CREATE OR REPLACE FUNCTION public.fn_nonzero_meters(p_meters numeric)
 RETURNS numeric
 LANGUAGE sql
 IMMUTABLE
AS $function$
  SELECT CASE WHEN COALESCE(p_meters, 0) = 0 THEN 0.0001 ELSE p_meters END;
$function$;

WITH repaired AS (
  UPDATE thread_inventory ti
  SET quantity_meters = tt.meters_per_cone,
      updated_at = NOW()
  FROM thread_types tt
  WHERE tt.id = ti.thread_type_id
    AND ti.status = 'RESERVED_FOR_ORDER'
    AND (ti.quantity_meters IS NULL OR ti.quantity_meters = 0)
    AND tt.meters_per_cone > 0
  RETURNING ti.id AS cone_id, ti.status AS current_status, tt.meters_per_cone AS meters
)
INSERT INTO thread_movements (
  cone_id, movement_type, quantity_meters,
  from_status, to_status,
  reference_type, reference_id,
  performed_by, notes
)
SELECT
  cone_id, 'ADJUSTMENT'::movement_type, meters,
  current_status, current_status,
  'MIGRATION', '20260804090000',
  'system', 'Nắn lại số mét cho cuộn bị tạo với 0 mét'
FROM repaired;

CREATE OR REPLACE FUNCTION public.fn_issue_cones_with_movements(p_cone_ids integer[], p_line_id integer, p_performed_by character varying)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_line_thread_type_id INTEGER;
  v_cone_count INTEGER;
  v_affected INTEGER;
  v_cone RECORD;
  v_issuable_statuses cone_status[] := ARRAY['AVAILABLE', 'RECEIVED', 'INSPECTED', 'RESERVED_FOR_ORDER']::cone_status[];
BEGIN
  IF p_cone_ids IS NULL OR array_length(p_cone_ids, 1) IS NULL OR array_length(p_cone_ids, 1) = 0 THEN
    RAISE EXCEPTION 'p_cone_ids cannot be empty';
  END IF;

  IF p_line_id IS NULL THEN
    RAISE EXCEPTION 'p_line_id cannot be NULL';
  END IF;

  IF (SELECT COUNT(*) FROM (SELECT UNNEST(p_cone_ids)) t) != (SELECT COUNT(*) FROM (SELECT DISTINCT UNNEST(p_cone_ids)) t) THEN
    RAISE EXCEPTION 'p_cone_ids contains duplicates';
  END IF;

  SELECT thread_type_id INTO v_line_thread_type_id
  FROM thread_issue_lines
  WHERE id = p_line_id;

  IF v_line_thread_type_id IS NULL THEN
    RAISE EXCEPTION 'Issue line % not found', p_line_id;
  END IF;

  SELECT COUNT(*) INTO v_cone_count
  FROM thread_inventory
  WHERE id = ANY(p_cone_ids)
    AND thread_type_id != v_line_thread_type_id;

  IF v_cone_count > 0 THEN
    RAISE EXCEPTION 'Some cones do not match thread_type_id % of issue line', v_line_thread_type_id;
  END IF;

  PERFORM 1
  FROM thread_inventory
  WHERE id = ANY(p_cone_ids)
  FOR UPDATE;

  SELECT COUNT(*) INTO v_cone_count
  FROM thread_inventory
  WHERE id = ANY(p_cone_ids)
    AND status != ALL(v_issuable_statuses);

  IF v_cone_count > 0 THEN
    RAISE EXCEPTION 'Some cones are not in issuable status (% cones)', v_cone_count;
  END IF;

  FOR v_cone IN
    SELECT id, quantity_meters, status
    FROM thread_inventory
    WHERE id = ANY(p_cone_ids)
  LOOP
    INSERT INTO thread_movements (
      cone_id, movement_type, quantity_meters,
      from_status, to_status,
      reference_type, reference_id,
      performed_by, created_at
    ) VALUES (
      v_cone.id, 'ISSUE', fn_nonzero_meters(v_cone.quantity_meters),
      v_cone.status, 'IN_PRODUCTION',
      'ISSUE_LINE', p_line_id::VARCHAR,
      p_performed_by, NOW()
    );
  END LOOP;

  UPDATE thread_inventory
  SET
    status = 'IN_PRODUCTION',
    issued_line_id = p_line_id,
    reserved_week_id = NULL,
    updated_at = NOW()
  WHERE id = ANY(p_cone_ids)
    AND status = ANY(v_issuable_statuses);

  GET DIAGNOSTICS v_affected = ROW_COUNT;

  IF v_affected != array_length(p_cone_ids, 1) THEN
    RAISE EXCEPTION 'Concurrent modification detected: expected %, affected %', array_length(p_cone_ids, 1), v_affected;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'affected_cones', v_affected,
    'line_id', p_line_id
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.fn_complete_week_and_release(p_week_id integer, p_performed_by character varying)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_week RECORD;
    v_total_items INTEGER;
    v_completed_items INTEGER;
    v_released_own INTEGER := 0;
    v_returned_borrowed INTEGER := 0;
    v_settled_loans INTEGER := 0;
    v_cone RECORD;
    v_original_week_status VARCHAR;
