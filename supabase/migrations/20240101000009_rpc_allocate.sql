-- ============================================================================
-- Thread Management System - RPC Function: allocate_thread
-- Migration: 009_rpc_allocate.sql
-- Description: Atomic soft allocation with FEFO logic and conflict detection
-- Dependencies: 002_thread_inventory.sql, 003_thread_allocations.sql, 006_thread_conflicts.sql
-- ============================================================================

-- ============================================================================
-- FUNCTION: allocate_thread
-- Purpose: Create soft allocation for a thread request with FEFO logic
--
-- Parameters:
--   p_order_id: Production order ID
--   p_order_reference: Order description/reference
--   p_thread_type_id: Thread type to allocate
--   p_requested_meters: Amount of thread needed
--   p_priority: Priority level (LOW, NORMAL, HIGH, URGENT)
--   p_due_date: Optional due date for production
--   p_notes: Optional notes
--   p_created_by: User who created the allocation
--
-- Returns: JSON object with allocation result
--   {
--     success: boolean,
--     allocation_id: integer,
--     allocated_meters: decimal,
--     waitlisted_meters: decimal,
--     conflict_id: integer | null,
--     message: string (Vietnamese)
--   }
--
-- Key Features:
--   1. Uses FOR UPDATE SKIP LOCKED to prevent race conditions
--   2. FEFO (First Expired First Out) with partial cone priority
--   3. Creates conflict record when demand > supply
--   4. Returns Vietnamese messages for UI display
-- ============================================================================

