CREATE OR REPLACE FUNCTION public.fn_re_reserve_after_remove_po(p_week_id integer)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_week RECORD;
  v_pair RECORD;
  v_cone RECORD;
  v_all_summaries JSON[] := '{}';
  v_partial_ratio NUMERIC := 0.3;
  v_cone_equivalent NUMERIC;
  v_stock_equivalent NUMERIC;
  v_pair_released INTEGER;
  v_total_released INTEGER := 0;
  v_total_kept INTEGER := 0;
BEGIN
  SELECT * INTO v_week
  FROM thread_order_weeks
  WHERE id = p_week_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy tuần đơn hàng với id %', p_week_id;
  END IF;

  IF v_week.status <> 'CONFIRMED' THEN
    RAISE EXCEPTION 'Chỉ có thể re-reserve cho tuần đang CONFIRMED. Trạng thái hiện tại: %', v_week.status;
  END IF;

  SELECT COALESCE(NULLIF(value #>> '{}', '')::NUMERIC, 0.3)
  INTO v_partial_ratio
  FROM system_settings
  WHERE key = 'partial_cone_ratio';

  IF v_partial_ratio IS NULL OR v_partial_ratio <= 0 THEN
    v_partial_ratio := 0.3;
  END IF;

  FOR v_pair IN
    WITH held_cones AS (
      SELECT ti.thread_type_id,
             ti.color_id,
             (COALESCE(ti.lot_number LIKE 'WO-%', false)
               OR ti.receive_log_id IS NOT NULL
               OR ti.original_week_id IS NOT NULL
               OR ti.color_id IS NULL) AS is_kept,
             CASE WHEN ti.is_partial THEN v_partial_ratio ELSE 1 END AS equivalent
      FROM thread_inventory ti
      WHERE ti.reserved_week_id = p_week_id
        AND ti.status = 'RESERVED_FOR_ORDER'
    ),
    held AS (
      SELECT thread_type_id,
             color_id,
             COUNT(*) FILTER (WHERE is_kept) AS kept_physical,
             COALESCE(SUM(equivalent) FILTER (WHERE NOT is_kept), 0) AS stock_equivalent
      FROM held_cones
      GROUP BY thread_type_id, color_id
    )
    SELECT h.thread_type_id,
           h.color_id,
           COALESCE(n.needed_cones, 0) AS needed,
           h.kept_physical,
           h.stock_equivalent
    FROM held h
    LEFT JOIN fn_parse_calculation_cones(p_week_id) n
      ON n.thread_type_id = h.thread_type_id
     AND n.color_id = h.color_id
  LOOP
    v_stock_equivalent := v_pair.stock_equivalent;
    v_pair_released := 0;

    IF v_stock_equivalent > v_pair.needed AND v_pair.color_id IS NOT NULL THEN
      FOR v_cone IN
        SELECT id, is_partial
        FROM thread_inventory
        WHERE reserved_week_id = p_week_id
          AND status = 'RESERVED_FOR_ORDER'
          AND thread_type_id = v_pair.thread_type_id
          AND color_id = v_pair.color_id
          AND NOT COALESCE(lot_number LIKE 'WO-%', false)
          AND receive_log_id IS NULL
          AND original_week_id IS NULL
        ORDER BY expiry_date DESC NULLS FIRST, received_date DESC, id DESC
        FOR UPDATE
      LOOP
        EXIT WHEN v_stock_equivalent <= v_pair.needed;

        v_cone_equivalent := CASE WHEN v_cone.is_partial THEN v_partial_ratio ELSE 1 END;
        CONTINUE WHEN v_stock_equivalent - v_cone_equivalent < v_pair.needed;

        UPDATE thread_inventory
        SET status = 'AVAILABLE',
            reserved_week_id = NULL,
            updated_at = NOW()
        WHERE id = v_cone.id;

        v_stock_equivalent := v_stock_equivalent - v_cone_equivalent;
        v_pair_released := v_pair_released + 1;
      END LOOP;
    END IF;

    IF v_pair_released > 0 THEN
      v_all_summaries := array_append(v_all_summaries, json_build_object(
        'thread_type_id', v_pair.thread_type_id,
        'color_id', v_pair.color_id,
        'needed', v_pair.needed,
        'kept', v_pair.kept_physical,
        'released', v_pair_released
      ));
    END IF;

    v_total_released := v_total_released + v_pair_released;
    v_total_kept := v_total_kept + v_pair.kept_physical;
  END LOOP;

  RETURN json_build_object(
    'success', true,
    'week_id', p_week_id,
    'released', v_total_released,
    'kept', v_total_kept,
    'total_reserved', 0,
    'total_shortage', 0,
    'reservation_summary', to_json(v_all_summaries)
  );
END;
$function$;