BEGIN
    SELECT * INTO v_week
    FROM thread_order_weeks
    WHERE id = p_week_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Không tìm thấy tuần đặt hàng với id %', p_week_id;
    END IF;

    IF v_week.status = 'COMPLETED' THEN
        RAISE EXCEPTION 'Tuần đã được hoàn tất';
    END IF;

    IF v_week.status <> 'CONFIRMED' THEN
        RAISE EXCEPTION 'Chỉ có thể hoàn tất tuần ở trạng thái CONFIRMED. Trạng thái hiện tại: %', v_week.status;
    END IF;

    SELECT COUNT(*) INTO v_total_items
    FROM thread_order_items
    WHERE week_id = p_week_id;

    SELECT COUNT(*) INTO v_completed_items
    FROM thread_order_items toi
    JOIN thread_order_item_completions toic ON toic.item_id = toi.id
    WHERE toi.week_id = p_week_id;

    IF v_total_items = 0 THEN
        RAISE EXCEPTION 'Tuần không có sản phẩm nào';
    END IF;

    IF v_completed_items < v_total_items THEN
        RAISE EXCEPTION 'Chưa hoàn tất tất cả sản phẩm (% / %)', v_completed_items, v_total_items;
    END IF;

    WITH settled AS (
        UPDATE thread_order_loans
        SET status = 'SETTLED',
            returned_cones = quantity_cones,
            updated_at = NOW()
        WHERE (from_week_id = p_week_id OR to_week_id = p_week_id)
          AND status = 'ACTIVE'
          AND deleted_at IS NULL
        RETURNING id
    )
    SELECT COUNT(*) INTO v_settled_loans FROM settled;

    FOR v_cone IN
        SELECT id, thread_type_id, quantity_meters, original_week_id, status
        FROM thread_inventory
        WHERE reserved_week_id = p_week_id
          AND status = 'RESERVED_FOR_ORDER'
        FOR UPDATE
    LOOP
        IF v_cone.original_week_id IS NOT NULL AND v_cone.original_week_id <> p_week_id THEN
            SELECT status INTO v_original_week_status
            FROM thread_order_weeks
            WHERE id = v_cone.original_week_id;

            IF v_original_week_status = 'CONFIRMED' THEN
                UPDATE thread_inventory
                SET reserved_week_id = v_cone.original_week_id,
                    original_week_id = NULL,
                    updated_at = NOW()
                WHERE id = v_cone.id;

                INSERT INTO thread_movements (
                    cone_id, movement_type, quantity_meters, from_status, to_status,
                    reference_type, reference_id, performed_by, notes
                ) VALUES (
                    v_cone.id, 'WEEK_COMPLETED', fn_nonzero_meters(v_cone.quantity_meters),
                    'RESERVED_FOR_ORDER', 'RESERVED_FOR_ORDER',
                    'WEEK', p_week_id::TEXT, p_performed_by,
                    'Trả cuộn mượn về tuần gốc #' || v_cone.original_week_id
                );

                v_returned_borrowed := v_returned_borrowed + 1;
            ELSE
                UPDATE thread_inventory
                SET status = 'AVAILABLE',
                    reserved_week_id = NULL,
                    original_week_id = NULL,
                    updated_at = NOW()
                WHERE id = v_cone.id;

                INSERT INTO thread_movements (
                    cone_id, movement_type, quantity_meters, from_status, to_status,
                    reference_type, reference_id, performed_by, notes
                ) VALUES (
                    v_cone.id, 'WEEK_COMPLETED', fn_nonzero_meters(v_cone.quantity_meters),
                    'RESERVED_FOR_ORDER', 'AVAILABLE',
                    'WEEK', p_week_id::TEXT, p_performed_by,
                    'Trả cuộn mượn (tuần gốc #' || v_cone.original_week_id || ' đã ' || COALESCE(v_original_week_status, 'không tìm thấy') || ')'
                );

                v_released_own := v_released_own + 1;
            END IF;
        ELSE
            UPDATE thread_inventory
            SET status = 'AVAILABLE',
                reserved_week_id = NULL,
                original_week_id = NULL,
                updated_at = NOW()
            WHERE id = v_cone.id;

            INSERT INTO thread_movements (
                cone_id, movement_type, quantity_meters, from_status, to_status,
                reference_type, reference_id, performed_by, notes
            ) VALUES (
                v_cone.id, 'WEEK_COMPLETED', fn_nonzero_meters(v_cone.quantity_meters),
                'RESERVED_FOR_ORDER', 'AVAILABLE',
                'WEEK', p_week_id::TEXT, p_performed_by,
                'Trả dư cuộn chỉ sau hoàn tất tuần'
            );

            v_released_own := v_released_own + 1;
        END IF;
    END LOOP;

    UPDATE thread_order_weeks
    SET status = 'COMPLETED',
        updated_at = NOW()
    WHERE id = p_week_id;

    RETURN jsonb_build_object(
        'success', true,
        'released_own', v_released_own,
        'returned_borrowed', v_returned_borrowed,
        'settled_loans', v_settled_loans,
        'week_status', 'COMPLETED'
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.fn_issue_cone(p_allocation_id integer, p_confirmed_by character varying DEFAULT NULL::character varying)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_allocation RECORD;
    v_cone RECORD;
    v_movement_ids INTEGER[] := '{}';
    v_movement_id INTEGER;
    v_cone_ids INTEGER[] := '{}';
    v_cones_processed INTEGER := 0;
BEGIN
    SELECT * INTO v_allocation
    FROM thread_allocations
    WHERE id = p_allocation_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'movement_id', NULL,
            'cone_ids', '{}',
            'message', 'Không tìm thấy phân bổ'
        );
    END IF;

    IF v_allocation.status != 'SOFT' THEN
        RETURN json_build_object(
            'success', false,
            'movement_id', NULL,
            'cone_ids', '{}',
            'message', 'Phân bổ phải ở trạng thái "Đã giữ chỗ" để xuất kho. Trạng thái hiện tại: ' || v_allocation.status::TEXT
        );
    END IF;

    FOR v_cone IN
        SELECT
            ac.cone_id,
            ac.allocated_meters,
            ti.status AS current_status,
            ti.quantity_meters
        FROM thread_allocation_cones ac
        JOIN thread_inventory ti ON ti.id = ac.cone_id
        WHERE ac.allocation_id = p_allocation_id
        FOR UPDATE OF ti
    LOOP
        IF v_cone.current_status NOT IN ('SOFT_ALLOCATED', 'AVAILABLE') THEN
            CONTINUE;
        END IF;

        UPDATE thread_inventory
        SET status = 'IN_PRODUCTION',
            updated_at = NOW()
        WHERE id = v_cone.cone_id;

        INSERT INTO thread_movements (
            cone_id,
            allocation_id,
            movement_type,
            quantity_meters,
            from_status,
            to_status,
            reference_type,
            reference_id,
            performed_by
        ) VALUES (
            v_cone.cone_id,
            p_allocation_id,
            'ISSUE',
            fn_nonzero_meters(v_cone.allocated_meters),
            v_cone.current_status,
            'IN_PRODUCTION'::cone_status,
            'ALLOCATION',
            p_allocation_id::VARCHAR,
            p_confirmed_by
        ) RETURNING id INTO v_movement_id;

        v_movement_ids := array_append(v_movement_ids, v_movement_id);
        v_cone_ids := array_append(v_cone_ids, v_cone.cone_id);
        v_cones_processed := v_cones_processed + 1;
    END LOOP;

    IF v_cones_processed = 0 THEN
        RETURN json_build_object(
            'success', false,
            'movement_id', NULL,
            'cone_ids', '{}',
            'message', 'Không có cuộn chỉ nào được xuất kho - kiểm tra trạng thái cuộn'
        );
    END IF;

    UPDATE thread_allocations
    SET status = 'ISSUED',
        updated_at = NOW()
    WHERE id = p_allocation_id;

    RETURN json_build_object(
        'success', true,
        'movement_id', v_movement_ids[1],
        'cone_ids', v_cone_ids,
        'message', 'Xuất kho thành công - ' || v_cones_processed || ' cuộn'
    );

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'movement_id', NULL,
        'cone_ids', '{}',
        'message', 'Lỗi: ' || SQLERRM
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.fn_recover_cone(p_cone_id integer, p_returned_weight_grams numeric, p_tare_weight_grams numeric DEFAULT 10, p_notes text DEFAULT NULL::text, p_weighed_by character varying DEFAULT NULL::character varying, p_confirmed_by character varying DEFAULT NULL::character varying)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_cone RECORD;
    v_thread_type RECORD;
    v_recovery_id INTEGER;
    v_calculated_meters DECIMAL;
    v_consumption_meters DECIMAL;
    v_net_weight DECIMAL;
    v_is_write_off BOOLEAN := FALSE;
    v_new_status cone_status;
    v_recovery_status recovery_status;
