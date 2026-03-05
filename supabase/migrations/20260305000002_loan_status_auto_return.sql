BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'loan_status') THEN
    CREATE TYPE loan_status AS ENUM ('ACTIVE', 'SETTLED');
  END IF;
END
$$;

ALTER TABLE thread_order_loans
  ADD COLUMN IF NOT EXISTS status loan_status DEFAULT 'ACTIVE';

UPDATE thread_order_loans SET status = 'ACTIVE' WHERE status IS NULL;

ALTER TABLE thread_order_loans
  ALTER COLUMN status SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_loans_status_active
  ON thread_order_loans(to_week_id, thread_type_id)
  WHERE status = 'ACTIVE' AND deleted_at IS NULL;

COMMENT ON COLUMN thread_order_loans.status IS 'ACTIVE = đang mượn, SETTLED = đã trả (auto khi nhận hàng)';

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
BEGIN
  IF v_max_idx IS NULL OR v_max_idx = 0 THEN
    RETURN json_build_object('settled', 0, 'returned_cones', 0);
  END IF;

  FOR v_loan IN
    SELECT id, from_week_id, quantity_cones
    FROM thread_order_loans
    WHERE to_week_id = p_week_id
      AND thread_type_id = p_thread_type_id
      AND from_week_id IS NOT NULL
      AND status = 'ACTIVE'
      AND deleted_at IS NULL
    ORDER BY created_at ASC
    FOR UPDATE
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

    IF v_returned_this_loan >= v_loan.quantity_cones THEN
      UPDATE thread_order_loans
      SET status = 'SETTLED',
          updated_at = NOW()
      WHERE id = v_loan.id;
      v_loans_settled := v_loans_settled + 1;
    END IF;

    EXIT WHEN v_idx > v_max_idx;
  END LOOP;

  RETURN json_build_object(
    'settled', v_loans_settled,
    'returned_cones', v_returned_total
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_auto_return_loans IS 'Auto-return borrowed cones to lender weeks when new cones received. FIFO by loan date.';

CREATE OR REPLACE FUNCTION fn_receive_delivery(
  p_delivery_id INTEGER,
  p_received_qty INTEGER,
  p_warehouse_id INTEGER,
  p_received_by VARCHAR,
  p_expiry_date DATE DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_delivery RECORD;
  v_week_id INTEGER;
  v_thread_type_id INTEGER;
  v_density NUMERIC;
  v_meters_per_cone NUMERIC;
  v_cone_id VARCHAR;
  v_cone_db_id INTEGER;
  v_cones_created INTEGER := 0;
  v_cones_reserved INTEGER := 0;
  v_current_shortage INTEGER;
  v_available_cone_ids INTEGER[] := '{}';
  v_auto_return JSON;
  i INTEGER;
BEGIN
  SELECT tod.*, tow.id AS week_id
  INTO v_delivery
  FROM thread_order_deliveries tod
  JOIN thread_order_weeks tow ON tod.week_id = tow.id
  WHERE tod.id = p_delivery_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy đơn giao hàng với id %', p_delivery_id;
  END IF;

  v_week_id := v_delivery.week_id;
  v_thread_type_id := v_delivery.thread_type_id;

  SELECT density_grams_per_meter, meters_per_cone
  INTO v_density, v_meters_per_cone
  FROM thread_types
  WHERE id = v_thread_type_id;

  v_current_shortage := GREATEST(0,
    v_delivery.quantity_cones - COALESCE(
      (SELECT COUNT(*)
       FROM thread_inventory
       WHERE reserved_week_id = v_week_id
         AND thread_type_id = v_thread_type_id
         AND status = 'RESERVED_FOR_ORDER'), 0
    )
  );

  FOR i IN 1..p_received_qty LOOP
    v_cone_id := 'WO-' || v_week_id || '-' || v_thread_type_id || '-' ||
                 TO_CHAR(NOW(), 'YYYYMMDD') || '-' ||
                 LPAD((nextval('thread_inventory_id_seq'))::TEXT, 6, '0');

    INSERT INTO thread_inventory (
      cone_id, thread_type_id, warehouse_id,
      quantity_cones, quantity_meters,
      status, received_date, lot_number
    ) VALUES (
      v_cone_id, v_thread_type_id, p_warehouse_id,
      1, COALESCE(v_meters_per_cone, 5000),
      CASE WHEN v_cones_created < v_current_shortage THEN 'RESERVED_FOR_ORDER'::cone_status ELSE 'AVAILABLE'::cone_status END,
      CURRENT_DATE, 'WO-' || v_week_id
    ) RETURNING id INTO v_cone_db_id;

    IF v_cones_created < v_current_shortage THEN
      UPDATE thread_inventory
      SET reserved_week_id = v_week_id
      WHERE id = v_cone_db_id;
      v_cones_reserved := v_cones_reserved + 1;
    ELSE
      v_available_cone_ids := array_append(v_available_cone_ids, v_cone_db_id);
    END IF;

    v_cones_created := v_cones_created + 1;
  END LOOP;

  v_auto_return := '{"settled":0,"returned_cones":0}'::JSON;
  IF array_length(v_available_cone_ids, 1) > 0 THEN
    v_auto_return := fn_auto_return_loans(v_week_id, v_thread_type_id, v_available_cone_ids);
  END IF;

  UPDATE thread_order_deliveries
  SET received_quantity = received_quantity + p_received_qty,
      received_by = p_received_by,
      received_at = NOW(),
      warehouse_id = p_warehouse_id,
      inventory_status = CASE
        WHEN received_quantity + p_received_qty >= quantity_cones THEN 'RECEIVED'::inventory_receipt_status
        ELSE 'PARTIAL'::inventory_receipt_status
      END,
      updated_at = NOW()
  WHERE id = p_delivery_id;

  RETURN json_build_object(
    'success', true,
    'cones_created', v_cones_created,
    'cones_reserved', v_cones_reserved,
    'remaining_shortage', GREATEST(0, v_current_shortage - v_cones_reserved),
    'lot_number', 'WO-' || v_week_id,
    'auto_return', v_auto_return
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_receive_delivery IS 'Atomic receive delivery with auto-reserve + auto-return loans to lender weeks';

NOTIFY pgrst, 'reload schema';

COMMIT;
