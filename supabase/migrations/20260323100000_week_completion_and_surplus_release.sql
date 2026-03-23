-- ============================================================================
-- Migration: 20260323100000_week_completion_and_surplus_release.sql
-- Description: Week completion tracking, surplus release RPC, WEEK_COMPLETED movement type
-- ============================================================================

-- ============================================================================
-- 1.1: Add COMPLETED to order_week_status enum
-- ============================================================================
ALTER TYPE order_week_status ADD VALUE IF NOT EXISTS 'COMPLETED' AFTER 'CANCELLED';

-- ============================================================================
-- 1.2: Add WEEK_COMPLETED to movement_type enum
-- ============================================================================
ALTER TYPE movement_type ADD VALUE IF NOT EXISTS 'WEEK_COMPLETED';

-- ============================================================================
-- 1.3: Create thread_order_item_completions table
-- ============================================================================
CREATE TABLE IF NOT EXISTS thread_order_item_completions (
    id SERIAL PRIMARY KEY,
    item_id INTEGER NOT NULL REFERENCES thread_order_items(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_by VARCHAR(100) NOT NULL,
    UNIQUE(item_id)
);

COMMENT ON TABLE thread_order_item_completions IS 'Theo doi hoan tat xuat chi per PO-Style-Color item';
COMMENT ON COLUMN thread_order_item_completions.item_id IS 'FK den thread_order_items';
COMMENT ON COLUMN thread_order_item_completions.completed_at IS 'Thoi diem danh dau hoan tat';
COMMENT ON COLUMN thread_order_item_completions.completed_by IS 'Nguoi danh dau hoan tat';

CREATE INDEX idx_toic_item_id ON thread_order_item_completions(item_id);

-- ============================================================================
-- 1.4: Create fn_complete_week_and_release RPC
-- Atomic: lock week, verify all items completed, auto-settle loans,
-- release own cones, return borrowed cones, log movements, update status
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_complete_week_and_release(
    p_week_id INTEGER,
    p_performed_by VARCHAR
)
RETURNS JSONB AS $$
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
    -- Lock week row FOR UPDATE to prevent concurrent release
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

    -- Verify all items have completions
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

    -- Auto-settle active loans
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

    -- Process each reserved cone
    FOR v_cone IN
        SELECT id, thread_type_id, quantity_meters, original_week_id, status
        FROM thread_inventory
        WHERE reserved_week_id = p_week_id
          AND status = 'RESERVED_FOR_ORDER'
        FOR UPDATE
    LOOP
        IF v_cone.original_week_id IS NOT NULL AND v_cone.original_week_id <> p_week_id THEN
            -- Borrowed cone: check original week status
            SELECT status INTO v_original_week_status
            FROM thread_order_weeks
            WHERE id = v_cone.original_week_id;

            IF v_original_week_status = 'CONFIRMED' THEN
                -- Re-reserve for original week
                UPDATE thread_inventory
                SET reserved_week_id = v_cone.original_week_id,
                    original_week_id = NULL,
                    updated_at = NOW()
                WHERE id = v_cone.id;

                -- Log movement: borrowed cone returned
                INSERT INTO thread_movements (
                    cone_id, movement_type, quantity_meters, from_status, to_status,
                    reference_type, reference_id, performed_by, notes
                ) VALUES (
                    v_cone.id, 'WEEK_COMPLETED', v_cone.quantity_meters,
                    'RESERVED_FOR_ORDER', 'RESERVED_FOR_ORDER',
                    'WEEK', p_week_id::TEXT, p_performed_by,
                    'Trả cuộn mượn về tuần gốc #' || v_cone.original_week_id
                );

                v_returned_borrowed := v_returned_borrowed + 1;
            ELSE
                -- Original week not CONFIRMED (COMPLETED/CANCELLED) → release to AVAILABLE
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
                    v_cone.id, 'WEEK_COMPLETED', v_cone.quantity_meters,
                    'RESERVED_FOR_ORDER', 'AVAILABLE',
                    'WEEK', p_week_id::TEXT, p_performed_by,
                    'Trả cuộn mượn (tuần gốc #' || v_cone.original_week_id || ' đã ' || COALESCE(v_original_week_status, 'không tìm thấy') || ')'
                );

                v_released_own := v_released_own + 1;
            END IF;
        ELSE
            -- Own cone: release to AVAILABLE
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
                v_cone.id, 'WEEK_COMPLETED', v_cone.quantity_meters,
                'RESERVED_FOR_ORDER', 'AVAILABLE',
                'WEEK', p_week_id::TEXT, p_performed_by,
                'Trả dư cuộn chỉ sau hoàn tất tuần'
            );

            v_released_own := v_released_own + 1;
        END IF;
    END LOOP;

    -- Update week status to COMPLETED
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
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_complete_week_and_release IS 'Atomic week completion: settle loans, release own cones, return borrowed cones, log movements, update status';

-- ============================================================================
-- 1.5: Grant permissions
-- ============================================================================
REVOKE ALL ON FUNCTION fn_complete_week_and_release FROM PUBLIC;
GRANT EXECUTE ON FUNCTION fn_complete_week_and_release TO service_role;