BEGIN
    SELECT * INTO v_cone
    FROM thread_inventory
    WHERE id = p_cone_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'recovery_id', NULL,
            'calculated_meters', 0,
            'is_write_off', false,
            'message', 'Không tìm thấy cuộn chỉ'
        );
    END IF;

    IF v_cone.status NOT IN ('IN_PRODUCTION', 'PARTIAL_RETURN') THEN
        RETURN json_build_object(
            'success', false,
            'recovery_id', NULL,
            'calculated_meters', 0,
            'is_write_off', false,
            'message', 'Cuộn chỉ phải đang trong sản xuất hoặc đang thu hồi'
        );
    END IF;

    SELECT * INTO v_thread_type
    FROM thread_types
    WHERE id = v_cone.thread_type_id;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'recovery_id', NULL,
            'calculated_meters', 0,
            'is_write_off', false,
            'message', 'Không tìm thấy loại chỉ'
        );
    END IF;

    IF v_thread_type.density_grams_per_meter IS NULL OR v_thread_type.density_grams_per_meter <= 0 THEN
        RETURN json_build_object(
            'success', false,
            'recovery_id', NULL,
            'calculated_meters', 0,
            'is_write_off', false,
            'message', 'Hệ số mật độ chưa được cấu hình cho loại chỉ này'
        );
    END IF;

    v_net_weight := GREATEST(0, p_returned_weight_grams - p_tare_weight_grams);

    v_calculated_meters := ROUND(
        v_net_weight / v_thread_type.density_grams_per_meter,
        4
    );

    v_consumption_meters := v_cone.quantity_meters - v_calculated_meters;

    IF v_net_weight < 50 THEN
        v_is_write_off := TRUE;
        v_new_status := 'WRITTEN_OFF'::cone_status;
        v_recovery_status := 'WRITTEN_OFF';
    ELSE
        v_new_status := 'AVAILABLE'::cone_status;
        v_recovery_status := 'CONFIRMED';
    END IF;

    INSERT INTO thread_recovery (
        cone_id,
        original_meters,
        returned_weight_grams,
        calculated_meters,
        tare_weight_grams,
        consumption_meters,
        status,
        weighed_by,
        confirmed_by,
        notes
    ) VALUES (
        p_cone_id,
        v_cone.quantity_meters,
        p_returned_weight_grams,
        v_calculated_meters,
        p_tare_weight_grams,
        v_consumption_meters,
        v_recovery_status,
        p_weighed_by,
        p_confirmed_by,
        p_notes
    ) RETURNING id INTO v_recovery_id;

    UPDATE thread_inventory
    SET status = v_new_status,
        quantity_meters = v_calculated_meters,
        weight_grams = v_net_weight,
        is_partial = TRUE,
        updated_at = NOW()
    WHERE id = p_cone_id;

    INSERT INTO thread_movements (
        cone_id,
        movement_type,
        quantity_meters,
        from_status,
        to_status,
        performed_by,
        notes
    ) VALUES (
        p_cone_id,
        CASE WHEN v_is_write_off THEN 'WRITE_OFF'::movement_type ELSE 'RETURN'::movement_type END,
        fn_nonzero_meters(v_consumption_meters),
        v_cone.status,
        v_new_status,
        p_confirmed_by,
        CASE
            WHEN v_is_write_off THEN 'Xóa sổ - dưới 50g (' || v_net_weight || 'g)'
            ELSE 'Thu hồi cuộn lẻ - ' || v_calculated_meters || ' mét còn lại'
        END
    );

    RETURN json_build_object(
        'success', true,
        'recovery_id', v_recovery_id,
        'calculated_meters', v_calculated_meters,
        'is_write_off', v_is_write_off,
        'message', CASE
            WHEN v_is_write_off THEN 'Xóa sổ thành công - dưới 50g còn lại'
            ELSE 'Thu hồi thành công - ' || v_calculated_meters || ' mét còn lại'
        END
    );

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'recovery_id', NULL,
        'calculated_meters', 0,
        'is_write_off', false,
        'message', 'Lỗi: ' || SQLERRM
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.fn_return_cones_with_movements(p_cone_ids integer[], p_line_id integer, p_performed_by character varying, p_partial_returns jsonb DEFAULT NULL::jsonb, p_target_warehouse_id integer DEFAULT NULL::integer, p_return_log_id integer DEFAULT NULL::integer)
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
        return_log_id,
        performed_by,
        created_at
      ) VALUES (
        v_cone.id,
        'RETURN',
        fn_nonzero_meters(v_cone.quantity_meters),
        v_cone.status,
        'AVAILABLE',
        'ISSUE_LINE',
        p_line_id::VARCHAR,
        p_return_log_id,
        p_performed_by,
        NOW()
      );
    END LOOP;

    UPDATE thread_inventory
    SET
      status = 'AVAILABLE',
      warehouse_id = COALESCE(p_target_warehouse_id, warehouse_id),
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
        COALESCE(p_target_warehouse_id, v_cone.warehouse_id),
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
        return_log_id,
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
        p_return_log_id,
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
        return_log_id,
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
        p_return_log_id,
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
$function$;
