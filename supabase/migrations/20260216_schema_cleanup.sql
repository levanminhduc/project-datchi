BEGIN;

ALTER TABLE style_thread_specs RENAME COLUMN tex_id TO thread_type_id;
DROP INDEX IF EXISTS idx_style_thread_specs_tex_id;
CREATE INDEX idx_style_thread_specs_thread_type_id ON style_thread_specs(thread_type_id);
COMMENT ON COLUMN style_thread_specs.thread_type_id IS 'FK den bang thread_types - Loai chi';

DO $$ BEGIN
    CREATE TYPE conflict_status AS ENUM ('PENDING', 'RESOLVED', 'ESCALATED');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

UPDATE thread_conflicts SET status = 'PENDING' WHERE status IS NULL OR status NOT IN ('PENDING', 'RESOLVED', 'ESCALATED');

ALTER TABLE thread_conflicts DROP CONSTRAINT IF EXISTS chk_conflicts_status_valid;
DROP INDEX IF EXISTS idx_conflicts_pending;
ALTER TABLE thread_conflicts ALTER COLUMN status DROP DEFAULT;
ALTER TABLE thread_conflicts
  ALTER COLUMN status TYPE conflict_status USING status::conflict_status;
ALTER TABLE thread_conflicts
  ALTER COLUMN status SET DEFAULT 'PENDING'::conflict_status;
CREATE INDEX idx_conflicts_pending ON thread_conflicts(status) WHERE status = 'PENDING'::conflict_status;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM thread_movements
    WHERE from_status IS NOT NULL
    AND from_status NOT IN ('RECEIVED','INSPECTED','AVAILABLE','SOFT_ALLOCATED','HARD_ALLOCATED','IN_PRODUCTION','PARTIAL_RETURN','PENDING_WEIGH','CONSUMED','WRITTEN_OFF','QUARANTINE')
  ) THEN
    RAISE EXCEPTION 'thread_movements.from_status contains values outside cone_status enum';
  END IF;
  IF EXISTS (
    SELECT 1 FROM thread_movements
    WHERE to_status IS NOT NULL
    AND to_status NOT IN ('RECEIVED','INSPECTED','AVAILABLE','SOFT_ALLOCATED','HARD_ALLOCATED','IN_PRODUCTION','PARTIAL_RETURN','PENDING_WEIGH','CONSUMED','WRITTEN_OFF','QUARANTINE')
  ) THEN
    RAISE EXCEPTION 'thread_movements.to_status contains values outside cone_status enum';
  END IF;
END $$;

ALTER TABLE thread_movements
  ALTER COLUMN from_status TYPE cone_status USING from_status::cone_status;
ALTER TABLE thread_movements
  ALTER COLUMN to_status TYPE cone_status USING to_status::cone_status;

CREATE INDEX IF NOT EXISTS idx_thread_issue_lines_issue_thread
  ON thread_issue_lines(issue_id, thread_type_id);

CREATE INDEX IF NOT EXISTS idx_return_logs_line_id
  ON thread_issue_return_logs(line_id);

CREATE OR REPLACE FUNCTION fn_issue_cone(
    p_allocation_id INTEGER,
    p_confirmed_by VARCHAR DEFAULT NULL
)
RETURNS JSON AS $$
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
            v_cone.allocated_meters,
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
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_recover_cone(
    p_cone_id INTEGER,
    p_returned_weight_grams DECIMAL,
    p_tare_weight_grams DECIMAL DEFAULT 10,
    p_notes TEXT DEFAULT NULL,
    p_weighed_by VARCHAR DEFAULT NULL,
    p_confirmed_by VARCHAR DEFAULT NULL
)
RETURNS JSON AS $$
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
        v_consumption_meters,
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
$$ LANGUAGE plpgsql;

NOTIFY pgrst, 'reload schema';

COMMIT;
