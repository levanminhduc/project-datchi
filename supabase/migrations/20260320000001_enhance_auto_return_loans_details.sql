BEGIN;

-- Enhance fn_auto_return_loans to return per-loan detail array
-- Now includes: details[] with loan_id, from_week_id, from_week_name, cones_returned, fully_settled
CREATE OR REPLACE FUNCTION fn_auto_return_loans(
  p_week_id INTEGER,
  p_thread_type_id INTEGER,
  p_available_cone_ids INTEGER[]
)
RETURNS JSON AS $$
DECLARE
  v_loan RECORD;
  v_cone_id INTEGER;
  v_returned_total INTEGER := 0;
  v_loans_settled INTEGER := 0;
  v_idx INTEGER := 1;
  v_max_idx INTEGER := array_length(p_available_cone_ids, 1);
  v_returned_this_loan INTEGER;
  v_details JSONB := '[]'::JSONB;
  v_week_name TEXT;
BEGIN
  IF v_max_idx IS NULL OR v_max_idx = 0 THEN
    RETURN json_build_object('settled', 0, 'returned_cones', 0, 'details', '[]'::json);
  END IF;

  FOR v_loan IN
    SELECT tol.id, tol.from_week_id, tol.quantity_cones,
           tow.week_name AS from_week_name
    FROM thread_order_loans tol
    LEFT JOIN thread_order_weeks tow ON tow.id = tol.from_week_id
    WHERE tol.to_week_id = p_week_id
      AND tol.thread_type_id = p_thread_type_id
      AND tol.from_week_id IS NOT NULL
      AND tol.status = 'ACTIVE'
      AND tol.deleted_at IS NULL
    ORDER BY tol.created_at ASC
    FOR UPDATE OF tol
  LOOP
    v_returned_this_loan := 0;

    WHILE v_idx <= v_max_idx AND v_returned_this_loan < v_loan.quantity_cones LOOP
      v_cone_id := p_available_cone_ids[v_idx];

      UPDATE thread_inventory
      SET status = 'RESERVED_FOR_ORDER'::cone_status,
          reserved_week_id = v_loan.from_week_id,
          updated_at = NOW()
      WHERE id = v_cone_id
        AND status = 'AVAILABLE'
        AND reserved_week_id IS NULL;

      IF FOUND THEN
        v_returned_this_loan := v_returned_this_loan + 1;
        v_returned_total := v_returned_total + 1;
      END IF;

      v_idx := v_idx + 1;
    END LOOP;

    IF v_returned_this_loan > 0 THEN
      IF v_returned_this_loan >= v_loan.quantity_cones THEN
        UPDATE thread_order_loans
        SET status = 'SETTLED',
            updated_at = NOW()
        WHERE id = v_loan.id;
        v_loans_settled := v_loans_settled + 1;
      END IF;

      v_details := v_details || jsonb_build_object(
        'loan_id', v_loan.id,
        'from_week_id', v_loan.from_week_id,
        'from_week_name', COALESCE(v_loan.from_week_name, 'Không rõ'),
        'cones_returned', v_returned_this_loan,
        'fully_settled', v_returned_this_loan >= v_loan.quantity_cones
      );
    END IF;

    EXIT WHEN v_idx > v_max_idx;
  END LOOP;

  RETURN json_build_object(
    'settled', v_loans_settled,
    'returned_cones', v_returned_total,
    'details', v_details
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_auto_return_loans IS 'Auto-return borrowed cones to lender weeks when new cones received. FIFO by loan date. Returns per-loan detail array.';

NOTIFY pgrst, 'reload schema';

COMMIT;
