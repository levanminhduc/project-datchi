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

  IF p_color_id IS NULL THEN
    RETURN json_build_object(
      'reserved', 0,
      'reserved_physical_cones', 0,
      'reserved_equivalent_cones', 0,
      'skipped_locked', 0,
      'skipped_null_color', true,
      'shortage', ROUND(p_quantity, 2),
      'shortage_equivalent_cones', ROUND(p_quantity, 2),
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
    AND color_id = p_color_id
    AND (v_warehouse_ids IS NULL OR warehouse_id = ANY(v_warehouse_ids));

  FOR v_cone IN
    SELECT id, is_partial
    FROM thread_inventory
    WHERE thread_type_id = p_thread_type_id
      AND status = 'AVAILABLE'
      AND reserved_week_id IS NULL
      AND color_id = p_color_id
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
