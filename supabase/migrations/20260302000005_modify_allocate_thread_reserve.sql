-- ============================================================================
-- Weekly Order Reserve Inventory - Modify fn_allocate_thread
-- Migration: 20260302000005_modify_allocate_thread_reserve.sql
-- Description: Add p_week_id param, include RESERVED_FOR_ORDER status, auto-loan logic
-- Tasks: 4.1-4.5
-- ============================================================================

-- Drop and recreate with new signature
DROP FUNCTION IF EXISTS fn_allocate_thread(VARCHAR, VARCHAR, INTEGER, DECIMAL, allocation_priority, DATE, TEXT, VARCHAR);

CREATE OR REPLACE FUNCTION fn_allocate_thread(
    p_order_id VARCHAR,
    p_order_reference VARCHAR,
    p_thread_type_id INTEGER,
    p_requested_meters DECIMAL,
    p_priority allocation_priority,
    p_due_date DATE DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_created_by VARCHAR DEFAULT NULL,
    p_week_id INTEGER DEFAULT NULL  -- Task 4.1: Add optional week_id parameter
)
RETURNS JSON AS $$
DECLARE
    v_allocation_id INTEGER;
    v_allocated_meters DECIMAL := 0;
    v_remaining_meters DECIMAL;
    v_priority_score INTEGER;
    v_available_total DECIMAL;
    v_cone RECORD;
    v_cone_allocate_meters DECIMAL;
    v_conflict_id INTEGER := NULL;
    v_status allocation_status;
    v_loan_meters DECIMAL := 0;
    v_loan_cones INTEGER := 0;
    v_loan_from_week INTEGER;
BEGIN
    -- Calculate priority score
    v_priority_score := CASE p_priority
        WHEN 'URGENT' THEN 40
        WHEN 'HIGH' THEN 30
        WHEN 'NORMAL' THEN 20
        WHEN 'LOW' THEN 10
    END;

    -- Task 4.2: Check total available (AVAILABLE + RESERVED_FOR_ORDER)
    SELECT COALESCE(SUM(quantity_meters), 0) INTO v_available_total
    FROM thread_inventory
    WHERE thread_type_id = p_thread_type_id
      AND status IN ('AVAILABLE', 'RESERVED_FOR_ORDER');

    -- Create allocation record
    INSERT INTO thread_allocations (
        order_id, order_reference, thread_type_id,
        requested_meters, allocated_meters,
        status, priority, priority_score,
        due_date, notes, created_by,
        week_id  -- Store week_id on allocation
    ) VALUES (
        p_order_id, p_order_reference, p_thread_type_id,
        p_requested_meters, 0,
        'PENDING', p_priority, v_priority_score,
        p_due_date, p_notes, p_created_by,
        p_week_id
    ) RETURNING id INTO v_allocation_id;

    v_remaining_meters := p_requested_meters;

    -- Task 4.2: FEFO allocation - prioritize reserved cones for same week, then available
    FOR v_cone IN
        SELECT id, quantity_meters, reserved_week_id, original_week_id
        FROM thread_inventory
        WHERE thread_type_id = p_thread_type_id
          AND status IN ('AVAILABLE', 'RESERVED_FOR_ORDER')
        ORDER BY
            -- Prioritize: 1) Reserved for same week, 2) Available, 3) Reserved for other weeks
            CASE
              WHEN reserved_week_id = p_week_id THEN 0
              WHEN reserved_week_id IS NULL THEN 1
              ELSE 2
            END,
            is_partial DESC,
            expiry_date ASC NULLS LAST,
            received_date ASC
        FOR UPDATE SKIP LOCKED
    LOOP
        EXIT WHEN v_remaining_meters <= 0;

        v_cone_allocate_meters := LEAST(v_cone.quantity_meters, v_remaining_meters);

        -- Task 4.3 & 4.4: Track loans when allocating reserved cones from different week
        IF v_cone.reserved_week_id IS NOT NULL
           AND p_week_id IS NOT NULL
           AND v_cone.reserved_week_id <> p_week_id THEN
            -- This is a cross-week allocation - track for auto-loan
            v_loan_from_week := v_cone.reserved_week_id;
            v_loan_meters := v_loan_meters + v_cone_allocate_meters;
            v_loan_cones := v_loan_cones + 1;
        END IF;

        -- Task 4.3: Set original_week_id when allocating reserved cones
        UPDATE thread_inventory
        SET status = 'SOFT_ALLOCATED',
            original_week_id = CASE
              WHEN reserved_week_id IS NOT NULL THEN COALESCE(original_week_id, reserved_week_id)
              ELSE original_week_id
            END,
            reserved_week_id = NULL,
            updated_at = NOW()
        WHERE id = v_cone.id;

        INSERT INTO thread_allocation_cones (
            allocation_id, cone_id, allocated_meters
        ) VALUES (
            v_allocation_id, v_cone.id, v_cone_allocate_meters
        );

        v_allocated_meters := v_allocated_meters + v_cone_allocate_meters;
        v_remaining_meters := v_remaining_meters - v_cone_allocate_meters;
    END LOOP;

    -- Task 4.4: Create auto-loan record if cross-week allocation occurred
    IF v_loan_cones > 0 AND v_loan_from_week IS NOT NULL AND p_week_id IS NOT NULL THEN
        INSERT INTO thread_order_loans (
            from_week_id, to_week_id, thread_type_id,
            quantity_cones, quantity_meters, reason, created_by
        ) VALUES (
            v_loan_from_week, p_week_id, p_thread_type_id,
            v_loan_cones, v_loan_meters,
            'Auto-loan từ allocation #' || v_allocation_id,
            COALESCE(p_created_by, 'system')
        );
    END IF;

    -- Determine final status and handle conflicts
    IF v_allocated_meters >= p_requested_meters THEN
        v_status := 'SOFT';
    ELSIF v_allocated_meters > 0 THEN
        v_status := 'SOFT';
        INSERT INTO thread_conflicts (
            thread_type_id, total_requested_meters, total_available_meters,
            shortage_meters, status
        ) VALUES (
            p_thread_type_id, p_requested_meters, v_available_total,
            p_requested_meters - v_allocated_meters, 'PENDING'
        ) RETURNING id INTO v_conflict_id;

        INSERT INTO thread_conflict_allocations (
            conflict_id, allocation_id, original_priority_score
        ) VALUES (v_conflict_id, v_allocation_id, v_priority_score);
    ELSE
        v_status := 'WAITLISTED';
        INSERT INTO thread_conflicts (
            thread_type_id, total_requested_meters, total_available_meters,
            shortage_meters, status
        ) VALUES (
            p_thread_type_id, p_requested_meters, v_available_total,
            p_requested_meters, 'PENDING'
        ) RETURNING id INTO v_conflict_id;

        INSERT INTO thread_conflict_allocations (
            conflict_id, allocation_id, original_priority_score
        ) VALUES (v_conflict_id, v_allocation_id, v_priority_score);
    END IF;

    UPDATE thread_allocations
    SET allocated_meters = v_allocated_meters,
        status = v_status,
        updated_at = NOW()
    WHERE id = v_allocation_id;

    RETURN json_build_object(
        'success', true,
        'allocation_id', v_allocation_id,
        'allocated_meters', v_allocated_meters,
        'waitlisted_meters', GREATEST(0, p_requested_meters - v_allocated_meters),
        'conflict_id', v_conflict_id,
        'auto_loan_cones', v_loan_cones,
        'message', CASE
            WHEN v_allocated_meters >= p_requested_meters THEN 'Phân bổ thành công'
            WHEN v_allocated_meters > 0 THEN 'Phân bổ một phần - thiếu hàng'
            ELSE 'Không có hàng - đã thêm vào danh sách chờ'
        END
    );

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'allocation_id', NULL,
        'allocated_meters', 0,
        'waitlisted_meters', 0,
        'conflict_id', NULL,
        'auto_loan_cones', 0,
        'message', 'Lỗi: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_allocate_thread IS 'Atomic soft allocation with FEFO, RESERVED_FOR_ORDER support, and auto-loan tracking';

