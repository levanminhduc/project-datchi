CREATE OR REPLACE FUNCTION public.fn_re_reserve_after_remove_po(p_week_id integer)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_week RECORD;
  v_summary RECORD;
  v_reserve_result JSON;
  v_all_summaries JSON[] := '{}';
  v_total_released INTEGER := 0;
  v_total_reserved NUMERIC := 0;
  v_total_shortage NUMERIC := 0;
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

  SELECT COUNT(*) INTO v_total_released
  FROM thread_inventory
  WHERE reserved_week_id = p_week_id
    AND status = 'RESERVED_FOR_ORDER';

  UPDATE thread_inventory
  SET status = 'AVAILABLE',
      reserved_week_id = NULL,
      updated_at = NOW()
  WHERE reserved_week_id = p_week_id
    AND status = 'RESERVED_FOR_ORDER';

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
      'shortage', (v_reserve_result->>'shortage_equivalent_cones')::NUMERIC
    ));

    v_total_reserved := v_total_reserved + (v_reserve_result->>'reserved_equivalent_cones')::NUMERIC;
    v_total_shortage := v_total_shortage + (v_reserve_result->>'shortage_equivalent_cones')::NUMERIC;
  END LOOP;

  RETURN json_build_object(
    'success', true,
    'week_id', p_week_id,
    'released', v_total_released,
    'total_reserved', ROUND(v_total_reserved, 2),
    'total_shortage', ROUND(v_total_shortage, 2),
    'reservation_summary', to_json(v_all_summaries)
  );
END;
$function$;
