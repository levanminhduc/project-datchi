\set ON_ERROR_STOP on

BEGIN;

INSERT INTO system_settings (key, value, description)
VALUES
  ('partial_cone_ratio', '0.3'::jsonb, 'Test partial cone ratio'),
  ('reserve_priority', '"partial_first"'::jsonb, 'Test reserve priority')
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    description = EXCLUDED.description,
    updated_at = now();

DO $$
DECLARE
  v_suffix TEXT := replace(gen_random_uuid()::TEXT, '-', '');
  v_supplier_id INTEGER;
  v_color_id INTEGER;
  v_thread_type_id INTEGER;
  v_warehouse_id INTEGER;
  v_week_id INTEGER;
  v_result JSON;
  v_physical INTEGER;
  v_equivalent NUMERIC;
  v_shortage NUMERIC;
BEGIN
  INSERT INTO suppliers (code, name)
  VALUES ('TEST-SUP-' || v_suffix, 'Test Supplier ' || v_suffix)
  RETURNING id INTO v_supplier_id;

  INSERT INTO colors (name, hex_code)
  VALUES ('TEST-COLOR-' || v_suffix, '#808080')
  RETURNING id INTO v_color_id;

  INSERT INTO thread_types (
    code,
    name,
    tex_number,
    density_grams_per_meter,
    meters_per_cone,
    supplier_id,
    color_id
  )
  VALUES (
    'TEST-TT-' || v_suffix,
    'Test Thread',
    '27',
    0.000001,
    5000,
    v_supplier_id,
    v_color_id
  )
  RETURNING id INTO v_thread_type_id;

  INSERT INTO warehouses (code, name)
  VALUES ('TW' || left(v_suffix, 18), 'Test Warehouse ' || v_suffix)
  RETURNING id INTO v_warehouse_id;

  INSERT INTO thread_order_weeks (week_name, status)
  VALUES ('TEST-WEEK-PARTIAL-' || left(v_suffix, 20), 'DRAFT')
  RETURNING id INTO v_week_id;

  INSERT INTO thread_inventory (
    cone_id,
    thread_type_id,
    warehouse_id,
    quantity_meters,
    is_partial,
    status,
    color_id,
    received_date
  )
  SELECT
    'TEST-PARTIAL-' || v_suffix || '-' || gs,
    v_thread_type_id,
    v_warehouse_id,
    1500,
    TRUE,
    'AVAILABLE'::cone_status,
    v_color_id,
    CURRENT_DATE + (gs || ' days')::INTERVAL
  FROM generate_series(1, 20) AS gs;

  v_result := fn_reserve_for_week(v_week_id, v_thread_type_id, 5, v_color_id);

  SELECT
    COUNT(*),
    COALESCE(SUM(CASE WHEN is_partial THEN 0.3 ELSE 1 END), 0)
  INTO v_physical, v_equivalent
  FROM thread_inventory
  WHERE reserved_week_id = v_week_id
    AND thread_type_id = v_thread_type_id
    AND color_id = v_color_id
    AND status = 'RESERVED_FOR_ORDER';

  IF v_physical <> 17 OR v_equivalent < 5 THEN
    RAISE EXCEPTION
      'Expected 17 partial cones and >= 5 equivalent cones, got physical=% equivalent=% result=%',
      v_physical,
      v_equivalent,
      v_result;
  END IF;

  IF ROUND(((v_result->>'reserved_equivalent_cones')::NUMERIC), 2) <> 5.10 THEN
    RAISE EXCEPTION 'Expected reserved_equivalent_cones=5.10, got result=%', v_result;
  END IF;

  UPDATE thread_inventory
  SET status = 'CONSUMED'::cone_status,
      reserved_week_id = NULL
  WHERE thread_type_id = v_thread_type_id;

  v_suffix := replace(gen_random_uuid()::TEXT, '-', '');

  INSERT INTO thread_order_weeks (week_name, status)
  VALUES ('TEST-WEEK-MIXED-' || left(v_suffix, 22), 'DRAFT')
  RETURNING id INTO v_week_id;

  INSERT INTO thread_inventory (
    cone_id,
    thread_type_id,
    warehouse_id,
    quantity_meters,
    is_partial,
    status,
    color_id,
    received_date
  )
  SELECT
    'TEST-MIXED-P-' || v_suffix || '-' || gs,
    v_thread_type_id,
    v_warehouse_id,
    1500,
    TRUE,
    'AVAILABLE'::cone_status,
    v_color_id,
    CURRENT_DATE + (gs || ' days')::INTERVAL
  FROM generate_series(1, 15) AS gs
  UNION ALL
  SELECT
    'TEST-MIXED-F-' || v_suffix || '-' || gs,
    v_thread_type_id,
    v_warehouse_id,
    5000,
    FALSE,
    'AVAILABLE'::cone_status,
    v_color_id,
    CURRENT_DATE + (100 + gs || ' days')::INTERVAL
  FROM generate_series(1, 5) AS gs;

  v_result := fn_reserve_for_week(v_week_id, v_thread_type_id, 5, v_color_id);

  SELECT
    COUNT(*),
    COALESCE(SUM(CASE WHEN is_partial THEN 0.3 ELSE 1 END), 0)
  INTO v_physical, v_equivalent
  FROM thread_inventory
  WHERE reserved_week_id = v_week_id
    AND thread_type_id = v_thread_type_id
    AND color_id = v_color_id
    AND status = 'RESERVED_FOR_ORDER';

  IF v_physical <> 16 OR v_equivalent <> 5.5 THEN
    RAISE EXCEPTION
      'Expected 15 partial + 1 full cones = 5.5 equivalent, got physical=% equivalent=% result=%',
      v_physical,
      v_equivalent,
      v_result;
  END IF;

  UPDATE thread_inventory
  SET status = 'CONSUMED'::cone_status,
      reserved_week_id = NULL
  WHERE thread_type_id = v_thread_type_id;

  v_suffix := replace(gen_random_uuid()::TEXT, '-', '');

  INSERT INTO thread_order_weeks (week_name, status)
  VALUES ('TEST-WEEK-SHORT-' || left(v_suffix, 22), 'DRAFT')
  RETURNING id INTO v_week_id;

  INSERT INTO thread_inventory (
    cone_id,
    thread_type_id,
    warehouse_id,
    quantity_meters,
    is_partial,
    status,
    color_id,
    received_date
  )
  SELECT
    'TEST-SHORT-P-' || v_suffix || '-' || gs,
    v_thread_type_id,
    v_warehouse_id,
    1500,
    TRUE,
    'AVAILABLE'::cone_status,
    v_color_id,
    CURRENT_DATE + (gs || ' days')::INTERVAL
  FROM generate_series(1, 4) AS gs;

  v_result := fn_reserve_for_week(v_week_id, v_thread_type_id, 5, v_color_id);
  v_shortage := (v_result->>'shortage_equivalent_cones')::NUMERIC;

  IF ROUND(v_shortage, 2) <> 3.80 THEN
    RAISE EXCEPTION 'Expected shortage_equivalent_cones=3.80, got result=%', v_result;
  END IF;

  UPDATE thread_inventory
  SET status = 'CONSUMED'::cone_status,
      reserved_week_id = NULL
  WHERE thread_type_id = v_thread_type_id;

  v_suffix := replace(gen_random_uuid()::TEXT, '-', '');

  INSERT INTO thread_order_weeks (week_name, status)
  VALUES ('TEST-WEEK-STOCK-' || left(v_suffix, 22), 'CONFIRMED')
  RETURNING id INTO v_week_id;

  INSERT INTO thread_order_deliveries (
    week_id,
    thread_type_id,
    supplier_id,
    delivery_date,
    quantity_cones,
    thread_color
  )
  VALUES (
    v_week_id,
    v_thread_type_id,
    v_supplier_id,
    CURRENT_DATE,
    5,
    'TEST-COLOR-' || left(v_suffix, 10)
  );

  UPDATE colors
  SET name = 'TEST-COLOR-' || left(v_suffix, 10)
  WHERE id = v_color_id;

  INSERT INTO thread_inventory (
    cone_id,
    thread_type_id,
    warehouse_id,
    quantity_meters,
    is_partial,
    status,
    color_id,
    received_date
  )
  SELECT
    'TEST-STOCK-P-' || v_suffix || '-' || gs,
    v_thread_type_id,
    v_warehouse_id,
    1500,
    TRUE,
    'AVAILABLE'::cone_status,
    v_color_id,
    CURRENT_DATE + (gs || ' days')::INTERVAL
  FROM generate_series(1, 20) AS gs;

  v_result := fn_reserve_from_stock(
    v_week_id,
    v_thread_type_id,
    5,
    'test equivalent reserve from stock',
    'TEST',
    v_color_id
  );

  IF ROUND(((v_result->>'reserved_equivalent_cones')::NUMERIC), 2) <> 5.10 THEN
    RAISE EXCEPTION 'Expected reserve-from-stock reserved_equivalent_cones=5.10, got result=%', v_result;
  END IF;
END $$;

ROLLBACK;
