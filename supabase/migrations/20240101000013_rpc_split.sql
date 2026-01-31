-- ============================================================================
-- Thread Management System - RPC Function: split_allocation
-- Migration: 013_rpc_split.sql
-- Description: Split an allocation into two separate allocations
-- Dependencies: 003_thread_allocations.sql, 002_thread_inventory.sql
-- ============================================================================

-- ============================================================================
-- COLUMN: split_from_id
-- Nullable FK to track split history
-- ============================================================================

ALTER TABLE thread_allocations
ADD COLUMN IF NOT EXISTS split_from_id INTEGER REFERENCES thread_allocations(id);

COMMENT ON COLUMN thread_allocations.split_from_id IS 'Reference to original allocation if this was created from a split - Tham chieu phan bo goc neu la ket qua chia nho';

-- Index for tracking split relationships
CREATE INDEX IF NOT EXISTS idx_allocations_split_from ON thread_allocations(split_from_id) WHERE split_from_id IS NOT NULL;

-- ============================================================================
-- FUNCTION: split_allocation
-- Purpose: Split an existing allocation into two separate allocations
--
-- Parameters:
--   p_allocation_id: ID of the allocation to split
--   p_split_meters: Number of meters for the NEW allocation
--   p_split_reason: Optional reason for the split
--
-- Returns: JSON object with split result
--   {
--     success: boolean,
--     original_allocation_id: integer,
--     new_allocation_id: integer,
--     original_meters: decimal,
--     split_meters: decimal,
--     message: string (Vietnamese)
--   }
--
-- Key Features:
--   1. Uses FOR UPDATE to prevent race conditions
--   2. Releases all allocated cones back to AVAILABLE
--   3. Sets both allocations to PENDING with allocated_meters = 0
--   4. Tracks split history via split_from_id
-- ============================================================================

