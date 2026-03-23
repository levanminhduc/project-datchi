-- Database Functions for Thread Inventory System
CREATE OR REPLACE FUNCTION public.allocate_thread(p_order_id character varying, p_order_reference character varying, p_thread_type_id integer, p_requested_meters numeric, p_priority allocation_priority, p_due_date date DEFAULT NULL::date, p_notes text DEFAULT NULL::text, p_created_by character varying DEFAULT NULL::character varying)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
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
$function$
;
CREATE OR REPLACE FUNCTION public.can_manage_employee(actor_id integer, target_id integer)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
DECLARE
  actor_min_level INTEGER;
  target_min_level INTEGER;
BEGIN
  -- Cannot manage yourself
  IF actor_id = target_id THEN
    RETURN false;
  END IF;
  
  -- Get actor's minimum (highest privilege) level
  SELECT MIN(r.level) INTO actor_min_level
  FROM employee_roles er
  JOIN roles r ON er.role_id = r.id
  WHERE er.employee_id = actor_id;
  
  -- Get target's minimum level
  SELECT MIN(r.level) INTO target_min_level
  FROM employee_roles er
  JOIN roles r ON er.role_id = r.id
  WHERE er.employee_id = target_id;
  
  -- No roles = level 99 (lowest privilege)
  actor_min_level := COALESCE(actor_min_level, 99);
  target_min_level := COALESCE(target_min_level, 99);
  
  -- Can manage if actor's level is strictly lower (higher privilege)
  -- Exception: ROOT (level 0) can manage anyone including other ROOTs
  IF actor_min_level = 0 THEN
    RETURN true;
  END IF;
  
  RETURN actor_min_level < target_min_level;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.cleanup_expired_refresh_tokens()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM employee_refresh_tokens WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.get_employee_permissions(p_employee_id integer)
 RETURNS TABLE(permission_code text, granted boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
BEGIN
  -- ROOT has ALL permissions (return special indicator)
  IF public.is_root(p_employee_id) THEN
    RETURN QUERY SELECT '*'::TEXT, true;
    RETURN;
  END IF;
  
  -- Combine role permissions + direct permissions
  RETURN QUERY
  WITH role_perms AS (
    SELECT DISTINCT p.code, true as granted
    FROM employee_roles er
    JOIN role_permissions rp ON er.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE er.employee_id = p_employee_id
  ),
  direct_perms AS (
    SELECT p.code, ep.granted
    FROM employee_permissions ep
    JOIN permissions p ON ep.permission_id = p.id
    WHERE ep.employee_id = p_employee_id
      AND (ep.expires_at IS NULL OR ep.expires_at > NOW())
  )
  SELECT COALESCE(dp.code, rp.code), COALESCE(dp.granted, rp.granted)
  FROM role_perms rp
  FULL OUTER JOIN direct_perms dp ON rp.code = dp.code
  WHERE COALESCE(dp.granted, rp.granted) = true;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.get_employee_roles(p_employee_id integer)
 RETURNS TABLE(role_code text, role_name text, role_level integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT r.code, r.name, r.level
  FROM employee_roles er
  JOIN roles r ON er.role_id = r.id
  WHERE er.employee_id = p_employee_id
    AND r.is_active = true
  ORDER BY r.level;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.has_any_permission(p_employee_id integer, requested_permissions text[])
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
BEGIN
  -- ROOT bypasses ALL permission checks
  IF public.is_root(p_employee_id) THEN
    RETURN true;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM unnest(requested_permissions) AS perm
    WHERE public.has_permission(p_employee_id, perm)
  );
END;
$function$
;
CREATE OR REPLACE FUNCTION public.has_permission(p_employee_id integer, requested_permission text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
DECLARE
  has_perm BOOLEAN := false;
BEGIN
  -- ROOT bypasses ALL permission checks
  IF public.is_root(p_employee_id) THEN
    RETURN true;
  END IF;
  
  -- Check direct employee permission (explicit grant/deny)
  SELECT granted INTO has_perm
  FROM employee_permissions ep
  JOIN permissions p ON ep.permission_id = p.id
  WHERE ep.employee_id = p_employee_id 
    AND p.code = requested_permission
    AND (ep.expires_at IS NULL OR ep.expires_at > NOW());
  
  IF has_perm IS NOT NULL THEN
    RETURN has_perm;  -- Return explicit grant/deny
  END IF;
  
  -- Check role-based permission
  SELECT EXISTS (
    SELECT 1 
    FROM employee_roles er
    JOIN role_permissions rp ON er.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE er.employee_id = p_employee_id 
      AND p.code = requested_permission
  ) INTO has_perm;
  
  RETURN COALESCE(has_perm, false);
END;
$function$
;
CREATE OR REPLACE FUNCTION public.is_admin(p_employee_id integer)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM employee_roles er
    JOIN roles r ON er.role_id = r.id
    WHERE er.employee_id = p_employee_id
      AND r.code IN ('root', 'admin')  -- ROOT is also considered admin
  );
END;
$function$
;
CREATE OR REPLACE FUNCTION public.is_root(p_employee_id integer)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM employee_roles er
    JOIN roles r ON er.role_id = r.id
    WHERE er.employee_id = p_employee_id
      AND r.code = 'root'
  );
END;
$function$
;
CREATE OR REPLACE FUNCTION public.issue_cone(p_allocation_id integer, p_confirmed_by character varying DEFAULT NULL::character varying)
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
$function$
;
CREATE OR REPLACE FUNCTION public.recover_cone(p_cone_id integer, p_returned_weight_grams numeric, p_tare_weight_grams numeric DEFAULT 10, p_notes text DEFAULT NULL::text, p_weighed_by character varying DEFAULT NULL::character varying, p_confirmed_by character varying DEFAULT NULL::character varying)
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
$function$
;
CREATE OR REPLACE FUNCTION public.split_allocation(p_allocation_id integer, p_split_meters numeric, p_split_reason text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
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
$function$
;
CREATE OR REPLACE FUNCTION public.thread_audit_trigger_func()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF TG_OP = 'DELETE' THEN
        -- Log DELETE operation with old values only
        INSERT INTO thread_audit_log (
            table_name, 
            record_id, 
            action, 
            old_values
        )
        VALUES (
            TG_TABLE_NAME, 
            OLD.id, 
            'DELETE', 
            to_jsonb(OLD)
        );
        RETURN OLD;
        
    ELSIF TG_OP = 'UPDATE' THEN
        -- Log UPDATE operation with old values, new values, and changed fields
        INSERT INTO thread_audit_log (
            table_name, 
            record_id, 
            action, 
            old_values, 
            new_values, 
            changed_fields
        )
        VALUES (
            TG_TABLE_NAME,
            NEW.id,
            'UPDATE',
            to_jsonb(OLD),
            to_jsonb(NEW),
            -- Calculate which fields changed using JSON comparison
            ARRAY(
                SELECT key
                FROM jsonb_each(to_jsonb(OLD)) old_kv
                FULL OUTER JOIN jsonb_each(to_jsonb(NEW)) new_kv USING (key)
                WHERE old_kv.value IS DISTINCT FROM new_kv.value
            )
        );
        RETURN NEW;
        
    ELSIF TG_OP = 'INSERT' THEN
        -- Log INSERT operation with new values only
        INSERT INTO thread_audit_log (
            table_name, 
            record_id, 
            action, 
            new_values
        )
        VALUES (
            TG_TABLE_NAME, 
            NEW.id, 
            'INSERT', 
            to_jsonb(NEW)
        );
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.update_lots_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;
