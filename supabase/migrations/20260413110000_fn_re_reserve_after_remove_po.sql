BEGIN;

CREATE OR REPLACE FUNCTION fn_re_reserve_after_remove_po(p_week_id INTEGER)
RETURNS JSON AS $$
DECLARE
  v_week RECORD;
  v_summary RECORD;
  v_reserve_result JSON;
  v_all_summaries JSON[] := '{}';
  v_total_released INTEGER := 0;
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
      'reserved', (v_reserve_result->>'reserved')::INTEGER,
      'shortage', (v_reserve_result->>'shortage')::INTEGER
    ));

    v_total_reserved := v_total_reserved + (v_reserve_result->>'reserved')::INTEGER;
    v_total_shortage := v_total_shortage + (v_reserve_result->>'shortage')::INTEGER;
  END LOOP;

  RETURN json_build_object(
    'success', true,
    'week_id', p_week_id,
    'released', v_total_released,
    'total_reserved', v_total_reserved,
    'total_shortage', v_total_shortage,
    'reservation_summary', to_json(v_all_summaries)
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_re_reserve_after_remove_po IS 'Release all reservations then re-reserve based on current calculation_data. Used after removing a PO from CONFIRMED week.';

NOTIFY pgrst, 'reload schema';

COMMIT;
