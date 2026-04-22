-- Mở rộng fn_transfer_reserved_cones: nhập riêng số cuộn nguyên (full) và cuộn lẻ (partial).
-- Mỗi item: { thread_type_id, color_id, full_quantity, partial_quantity }.
-- Pick riêng từng nhóm theo expiry_date ASC NULLS LAST, received_date ASC.
CREATE OR REPLACE FUNCTION fn_transfer_reserved_cones(
  p_week_id INTEGER,
  p_from_warehouse_id INTEGER,
  p_to_warehouse_id INTEGER,
  p_items JSONB,
  p_performed_by VARCHAR
) RETURNS JSON AS $$
DECLARE
  v_item JSONB;
  v_cone_ids INTEGER[] := ARRAY[]::INTEGER[];
  v_picked_full INTEGER[];
  v_picked_partial INTEGER[];
  v_full_req INTEGER;
  v_partial_req INTEGER;
  v_per_item JSONB := '[]'::JSONB;
  v_total INTEGER := 0;
  v_transaction_id INTEGER;
BEGIN
  IF p_from_warehouse_id = p_to_warehouse_id THEN
    RAISE EXCEPTION 'Kho nguồn và kho đích không được trùng nhau';
  END IF;

  PERFORM 1 FROM thread_order_weeks WHERE id = p_week_id FOR UPDATE;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_full_req := COALESCE((v_item->>'full_quantity')::INTEGER, 0);
    v_partial_req := COALESCE((v_item->>'partial_quantity')::INTEGER, 0);

    IF v_full_req < 0 OR v_partial_req < 0 THEN
      RAISE EXCEPTION 'Số lượng âm không hợp lệ (thread_type_id=%, color_id=%)',
        v_item->>'thread_type_id', v_item->>'color_id';
    END IF;
    IF v_full_req = 0 AND v_partial_req = 0 THEN
      CONTINUE;
    END IF;

    v_picked_full := ARRAY[]::INTEGER[];
    v_picked_partial := ARRAY[]::INTEGER[];

    IF v_full_req > 0 THEN
      SELECT ARRAY(
        SELECT id FROM thread_inventory
        WHERE reserved_week_id = p_week_id
          AND warehouse_id = p_from_warehouse_id
          AND thread_type_id = (v_item->>'thread_type_id')::INTEGER
          AND color_id = (v_item->>'color_id')::INTEGER
          AND status = 'RESERVED_FOR_ORDER'
          AND is_partial = FALSE
        ORDER BY expiry_date ASC NULLS LAST, received_date ASC
        FOR UPDATE SKIP LOCKED
        LIMIT v_full_req
      ) INTO v_picked_full;

      IF COALESCE(array_length(v_picked_full, 1), 0) < v_full_req THEN
        RAISE EXCEPTION 'Không đủ cuộn nguyên cho thread_type_id=%, color_id=% (yêu cầu %, có %)',
          v_item->>'thread_type_id', v_item->>'color_id',
          v_full_req, COALESCE(array_length(v_picked_full, 1), 0);
      END IF;
    END IF;

    IF v_partial_req > 0 THEN
      SELECT ARRAY(
        SELECT id FROM thread_inventory
        WHERE reserved_week_id = p_week_id
          AND warehouse_id = p_from_warehouse_id
          AND thread_type_id = (v_item->>'thread_type_id')::INTEGER
          AND color_id = (v_item->>'color_id')::INTEGER
          AND status = 'RESERVED_FOR_ORDER'
          AND is_partial = TRUE
        ORDER BY expiry_date ASC NULLS LAST, received_date ASC
        FOR UPDATE SKIP LOCKED
        LIMIT v_partial_req
      ) INTO v_picked_partial;

      IF COALESCE(array_length(v_picked_partial, 1), 0) < v_partial_req THEN
        RAISE EXCEPTION 'Không đủ cuộn lẻ cho thread_type_id=%, color_id=% (yêu cầu %, có %)',
          v_item->>'thread_type_id', v_item->>'color_id',
          v_partial_req, COALESCE(array_length(v_picked_partial, 1), 0);
      END IF;
    END IF;

    UPDATE thread_inventory
       SET warehouse_id = p_to_warehouse_id, updated_at = NOW()
     WHERE id = ANY(v_picked_full || v_picked_partial);

    v_cone_ids := v_cone_ids || v_picked_full || v_picked_partial;
    v_per_item := v_per_item || jsonb_build_object(
      'thread_type_id', (v_item->>'thread_type_id')::INTEGER,
      'color_id', (v_item->>'color_id')::INTEGER,
      'moved_full', COALESCE(array_length(v_picked_full, 1), 0),
      'moved_partial', COALESCE(array_length(v_picked_partial, 1), 0),
      'moved', COALESCE(array_length(v_picked_full, 1), 0) + COALESCE(array_length(v_picked_partial, 1), 0)
    );
    v_total := v_total
      + COALESCE(array_length(v_picked_full, 1), 0)
      + COALESCE(array_length(v_picked_partial, 1), 0);
  END LOOP;

  IF v_total = 0 THEN
    RAISE EXCEPTION 'Không có cuộn nào được chọn để chuyển';
  END IF;

  INSERT INTO batch_transactions (
    operation_type, from_warehouse_id, to_warehouse_id,
    cone_ids, cone_count, notes, performed_by, performed_at
  ) VALUES (
    'TRANSFER', p_from_warehouse_id, p_to_warehouse_id,
    v_cone_ids, v_total,
    'Chuyển kho cho Tuần #' || p_week_id, p_performed_by, NOW()
  ) RETURNING id INTO v_transaction_id;

  RETURN jsonb_build_object(
    'transaction_id', v_transaction_id,
    'total_cones', v_total,
    'per_item', v_per_item
  );
END;
$$ LANGUAGE plpgsql;
