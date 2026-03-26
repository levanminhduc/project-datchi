-- ============================================================================
-- Fix fn_confirm_week_with_reserve & fn_receive_delivery
-- Parse nested calculation_data: style_result → calculations → color_breakdown
-- ============================================================================

BEGIN;

-- ============================================================================
-- HELPER: fn_parse_calculation_cones
-- Returns (thread_type_id, needed_cones) from nested calculation_data
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_parse_calculation_cones(
  p_week_id INTEGER,
  p_thread_type_id INTEGER DEFAULT NULL
)
RETURNS TABLE(thread_type_id INTEGER, needed_cones INTEGER) AS $$
BEGIN
  RETURN QUERY
  WITH parsed AS (
    SELECT
      COALESCE(
        (cb.value->>'thread_type_id')::INTEGER,
        (calc.value->>'spec_id')::INTEGER
      ) AS tt_id,
      CASE
        WHEN cb.value IS NOT NULL THEN
          CEIL(
            COALESCE((cb.value->>'total_meters')::NUMERIC, 0)
            / NULLIF(COALESCE(
              (cb.value->>'meters_per_cone')::NUMERIC,
              (calc.value->>'meters_per_cone')::NUMERIC
            ), 0)
          )
        ELSE
          CEIL(
            COALESCE((calc.value->>'total_meters')::NUMERIC, 0)
            / NULLIF((calc.value->>'meters_per_cone')::NUMERIC, 0)
          )
      END AS cones
    FROM thread_order_results tor,
         jsonb_array_elements(tor.calculation_data) AS style_result,
         jsonb_array_elements(style_result.value->'calculations') AS calc
         LEFT JOIN LATERAL jsonb_array_elements(calc.value->'color_breakdown') AS cb ON true
    WHERE tor.week_id = p_week_id
      AND (
        cb.value IS NOT NULL
        OR calc.value->'color_breakdown' IS NULL
        OR jsonb_array_length(calc.value->'color_breakdown') = 0
      )
  )
  SELECT p.tt_id, SUM(COALESCE(p.cones, 0))::INTEGER
  FROM parsed p
  WHERE p.tt_id IS NOT NULL AND p.cones IS NOT NULL AND p.cones > 0
    AND (p_thread_type_id IS NULL OR p.tt_id = p_thread_type_id)
  GROUP BY p.tt_id;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION fn_parse_calculation_cones IS 'Parse nested calculation_data to get thread_type_id → needed_cones';

-- ============================================================================
-- FUNCTION: fn_confirm_week_with_reserve (REPLACE)
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_confirm_week_with_reserve(p_week_id INTEGER)
RETURNS JSON AS $$
DECLARE
  v_week RECORD;
  v_summary RECORD;
  v_reserve_result JSON;
  v_all_summaries JSON[] := '{}';
  v_total_reserved INTEGER := 0;
  v_total_shortage INTEGER := 0;
BEGIN
  SELECT * INTO v_week
  FROM thread_order_weeks
  WHERE id = p_week_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy tuần đơn hàng với id %', p_week_id;
  END IF;

  IF v_week.status <> 'DRAFT' THEN
    RAISE EXCEPTION 'Chỉ có thể xác nhận tuần ở trạng thái DRAFT. Trạng thái hiện tại: %', v_week.status;
  END IF;

  FOR v_summary IN
    SELECT * FROM fn_parse_calculation_cones(p_week_id)
  LOOP
    v_reserve_result := fn_reserve_for_week(
      p_week_id,
      v_summary.thread_type_id,
      v_summary.needed_cones
    );

    v_all_summaries := array_append(v_all_summaries, json_build_object(
      'thread_type_id', v_summary.thread_type_id,
      'needed', v_summary.needed_cones,
      'reserved', (v_reserve_result->>'reserved')::INTEGER,
      'shortage', (v_reserve_result->>'shortage')::INTEGER
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
    'total_reserved', v_total_reserved,
    'total_shortage', v_total_shortage,
    'reservation_summary', to_json(v_all_summaries)
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_confirm_week_with_reserve IS 'Atomic confirm WO week with reservation - parses nested calculation_data (style→calc→color_breakdown)';

-- ============================================================================
-- FUNCTION: fn_receive_delivery (REPLACE)
-- ============================================================================
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
    END IF;

    v_cones_created := v_cones_created + 1;
  END LOOP;

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
    'lot_number', 'WO-' || v_week_id
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_receive_delivery IS 'Atomic receive delivery with auto-reserve, parses nested calculation_data for shortage';

NOTIFY pgrst, 'reload schema';

COMMIT;