-- ============================================================================
-- FUNCTION: fn_restore_reservation
-- Task 4.5: Reverse transition logic - restore RESERVED_FOR_ORDER on cancel/split
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_restore_reservation(p_cone_id INTEGER)
RETURNS JSON AS $$
DECLARE
    v_cone RECORD;
    v_week_valid BOOLEAN;
BEGIN
    SELECT * INTO v_cone
    FROM thread_inventory
    WHERE id = p_cone_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'message', 'Cone not found');
    END IF;

    -- Check if original_week_id exists and week is still valid
    IF v_cone.original_week_id IS NOT NULL THEN
        SELECT EXISTS(
            SELECT 1 FROM thread_order_weeks
            WHERE id = v_cone.original_week_id
              AND status IN ('DRAFT', 'CONFIRMED')
        ) INTO v_week_valid;

        IF v_week_valid THEN
            -- Restore to RESERVED_FOR_ORDER
            UPDATE thread_inventory
            SET status = 'RESERVED_FOR_ORDER',
                reserved_week_id = v_cone.original_week_id,
                original_week_id = NULL,
                updated_at = NOW()
            WHERE id = p_cone_id;

            RETURN json_build_object(
                'success', true,
                'action', 'restored_reservation',
                'week_id', v_cone.original_week_id
            );
        END IF;
    END IF;

    -- Default: set to AVAILABLE
    UPDATE thread_inventory
    SET status = 'AVAILABLE',
        reserved_week_id = NULL,
        original_week_id = NULL,
        updated_at = NOW()
    WHERE id = p_cone_id;

    RETURN json_build_object(
        'success', true,
        'action', 'set_available',
        'week_id', NULL
    );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_restore_reservation IS 'Restore cone to RESERVED_FOR_ORDER or AVAILABLE on allocation cancel/split (D9)';
