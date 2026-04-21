-- Atomic transfer cones đã reserve cho 1 tuần từ kho nguồn → kho đích.
-- FEFO pick: is_partial DESC, expiry_date ASC NULLS LAST, received_date ASC.
-- Giữ nguyên status='RESERVED_FOR_ORDER' và reserved_week_id, chỉ đổi warehouse_id.
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
  v_picked INTEGER[];
  v_per_item JSONB := '[]'::JSONB;
  v_total INTEGER := 0;
  v_transaction_id INTEGER;
BEGIN
  IF p_from_warehouse_id = p_to_warehouse_id THEN
    RAISE EXCEPTION 'Kho nguồn và kho đích không được trùng nhau';
  END IF;

  PERFORM 1 FROM thread_order_weeks WHERE id = p_week_id FOR UPDATE;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    SELECT ARRAY(
      SELECT id FROM thread_inventory
      WHERE reserved_week_id = p_week_id
        AND warehouse_id = p_from_warehouse_id
        AND thread_type_id = (v_item->>'thread_type_id')::INTEGER
        AND color_id = (v_item->>'color_id')::INTEGER
        AND status = 'RESERVED_FOR_ORDER'
      ORDER BY is_partial DESC, expiry_date ASC NULLS LAST, received_date ASC
      FOR UPDATE SKIP LOCKED
      LIMIT (v_item->>'quantity')::INTEGER
    ) INTO v_picked;

    IF array_length(v_picked, 1) IS NULL
       OR array_length(v_picked, 1) < (v_item->>'quantity')::INTEGER THEN
      RAISE EXCEPTION 'Không đủ cuộn cho thread_type_id=%, color_id=% (yêu cầu %, có %)',
        v_item->>'thread_type_id', v_item->>'color_id',
        v_item->>'quantity', COALESCE(array_length(v_picked, 1), 0);
    END IF;

    UPDATE thread_inventory
       SET warehouse_id = p_to_warehouse_id, updated_at = NOW()
     WHERE id = ANY(v_picked);

    v_cone_ids := v_cone_ids || v_picked;
    v_per_item := v_per_item || jsonb_build_object(
      'thread_type_id', (v_item->>'thread_type_id')::INTEGER,
      'color_id', (v_item->>'color_id')::INTEGER,
      'moved', array_length(v_picked, 1)
    );
    v_total := v_total + array_length(v_picked, 1);
  END LOOP;

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
