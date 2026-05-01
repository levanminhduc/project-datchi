-- Fix weekly-order reservation scope and receive color shortage.
--
-- 1. fn_reserve_for_week now respects thread_order_week_warehouses.
--    Empty selection keeps the historical "all warehouses" behavior.
-- 2. fn_reserve_from_stock uses the same warehouse filter and updates only
--    the matching delivery color.
-- 3. fn_receive_delivery computes shortage per thread color instead of the
--    whole thread_type_id aggregate.

BEGIN;

CREATE OR REPLACE FUNCTION fn_reserve_for_week(
  p_week_id INTEGER,
  p_thread_type_id INTEGER,
  p_quantity INTEGER,
  p_color_id INTEGER DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_reserved INTEGER := 0;
  v_skipped INTEGER := 0;
  v_cone RECORD;
  v_available_count INTEGER;
  v_priority TEXT;
  v_warehouse_ids INTEGER[];
BEGIN
  SELECT ARRAY_AGG(warehouse_id ORDER BY warehouse_id)
  INTO v_warehouse_ids
  FROM thread_order_week_warehouses
  WHERE week_id = p_week_id;

  SELECT COALESCE(value #>> '{}', 'partial_first') INTO v_priority
  FROM system_settings
  WHERE key = 'reserve_priority';

  IF v_priority IS NULL THEN
    v_priority := 'partial_first';
  END IF;

  SELECT COUNT(*) INTO v_available_count
  FROM thread_inventory
  WHERE thread_type_id = p_thread_type_id
    AND status = 'AVAILABLE'
    AND reserved_week_id IS NULL
    AND (p_color_id IS NULL OR color_id = p_color_id)
    AND (v_warehouse_ids IS NULL OR warehouse_id = ANY(v_warehouse_ids));

  FOR v_cone IN
    SELECT id
    FROM thread_inventory
    WHERE thread_type_id = p_thread_type_id
      AND status = 'AVAILABLE'
      AND reserved_week_id IS NULL
      AND (p_color_id IS NULL OR color_id = p_color_id)
      AND (v_warehouse_ids IS NULL OR warehouse_id = ANY(v_warehouse_ids))
    ORDER BY
      CASE WHEN v_priority = 'partial_first' THEN is_partial::int ELSE 0 END DESC,
      CASE WHEN v_priority = 'full_first' THEN is_partial::int ELSE 0 END ASC,
      expiry_date ASC NULLS LAST,
      received_date ASC,
      id ASC
    FOR UPDATE SKIP LOCKED
    LIMIT p_quantity
  LOOP
    UPDATE thread_inventory
    SET status = 'RESERVED_FOR_ORDER',
        reserved_week_id = p_week_id,
        updated_at = NOW()
    WHERE id = v_cone.id;

    v_reserved := v_reserved + 1;

    EXIT WHEN v_reserved >= p_quantity;
  END LOOP;

  v_skipped := LEAST(v_available_count, p_quantity) - v_reserved;
  IF v_skipped < 0 THEN v_skipped := 0; END IF;

  RETURN json_build_object(
    'reserved', v_reserved,
    'skipped_locked', v_skipped,
    'shortage', GREATEST(0, p_quantity - v_reserved),
    'warehouse_ids', v_warehouse_ids
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_reserve_for_week
  IS 'Reserve AVAILABLE cones for WO week with FEFO, color filter, and optional per-week warehouse filter';

CREATE OR REPLACE FUNCTION fn_confirm_week_with_reserve(p_week_id INTEGER)
RETURNS JSON AS $$
DECLARE
  v_week RECORD;
  v_summary RECORD;
  v_reserve_result JSON;
  v_all_summaries JSON[] := '{}';
  v_total_reserved INTEGER := 0;
  v_total_shortage INTEGER := 0;
  v_warehouse_ids INTEGER[];
BEGIN
  SELECT ARRAY_AGG(warehouse_id ORDER BY warehouse_id)
  INTO v_warehouse_ids
  FROM thread_order_week_warehouses
  WHERE week_id = p_week_id;

  SELECT * INTO v_week
  FROM thread_order_weeks
  WHERE id = p_week_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Khong tim thay tuan don hang voi id %', p_week_id;
  END IF;

  IF v_week.status <> 'DRAFT' THEN
    RAISE EXCEPTION 'Chi co the xac nhan tuan o trang thai DRAFT. Trang thai hien tai: %', v_week.status;
  END IF;

  FOR v_summary IN
    SELECT * FROM fn_parse_calculation_cones(p_week_id)
  LOOP
    v_reserve_result := fn_reserve_for_week(
      p_week_id,
      v_summary.thread_type_id,
      v_summary.needed_cones,
      v_summary.color_id
    );

    v_all_summaries := array_append(v_all_summaries, json_build_object(
      'thread_type_id', v_summary.thread_type_id,
      'color_id', v_summary.color_id,
      'needed', v_summary.needed_cones,
      'reserved', (v_reserve_result->>'reserved')::INTEGER,
      'shortage', (v_reserve_result->>'shortage')::INTEGER,
      'warehouse_ids', v_warehouse_ids
    ));

    v_total_reserved := v_total_reserved + (v_reserve_result->>'reserved')::INTEGER;
    v_total_shortage := v_total_shortage + (v_reserve_result->>'shortage')::INTEGER;
  END LOOP;

  UPDATE thread_order_weeks
  SET status = 'CONFIRMED',
      updated_at = NOW()
  WHERE id = p_week_id;

  RETURN json_build_object(
    'success', true,
    'week_id', p_week_id,
    'warehouse_ids', v_warehouse_ids,
    'total_reserved', v_total_reserved,
    'total_shortage', v_total_shortage,
    'reservation_summary', to_json(v_all_summaries)
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_confirm_week_with_reserve
  IS 'Atomic confirm WO week with reservation, color filtering, and optional per-week warehouse filter';

CREATE OR REPLACE FUNCTION fn_reserve_from_stock(
  p_week_id INTEGER,
  p_thread_type_id INTEGER,
  p_quantity INTEGER,
  p_reason TEXT,
  p_user VARCHAR,
  p_color_id INTEGER DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_week_status VARCHAR;
  v_reserved INTEGER := 0;
  v_total_meters NUMERIC(12,4) := 0;
  v_cone RECORD;
  v_loan_id INTEGER;
  v_shortage INTEGER;
  v_delivery_exists BOOLEAN;
  v_priority TEXT;
  v_color_name TEXT;
  v_warehouse_ids INTEGER[];
BEGIN
  SELECT ARRAY_AGG(warehouse_id ORDER BY warehouse_id)
  INTO v_warehouse_ids
  FROM thread_order_week_warehouses
  WHERE week_id = p_week_id;

  IF p_color_id IS NOT NULL THEN
    SELECT name INTO v_color_name
    FROM colors
    WHERE id = p_color_id;

    IF v_color_name IS NULL THEN
      RAISE EXCEPTION 'Khong tim thay mau chi voi id %', p_color_id;
    END IF;
  END IF;

  SELECT COALESCE(value #>> '{}', 'partial_first') INTO v_priority
  FROM system_settings
  WHERE key = 'reserve_priority';

  IF v_priority IS NULL THEN
    v_priority := 'partial_first';
  END IF;

  SELECT status INTO v_week_status
  FROM thread_order_weeks
  WHERE id = p_week_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Khong tim thay tuan don hang voi id %', p_week_id;
  END IF;

  IF v_week_status <> 'CONFIRMED' THEN
    RAISE EXCEPTION 'Chi co the lay tu ton kho cho tuan da xac nhan';
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM thread_order_deliveries
    WHERE week_id = p_week_id
      AND thread_type_id = p_thread_type_id
      AND (p_color_id IS NULL OR thread_color = v_color_name)
  ) INTO v_delivery_exists;

  IF NOT v_delivery_exists THEN
    RAISE EXCEPTION 'Khong co du lieu giao hang cho loai chi/mau chi nay trong tuan don hang';
  END IF;

  FOR v_cone IN
    SELECT id, quantity_meters
    FROM thread_inventory
    WHERE thread_type_id = p_thread_type_id
      AND status = 'AVAILABLE'
      AND reserved_week_id IS NULL
      AND (p_color_id IS NULL OR color_id = p_color_id)
      AND (v_warehouse_ids IS NULL OR warehouse_id = ANY(v_warehouse_ids))
    ORDER BY
      CASE WHEN v_priority = 'partial_first' THEN is_partial::int ELSE 0 END DESC,
      CASE WHEN v_priority = 'full_first' THEN is_partial::int ELSE 0 END ASC,
      expiry_date ASC NULLS LAST,
      received_date ASC,
      id ASC
    FOR UPDATE SKIP LOCKED
    LIMIT p_quantity
  LOOP
    UPDATE thread_inventory
    SET status = 'RESERVED_FOR_ORDER'::cone_status,
        reserved_week_id = p_week_id,
        updated_at = NOW()
    WHERE id = v_cone.id;

    v_reserved := v_reserved + 1;
    v_total_meters := v_total_meters + COALESCE(v_cone.quantity_meters, 0);

    EXIT WHEN v_reserved >= p_quantity;
  END LOOP;

  IF v_reserved > 0 THEN
    INSERT INTO thread_order_loans (
      from_week_id, to_week_id, thread_type_id,
      quantity_cones, quantity_meters, reason, created_by
    ) VALUES (
      NULL, p_week_id, p_thread_type_id,
      v_reserved, v_total_meters, COALESCE(p_reason, 'Lay tu ton kho'), p_user
    ) RETURNING id INTO v_loan_id;

    UPDATE thread_order_deliveries
    SET quantity_cones = GREATEST(0, quantity_cones - v_reserved),
        updated_at = NOW()
    WHERE week_id = p_week_id
      AND thread_type_id = p_thread_type_id
      AND (p_color_id IS NULL OR thread_color = v_color_name);
  END IF;

  v_shortage := GREATEST(0, p_quantity - v_reserved);

  RETURN json_build_object(
    'success', true,
    'reserved', v_reserved,
    'shortage', v_shortage,
    'loan_id', v_loan_id,
    'warehouse_ids', v_warehouse_ids
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_reserve_from_stock
  IS 'Reserve available stock for confirmed WO week, color filter, and optional per-week warehouse filter';

CREATE OR REPLACE FUNCTION public.fn_receive_delivery(
  p_delivery_id INTEGER,
  p_received_qty INTEGER,
  p_warehouse_id INTEGER,
  p_received_by VARCHAR,
  p_expiry_date DATE DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_delivery RECORD;
  v_week_id INTEGER;
  v_thread_type_id INTEGER;
  v_color_id INTEGER;
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
  v_thread_color_name TEXT;
  i INTEGER;
BEGIN
  SELECT tod.*, tow.id AS week_id
  INTO v_delivery
  FROM thread_order_deliveries tod
  JOIN thread_order_weeks tow ON tod.week_id = tow.id
  WHERE tod.id = p_delivery_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Khong tim thay don giao hang voi id %', p_delivery_id;
  END IF;

  v_week_id := v_delivery.week_id;
  v_thread_type_id := v_delivery.thread_type_id;

  SELECT density_grams_per_meter, meters_per_cone, color_id
  INTO v_density, v_meters_per_cone, v_color_id
  FROM thread_types
  WHERE id = v_thread_type_id;

  IF v_color_id IS NULL THEN
    v_thread_color_name := v_delivery.thread_color;

    IF v_thread_color_name IS NULL OR LENGTH(v_thread_color_name) = 0 THEN
      SELECT elem->>'thread_color'
      INTO v_thread_color_name
      FROM thread_order_results tor,
           jsonb_array_elements(tor.summary_data) elem
      WHERE tor.week_id = v_week_id
        AND (elem->>'thread_type_id')::int = v_thread_type_id
        AND LENGTH(elem->>'thread_color') > 0
      LIMIT 1;
    END IF;

    IF v_thread_color_name IS NOT NULL THEN
      SELECT id INTO v_color_id
      FROM colors
      WHERE name = v_thread_color_name
      LIMIT 1;
    END IF;
  END IF;

  SELECT COALESCE(SUM(p.needed_cones), 0) INTO v_needed_cones
  FROM fn_parse_calculation_cones(v_week_id, v_thread_type_id) p
  WHERE (v_color_id IS NULL AND p.color_id IS NULL)
     OR (v_color_id IS NOT NULL AND p.color_id = v_color_id);

  IF v_needed_cones IS NULL THEN v_needed_cones := 0; END IF;

  v_needed_cones := GREATEST(COALESCE(v_delivery.quantity_cones, 0), v_needed_cones);

  SELECT COUNT(*) INTO v_already_reserved
  FROM thread_inventory
  WHERE reserved_week_id = v_week_id
    AND thread_type_id = v_thread_type_id
    AND status = 'RESERVED_FOR_ORDER'
    AND (
      (v_color_id IS NULL AND color_id IS NULL)
      OR (v_color_id IS NOT NULL AND color_id = v_color_id)
    );

  v_current_shortage := GREATEST(0, v_needed_cones - v_already_reserved);

  FOR i IN 1..p_received_qty LOOP
    v_cone_id := 'WO-' || v_week_id || '-' || v_thread_type_id || '-' ||
                 TO_CHAR(NOW(), 'YYYYMMDD') || '-' ||
                 LPAD((nextval('thread_inventory_id_seq'))::TEXT, 6, '0');

    INSERT INTO thread_inventory (
      cone_id, thread_type_id, warehouse_id,
      quantity_cones, quantity_meters,
      status, received_date, expiry_date, lot_number,
      color_id
    ) VALUES (
      v_cone_id, v_thread_type_id, p_warehouse_id,
      1, COALESCE(v_meters_per_cone, 5000),
      CASE WHEN v_cones_created < v_current_shortage THEN 'RESERVED_FOR_ORDER'::cone_status ELSE 'AVAILABLE'::cone_status END,
      CURRENT_DATE, p_expiry_date, 'WO-' || v_week_id,
      v_color_id
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

  INSERT INTO delivery_receive_logs (delivery_id, quantity, warehouse_id, received_by)
  VALUES (p_delivery_id, p_received_qty, p_warehouse_id, p_received_by);

  RETURN json_build_object(
    'success', true,
    'cones_created', v_cones_created,
    'cones_reserved', v_cones_reserved,
    'remaining_shortage', GREATEST(0, v_current_shortage - v_cones_reserved),
    'lot_number', 'WO-' || v_week_id,
    'color_id', v_color_id,
    'auto_return', v_auto_return
  );
END;
$function$;

COMMENT ON FUNCTION fn_receive_delivery(INTEGER, INTEGER, INTEGER, VARCHAR, DATE)
  IS 'Atomic receive delivery with per-color shortage, auto-reserve, receive log, and optional auto-return';

NOTIFY pgrst, 'reload schema';

COMMIT;
