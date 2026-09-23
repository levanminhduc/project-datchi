CREATE OR REPLACE FUNCTION public.fn_return_cones_with_movements(p_cone_ids integer[], p_line_id integer, p_performed_by character varying, p_partial_returns jsonb DEFAULT NULL::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_line_thread_type_id INTEGER;
  v_issue_id INTEGER;
  v_cone_count INTEGER;
  v_affected INTEGER;
  v_cone RECORD;
  v_partial RECORD;
  v_partial_cone_ids INTEGER[];
  v_full_return_ids INTEGER[];
  v_new_cone_id VARCHAR(50);
  v_new_id INTEGER;
  v_original_meters NUMERIC(12,4);
  v_return_meters NUMERIC(12,4);
  v_consumed_meters NUMERIC(12,4);
  v_seq BIGINT;
  v_candidate_count INTEGER;
  v_full_returned_count INTEGER := 0;
  v_partial_existing_returned_count INTEGER := 0;
  v_partial_created_count INTEGER := 0;
  v_returnable_statuses cone_status[] := ARRAY['IN_PRODUCTION', 'HARD_ALLOCATED']::cone_status[];
BEGIN
  IF p_line_id IS NULL THEN
    RAISE EXCEPTION 'Thiếu dòng phiếu xuất khi trả kho';
  END IF;

  SELECT thread_type_id, issue_id INTO v_line_thread_type_id, v_issue_id
  FROM thread_issue_lines
  WHERE id = p_line_id;

  IF v_line_thread_type_id IS NULL THEN
    RAISE EXCEPTION 'Không tìm thấy dòng phiếu xuất %', p_line_id;
  END IF;

  v_full_return_ids := COALESCE(p_cone_ids, ARRAY[]::INTEGER[]);

  IF array_length(v_full_return_ids, 1) IS NULL
     AND (p_partial_returns IS NULL OR jsonb_array_length(p_partial_returns) = 0) THEN
    RAISE EXCEPTION 'Không có cuộn nào để trả kho';
  END IF;

  IF p_partial_returns IS NOT NULL AND jsonb_array_length(p_partial_returns) > 0 THEN
    FOR v_partial IN
      SELECT
        (elem->>'original_cone_id')::INTEGER AS original_cone_id,
        (elem->>'return_quantity_meters')::NUMERIC(12,4) AS return_quantity_meters
      FROM jsonb_array_elements(p_partial_returns) AS elem
    LOOP
      IF v_partial.original_cone_id IS NULL THEN
        RAISE EXCEPTION 'Thiếu cuộn nguồn để tách cuộn lẻ';
      END IF;
      IF v_partial.return_quantity_meters IS NULL OR v_partial.return_quantity_meters <= 0 THEN
        RAISE EXCEPTION 'Số mét trả lẻ phải lớn hơn 0';
      END IF;

      v_partial_cone_ids := array_append(COALESCE(v_partial_cone_ids, ARRAY[]::INTEGER[]), v_partial.original_cone_id);
    END LOOP;

    IF (SELECT COUNT(*) FROM (SELECT UNNEST(v_partial_cone_ids)) t) !=
       (SELECT COUNT(*) FROM (SELECT DISTINCT UNNEST(v_partial_cone_ids)) t) THEN
      RAISE EXCEPTION 'Danh sách cuộn tách lẻ bị trùng';
    END IF;

    IF v_full_return_ids && v_partial_cone_ids THEN
      RAISE EXCEPTION 'Một cuộn vừa nằm trong danh sách trả nguyên vừa nằm trong danh sách tách lẻ';
    END IF;
  END IF;

  IF array_length(v_full_return_ids, 1) > 0 THEN
    IF (SELECT COUNT(*) FROM (SELECT UNNEST(v_full_return_ids)) t) !=
       (SELECT COUNT(*) FROM (SELECT DISTINCT UNNEST(v_full_return_ids)) t) THEN
      RAISE EXCEPTION 'Danh sách cuộn trả bị trùng';
    END IF;

    SELECT
      COUNT(*) FILTER (WHERE is_partial = FALSE),
      COUNT(*) FILTER (WHERE is_partial = TRUE)
    INTO
      v_full_returned_count,
      v_partial_existing_returned_count
    FROM thread_inventory
    WHERE id = ANY(v_full_return_ids);

    PERFORM 1
    FROM thread_inventory
    WHERE id = ANY(v_full_return_ids)
    FOR UPDATE;

    SELECT COUNT(*) INTO v_cone_count
    FROM thread_inventory
    WHERE id = ANY(v_full_return_ids)
      AND status != ALL(v_returnable_statuses);

    IF v_cone_count > 0 THEN
      RAISE EXCEPTION 'Có % cuộn không trả được vì đã xuất đi nơi khác hoặc đã loại bỏ', v_cone_count;
    END IF;

    SELECT COUNT(*) INTO v_cone_count
    FROM thread_inventory
    WHERE id = ANY(v_full_return_ids)
      AND (issued_line_id != p_line_id OR issued_line_id IS NULL)
      AND (is_legacy_unmapped IS NULL OR is_legacy_unmapped = FALSE);

    IF v_cone_count > 0 THEN
      RAISE EXCEPTION 'Dòng phiếu xuất % có % cuộn không thuộc về nó', p_line_id, v_cone_count;
    END IF;

    FOR v_cone IN
      SELECT id, quantity_meters, is_legacy_unmapped, thread_type_id
      FROM thread_inventory
      WHERE id = ANY(v_full_return_ids)
        AND is_legacy_unmapped = TRUE
        AND issued_line_id IS NULL
    LOOP
      SELECT COUNT(*) INTO v_candidate_count
      FROM thread_issue_lines
      WHERE issue_id = v_issue_id
        AND thread_type_id = v_cone.thread_type_id;

      IF v_candidate_count != 1 THEN
        RAISE EXCEPTION 'Cuộn % thuộc dữ liệu cũ, cần đối chiếu tay vì tìm thấy % dòng phiếu phù hợp', v_cone.id, v_candidate_count;
      END IF;
    END LOOP;

    FOR v_cone IN
      SELECT id, quantity_meters, status
      FROM thread_inventory
      WHERE id = ANY(v_full_return_ids)
    LOOP
      INSERT INTO thread_movements (
        cone_id,
        movement_type,
        quantity_meters,
        from_status,
        to_status,
        reference_type,
        reference_id,
        performed_by,
        created_at
      ) VALUES (
        v_cone.id,
        'RETURN',
        v_cone.quantity_meters,
        v_cone.status,
        'AVAILABLE',
        'ISSUE_LINE',
        p_line_id::VARCHAR,
        p_performed_by,
        NOW()
      );
    END LOOP;

    UPDATE thread_inventory
    SET
      status = 'AVAILABLE',
      issued_line_id = NULL,
      reserved_week_id = NULL,
      original_week_id = NULL,
      updated_at = NOW()
    WHERE id = ANY(v_full_return_ids)
      AND status = ANY(v_returnable_statuses);

    GET DIAGNOSTICS v_affected = ROW_COUNT;

    IF v_affected != array_length(v_full_return_ids, 1) THEN
      RAISE EXCEPTION 'Có người khác vừa thay đổi các cuộn này (chờ % cuộn, đổi được % cuộn), vui lòng tải lại rồi thử lại', array_length(v_full_return_ids, 1), v_affected;
    END IF;
  END IF;

  IF v_partial_cone_ids IS NOT NULL AND array_length(v_partial_cone_ids, 1) > 0 THEN
    PERFORM 1
    FROM thread_inventory
    WHERE id = ANY(v_partial_cone_ids)
    FOR UPDATE;

    SELECT COUNT(*) INTO v_cone_count
    FROM thread_inventory
    WHERE id = ANY(v_partial_cone_ids)
      AND (
        status != ALL(v_returnable_statuses)
        OR is_partial = TRUE
        OR (
          (issued_line_id != p_line_id OR issued_line_id IS NULL)
          AND (is_legacy_unmapped IS NULL OR is_legacy_unmapped = FALSE)
        )
      );

    IF v_cone_count > 0 THEN
      RAISE EXCEPTION 'Dòng phiếu xuất % có % cuộn nguồn không hợp lệ để tách lẻ', p_line_id, v_cone_count;
    END IF;

    FOR v_partial IN
      SELECT
        (elem->>'original_cone_id')::INTEGER AS original_cone_id,
        (elem->>'return_quantity_meters')::NUMERIC(12,4) AS return_quantity_meters
      FROM jsonb_array_elements(p_partial_returns) AS elem
    LOOP
      SELECT quantity_meters, cone_id, thread_type_id, warehouse_id, lot_id, lot_number, expiry_date, received_date, location, color_id, status
      INTO v_cone
      FROM thread_inventory
      WHERE id = v_partial.original_cone_id
        AND status = ANY(v_returnable_statuses)
        AND is_partial = FALSE
        AND (
          issued_line_id = p_line_id
          OR (is_legacy_unmapped = TRUE AND issued_line_id IS NULL)
        );

      IF v_cone IS NULL THEN
        RAISE EXCEPTION 'Cuộn % không tách lẻ được vì không tìm thấy hoặc không đủ điều kiện', v_partial.original_cone_id;
      END IF;

      v_original_meters := v_cone.quantity_meters;
      v_return_meters := v_partial.return_quantity_meters;

      IF v_return_meters >= v_original_meters THEN
        RAISE EXCEPTION 'Số mét trả lẻ % phải nhỏ hơn số mét gốc % của cuộn %', v_return_meters, v_original_meters, v_partial.original_cone_id;
      END IF;

      v_consumed_meters := v_original_meters - v_return_meters;

      v_seq := nextval('thread_inventory_partial_seq');

      IF LENGTH(v_cone.cone_id || '-P' || LPAD(v_seq::TEXT, 6, '0')) > 50 THEN
        v_new_cone_id := LEFT(v_cone.cone_id, 38) || '-P' || LPAD(v_seq::TEXT, 6, '0');
      ELSE
        v_new_cone_id := v_cone.cone_id || '-P' || LPAD(v_seq::TEXT, 6, '0');
      END IF;

      INSERT INTO thread_inventory (
        cone_id,
        thread_type_id,
        warehouse_id,
        quantity_cones,
        quantity_meters,
        is_partial,
        status,
        lot_id,
        lot_number,
        expiry_date,
        received_date,
        location,
        issued_line_id,
        reserved_week_id,
        original_week_id,
        color_id,
        created_at,
        updated_at
      ) VALUES (
        v_new_cone_id,
        v_cone.thread_type_id,
        v_cone.warehouse_id,
        1,
        v_return_meters,
        TRUE,
        'AVAILABLE',
        v_cone.lot_id,
        v_cone.lot_number,
        v_cone.expiry_date,
        v_cone.received_date,
        v_cone.location,
        NULL,
        NULL,
        NULL,
        v_cone.color_id,
        NOW(),
        NOW()
      )
      RETURNING id INTO v_new_id;

      UPDATE thread_inventory
      SET
        quantity_meters = v_consumed_meters,
        status = 'CONSUMED',
        is_partial = TRUE,
        issued_line_id = NULL,
        reserved_week_id = NULL,
        original_week_id = NULL,
        updated_at = NOW()
      WHERE id = v_partial.original_cone_id;

      INSERT INTO thread_movements (
        cone_id,
        movement_type,
        quantity_meters,
        from_status,
        to_status,
        reference_type,
        reference_id,
        performed_by,
        notes,
        created_at
      ) VALUES (
        v_new_id,
        'RETURN',
        v_return_meters,
        v_cone.status,
        'AVAILABLE',
        'ISSUE_LINE',
        p_line_id::VARCHAR,
        p_performed_by,
        'Partial return from cone ID ' || v_partial.original_cone_id,
        NOW()
      );

      INSERT INTO thread_movements (
        cone_id,
        movement_type,
        quantity_meters,
        from_status,
        to_status,
        reference_type,
        reference_id,
        performed_by,
        notes,
        created_at
      ) VALUES (
        v_partial.original_cone_id,
        'RETURN',
        v_consumed_meters,
        v_cone.status,
        'CONSUMED',
        'ISSUE_LINE',
        p_line_id::VARCHAR,
        p_performed_by,
        'Original cone consumed: ' || v_consumed_meters || 'm used, ' || v_return_meters || 'm returned as cone ' || v_new_id,
        NOW()
      );

      v_partial_created_count := v_partial_created_count + 1;
    END LOOP;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'full_returns', COALESCE(array_length(v_full_return_ids, 1), 0),
    'partial_returns', v_partial_created_count,
    'full_returned', v_full_returned_count,
    'partial_existing_returned', v_partial_existing_returned_count,
    'partial_created_returned', v_partial_created_count,
    'line_id', p_line_id
  );
END;
$function$
