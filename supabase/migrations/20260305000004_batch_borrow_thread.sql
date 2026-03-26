CREATE OR REPLACE FUNCTION fn_batch_borrow_thread(
  p_from_week_id INTEGER,
  p_to_week_id   INTEGER,
  p_items         JSONB,
  p_reason        TEXT,
  p_user          VARCHAR
)
RETURNS JSON AS $$
DECLARE
  v_item       JSONB;
  v_thread_type_id INTEGER;
  v_quantity   INTEGER;
  v_needed     INTEGER;
  v_reserved   INTEGER;
  v_shortage   INTEGER;
  v_result     JSON;
  v_results    JSON[] := '{}';
  v_total_moved INTEGER := 0;
  v_thread_name TEXT;
BEGIN
  IF p_from_week_id = p_to_week_id THEN
    RAISE EXCEPTION 'Không thể mượn từ chính tuần đó';
  END IF;

  IF jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Cần ít nhất một loại chỉ';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_thread_type_id := (v_item->>'thread_type_id')::INTEGER;
    v_quantity := (v_item->>'quantity_cones')::INTEGER;

    IF v_quantity <= 0 THEN
      SELECT name INTO v_thread_name FROM thread_types WHERE id = v_thread_type_id;
      RAISE EXCEPTION 'Số cuộn phải lớn hơn 0 cho loại chỉ %', COALESCE(v_thread_name, v_thread_type_id::TEXT);
    END IF;

    SELECT COALESCE(tod.quantity_cones, 0) INTO v_needed
    FROM thread_order_deliveries tod
    WHERE tod.week_id = p_to_week_id AND tod.thread_type_id = v_thread_type_id;

    IF v_needed IS NULL THEN v_needed := 0; END IF;

    SELECT COUNT(*) INTO v_reserved
    FROM thread_inventory
    WHERE reserved_week_id = p_to_week_id
      AND thread_type_id = v_thread_type_id
      AND status = 'RESERVED_FOR_ORDER';

    v_shortage := GREATEST(0, v_needed - v_reserved);

    IF v_quantity > v_shortage THEN
      SELECT name INTO v_thread_name FROM thread_types WHERE id = v_thread_type_id;
      RAISE EXCEPTION 'Loại chỉ % chỉ thiếu % cuộn, không thể mượn % cuộn',
        COALESCE(v_thread_name, v_thread_type_id::TEXT), v_shortage, v_quantity;
    END IF;

    v_result := fn_borrow_thread(
      p_from_week_id, p_to_week_id, v_thread_type_id,
      v_quantity, p_reason, p_user
    );

    v_results := array_append(v_results, v_result);
    v_total_moved := v_total_moved + (v_result->>'moved_cones')::INTEGER;
  END LOOP;

  RETURN json_build_object(
    'success', true,
    'total_items', jsonb_array_length(p_items),
    'total_moved_cones', v_total_moved,
    'results', to_json(v_results)
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_batch_borrow_thread IS 'Atomic batch borrow: validates shortage cap per thread type, then delegates to fn_borrow_thread for each item';
