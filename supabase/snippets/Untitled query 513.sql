BEGIN;

DROP FUNCTION IF EXISTS fn_parse_calculation_cones(INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION fn_parse_calculation_cones(
  p_week_id INTEGER,
  p_thread_type_id INTEGER DEFAULT NULL
)
RETURNS TABLE(thread_type_id INTEGER, color_id INTEGER, needed_cones INTEGER) AS $$
BEGIN
  RETURN QUERY
  WITH parsed AS (
    SELECT
      COALESCE(
        (cb.value->>'thread_type_id')::INTEGER,
        (calc.value->>'spec_id')::INTEGER
      ) AS tt_id,
      CASE
        WHEN cb.value IS NOT NULL THEN cb.value->>'thread_color'
        ELSE calc.value->>'thread_color'
      END AS thread_color_name,
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
  SELECT p.tt_id, c.id, SUM(COALESCE(p.cones, 0))::INTEGER
  FROM parsed p
  LEFT JOIN colors c ON c.name = p.thread_color_name
  WHERE p.tt_id IS NOT NULL AND p.cones IS NOT NULL AND p.cones > 0
    AND (p_thread_type_id IS NULL OR p.tt_id = p_thread_type_id)
  GROUP BY p.tt_id, c.id;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION fn_parse_calculation_cones IS 'Parse nested calculation_data to get thread_type_id + color_id -> needed_cones';

DROP FUNCTION IF EXISTS fn_reserve_for_week(INTEGER, INTEGER, INTEGER);

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
BEGIN
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
    AND (p_color_id IS NULL OR color_id = p_color_id);

  FOR v_cone IN
    SELECT id
    FROM thread_inventory
    WHERE thread_type_id = p_thread_type_id
      AND status = 'AVAILABLE'
      AND reserved_week_id IS NULL
      AND (p_color_id IS NULL OR color_id = p_color_id)
    ORDER BY
      CASE WHEN v_priority = 'partial_first' THEN is_partial::int ELSE 0 END DESC,
      CASE WHEN v_priority = 'full_first' THEN is_partial::int ELSE 0 END ASC,
      expiry_date ASC NULLS LAST,
      received_date ASC
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
    'shortage', GREATEST(0, p_quantity - v_reserved)
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_reserve_for_week IS 'Reserve AVAILABLE cones for WO week with FEFO, respects reserve_priority and color_id filter';

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
      v_summary.needed_cones,
      v_summary.color_id
    );

    v_all_summaries := array_append(v_all_summaries, json_build_object(
      'thread_type_id', v_summary.thread_type_id,
      'color_id', v_summary.color_id,
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

COMMENT ON FUNCTION fn_confirm_week_with_reserve IS 'Atomic confirm WO week with reservation - parses nested calculation_data with color_id filtering';

DROP FUNCTION IF EXISTS fn_reserve_from_stock(INTEGER, INTEGER, INTEGER, TEXT, VARCHAR);

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
BEGIN
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
    RAISE EXCEPTION 'Không tìm thấy tuần đơn hàng với id %', p_week_id;
  END IF;

  IF v_week_status <> 'CONFIRMED' THEN
    RAISE EXCEPTION 'Chỉ có thể lấy từ tồn kho cho tuần đã xác nhận';
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM thread_order_deliveries
    WHERE week_id = p_week_id AND thread_type_id = p_thread_type_id
  ) INTO v_delivery_exists;

  IF NOT v_delivery_exists THEN
    RAISE EXCEPTION 'Không có dữ liệu giao hàng cho loại chỉ này trong tuần đơn hàng';
  END IF;

  FOR v_cone IN
    SELECT id, quantity_meters
    FROM thread_inventory
    WHERE thread_type_id = p_thread_type_id
      AND status = 'AVAILABLE'
      AND reserved_week_id IS NULL
      AND (p_color_id IS NULL OR color_id = p_color_id)
    ORDER BY
      CASE WHEN v_priority = 'partial_first' THEN is_partial::int ELSE 0 END DESC,
      CASE WHEN v_priority = 'full_first' THEN is_partial::int ELSE 0 END ASC,
      expiry_date ASC NULLS LAST,
      received_date ASC
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
      v_reserved, v_total_meters, COALESCE(p_reason, 'Lấy từ tồn kho'), p_user
    ) RETURNING id INTO v_loan_id;

    UPDATE thread_order_deliveries
    SET quantity_cones = GREATEST(0, quantity_cones - v_reserved),
        updated_at = NOW()
    WHERE week_id = p_week_id
      AND thread_type_id = p_thread_type_id;
  END IF;

  v_shortage := GREATEST(0, p_quantity - v_reserved);

  RETURN json_build_object(
    'success', true,
    'reserved', v_reserved,
    'shortage', v_shortage,
    'loan_id', v_loan_id
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_reserve_from_stock IS 'Reserve available stock for confirmed WO week, respects reserve_priority and color_id filter';

CREATE INDEX IF NOT EXISTS idx_inventory_reserve_color
ON thread_inventory (thread_type_id, color_id, status)
WHERE reserved_week_id IS NULL;

NOTIFY pgrst, 'reload schema';

COMMIT;