CREATE OR REPLACE FUNCTION split_allocation(
    p_allocation_id INTEGER,
    p_split_meters DECIMAL,
    p_split_reason TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_allocation RECORD;
    v_new_allocation_id INTEGER;
    v_remaining_meters DECIMAL;
    v_cone_ids INTEGER[];
    v_notes TEXT;
BEGIN
    -- =========================================================================
    -- STEP 1: Lock and fetch the original allocation
    -- =========================================================================
    SELECT 
        id, 
        order_id, 
        order_reference, 
        thread_type_id,
        requested_meters, 
        allocated_meters,
        status, 
        priority, 
        priority_score,
        due_date, 
        notes, 
        created_by
    INTO v_allocation
    FROM thread_allocations
    WHERE id = p_allocation_id
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'original_allocation_id', p_allocation_id,
            'new_allocation_id', NULL,
            'original_meters', 0,
            'split_meters', 0,
            'message', 'Không tìm thấy phân bổ'
        );
    END IF;
    
    -- =========================================================================
    -- STEP 2: Validate split parameters
    -- =========================================================================
    
    -- Check status - only allow split for PENDING, SOFT, WAITLISTED
    IF v_allocation.status NOT IN ('PENDING', 'SOFT', 'WAITLISTED') THEN
        RETURN json_build_object(
            'success', false,
            'original_allocation_id', p_allocation_id,
            'new_allocation_id', NULL,
            'original_meters', v_allocation.requested_meters,
            'split_meters', 0,
            'message', 'Chỉ có thể chia nhỏ phân bổ đang chờ xử lý, đã phân bổ mềm hoặc trong danh sách chờ'
        );
    END IF;
    
    -- Validate split_meters > 0
    IF p_split_meters <= 0 THEN
        RETURN json_build_object(
            'success', false,
            'original_allocation_id', p_allocation_id,
            'new_allocation_id', NULL,
            'original_meters', v_allocation.requested_meters,
            'split_meters', 0,
            'message', 'Số mét chia phải lớn hơn 0'
        );
    END IF;
    
    -- Validate split_meters < requested_meters
    IF p_split_meters >= v_allocation.requested_meters THEN
        RETURN json_build_object(
            'success', false,
            'original_allocation_id', p_allocation_id,
            'new_allocation_id', NULL,
            'original_meters', v_allocation.requested_meters,
            'split_meters', 0,
            'message', 'Số mét chia phải nhỏ hơn số mét yêu cầu ban đầu'
        );
    END IF;
    
    -- =========================================================================
    -- STEP 3: Release all allocated cones back to AVAILABLE
    -- =========================================================================
    
    -- Get cone IDs for this allocation
    SELECT ARRAY_AGG(cone_id) INTO v_cone_ids
    FROM thread_allocation_cones
    WHERE allocation_id = p_allocation_id;
    
    -- Release cones if any exist
    IF v_cone_ids IS NOT NULL AND array_length(v_cone_ids, 1) > 0 THEN
        UPDATE thread_inventory
        SET status = 'AVAILABLE',
            updated_at = NOW()
        WHERE id = ANY(v_cone_ids)
          AND status IN ('SOFT_ALLOCATED', 'HARD_ALLOCATED');
        
        -- Delete cone allocation records
        DELETE FROM thread_allocation_cones
        WHERE allocation_id = p_allocation_id;
    END IF;
    
    -- =========================================================================
    -- STEP 4: Calculate remaining meters for original allocation
    -- =========================================================================
    v_remaining_meters := v_allocation.requested_meters - p_split_meters;
    
    -- =========================================================================
    -- STEP 5: Update original allocation
    -- =========================================================================
    v_notes := COALESCE(v_allocation.notes, '');
    IF p_split_reason IS NOT NULL THEN
        v_notes := v_notes || E'\n[Chia nhỏ]: ' || p_split_reason;
    ELSE
        v_notes := v_notes || E'\n[Chia nhỏ]: Đã chia ' || p_split_meters || ' mét thành phân bổ mới';
    END IF;
    
    UPDATE thread_allocations
    SET requested_meters = v_remaining_meters,
        allocated_meters = 0,
        status = 'PENDING',
        notes = TRIM(v_notes),
        updated_at = NOW()
    WHERE id = p_allocation_id;
    
    -- =========================================================================
    -- STEP 6: Create new allocation with split meters
    -- =========================================================================
    INSERT INTO thread_allocations (
        order_id,
        order_reference,
        thread_type_id,
        requested_meters,
        allocated_meters,
        status,
        priority,
        priority_score,
        due_date,
        notes,
        created_by,
        split_from_id
    ) VALUES (
        v_allocation.order_id,
        v_allocation.order_reference,
        v_allocation.thread_type_id,
        p_split_meters,
        0,
        'PENDING',
        v_allocation.priority,
        v_allocation.priority_score,
        v_allocation.due_date,
        CASE 
            WHEN p_split_reason IS NOT NULL THEN '[Từ phân bổ #' || p_allocation_id || ']: ' || p_split_reason
            ELSE '[Từ phân bổ #' || p_allocation_id || ']: Được tách ra từ phân bổ gốc'
        END,
        v_allocation.created_by,
        p_allocation_id
    ) RETURNING id INTO v_new_allocation_id;
    
    -- =========================================================================
    -- STEP 7: Return success result
    -- =========================================================================
    RETURN json_build_object(
        'success', true,
        'original_allocation_id', p_allocation_id,
        'new_allocation_id', v_new_allocation_id,
        'original_meters', v_remaining_meters,
        'split_meters', p_split_meters,
        'message', 'Đã chia nhỏ phân bổ thành công'
    );
    
EXCEPTION WHEN OTHERS THEN
    -- =========================================================================
    -- ERROR HANDLING
    -- =========================================================================
    RETURN json_build_object(
        'success', false,
        'original_allocation_id', p_allocation_id,
        'new_allocation_id', NULL,
        'original_meters', 0,
        'split_meters', 0,
        'message', 'Lỗi: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql;

-- Add function comment
COMMENT ON FUNCTION split_allocation IS 'Split an allocation into two separate allocations - Chia nho phan bo thanh hai phan bo rieng';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
