-- ============================================================================
-- Thread Management System - RPC Function: issue_cone
-- Migration: 010_rpc_issue.sql
-- Description: Convert soft allocation to hard allocation (issue cones to production)
-- Dependencies: 003_thread_allocations.sql, 004_thread_movements.sql
-- ============================================================================

-- ============================================================================
-- FUNCTION: issue_cone
-- Purpose: Convert soft allocation to hard allocation (issue to production)
--
-- Parameters:
--   p_allocation_id: ID of the allocation to issue
--   p_confirmed_by: Optional user who confirmed the issue
--
-- Returns: JSON object with issue result
--   {
--     success: boolean,
--     movement_id: integer | null (first movement ID for reference),
--     cone_ids: integer[],
--     message: string (Vietnamese)
--   }
--
-- Key Features:
--   1. Validates allocation exists and status is SOFT
--   2. Uses row-level locks to prevent concurrent modifications
--   3. Updates all allocated cones to IN_PRODUCTION status
--   4. Creates movement records for each cone
--   5. Updates allocation status to ISSUED
--   6. Returns Vietnamese messages for UI display
--
-- State Transitions:
--   Allocation: SOFT -> ISSUED
--   Cones: SOFT_ALLOCATED -> IN_PRODUCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION issue_cone(
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
    -- =========================================================================
    -- STEP 1: Get allocation with lock to prevent concurrent modifications
    -- =========================================================================
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
    
    -- =========================================================================
    -- STEP 2: Validate allocation status is SOFT
    -- Only SOFT allocations can be issued (converted to HARD/ISSUED)
    -- =========================================================================
    IF v_allocation.status != 'SOFT' THEN
        RETURN json_build_object(
            'success', false,
            'movement_id', NULL,
            'cone_ids', '{}',
            'message', 'Phân bổ phải ở trạng thái "Đã giữ chỗ" để xuất kho. Trạng thái hiện tại: ' || v_allocation.status::TEXT
        );
    END IF;
    
    -- =========================================================================
    -- STEP 3: Process each allocated cone
    -- Lock cones to prevent concurrent modifications
    -- Update status and create movement records
    -- =========================================================================
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
        -- Validate cone status (should be SOFT_ALLOCATED or AVAILABLE)
        IF v_cone.current_status NOT IN ('SOFT_ALLOCATED', 'AVAILABLE') THEN
            -- Skip cones that are not in valid state (might have been modified concurrently)
            CONTINUE;
        END IF;
        
        -- Update cone status to IN_PRODUCTION
        UPDATE thread_inventory
        SET status = 'IN_PRODUCTION',
            updated_at = NOW()
        WHERE id = v_cone.cone_id;
        
        -- Create movement record for this cone
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
            v_cone.current_status::VARCHAR,
            'IN_PRODUCTION',
            'ALLOCATION',
            p_allocation_id::VARCHAR,
            p_confirmed_by
        ) RETURNING id INTO v_movement_id;
        
        -- Collect IDs for response
        v_movement_ids := array_append(v_movement_ids, v_movement_id);
        v_cone_ids := array_append(v_cone_ids, v_cone.cone_id);
        v_cones_processed := v_cones_processed + 1;
    END LOOP;
    
    -- =========================================================================
    -- STEP 4: Check if any cones were processed
    -- =========================================================================
    IF v_cones_processed = 0 THEN
        RETURN json_build_object(
            'success', false,
            'movement_id', NULL,
            'cone_ids', '{}',
            'message', 'Không có cuộn chỉ nào được xuất kho - kiểm tra trạng thái cuộn'
        );
    END IF;
    
    -- =========================================================================
    -- STEP 5: Update allocation status to ISSUED
    -- =========================================================================
    UPDATE thread_allocations
    SET status = 'ISSUED',
        updated_at = NOW()
    WHERE id = p_allocation_id;
    
    -- =========================================================================
    -- STEP 6: Return success result with Vietnamese message
    -- =========================================================================
    RETURN json_build_object(
        'success', true,
        'movement_id', v_movement_ids[1],  -- First movement ID for reference
        'cone_ids', v_cone_ids,
        'message', 'Xuất kho thành công - ' || v_cones_processed || ' cuộn'
    );

EXCEPTION WHEN OTHERS THEN
    -- =========================================================================
    -- ERROR HANDLING
    -- Return error information with Vietnamese message
    -- Transaction will be rolled back by caller
    -- =========================================================================
    RETURN json_build_object(
        'success', false,
        'movement_id', NULL,
        'cone_ids', '{}',
        'message', 'Lỗi: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql;

-- Add function comment
COMMENT ON FUNCTION issue_cone IS 'Convert soft allocation to issued status - Xuat kho tu phan bo mem';

-- ============================================================================
-- GRANT EXECUTE permission to authenticated users
-- (Adjust based on your security requirements)
-- ============================================================================
-- GRANT EXECUTE ON FUNCTION issue_cone TO authenticated;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
