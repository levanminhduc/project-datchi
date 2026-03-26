BEGIN;

-- Task 2.1: Create fn_manual_return_loan
-- Manual return: user specifies quantity, FIFO selects RESERVED_FOR_ORDER cones from borrower week,
-- reassigns to lender week, increments returned_cones, settles if full, inserts return log.
CREATE OR REPLACE FUNCTION fn_manual_return_loan(
  p_loan_id INTEGER,
  p_quantity INTEGER,
  p_returned_by VARCHAR,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_loan RECORD;
  v_cone RECORD;
  v_moved INTEGER := 0;
  v_remaining_debt INTEGER;
  v_available_count INTEGER;
BEGIN
  -- Validate input
  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'Số cuộn phải lớn hơn 0';
  END IF;

  -- Lock loan row
  SELECT tol.id, tol.from_week_id, tol.to_week_id, tol.thread_type_id,
         tol.quantity_cones, tol.returned_cones, tol.status
  INTO v_loan
  FROM thread_order_loans tol
  WHERE tol.id = p_loan_id
    AND tol.deleted_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy khoản mượn';
  END IF;

  IF v_loan.status = 'SETTLED' THEN
    RAISE EXCEPTION 'Khoản mượn đã được thanh toán đầy đủ';
  END IF;

  v_remaining_debt := v_loan.quantity_cones - v_loan.returned_cones;

  IF p_quantity > v_remaining_debt THEN
    RAISE EXCEPTION 'Chỉ có thể trả tối đa % cuộn', v_remaining_debt;
  END IF;

  -- Count available RESERVED_FOR_ORDER cones in borrower week for this thread type
  SELECT COUNT(*) INTO v_available_count
  FROM thread_inventory
  WHERE status = 'RESERVED_FOR_ORDER'
    AND reserved_week_id = v_loan.to_week_id
    AND thread_type_id = v_loan.thread_type_id
    AND deleted_at IS NULL;

  IF v_available_count < p_quantity THEN
    RAISE EXCEPTION 'Không đủ cuộn khả dụng trong kho tuần mượn (có %, cần %)', v_available_count, p_quantity;
  END IF;

  -- FIFO: select cones by received_date ASC, move to lender week
  FOR v_cone IN
    SELECT id
    FROM thread_inventory
    WHERE status = 'RESERVED_FOR_ORDER'
      AND reserved_week_id = v_loan.to_week_id
      AND thread_type_id = v_loan.thread_type_id
      AND deleted_at IS NULL
    ORDER BY received_date ASC, id ASC
    LIMIT p_quantity
  LOOP
    UPDATE thread_inventory
    SET reserved_week_id = v_loan.from_week_id,
        updated_at = NOW()
    WHERE id = v_cone.id
      AND status = 'RESERVED_FOR_ORDER'
      AND reserved_week_id = v_loan.to_week_id;

    IF FOUND THEN
      v_moved := v_moved + 1;
    END IF;
  END LOOP;

  -- Update returned_cones and settle if fully returned
  UPDATE thread_order_loans
  SET returned_cones = returned_cones + v_moved,
      status = CASE WHEN (returned_cones + v_moved) >= quantity_cones THEN 'SETTLED' ELSE status END,
      updated_at = NOW()
  WHERE id = p_loan_id;

  -- Insert return log
  INSERT INTO thread_loan_return_logs (loan_id, cones_returned, return_type, returned_by, notes)
  VALUES (p_loan_id, v_moved, 'MANUAL', p_returned_by, p_notes);

  RETURN json_build_object(
    'success', true,
    'returned', v_moved,
    'remaining', v_remaining_debt - v_moved,
    'settled', (v_loan.returned_cones + v_moved) >= v_loan.quantity_cones
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_manual_return_loan IS 'Manual return of borrowed cones: FIFO select from borrower RESERVED_FOR_ORDER, reassign to lender, log event';

-- Task 2.2: Update fn_auto_return_loans
-- Adds: returned_cones increment, return log insertion, cumulative SETTLED condition
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
    SELECT tol.id, tol.from_week_id, tol.quantity_cones, tol.returned_cones,
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

    WHILE v_idx <= v_max_idx AND v_returned_this_loan < (v_loan.quantity_cones - v_loan.returned_cones) LOOP
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
      -- Cumulative SETTLED check: use existing returned_cones + newly returned
      IF (v_loan.returned_cones + v_returned_this_loan) >= v_loan.quantity_cones THEN
        UPDATE thread_order_loans
        SET returned_cones = returned_cones + v_returned_this_loan,
            status = 'SETTLED',
            updated_at = NOW()
        WHERE id = v_loan.id;
        v_loans_settled := v_loans_settled + 1;
      ELSE
        UPDATE thread_order_loans
        SET returned_cones = returned_cones + v_returned_this_loan,
            updated_at = NOW()
        WHERE id = v_loan.id;
      END IF;

      -- Insert return log for this auto-return event
      INSERT INTO thread_loan_return_logs (loan_id, cones_returned, return_type, returned_by, notes)
      VALUES (v_loan.id, v_returned_this_loan, 'AUTO', 'system', NULL);

      v_details := v_details || jsonb_build_object(
        'loan_id', v_loan.id,
        'from_week_id', v_loan.from_week_id,
        'from_week_name', COALESCE(v_loan.from_week_name, 'Không rõ'),
        'cones_returned', v_returned_this_loan,
        'fully_settled', (v_loan.returned_cones + v_returned_this_loan) >= v_loan.quantity_cones
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

COMMENT ON FUNCTION fn_auto_return_loans IS 'Auto-return borrowed cones to lender weeks when new cones received. FIFO by loan date. Cumulative returned_cones tracking. Returns per-loan detail array.';

-- Task 2.3: Update fn_loan_detail_by_thread_type to include returned_cones aggregates
CREATE OR REPLACE FUNCTION fn_loan_detail_by_thread_type(p_week_id INTEGER)
RETURNS JSON AS $$
BEGIN
  RETURN (
    SELECT COALESCE(json_agg(row_data ORDER BY row_data.thread_code), '[]'::json)
    FROM (
      SELECT
        tt.id AS thread_type_id,
        tt.code AS thread_code,
        tt.name AS thread_name,
        COALESCE(c.name, '') AS color_name,
        COALESCE(lb.borrowed_cones, 0) AS borrowed_cones,
        COALESCE(lr.borrowed_returned_cones, 0) AS borrowed_returned_cones,
        COALESCE(ll.lent_cones, 0) AS lent_cones,
        COALESCE(lo.lent_returned_cones, 0) AS lent_returned_cones,
        COALESCE(tod.ncc_ordered, 0) AS ncc_ordered,
        COALESCE(tod.ncc_received, 0) AS ncc_received,
        GREATEST(0, COALESCE(tod.ncc_ordered, 0) - COALESCE(tod.ncc_received, 0)) AS ncc_pending
      FROM thread_order_deliveries d
      JOIN thread_types tt ON tt.id = d.thread_type_id
      LEFT JOIN colors c ON c.id = tt.color_id
      LEFT JOIN LATERAL (
        SELECT SUM(tol.quantity_cones) AS borrowed_cones
        FROM thread_order_loans tol
        WHERE tol.to_week_id = p_week_id
          AND tol.thread_type_id = tt.id
          AND tol.from_week_id IS NOT NULL
          AND tol.status = 'ACTIVE'
          AND tol.deleted_at IS NULL
      ) lb ON true
      LEFT JOIN LATERAL (
        SELECT SUM(tol.returned_cones) AS borrowed_returned_cones
        FROM thread_order_loans tol
        WHERE tol.to_week_id = p_week_id
          AND tol.thread_type_id = tt.id
          AND tol.deleted_at IS NULL
      ) lr ON true
      LEFT JOIN LATERAL (
        SELECT SUM(tol.quantity_cones) AS lent_cones
        FROM thread_order_loans tol
        WHERE tol.from_week_id = p_week_id
          AND tol.thread_type_id = tt.id
          AND tol.status = 'ACTIVE'
          AND tol.deleted_at IS NULL
      ) ll ON true
      LEFT JOIN LATERAL (
        SELECT SUM(tol.returned_cones) AS lent_returned_cones
        FROM thread_order_loans tol
        WHERE tol.from_week_id = p_week_id
          AND tol.thread_type_id = tt.id
          AND tol.deleted_at IS NULL
      ) lo ON true
      LEFT JOIN LATERAL (
        SELECT
          SUM(tod2.quantity_cones) AS ncc_ordered,
          SUM(tod2.received_quantity) AS ncc_received
        FROM thread_order_deliveries tod2
        WHERE tod2.week_id = p_week_id
          AND tod2.thread_type_id = tt.id
          AND tod2.deleted_at IS NULL
      ) tod ON true
      WHERE d.week_id = p_week_id
        AND d.deleted_at IS NULL
      GROUP BY tt.id, tt.code, tt.name, c.name,
               lb.borrowed_cones, lr.borrowed_returned_cones,
               ll.lent_cones, lo.lent_returned_cones,
               tod.ncc_ordered, tod.ncc_received
    ) row_data
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_loan_detail_by_thread_type IS 'Per-thread-type loan breakdown for a week: borrowed, lent, NCC delivery status, returned_cones aggregates';

NOTIFY pgrst, 'reload schema';

COMMIT;
