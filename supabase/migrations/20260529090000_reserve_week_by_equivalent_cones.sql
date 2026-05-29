-- Migration: Reserve weekly orders by equivalent cones
-- Description:
--   Reserve enough physical cones so full_cones * 1 + partial_cones * partial_cone_ratio
--   covers the requested equivalent cone quantity. This migration only changes functions;
--   it does not update existing reservation data.

DROP FUNCTION IF EXISTS fn_reserve_from_stock(
  INTEGER,
  INTEGER,
  INTEGER,
  TEXT,
  CHARACTER VARYING,
  INTEGER
);

DROP FUNCTION IF EXISTS fn_reserve_for_week(INTEGER, INTEGER, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION fn_reserve_for_week(
  p_week_id INTEGER,
  p_thread_type_id INTEGER,
  p_quantity NUMERIC,
  p_color_id INTEGER DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_reserved_physical INTEGER := 0;
  v_reserved_equivalent NUMERIC := 0;
  v_available_physical INTEGER := 0;
  v_available_equivalent NUMERIC := 0;
  v_skipped INTEGER := 0;
  v_cone RECORD;
  v_cone_equivalent NUMERIC;
  v_priority TEXT;
  v_warehouse_ids INTEGER[];
  v_partial_ratio NUMERIC := 0.3;
  v_shortage_equivalent NUMERIC;
BEGIN
  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RETURN json_build_object(
      'reserved', 0,
      'reserved_physical_cones', 0,
      'reserved_equivalent_cones', 0,
      'skipped_locked', 0,
      'shortage', 0,
      'shortage_equivalent_cones', 0,
      'warehouse_ids', NULL
    );
  END IF;

  SELECT ARRAY_AGG(warehouse_id ORDER BY warehouse_id)
  INTO v_warehouse_ids
  FROM thread_order_week_warehouses
  WHERE week_id = p_week_id;

  SELECT COALESCE(NULLIF(value #>> '{}', '')::NUMERIC, 0.3)
  INTO v_partial_ratio
  FROM system_settings
  WHERE key = 'partial_cone_ratio';

  IF v_partial_ratio IS NULL OR v_partial_ratio <= 0 THEN
    v_partial_ratio := 0.3;
  END IF;

  SELECT COALESCE(value #>> '{}', 'partial_first')
  INTO v_priority
  FROM system_settings
  WHERE key = 'reserve_priority';

  IF v_priority IS NULL THEN
    v_priority := 'partial_first';
  END IF;

  SELECT
    COUNT(*),
    COALESCE(SUM(CASE WHEN is_partial THEN v_partial_ratio ELSE 1 END), 0)
  INTO v_available_physical, v_available_equivalent
  FROM thread_inventory
  WHERE thread_type_id = p_thread_type_id
    AND status = 'AVAILABLE'
    AND reserved_week_id IS NULL
    AND (p_color_id IS NULL OR color_id = p_color_id)
    AND (v_warehouse_ids IS NULL OR warehouse_id = ANY(v_warehouse_ids));

  FOR v_cone IN
    SELECT id, is_partial
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
  LOOP
    EXIT WHEN v_reserved_equivalent >= p_quantity;

    v_cone_equivalent := CASE WHEN v_cone.is_partial THEN v_partial_ratio ELSE 1 END;

    UPDATE thread_inventory
    SET status = 'RESERVED_FOR_ORDER',
        reserved_week_id = p_week_id,
        updated_at = NOW()
    WHERE id = v_cone.id;

    v_reserved_physical := v_reserved_physical + 1;
    v_reserved_equivalent := v_reserved_equivalent + v_cone_equivalent;
  END LOOP;

  v_shortage_equivalent := GREATEST(0::NUMERIC, p_quantity - v_reserved_equivalent);

  IF v_shortage_equivalent > 0 AND v_available_equivalent >= p_quantity THEN
    v_skipped := 1;
  END IF;

  RETURN json_build_object(
    'reserved', ROUND(v_reserved_equivalent, 2),
    'reserved_physical_cones', v_reserved_physical,
    'reserved_equivalent_cones', ROUND(v_reserved_equivalent, 2),
    'available_physical_cones', v_available_physical,
    'available_equivalent_cones', ROUND(v_available_equivalent, 2),
    'skipped_locked', v_skipped,
    'shortage', ROUND(v_shortage_equivalent, 2),
    'shortage_equivalent_cones', ROUND(v_shortage_equivalent, 2),
    'warehouse_ids', v_warehouse_ids
  );
END;
$$;

COMMENT ON FUNCTION fn_reserve_for_week(INTEGER, INTEGER, NUMERIC, INTEGER)
  IS 'Reserve AVAILABLE inventory for a weekly order until full + partial * partial_cone_ratio covers requested equivalent cones.';

CREATE OR REPLACE FUNCTION fn_confirm_week_with_reserve(p_week_id INTEGER)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_week RECORD;
  v_summary RECORD;
  v_reserve_result JSON;
  v_all_summaries JSON[] := '{}';
  v_total_reserved_physical INTEGER := 0;
  v_total_reserved_equivalent NUMERIC := 0;
  v_total_shortage_equivalent NUMERIC := 0;
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
      'reserved', (v_reserve_result->>'reserved_equivalent_cones')::NUMERIC,
      'reserved_physical_cones', (v_reserve_result->>'reserved_physical_cones')::INTEGER,
      'reserved_equivalent_cones', (v_reserve_result->>'reserved_equivalent_cones')::NUMERIC,
      'shortage', (v_reserve_result->>'shortage_equivalent_cones')::NUMERIC,
      'shortage_equivalent_cones', (v_reserve_result->>'shortage_equivalent_cones')::NUMERIC,
      'skipped_locked', (v_reserve_result->>'skipped_locked')::INTEGER,
      'warehouse_ids', v_warehouse_ids
    ));

    v_total_reserved_physical := v_total_reserved_physical
      + (v_reserve_result->>'reserved_physical_cones')::INTEGER;
    v_total_reserved_equivalent := v_total_reserved_equivalent
      + (v_reserve_result->>'reserved_equivalent_cones')::NUMERIC;
    v_total_shortage_equivalent := v_total_shortage_equivalent
      + (v_reserve_result->>'shortage_equivalent_cones')::NUMERIC;
  END LOOP;

  UPDATE thread_order_weeks
  SET status = 'CONFIRMED',
      updated_at = NOW()
  WHERE id = p_week_id;

  RETURN json_build_object(
    'success', true,
    'week_id', p_week_id,
    'warehouse_ids', v_warehouse_ids,
    'total_reserved', ROUND(v_total_reserved_equivalent, 2),
    'total_reserved_physical_cones', v_total_reserved_physical,
    'total_reserved_equivalent_cones', ROUND(v_total_reserved_equivalent, 2),
    'total_shortage', ROUND(v_total_shortage_equivalent, 2),
    'total_shortage_equivalent_cones', ROUND(v_total_shortage_equivalent, 2),
    'reservation_summary', to_json(v_all_summaries)
  );
END;
$$;

COMMENT ON FUNCTION fn_confirm_week_with_reserve(INTEGER)
  IS 'Confirm a weekly order and reserve stock by equivalent cones using partial_cone_ratio.';

CREATE OR REPLACE FUNCTION fn_reserve_from_stock(
  p_week_id INTEGER,
  p_thread_type_id INTEGER,
  p_quantity NUMERIC,
  p_reason TEXT,
  p_user CHARACTER VARYING,
  p_color_id INTEGER DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_week_status VARCHAR;
  v_reserved_physical INTEGER := 0;
  v_reserved_equivalent NUMERIC := 0;
  v_total_meters NUMERIC(12,4) := 0;
  v_cone RECORD;
  v_cone_equivalent NUMERIC;
  v_loan_id INTEGER;
  v_shortage_equivalent NUMERIC;
  v_delivery_exists BOOLEAN;
  v_priority TEXT;
  v_color_name TEXT;
  v_warehouse_ids INTEGER[];
  v_partial_ratio NUMERIC := 0.3;
  v_delivery_decrement INTEGER := 0;
BEGIN
  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'So luong quy doi phai lon hon 0';
  END IF;

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

  SELECT COALESCE(NULLIF(value #>> '{}', '')::NUMERIC, 0.3)
  INTO v_partial_ratio
  FROM system_settings
  WHERE key = 'partial_cone_ratio';

  IF v_partial_ratio IS NULL OR v_partial_ratio <= 0 THEN
    v_partial_ratio := 0.3;
  END IF;

  SELECT COALESCE(value #>> '{}', 'partial_first')
  INTO v_priority
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
    SELECT id, quantity_meters, is_partial
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
  LOOP
    EXIT WHEN v_reserved_equivalent >= p_quantity;

    v_cone_equivalent := CASE WHEN v_cone.is_partial THEN v_partial_ratio ELSE 1 END;

    UPDATE thread_inventory
    SET status = 'RESERVED_FOR_ORDER'::cone_status,
        reserved_week_id = p_week_id,
        updated_at = NOW()
    WHERE id = v_cone.id;

    v_reserved_physical := v_reserved_physical + 1;
    v_reserved_equivalent := v_reserved_equivalent + v_cone_equivalent;
    v_total_meters := v_total_meters + COALESCE(v_cone.quantity_meters, 0);
  END LOOP;

  IF v_reserved_physical > 0 THEN
    INSERT INTO thread_order_loans (
      from_week_id, to_week_id, thread_type_id,
      quantity_cones, quantity_meters, reason, created_by
    ) VALUES (
      NULL, p_week_id, p_thread_type_id,
      v_reserved_physical, v_total_meters, COALESCE(p_reason, 'Lay tu ton kho'), p_user
    ) RETURNING id INTO v_loan_id;

    v_delivery_decrement := CEIL(LEAST(p_quantity, v_reserved_equivalent));

    UPDATE thread_order_deliveries
    SET quantity_cones = GREATEST(0, quantity_cones - v_delivery_decrement),
        updated_at = NOW()
    WHERE week_id = p_week_id
      AND thread_type_id = p_thread_type_id
      AND (p_color_id IS NULL OR thread_color = v_color_name);
  END IF;

  v_shortage_equivalent := GREATEST(0::NUMERIC, p_quantity - v_reserved_equivalent);

  RETURN json_build_object(
    'success', true,
    'reserved', ROUND(v_reserved_equivalent, 2),
    'reserved_physical_cones', v_reserved_physical,
    'reserved_equivalent_cones', ROUND(v_reserved_equivalent, 2),
    'shortage', ROUND(v_shortage_equivalent, 2),
    'shortage_equivalent_cones', ROUND(v_shortage_equivalent, 2),
    'loan_id', v_loan_id,
    'warehouse_ids', v_warehouse_ids
  );
END;
$$;

COMMENT ON FUNCTION fn_reserve_from_stock(INTEGER, INTEGER, NUMERIC, TEXT, CHARACTER VARYING, INTEGER)
  IS 'Reserve available stock for a confirmed week until equivalent cones cover requested quantity.';