CREATE OR REPLACE FUNCTION allocate_thread(
    p_order_id VARCHAR,
    p_order_reference VARCHAR,
    p_thread_type_id INTEGER,
    p_requested_meters DECIMAL,
    p_priority allocation_priority,
    p_due_date DATE DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_created_by VARCHAR DEFAULT NULL
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
BEGIN
    -- =========================================================================
    -- STEP 1: Calculate priority score
    -- Priority score = priority_level * 10 + age_days (age is 0 for new allocation)
    -- Priority levels: LOW=10, NORMAL=20, HIGH=30, URGENT=40
    -- =========================================================================
    v_priority_score := CASE p_priority
        WHEN 'URGENT' THEN 40
        WHEN 'HIGH' THEN 30
        WHEN 'NORMAL' THEN 20
        WHEN 'LOW' THEN 10
    END;
    
    -- =========================================================================
    -- STEP 2: Check total available meters for this thread type
    -- This is used for conflict detection later
    -- =========================================================================
    SELECT COALESCE(SUM(quantity_meters), 0) INTO v_available_total
    FROM thread_inventory
    WHERE thread_type_id = p_thread_type_id
      AND status = 'AVAILABLE';
    
    -- =========================================================================
    -- STEP 3: Create allocation record with PENDING status
    -- We'll update the status after allocation attempt
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
        created_by
    ) VALUES (
        p_order_id, 
        p_order_reference, 
        p_thread_type_id,
        p_requested_meters, 
        0,
        'PENDING', 
        p_priority, 
        v_priority_score,
        p_due_date, 
        p_notes, 
        p_created_by
    ) RETURNING id INTO v_allocation_id;
    
    v_remaining_meters := p_requested_meters;
    
    -- =========================================================================
    -- STEP 4: FEFO allocation with row-level locks
    -- 
    -- Allocation Order:
    --   1. is_partial DESC: Partial cones first (use up remnants before full cones)
    --   2. expiry_date ASC NULLS LAST: Earliest expiry first (no expiry = lowest priority)
    --   3. received_date ASC: Oldest received first (FIFO as tiebreaker)
    --
    -- FOR UPDATE SKIP LOCKED:
    --   - Locks selected rows to prevent concurrent modification
    --   - SKIP LOCKED skips rows already locked by other transactions
    --   - This prevents race conditions in concurrent allocation scenarios
    -- =========================================================================
    FOR v_cone IN
        SELECT id, quantity_meters
        FROM thread_inventory
        WHERE thread_type_id = p_thread_type_id
          AND status = 'AVAILABLE'
        ORDER BY 
            is_partial DESC,              -- Partial cones first
            expiry_date ASC NULLS LAST,   -- FEFO (First Expired First Out)
            received_date ASC             -- Oldest received first
        FOR UPDATE SKIP LOCKED            -- Lock rows, skip already locked
    LOOP
        -- Exit when we've allocated enough
        EXIT WHEN v_remaining_meters <= 0;
        
        -- Calculate how much to allocate from this cone
        -- Take the minimum of what's available and what's remaining to allocate
        v_cone_allocate_meters := LEAST(v_cone.quantity_meters, v_remaining_meters);
        
        -- Update cone status to SOFT_ALLOCATED
        UPDATE thread_inventory
        SET status = 'SOFT_ALLOCATED',
            updated_at = NOW()
        WHERE id = v_cone.id;
        
        -- Create allocation-cone junction record
        -- This links the allocation to the specific cone with the allocated amount
        INSERT INTO thread_allocation_cones (
            allocation_id, 
            cone_id, 
            allocated_meters
        ) VALUES (
            v_allocation_id, 
            v_cone.id, 
            v_cone_allocate_meters
        );
        
        -- Update running totals
        v_allocated_meters := v_allocated_meters + v_cone_allocate_meters;
        v_remaining_meters := v_remaining_meters - v_cone_allocate_meters;
    END LOOP;
    
    -- =========================================================================
    -- STEP 5: Determine final status and handle conflicts
    -- =========================================================================
    IF v_allocated_meters >= p_requested_meters THEN
        -- Fully allocated
        v_status := 'SOFT';
    ELSIF v_allocated_meters > 0 THEN
        -- Partial allocation - some stock available but not enough
        v_status := 'SOFT';
        
        -- Create conflict record for shortage
        INSERT INTO thread_conflicts (
            thread_type_id, 
            total_requested_meters, 
            total_available_meters, 
            shortage_meters,
            status
        ) VALUES (
            p_thread_type_id, 
            p_requested_meters, 
            v_available_total, 
            p_requested_meters - v_allocated_meters,
            'PENDING'
        ) RETURNING id INTO v_conflict_id;
        
        -- Link allocation to conflict for tracking
        INSERT INTO thread_conflict_allocations (
            conflict_id, 
            allocation_id, 
            original_priority_score
        ) VALUES (
            v_conflict_id, 
            v_allocation_id, 
            v_priority_score
        );
    ELSE
        -- No stock available at all - add to waitlist
        v_status := 'WAITLISTED';
        
        -- Create conflict record for complete shortage
        INSERT INTO thread_conflicts (
            thread_type_id, 
            total_requested_meters, 
            total_available_meters, 
            shortage_meters,
            status
        ) VALUES (
            p_thread_type_id, 
            p_requested_meters, 
            v_available_total, 
            p_requested_meters,
            'PENDING'
        ) RETURNING id INTO v_conflict_id;
        
        -- Link allocation to conflict
        INSERT INTO thread_conflict_allocations (
            conflict_id, 
            allocation_id, 
            original_priority_score
        ) VALUES (
            v_conflict_id, 
            v_allocation_id, 
            v_priority_score
        );
    END IF;
    
    -- =========================================================================
    -- STEP 6: Update allocation with final values
    -- =========================================================================
    UPDATE thread_allocations
    SET allocated_meters = v_allocated_meters,
        status = v_status,
        updated_at = NOW()
    WHERE id = v_allocation_id;
    
    -- =========================================================================
    -- STEP 7: Return result with Vietnamese messages
    -- =========================================================================
    RETURN json_build_object(
        'success', true,
        'allocation_id', v_allocation_id,
        'allocated_meters', v_allocated_meters,
        'waitlisted_meters', GREATEST(0, p_requested_meters - v_allocated_meters),
        'conflict_id', v_conflict_id,
        'message', CASE
            WHEN v_allocated_meters >= p_requested_meters THEN 'Phân bổ thành công'
            WHEN v_allocated_meters > 0 THEN 'Phân bổ một phần - thiếu hàng'
            ELSE 'Không có hàng - đã thêm vào danh sách chờ'
        END
    );
    
EXCEPTION WHEN OTHERS THEN
    -- =========================================================================
    -- ERROR HANDLING
    -- Return error information with Vietnamese message
    -- =========================================================================
    RETURN json_build_object(
        'success', false,
        'allocation_id', NULL,
        'allocated_meters', 0,
        'waitlisted_meters', 0,
        'conflict_id', NULL,
        'message', 'Lỗi: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql;

-- Add function comment
COMMENT ON FUNCTION allocate_thread IS 'Atomic soft allocation with FEFO logic - Phan bo mem voi logic FEFO';

-- ============================================================================
-- GRANT EXECUTE permission to authenticated users
-- (Adjust based on your security requirements)
-- ============================================================================
-- GRANT EXECUTE ON FUNCTION allocate_thread TO authenticated;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
