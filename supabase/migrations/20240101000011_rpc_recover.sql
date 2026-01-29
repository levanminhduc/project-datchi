-- ============================================================================
-- Thread Management System - RPC Function: recover_cone
-- Migration: 011_rpc_recover.sql
-- Description: Process partial cone recovery from production
-- Dependencies: 002_thread_inventory.sql, 004_thread_movements.sql, 005_thread_recovery.sql
-- ============================================================================

-- ============================================================================
-- FUNCTION: recover_cone
-- Purpose: Record weight and calculate remaining meters for returned cones
--
-- Parameters:
--   p_cone_id: ID of the cone being recovered (thread_inventory.id)
--   p_returned_weight_grams: Actual weight measured at warehouse
--   p_tare_weight_grams: Empty cone weight (default 10g)
--   p_notes: Optional notes about the recovery
--   p_weighed_by: Warehouse keeper who weighed
--   p_confirmed_by: Supervisor who confirmed (for write-off)
--
-- Returns: JSON object with recovery result
--   {
--     success: boolean,
--     recovery_id: integer,
--     calculated_meters: decimal,
--     is_write_off: boolean,
--     message: string (Vietnamese)
--   }
--
-- Key Features:
--   1. Uses row-level lock to prevent concurrent modifications
--   2. Calculates meters from weight using thread type density factor
--   3. Automatic write-off for cones with < 50g net weight
--   4. Creates recovery record and movement audit trail
--   5. Updates cone status and marks as partial
-- ============================================================================

CREATE OR REPLACE FUNCTION recover_cone(
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
    v_new_status VARCHAR;
    v_recovery_status recovery_status;
BEGIN
    -- =========================================================================
    -- STEP 1: Get cone with lock to prevent concurrent modifications
    -- FOR UPDATE ensures exclusive access during the recovery process
    -- =========================================================================
    SELECT * INTO v_cone
    FROM thread_inventory
    WHERE id = p_cone_id
    FOR UPDATE;
    
    -- Check if cone exists
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'recovery_id', NULL,
            'calculated_meters', 0,
            'is_write_off', false,
            'message', 'Không tìm thấy cuộn chỉ'
        );
    END IF;
    
    -- =========================================================================
    -- STEP 2: Validate cone status
    -- Only cones IN_PRODUCTION or PARTIAL_RETURN can be recovered
    -- =========================================================================
    IF v_cone.status NOT IN ('IN_PRODUCTION', 'PARTIAL_RETURN') THEN
        RETURN json_build_object(
            'success', false,
            'recovery_id', NULL,
            'calculated_meters', 0,
            'is_write_off', false,
            'message', 'Cuộn chỉ phải đang trong sản xuất hoặc đang thu hồi'
        );
    END IF;
    
    -- =========================================================================
    -- STEP 3: Get thread type for density factor
    -- Density factor is used to convert weight to meters
    -- Formula: meters = net_weight_grams / density_grams_per_meter
    -- =========================================================================
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
    
    -- Validate density factor exists and is positive
    IF v_thread_type.density_grams_per_meter IS NULL OR v_thread_type.density_grams_per_meter <= 0 THEN
        RETURN json_build_object(
            'success', false,
            'recovery_id', NULL,
            'calculated_meters', 0,
            'is_write_off', false,
            'message', 'Hệ số mật độ chưa được cấu hình cho loại chỉ này'
        );
    END IF;
    
    -- =========================================================================
    -- STEP 4: Calculate net weight (subtract tare/empty cone weight)
    -- Ensure net weight is never negative
    -- =========================================================================
    v_net_weight := GREATEST(0, p_returned_weight_grams - p_tare_weight_grams);
    
    -- =========================================================================
    -- STEP 5: Calculate meters from weight using density factor
    -- Formula: meters = net_weight_grams / density_grams_per_meter
    -- Round to 4 decimal places for consistency with other quantity_meters columns
    -- =========================================================================
    v_calculated_meters := ROUND(
        v_net_weight / v_thread_type.density_grams_per_meter,
        4
    );
    
    -- =========================================================================
    -- STEP 6: Calculate consumption (how much thread was used)
    -- Consumption = Original meters - Calculated remaining meters
    -- =========================================================================
    v_consumption_meters := v_cone.quantity_meters - v_calculated_meters;
    
    -- =========================================================================
    -- STEP 7: Check for write-off condition
    -- If net weight < 50g, cone is written off (too little to reuse)
    -- =========================================================================
    IF v_net_weight < 50 THEN
        v_is_write_off := TRUE;
        v_new_status := 'WRITTEN_OFF';
        v_recovery_status := 'WRITTEN_OFF';
    ELSE
        v_new_status := 'AVAILABLE';
        v_recovery_status := 'CONFIRMED';
    END IF;
    
    -- =========================================================================
    -- STEP 8: Create recovery record
    -- This tracks the full recovery details for audit and reporting
    -- =========================================================================
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
    
    -- =========================================================================
    -- STEP 9: Update cone inventory
    -- - Update status to AVAILABLE or WRITTEN_OFF
    -- - Set new quantity_meters based on calculated value
    -- - Set weight_grams to net weight
    -- - Mark as partial (is_partial = TRUE)
    -- =========================================================================
    UPDATE thread_inventory
    SET status = v_new_status::cone_status,
        quantity_meters = v_calculated_meters,
        weight_grams = v_net_weight,
        is_partial = TRUE,
        updated_at = NOW()
    WHERE id = p_cone_id;
    
    -- =========================================================================
    -- STEP 10: Create movement record for audit trail
    -- Movement type: RETURN for normal recovery, WRITE_OFF for write-offs
    -- Quantity is the consumption (how much was used)
    -- =========================================================================
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
        v_cone.status::VARCHAR,
        v_new_status,
        p_confirmed_by,
        CASE 
            WHEN v_is_write_off THEN 'Xóa sổ - dưới 50g (' || v_net_weight || 'g)'
            ELSE 'Thu hồi cuộn lẻ - ' || v_calculated_meters || ' mét còn lại'
        END
    );
    
    -- =========================================================================
    -- STEP 11: Return success response with Vietnamese messages
    -- =========================================================================
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
    -- =========================================================================
    -- ERROR HANDLING
    -- Return error information with Vietnamese message
    -- Transaction will be rolled back automatically
    -- =========================================================================
    RETURN json_build_object(
        'success', false,
        'recovery_id', NULL,
        'calculated_meters', 0,
        'is_write_off', false,
        'message', 'Lỗi: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql;

-- Add function comment
COMMENT ON FUNCTION recover_cone IS 'Process partial cone recovery with weight-to-meters conversion - Xử lý thu hồi cuộn lẻ với chuyển đổi khối lượng sang mét';

-- ============================================================================
-- GRANT EXECUTE permission to authenticated users
-- (Adjust based on your security requirements)
-- ============================================================================
-- GRANT EXECUTE ON FUNCTION recover_cone TO authenticated;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
