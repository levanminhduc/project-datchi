BEGIN;

-- Restore fn_auto_return_loans call in fn_receive_delivery
-- Migration 20260306000001 accidentally removed the auto-return logic
-- This restores it using the enhanced fn_auto_return_loans that returns details[]
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
  v_needed_cones INTEGER;
  v_already_reserved INTEGER;
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

  SELECT COALESCE(p.needed_cones, 0) INTO v_needed_cones
  FROM fn_parse_calculation_cones(v_week_id, v_thread_type_id) p;

  IF v_needed_cones IS NULL THEN v_needed_cones := 0; END IF;

  v_needed_cones := GREATEST(COALESCE(v_delivery.quantity_cones, 0), v_needed_cones);

  SELECT COUNT(*) INTO v_already_reserved
  FROM thread_inventory
  WHERE reserved_week_id = v_week_id
    AND thread_type_id = v_thread_type_id
    AND status = 'RESERVED_FOR_ORDER';

  v_current_shortage := GREATEST(0, v_needed_cones - v_already_reserved);

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

  v_auto_return := '{"settled":0,"returned_cones":0,"details":[]}'::JSON;
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

COMMENT ON FUNCTION fn_receive_delivery IS 'Atomic receive delivery with auto-reserve + auto-return loans for surplus cones';

NOTIFY pgrst, 'reload schema';

COMMIT;
