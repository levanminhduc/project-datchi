--
-- PostgreSQL database dump
--

\restrict HiHT5wvHZJj00DvJ8MhmU4hyZWmen6Wt29SA33kLyszC6BSvR8YMkQX3fyYfr8w

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: allocation_priority; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.allocation_priority AS ENUM (
    'LOW',
    'NORMAL',
    'HIGH',
    'URGENT'
);


--
-- Name: TYPE allocation_priority; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TYPE public.allocation_priority IS 'Priority levels for allocation ordering - Muc do uu tien phan bo';


--
-- Name: allocation_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.allocation_status AS ENUM (
    'PENDING',
    'SOFT',
    'HARD',
    'ISSUED',
    'CANCELLED',
    'WAITLISTED'
);


--
-- Name: TYPE allocation_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TYPE public.allocation_status IS 'Lifecycle states for allocation requests - Trang thai vong doi yeu cau phan bo';


--
-- Name: batch_operation_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.batch_operation_type AS ENUM (
    'RECEIVE',
    'TRANSFER',
    'ISSUE',
    'RETURN'
);


--
-- Name: TYPE batch_operation_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TYPE public.batch_operation_type IS 'Types of batch operations - Loại thao tác hàng loạt';


--
-- Name: cone_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.cone_status AS ENUM (
    'RECEIVED',
    'INSPECTED',
    'AVAILABLE',
    'SOFT_ALLOCATED',
    'HARD_ALLOCATED',
    'IN_PRODUCTION',
    'PARTIAL_RETURN',
    'PENDING_WEIGH',
    'CONSUMED',
    'WRITTEN_OFF',
    'QUARANTINE'
);


--
-- Name: TYPE cone_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TYPE public.cone_status IS 'Lifecycle states for thread cones - Trang thai vong doi cua cuon chi';


--
-- Name: lot_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.lot_status AS ENUM (
    'ACTIVE',
    'DEPLETED',
    'EXPIRED',
    'QUARANTINE'
);


--
-- Name: TYPE lot_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TYPE public.lot_status IS 'Lifecycle states for lots - Trạng thái vòng đời của lô hàng';


--
-- Name: movement_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.movement_type AS ENUM (
    'RECEIVE',
    'ISSUE',
    'RETURN',
    'TRANSFER',
    'ADJUSTMENT',
    'WRITE_OFF'
);


--
-- Name: TYPE movement_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TYPE public.movement_type IS 'Types of inventory movements - Cac loai di chuyen ton kho';


--
-- Name: permission_action; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.permission_action AS ENUM (
    'VIEW',
    'CREATE',
    'EDIT',
    'DELETE',
    'MANAGE'
);


--
-- Name: recovery_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.recovery_status AS ENUM (
    'INITIATED',
    'PENDING_WEIGH',
    'WEIGHED',
    'CONFIRMED',
    'WRITTEN_OFF',
    'REJECTED'
);


--
-- Name: TYPE recovery_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TYPE public.recovery_status IS 'Recovery workflow states - Trang thai quy trinh thu hoi cuon le';


--
-- Name: thread_material; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.thread_material AS ENUM (
    'POLYESTER',
    'COTTON',
    'NYLON',
    'SILK',
    'RAYON',
    'MIXED'
);


--
-- Name: allocate_thread(character varying, character varying, integer, numeric, public.allocation_priority, date, text, character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.allocate_thread(p_order_id character varying, p_order_reference character varying, p_thread_type_id integer, p_requested_meters numeric, p_priority public.allocation_priority, p_due_date date DEFAULT NULL::date, p_notes text DEFAULT NULL::text, p_created_by character varying DEFAULT NULL::character varying) RETURNS json
    LANGUAGE plpgsql
    AS $$
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
$$;


--
-- Name: FUNCTION allocate_thread(p_order_id character varying, p_order_reference character varying, p_thread_type_id integer, p_requested_meters numeric, p_priority public.allocation_priority, p_due_date date, p_notes text, p_created_by character varying); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.allocate_thread(p_order_id character varying, p_order_reference character varying, p_thread_type_id integer, p_requested_meters numeric, p_priority public.allocation_priority, p_due_date date, p_notes text, p_created_by character varying) IS 'Atomic soft allocation with FEFO logic - Phan bo mem voi logic FEFO';


--
-- Name: can_manage_employee(integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_manage_employee(actor_id integer, target_id integer) RETURNS boolean
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$
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
$$;


--
-- Name: cleanup_expired_refresh_tokens(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cleanup_expired_refresh_tokens() RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM employee_refresh_tokens WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;


--
-- Name: get_employee_permissions(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_employee_permissions(p_employee_id integer) RETURNS TABLE(permission_code text, granted boolean)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$
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
$$;


--
-- Name: get_employee_roles(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_employee_roles(p_employee_id integer) RETURNS TABLE(role_code text, role_name text, role_level integer)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT r.code, r.name, r.level
  FROM employee_roles er
  JOIN roles r ON er.role_id = r.id
  WHERE er.employee_id = p_employee_id
    AND r.is_active = true
  ORDER BY r.level;
END;
$$;


--
-- Name: has_any_permission(integer, text[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_any_permission(p_employee_id integer, requested_permissions text[]) RETURNS boolean
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$
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
$$;


--
-- Name: has_permission(integer, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_permission(p_employee_id integer, requested_permission text) RETURNS boolean
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$
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
$$;


--
-- Name: is_admin(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_admin(p_employee_id integer) RETURNS boolean
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM employee_roles er
    JOIN roles r ON er.role_id = r.id
    WHERE er.employee_id = p_employee_id
      AND r.code IN ('root', 'admin')  -- ROOT is also considered admin
  );
END;
$$;


--
-- Name: is_root(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_root(p_employee_id integer) RETURNS boolean
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM employee_roles er
    JOIN roles r ON er.role_id = r.id
    WHERE er.employee_id = p_employee_id
      AND r.code = 'root'
  );
END;
$$;


--
-- Name: issue_cone(integer, character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.issue_cone(p_allocation_id integer, p_confirmed_by character varying DEFAULT NULL::character varying) RETURNS json
    LANGUAGE plpgsql
    AS $$
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
$$;


--
-- Name: FUNCTION issue_cone(p_allocation_id integer, p_confirmed_by character varying); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.issue_cone(p_allocation_id integer, p_confirmed_by character varying) IS 'Convert soft allocation to issued status - Xuat kho tu phan bo mem';


--
-- Name: recover_cone(integer, numeric, numeric, text, character varying, character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.recover_cone(p_cone_id integer, p_returned_weight_grams numeric, p_tare_weight_grams numeric DEFAULT 10, p_notes text DEFAULT NULL::text, p_weighed_by character varying DEFAULT NULL::character varying, p_confirmed_by character varying DEFAULT NULL::character varying) RETURNS json
    LANGUAGE plpgsql
    AS $$
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
$$;


--
-- Name: FUNCTION recover_cone(p_cone_id integer, p_returned_weight_grams numeric, p_tare_weight_grams numeric, p_notes text, p_weighed_by character varying, p_confirmed_by character varying); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.recover_cone(p_cone_id integer, p_returned_weight_grams numeric, p_tare_weight_grams numeric, p_notes text, p_weighed_by character varying, p_confirmed_by character varying) IS 'Process partial cone recovery with weight-to-meters conversion - Xử lý thu hồi cuộn lẻ với chuyển đổi khối lượng sang mét';


--
-- Name: split_allocation(integer, numeric, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.split_allocation(p_allocation_id integer, p_split_meters numeric, p_split_reason text DEFAULT NULL::text) RETURNS json
    LANGUAGE plpgsql
    AS $$
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
$$;


--
-- Name: FUNCTION split_allocation(p_allocation_id integer, p_split_meters numeric, p_split_reason text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.split_allocation(p_allocation_id integer, p_split_meters numeric, p_split_reason text) IS 'Split an allocation into two separate allocations - Chia nho phan bo thanh hai phan bo rieng';


--
-- Name: thread_audit_trigger_func(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.thread_audit_trigger_func() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
$$;


--
-- Name: FUNCTION thread_audit_trigger_func(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.thread_audit_trigger_func() IS 'Generic audit trigger function for thread tables - Ham trigger kiem toan chung cho cac bang chi';


--
-- Name: update_lots_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_lots_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: batch_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.batch_transactions (
    id integer NOT NULL,
    operation_type public.batch_operation_type NOT NULL,
    lot_id integer,
    from_warehouse_id integer,
    to_warehouse_id integer,
    cone_ids integer[] NOT NULL,
    cone_count integer NOT NULL,
    reference_number character varying(50),
    recipient character varying(200),
    notes text,
    performed_by character varying(100),
    performed_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE batch_transactions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.batch_transactions IS 'Bảng lưu lịch sử các thao tác hàng loạt (nhập/xuất/chuyển kho)';


--
-- Name: COLUMN batch_transactions.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.batch_transactions.id IS 'Khóa chính tự tăng';


--
-- Name: COLUMN batch_transactions.operation_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.batch_transactions.operation_type IS 'Loại thao tác: RECEIVE=nhập kho, TRANSFER=chuyển kho, ISSUE=xuất kho, RETURN=trả lại';


--
-- Name: COLUMN batch_transactions.lot_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.batch_transactions.lot_id IS 'Lô hàng liên quan (nếu có)';


--
-- Name: COLUMN batch_transactions.from_warehouse_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.batch_transactions.from_warehouse_id IS 'Kho nguồn (cho chuyển/xuất kho)';


--
-- Name: COLUMN batch_transactions.to_warehouse_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.batch_transactions.to_warehouse_id IS 'Kho đích (cho nhập/chuyển kho)';


--
-- Name: COLUMN batch_transactions.cone_ids; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.batch_transactions.cone_ids IS 'Mảng ID các cuộn trong thao tác này';


--
-- Name: COLUMN batch_transactions.cone_count; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.batch_transactions.cone_count IS 'Số lượng cuộn (để truy vấn nhanh)';


--
-- Name: COLUMN batch_transactions.reference_number; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.batch_transactions.reference_number IS 'Số tham chiếu bên ngoài (số PO, phiếu xuất kho, v.v.)';


--
-- Name: COLUMN batch_transactions.recipient; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.batch_transactions.recipient IS 'Người nhận hàng (cho thao tác xuất kho)';


--
-- Name: COLUMN batch_transactions.notes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.batch_transactions.notes IS 'Ghi chú thêm về thao tác';


--
-- Name: COLUMN batch_transactions.performed_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.batch_transactions.performed_by IS 'Người thực hiện thao tác';


--
-- Name: COLUMN batch_transactions.performed_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.batch_transactions.performed_at IS 'Thời điểm thực hiện thao tác';


--
-- Name: batch_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.batch_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: batch_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.batch_transactions_id_seq OWNED BY public.batch_transactions.id;


--
-- Name: color_supplier; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.color_supplier (
    id integer NOT NULL,
    color_id integer NOT NULL,
    supplier_id integer NOT NULL,
    price_per_kg numeric(10,2),
    min_order_qty integer,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE color_supplier; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.color_supplier IS 'Bảng liên kết màu-nhà cung cấp với thông tin giá - Color-Supplier junction with pricing';


--
-- Name: COLUMN color_supplier.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.color_supplier.id IS 'Khóa chính tự tăng';


--
-- Name: COLUMN color_supplier.color_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.color_supplier.color_id IS 'FK đến bảng colors - mã màu';


--
-- Name: COLUMN color_supplier.supplier_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.color_supplier.supplier_id IS 'FK đến bảng suppliers - mã nhà cung cấp';


--
-- Name: COLUMN color_supplier.price_per_kg; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.color_supplier.price_per_kg IS 'Giá mỗi kg (VND)';


--
-- Name: COLUMN color_supplier.min_order_qty; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.color_supplier.min_order_qty IS 'Số lượng đặt tối thiểu (kg)';


--
-- Name: COLUMN color_supplier.is_active; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.color_supplier.is_active IS 'Trạng thái hoạt động - TRUE=đang cung cấp, FALSE=ngừng cung cấp';


--
-- Name: COLUMN color_supplier.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.color_supplier.created_at IS 'Thời điểm tạo bản ghi';


--
-- Name: COLUMN color_supplier.updated_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.color_supplier.updated_at IS 'Thời điểm cập nhật gần nhất';


--
-- Name: color_supplier_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.color_supplier_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: color_supplier_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.color_supplier_id_seq OWNED BY public.color_supplier.id;


--
-- Name: colors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.colors (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    hex_code character varying(7) NOT NULL,
    pantone_code character varying(20),
    ral_code character varying(20),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE colors; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.colors IS 'Bảng danh mục màu sắc chuẩn - Colors master data';


--
-- Name: COLUMN colors.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.colors.id IS 'Khóa chính tự tăng';


--
-- Name: COLUMN colors.name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.colors.name IS 'Tên màu (unique) - VD: Đỏ, Xanh dương';


--
-- Name: COLUMN colors.hex_code; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.colors.hex_code IS 'Mã màu Hex (#RRGGBB) - VD: #FF0000';


--
-- Name: COLUMN colors.pantone_code; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.colors.pantone_code IS 'Mã màu Pantone (tùy chọn) - VD: 186C';


--
-- Name: COLUMN colors.ral_code; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.colors.ral_code IS 'Mã màu RAL (tùy chọn) - VD: RAL 3020';


--
-- Name: COLUMN colors.is_active; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.colors.is_active IS 'Trạng thái hoạt động - TRUE=đang dùng, FALSE=ngừng dùng';


--
-- Name: COLUMN colors.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.colors.created_at IS 'Thời điểm tạo bản ghi';


--
-- Name: COLUMN colors.updated_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.colors.updated_at IS 'Thời điểm cập nhật gần nhất';


--
-- Name: colors_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.colors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: colors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.colors_id_seq OWNED BY public.colors.id;


--
-- Name: employee_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employee_permissions (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    permission_id integer NOT NULL,
    granted boolean DEFAULT true,
    assigned_by integer,
    assigned_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone
);


--
-- Name: employee_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.employee_permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: employee_permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.employee_permissions_id_seq OWNED BY public.employee_permissions.id;


--
-- Name: employee_refresh_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employee_refresh_tokens (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    token_hash text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: employee_refresh_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.employee_refresh_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: employee_refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.employee_refresh_tokens_id_seq OWNED BY public.employee_refresh_tokens.id;


--
-- Name: employee_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employee_roles (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    role_id integer NOT NULL,
    assigned_by integer,
    assigned_at timestamp with time zone DEFAULT now()
);


--
-- Name: employee_roles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.employee_roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: employee_roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.employee_roles_id_seq OWNED BY public.employee_roles.id;


--
-- Name: employees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employees (
    id integer NOT NULL,
    employee_id character varying(50) NOT NULL,
    full_name character varying(255) NOT NULL,
    department character varying(100),
    chuc_vu character varying(50) DEFAULT 'nhan_vien'::character varying,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    password_hash text,
    must_change_password boolean DEFAULT false,
    password_changed_at timestamp with time zone,
    failed_login_attempts integer DEFAULT 0,
    locked_until timestamp with time zone,
    last_login_at timestamp with time zone,
    refresh_token text,
    refresh_token_expires_at timestamp with time zone
);


--
-- Name: employees_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.employees_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: employees_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.employees_id_seq OWNED BY public.employees.id;


--
-- Name: lots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lots (
    id integer NOT NULL,
    lot_number character varying(50) NOT NULL,
    thread_type_id integer NOT NULL,
    warehouse_id integer NOT NULL,
    production_date date,
    expiry_date date,
    supplier character varying(200),
    total_cones integer DEFAULT 0 NOT NULL,
    available_cones integer DEFAULT 0 NOT NULL,
    status public.lot_status DEFAULT 'ACTIVE'::public.lot_status NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    supplier_id integer
);


--
-- Name: TABLE lots; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.lots IS 'Bảng quản lý lô hàng chỉ - theo dõi vòng đời từ nhập đến xuất kho';


--
-- Name: COLUMN lots.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.lots.id IS 'Khóa chính tự tăng';


--
-- Name: COLUMN lots.lot_number; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.lots.lot_number IS 'Mã lô duy nhất (VD: LOT-2026-001)';


--
-- Name: COLUMN lots.thread_type_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.lots.thread_type_id IS 'Tham chiếu đến loại chỉ trong bảng thread_types';


--
-- Name: COLUMN lots.warehouse_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.lots.warehouse_id IS 'Kho hiện tại đang chứa lô hàng';


--
-- Name: COLUMN lots.production_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.lots.production_date IS 'Ngày sản xuất của lô hàng';


--
-- Name: COLUMN lots.expiry_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.lots.expiry_date IS 'Ngày hết hạn sử dụng';


--
-- Name: COLUMN lots.supplier; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.lots.supplier IS 'Tên nhà cung cấp';


--
-- Name: COLUMN lots.total_cones; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.lots.total_cones IS 'Tổng số cuộn trong lô (denormalized để tăng hiệu suất)';


--
-- Name: COLUMN lots.available_cones; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.lots.available_cones IS 'Số cuộn còn sẵn sàng sử dụng (chưa xuất kho)';


--
-- Name: COLUMN lots.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.lots.status IS 'Trạng thái lô: ACTIVE=đang dùng, DEPLETED=đã hết, EXPIRED=hết hạn, QUARANTINE=cách ly';


--
-- Name: COLUMN lots.notes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.lots.notes IS 'Ghi chú thêm về lô hàng';


--
-- Name: COLUMN lots.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.lots.created_at IS 'Thời điểm tạo bản ghi';


--
-- Name: COLUMN lots.updated_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.lots.updated_at IS 'Thời điểm cập nhật gần nhất';


--
-- Name: COLUMN lots.supplier_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.lots.supplier_id IS 'FK đến bảng suppliers (normalized) - nullable trong giai đoạn migration';


--
-- Name: lots_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.lots_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: lots_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.lots_id_seq OWNED BY public.lots.id;


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permissions (
    id integer NOT NULL,
    code character varying(100) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    module character varying(50) NOT NULL,
    resource character varying(50) NOT NULL,
    action public.permission_action NOT NULL,
    route_path character varying(255),
    is_page_access boolean DEFAULT false,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.permissions_id_seq OWNED BY public.permissions.id;


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_permissions (
    id integer NOT NULL,
    role_id integer NOT NULL,
    permission_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: role_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.role_permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: role_permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.role_permissions_id_seq OWNED BY public.role_permissions.id;


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    level integer DEFAULT 99,
    is_system boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: suppliers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.suppliers (
    id integer NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(200) NOT NULL,
    contact_name character varying(100),
    phone character varying(20),
    email character varying(100),
    address text,
    lead_time_days integer DEFAULT 7,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE suppliers; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.suppliers IS 'Bảng danh mục nhà cung cấp - Suppliers master data';


--
-- Name: COLUMN suppliers.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.suppliers.id IS 'Khóa chính tự tăng';


--
-- Name: COLUMN suppliers.code; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.suppliers.code IS 'Mã nhà cung cấp (unique) - VD: SUP-001, NCC-ABC';


--
-- Name: COLUMN suppliers.name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.suppliers.name IS 'Tên đầy đủ nhà cung cấp';


--
-- Name: COLUMN suppliers.contact_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.suppliers.contact_name IS 'Tên người liên hệ';


--
-- Name: COLUMN suppliers.phone; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.suppliers.phone IS 'Số điện thoại liên hệ';


--
-- Name: COLUMN suppliers.email; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.suppliers.email IS 'Email liên hệ';


--
-- Name: COLUMN suppliers.address; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.suppliers.address IS 'Địa chỉ nhà cung cấp';


--
-- Name: COLUMN suppliers.lead_time_days; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.suppliers.lead_time_days IS 'Thời gian giao hàng tiêu chuẩn (ngày)';


--
-- Name: COLUMN suppliers.is_active; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.suppliers.is_active IS 'Trạng thái hoạt động - TRUE=đang hợp tác, FALSE=ngừng hợp tác';


--
-- Name: COLUMN suppliers.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.suppliers.created_at IS 'Thời điểm tạo bản ghi';


--
-- Name: COLUMN suppliers.updated_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.suppliers.updated_at IS 'Thời điểm cập nhật gần nhất';


--
-- Name: suppliers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.suppliers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: suppliers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.suppliers_id_seq OWNED BY public.suppliers.id;


--
-- Name: thread_allocation_cones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.thread_allocation_cones (
    id integer NOT NULL,
    allocation_id integer NOT NULL,
    cone_id integer NOT NULL,
    allocated_meters numeric(12,4) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT chk_allocation_cones_meters_positive CHECK ((allocated_meters > (0)::numeric))
);


--
-- Name: TABLE thread_allocation_cones; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.thread_allocation_cones IS 'Junction table linking allocations to inventory cones - Bang lien ket phan bo va cuon chi';


--
-- Name: COLUMN thread_allocation_cones.allocation_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_allocation_cones.allocation_id IS 'Reference to allocation request - Tham chieu yeu cau phan bo';


--
-- Name: COLUMN thread_allocation_cones.cone_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_allocation_cones.cone_id IS 'Reference to inventory cone - Tham chieu cuon chi trong kho';


--
-- Name: COLUMN thread_allocation_cones.allocated_meters; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_allocation_cones.allocated_meters IS 'Meters allocated from this cone - So met phan bo tu cuon nay';


--
-- Name: thread_allocation_cones_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.thread_allocation_cones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: thread_allocation_cones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.thread_allocation_cones_id_seq OWNED BY public.thread_allocation_cones.id;


--
-- Name: thread_allocations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.thread_allocations (
    id integer NOT NULL,
    order_id character varying(50) NOT NULL,
    order_reference character varying(200),
    thread_type_id integer NOT NULL,
    requested_meters numeric(12,4) NOT NULL,
    allocated_meters numeric(12,4) DEFAULT 0,
    status public.allocation_status DEFAULT 'PENDING'::public.allocation_status,
    priority public.allocation_priority DEFAULT 'NORMAL'::public.allocation_priority,
    priority_score integer DEFAULT 0,
    requested_date timestamp with time zone DEFAULT now(),
    due_date date,
    notes text,
    created_by character varying(100),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    split_from_id integer,
    CONSTRAINT chk_allocations_allocated_valid CHECK (((allocated_meters >= (0)::numeric) AND (allocated_meters <= requested_meters))),
    CONSTRAINT chk_allocations_requested_positive CHECK ((requested_meters > (0)::numeric))
);


--
-- Name: TABLE thread_allocations; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.thread_allocations IS 'Realtime enabled for allocation tracking';


--
-- Name: COLUMN thread_allocations.order_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_allocations.order_id IS 'Production order ID - Ma lenh san xuat';


--
-- Name: COLUMN thread_allocations.order_reference; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_allocations.order_reference IS 'Order description or reference - Mo ta don hang';


--
-- Name: COLUMN thread_allocations.thread_type_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_allocations.thread_type_id IS 'Reference to thread type - Tham chieu loai chi';


--
-- Name: COLUMN thread_allocations.requested_meters; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_allocations.requested_meters IS 'Total meters requested - Tong so met yeu cau';


--
-- Name: COLUMN thread_allocations.allocated_meters; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_allocations.allocated_meters IS 'Meters successfully allocated - So met da phan bo';


--
-- Name: COLUMN thread_allocations.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_allocations.status IS 'Current allocation status - Trang thai phan bo hien tai';


--
-- Name: COLUMN thread_allocations.priority; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_allocations.priority IS 'Allocation priority level - Muc do uu tien';


--
-- Name: COLUMN thread_allocations.priority_score; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_allocations.priority_score IS 'Calculated priority score (priority_level * 10 + age_days) - Diem uu tien tinh toan';


--
-- Name: COLUMN thread_allocations.requested_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_allocations.requested_date IS 'Date allocation was requested - Ngay yeu cau phan bo';


--
-- Name: COLUMN thread_allocations.due_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_allocations.due_date IS 'Due date for production - Ngay can cho san xuat';


--
-- Name: COLUMN thread_allocations.notes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_allocations.notes IS 'Additional notes - Ghi chu them';


--
-- Name: COLUMN thread_allocations.created_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_allocations.created_by IS 'User who created the allocation - Nguoi tao phan bo';


--
-- Name: COLUMN thread_allocations.split_from_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_allocations.split_from_id IS 'Reference to original allocation if this was created from a split - Tham chieu phan bo goc neu la ket qua chia nho';


--
-- Name: thread_allocations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.thread_allocations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: thread_allocations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.thread_allocations_id_seq OWNED BY public.thread_allocations.id;


--
-- Name: thread_audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.thread_audit_log (
    id integer NOT NULL,
    table_name character varying(50) NOT NULL,
    record_id integer NOT NULL,
    action character varying(10) NOT NULL,
    old_values jsonb,
    new_values jsonb,
    changed_fields text[],
    performed_by character varying(100),
    ip_address character varying(45),
    user_agent text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE thread_audit_log; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.thread_audit_log IS 'Audit log for thread management tables - Nhat ky kiem toan cho cac bang quan ly chi';


--
-- Name: COLUMN thread_audit_log.table_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_audit_log.table_name IS 'Name of the table that was changed - Ten bang bi thay doi';


--
-- Name: COLUMN thread_audit_log.record_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_audit_log.record_id IS 'ID of the record that was changed - ID ban ghi bi thay doi';


--
-- Name: COLUMN thread_audit_log.action; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_audit_log.action IS 'Type of action: INSERT, UPDATE, DELETE - Loai thao tac';


--
-- Name: COLUMN thread_audit_log.old_values; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_audit_log.old_values IS 'Previous state as JSONB - Trang thai truoc dang JSONB';


--
-- Name: COLUMN thread_audit_log.new_values; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_audit_log.new_values IS 'New state as JSONB - Trang thai moi dang JSONB';


--
-- Name: COLUMN thread_audit_log.changed_fields; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_audit_log.changed_fields IS 'Array of column names that changed - Mang ten cot da thay doi';


--
-- Name: COLUMN thread_audit_log.performed_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_audit_log.performed_by IS 'User who performed the action - Nguoi thuc hien thao tac';


--
-- Name: COLUMN thread_audit_log.ip_address; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_audit_log.ip_address IS 'IP address of the actor (IPv4 or IPv6) - Dia chi IP';


--
-- Name: COLUMN thread_audit_log.user_agent; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_audit_log.user_agent IS 'Browser or application user agent - Trinh duyet/ung dung';


--
-- Name: thread_audit_log_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.thread_audit_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: thread_audit_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.thread_audit_log_id_seq OWNED BY public.thread_audit_log.id;


--
-- Name: thread_conflict_allocations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.thread_conflict_allocations (
    id integer NOT NULL,
    conflict_id integer NOT NULL,
    allocation_id integer NOT NULL,
    original_priority_score integer,
    adjusted_priority_score integer,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE thread_conflict_allocations; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.thread_conflict_allocations IS 'Junction table linking conflicts to allocations - Bang lien ket xung dot va phan bo';


--
-- Name: COLUMN thread_conflict_allocations.conflict_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_conflict_allocations.conflict_id IS 'Reference to the conflict - Tham chieu xung dot';


--
-- Name: COLUMN thread_conflict_allocations.allocation_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_conflict_allocations.allocation_id IS 'Reference to affected allocation - Tham chieu phan bo bi anh huong';


--
-- Name: COLUMN thread_conflict_allocations.original_priority_score; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_conflict_allocations.original_priority_score IS 'Priority score at conflict detection - Diem uu tien ban dau';


--
-- Name: COLUMN thread_conflict_allocations.adjusted_priority_score; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_conflict_allocations.adjusted_priority_score IS 'Priority score after resolution - Diem uu tien sau dieu chinh';


--
-- Name: thread_conflict_allocations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.thread_conflict_allocations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: thread_conflict_allocations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.thread_conflict_allocations_id_seq OWNED BY public.thread_conflict_allocations.id;


--
-- Name: thread_conflicts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.thread_conflicts (
    id integer NOT NULL,
    thread_type_id integer NOT NULL,
    total_requested_meters numeric(12,4) NOT NULL,
    total_available_meters numeric(12,4) NOT NULL,
    shortage_meters numeric(12,4) NOT NULL,
    status character varying(20) DEFAULT 'PENDING'::character varying,
    resolution_notes text,
    resolved_by character varying(100),
    resolved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT chk_conflicts_available_non_negative CHECK ((total_available_meters >= (0)::numeric)),
    CONSTRAINT chk_conflicts_requested_positive CHECK ((total_requested_meters > (0)::numeric)),
    CONSTRAINT chk_conflicts_shortage_positive CHECK ((shortage_meters > (0)::numeric)),
    CONSTRAINT chk_conflicts_status_valid CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'RESOLVED'::character varying, 'ESCALATED'::character varying])::text[])))
);


--
-- Name: TABLE thread_conflicts; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.thread_conflicts IS 'Allocation conflicts when demand exceeds supply - Xung dot phan bo khi nhu cau vuot nguon cung';


--
-- Name: COLUMN thread_conflicts.thread_type_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_conflicts.thread_type_id IS 'Thread type with insufficient stock - Loai chi thieu ton';


--
-- Name: COLUMN thread_conflicts.total_requested_meters; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_conflicts.total_requested_meters IS 'Total meters requested - Tong so met yeu cau';


--
-- Name: COLUMN thread_conflicts.total_available_meters; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_conflicts.total_available_meters IS 'Total meters available - Tong so met co san';


--
-- Name: COLUMN thread_conflicts.shortage_meters; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_conflicts.shortage_meters IS 'Shortage amount (requested - available) - So met thieu';


--
-- Name: COLUMN thread_conflicts.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_conflicts.status IS 'Resolution status (PENDING/RESOLVED/ESCALATED) - Trang thai xu ly';


--
-- Name: COLUMN thread_conflicts.resolution_notes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_conflicts.resolution_notes IS 'Notes on how conflict was resolved - Ghi chu giai quyet';


--
-- Name: COLUMN thread_conflicts.resolved_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_conflicts.resolved_by IS 'User who resolved the conflict - Nguoi giai quyet';


--
-- Name: COLUMN thread_conflicts.resolved_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_conflicts.resolved_at IS 'When conflict was resolved - Thoi gian giai quyet';


--
-- Name: thread_conflicts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.thread_conflicts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: thread_conflicts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.thread_conflicts_id_seq OWNED BY public.thread_conflicts.id;


--
-- Name: thread_inventory; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.thread_inventory (
    id integer NOT NULL,
    cone_id character varying(50) NOT NULL,
    thread_type_id integer NOT NULL,
    warehouse_id integer NOT NULL,
    quantity_cones integer DEFAULT 1 NOT NULL,
    quantity_meters numeric(12,4) NOT NULL,
    weight_grams numeric(10,2),
    is_partial boolean DEFAULT false,
    status public.cone_status DEFAULT 'RECEIVED'::public.cone_status,
    lot_number character varying(50),
    expiry_date date,
    received_date date DEFAULT CURRENT_DATE,
    location character varying(100),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    lot_id integer,
    CONSTRAINT chk_thread_inventory_quantity_positive CHECK ((quantity_meters >= (0)::numeric)),
    CONSTRAINT chk_thread_inventory_weight_positive CHECK (((weight_grams IS NULL) OR (weight_grams >= (0)::numeric)))
);


--
-- Name: TABLE thread_inventory; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.thread_inventory IS 'Realtime enabled for live stock updates';


--
-- Name: COLUMN thread_inventory.cone_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_inventory.cone_id IS 'Barcode ID for cone (auto-generated or scanned) - Ma vach cuon chi';


--
-- Name: COLUMN thread_inventory.thread_type_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_inventory.thread_type_id IS 'Reference to thread type - Tham chieu loai chi';


--
-- Name: COLUMN thread_inventory.warehouse_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_inventory.warehouse_id IS 'Reference to warehouse location - Tham chieu kho';


--
-- Name: COLUMN thread_inventory.quantity_cones; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_inventory.quantity_cones IS 'Number of cones (always 1 for individual tracking) - So cuon';


--
-- Name: COLUMN thread_inventory.quantity_meters; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_inventory.quantity_meters IS 'Remaining meters on cone (high precision) - So met con lai';


--
-- Name: COLUMN thread_inventory.weight_grams; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_inventory.weight_grams IS 'Current weight in grams (for partial cone calculations) - Khoi luong hien tai';


--
-- Name: COLUMN thread_inventory.is_partial; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_inventory.is_partial IS 'Flag indicating partial cone (previously used) - Co danh dau cuon le';


--
-- Name: COLUMN thread_inventory.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_inventory.status IS 'Current lifecycle status - Trang thai hien tai';


--
-- Name: COLUMN thread_inventory.lot_number; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_inventory.lot_number IS 'Supplier batch/lot number - So lo nha cung cap';


--
-- Name: COLUMN thread_inventory.expiry_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_inventory.expiry_date IS 'Expiry date for FEFO allocation - Ngay het han';


--
-- Name: COLUMN thread_inventory.received_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_inventory.received_date IS 'Date received into warehouse - Ngay nhap kho';


--
-- Name: COLUMN thread_inventory.location; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_inventory.location IS 'Physical location in warehouse (e.g., A-1-2) - Vi tri kho';


--
-- Name: COLUMN thread_inventory.lot_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_inventory.lot_id IS 'Tham chiếu đến lô hàng trong bảng lots (nullable để hỗ trợ dữ liệu cũ)';


--
-- Name: thread_inventory_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.thread_inventory_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: thread_inventory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.thread_inventory_id_seq OWNED BY public.thread_inventory.id;


--
-- Name: thread_movements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.thread_movements (
    id integer NOT NULL,
    cone_id integer NOT NULL,
    allocation_id integer,
    movement_type public.movement_type NOT NULL,
    quantity_meters numeric(12,4) NOT NULL,
    from_status character varying(50),
    to_status character varying(50),
    reference_id character varying(50),
    reference_type character varying(50),
    performed_by character varying(100),
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT chk_thread_movements_quantity_not_zero CHECK ((quantity_meters <> (0)::numeric))
);


--
-- Name: TABLE thread_movements; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.thread_movements IS 'Transaction log for inventory movements - Nhat ky giao dich di chuyen ton kho';


--
-- Name: COLUMN thread_movements.cone_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_movements.cone_id IS 'Reference to the affected cone - Cuon chi bi anh huong';


--
-- Name: COLUMN thread_movements.allocation_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_movements.allocation_id IS 'Reference to allocation (for ISSUE/RETURN) - Lien ket phan bo';


--
-- Name: COLUMN thread_movements.movement_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_movements.movement_type IS 'Type of movement - Loai di chuyen';


--
-- Name: COLUMN thread_movements.quantity_meters; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_movements.quantity_meters IS 'Meters involved in movement - So met di chuyen';


--
-- Name: COLUMN thread_movements.from_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_movements.from_status IS 'Cone status before movement - Trang thai truoc';


--
-- Name: COLUMN thread_movements.to_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_movements.to_status IS 'Cone status after movement - Trang thai sau';


--
-- Name: COLUMN thread_movements.reference_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_movements.reference_id IS 'External document reference ID - Ma tham chieu ben ngoai';


--
-- Name: COLUMN thread_movements.reference_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_movements.reference_type IS 'Type of external reference - Loai tham chieu';


--
-- Name: COLUMN thread_movements.performed_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_movements.performed_by IS 'User who performed the movement - Nguoi thuc hien';


--
-- Name: COLUMN thread_movements.notes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_movements.notes IS 'Additional notes - Ghi chu';


--
-- Name: thread_movements_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.thread_movements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: thread_movements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.thread_movements_id_seq OWNED BY public.thread_movements.id;


--
-- Name: thread_recovery; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.thread_recovery (
    id integer NOT NULL,
    cone_id integer NOT NULL,
    original_meters numeric(12,4) NOT NULL,
    returned_weight_grams numeric(10,2),
    calculated_meters numeric(12,4),
    tare_weight_grams numeric(10,2) DEFAULT 10,
    consumption_meters numeric(12,4),
    status public.recovery_status DEFAULT 'INITIATED'::public.recovery_status,
    initiated_by character varying(100),
    weighed_by character varying(100),
    confirmed_by character varying(100),
    notes text,
    photo_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT chk_thread_recovery_original_meters_positive CHECK ((original_meters > (0)::numeric)),
    CONSTRAINT chk_thread_recovery_tare_non_negative CHECK ((tare_weight_grams >= (0)::numeric)),
    CONSTRAINT chk_thread_recovery_weight_non_negative CHECK (((returned_weight_grams IS NULL) OR (returned_weight_grams >= (0)::numeric)))
);


--
-- Name: TABLE thread_recovery; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.thread_recovery IS 'Realtime enabled for recovery workflow';


--
-- Name: COLUMN thread_recovery.cone_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_recovery.cone_id IS 'Reference to recovered cone - Cuon chi duoc thu hoi';


--
-- Name: COLUMN thread_recovery.original_meters; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_recovery.original_meters IS 'Meters on cone when issued to production - So met khi xuat san xuat';


--
-- Name: COLUMN thread_recovery.returned_weight_grams; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_recovery.returned_weight_grams IS 'Actual weight when returned (measured) - Khoi luong thuc te khi tra';


--
-- Name: COLUMN thread_recovery.calculated_meters; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_recovery.calculated_meters IS 'Meters calculated from weight using density factor - So met tinh tu khoi luong';


--
-- Name: COLUMN thread_recovery.tare_weight_grams; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_recovery.tare_weight_grams IS 'Empty cone weight (default 10g) - Khoi luong vo cuon';


--
-- Name: COLUMN thread_recovery.consumption_meters; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_recovery.consumption_meters IS 'Meters consumed (original - calculated) - So met da su dung';


--
-- Name: COLUMN thread_recovery.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_recovery.status IS 'Current recovery status - Trang thai thu hoi';


--
-- Name: COLUMN thread_recovery.initiated_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_recovery.initiated_by IS 'Production worker who initiated return - Cong nhan khoi tao tra';


--
-- Name: COLUMN thread_recovery.weighed_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_recovery.weighed_by IS 'Warehouse keeper who weighed - Nguoi can';


--
-- Name: COLUMN thread_recovery.confirmed_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_recovery.confirmed_by IS 'Supervisor who confirmed - Nguoi xac nhan';


--
-- Name: COLUMN thread_recovery.notes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_recovery.notes IS 'Additional notes or write-off reason - Ghi chu';


--
-- Name: COLUMN thread_recovery.photo_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_recovery.photo_url IS 'Verification photo URL - Anh xac nhan';


--
-- Name: thread_recovery_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.thread_recovery_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: thread_recovery_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.thread_recovery_id_seq OWNED BY public.thread_recovery.id;


--
-- Name: thread_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.thread_types (
    id integer NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(200) NOT NULL,
    color character varying(50),
    color_code character varying(7),
    material public.thread_material DEFAULT 'POLYESTER'::public.thread_material,
    tex_number numeric(8,2),
    density_grams_per_meter numeric(10,6) NOT NULL,
    meters_per_cone numeric(12,2),
    supplier character varying(200),
    reorder_level_meters numeric(12,2) DEFAULT 1000,
    lead_time_days integer DEFAULT 7,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    color_id integer,
    supplier_id integer,
    color_supplier_id integer
);


--
-- Name: TABLE thread_types; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.thread_types IS 'Master data for thread specifications - Bảng dữ liệu chủ về thông số chỉ may';


--
-- Name: COLUMN thread_types.code; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_types.code IS 'Thread SKU code - Mã SKU chỉ (unique)';


--
-- Name: COLUMN thread_types.name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_types.name IS 'Display name - Tên hiển thị';


--
-- Name: COLUMN thread_types.color; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_types.color IS 'Color name - Tên màu sắc';


--
-- Name: COLUMN thread_types.color_code; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_types.color_code IS 'Hex color code - Mã màu Hex (#RRGGBB)';


--
-- Name: COLUMN thread_types.material; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_types.material IS 'Thread material type - Loại chất liệu chỉ';


--
-- Name: COLUMN thread_types.tex_number; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_types.tex_number IS 'TEX number (thread thickness) - Độ mảnh TEX';


--
-- Name: COLUMN thread_types.density_grams_per_meter; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_types.density_grams_per_meter IS 'Weight-to-length conversion factor - Hệ số chuyển đổi khối lượng sang chiều dài';


--
-- Name: COLUMN thread_types.meters_per_cone; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_types.meters_per_cone IS 'Standard meters per full cone - Số mét tiêu chuẩn mỗi cuộn đầy';


--
-- Name: COLUMN thread_types.supplier; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_types.supplier IS 'Supplier name - Tên nhà cung cấp';


--
-- Name: COLUMN thread_types.reorder_level_meters; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_types.reorder_level_meters IS 'Reorder alert threshold in meters - Ngưỡng cảnh báo đặt hàng lại (mét)';


--
-- Name: COLUMN thread_types.lead_time_days; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_types.lead_time_days IS 'Supplier lead time in days - Thời gian giao hàng NCC (ngày)';


--
-- Name: COLUMN thread_types.is_active; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_types.is_active IS 'Active status - Trạng thái hoạt động';


--
-- Name: COLUMN thread_types.color_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_types.color_id IS 'FK đến bảng colors (normalized) - nullable trong giai đoạn migration';


--
-- Name: COLUMN thread_types.supplier_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_types.supplier_id IS 'FK đến bảng suppliers (normalized) - nullable trong giai đoạn migration';


--
-- Name: COLUMN thread_types.color_supplier_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thread_types.color_supplier_id IS 'FK đến bảng color_supplier - tham chiếu giá màu-NCC (tùy chọn)';


--
-- Name: thread_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.thread_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: thread_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.thread_types_id_seq OWNED BY public.thread_types.id;


--
-- Name: warehouses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.warehouses (
    id integer NOT NULL,
    code character varying(20) NOT NULL,
    name character varying(100) NOT NULL,
    location character varying(200),
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    parent_id integer,
    type character varying(20) DEFAULT 'STORAGE'::character varying,
    sort_order integer DEFAULT 0,
    CONSTRAINT chk_warehouses_no_self_parent CHECK (((parent_id IS NULL) OR (parent_id <> id))),
    CONSTRAINT chk_warehouses_type CHECK (((type)::text = ANY ((ARRAY['LOCATION'::character varying, 'STORAGE'::character varying])::text[])))
);


--
-- Name: TABLE warehouses; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.warehouses IS 'Storage locations for thread inventory management';


--
-- Name: COLUMN warehouses.code; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.warehouses.code IS 'Unique warehouse code (e.g., WH-01, WH-MAIN)';


--
-- Name: COLUMN warehouses.name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.warehouses.name IS 'Display name for the warehouse';


--
-- Name: COLUMN warehouses.location; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.warehouses.location IS 'Physical address or location description';


--
-- Name: COLUMN warehouses.is_active; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.warehouses.is_active IS 'Whether the warehouse is currently active';


--
-- Name: COLUMN warehouses.parent_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.warehouses.parent_id IS 'Parent warehouse ID. NULL for LOCATION (top-level), references LOCATION for STORAGE';


--
-- Name: COLUMN warehouses.type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.warehouses.type IS 'Warehouse type: LOCATION (site/địa điểm) or STORAGE (kho lưu trữ thực tế)';


--
-- Name: COLUMN warehouses.sort_order; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.warehouses.sort_order IS 'Display order within same parent level (lower = first)';


--
-- Name: warehouses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.warehouses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: warehouses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.warehouses_id_seq OWNED BY public.warehouses.id;


--
-- Name: batch_transactions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.batch_transactions ALTER COLUMN id SET DEFAULT nextval('public.batch_transactions_id_seq'::regclass);


--
-- Name: color_supplier id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.color_supplier ALTER COLUMN id SET DEFAULT nextval('public.color_supplier_id_seq'::regclass);


--
-- Name: colors id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.colors ALTER COLUMN id SET DEFAULT nextval('public.colors_id_seq'::regclass);


--
-- Name: employee_permissions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_permissions ALTER COLUMN id SET DEFAULT nextval('public.employee_permissions_id_seq'::regclass);


--
-- Name: employee_refresh_tokens id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_refresh_tokens ALTER COLUMN id SET DEFAULT nextval('public.employee_refresh_tokens_id_seq'::regclass);


--
-- Name: employee_roles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_roles ALTER COLUMN id SET DEFAULT nextval('public.employee_roles_id_seq'::regclass);


--
-- Name: employees id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees ALTER COLUMN id SET DEFAULT nextval('public.employees_id_seq'::regclass);


--
-- Name: lots id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lots ALTER COLUMN id SET DEFAULT nextval('public.lots_id_seq'::regclass);


--
-- Name: permissions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions ALTER COLUMN id SET DEFAULT nextval('public.permissions_id_seq'::regclass);


--
-- Name: role_permissions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions ALTER COLUMN id SET DEFAULT nextval('public.role_permissions_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: suppliers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suppliers ALTER COLUMN id SET DEFAULT nextval('public.suppliers_id_seq'::regclass);


--
-- Name: thread_allocation_cones id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thread_allocation_cones ALTER COLUMN id SET DEFAULT nextval('public.thread_allocation_cones_id_seq'::regclass);


--
-- Name: thread_allocations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thread_allocations ALTER COLUMN id SET DEFAULT nextval('public.thread_allocations_id_seq'::regclass);


--
-- Name: thread_audit_log id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thread_audit_log ALTER COLUMN id SET DEFAULT nextval('public.thread_audit_log_id_seq'::regclass);


--
-- Name: thread_conflict_allocations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thread_conflict_allocations ALTER COLUMN id SET DEFAULT nextval('public.thread_conflict_allocations_id_seq'::regclass);


--
-- Name: thread_conflicts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thread_conflicts ALTER COLUMN id SET DEFAULT nextval('public.thread_conflicts_id_seq'::regclass);


--
-- Name: thread_inventory id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thread_inventory ALTER COLUMN id SET DEFAULT nextval('public.thread_inventory_id_seq'::regclass);


--
-- Name: thread_movements id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thread_movements ALTER COLUMN id SET DEFAULT nextval('public.thread_movements_id_seq'::regclass);


--
-- Name: thread_recovery id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thread_recovery ALTER COLUMN id SET DEFAULT nextval('public.thread_recovery_id_seq'::regclass);


--
-- Name: thread_types id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thread_types ALTER COLUMN id SET DEFAULT nextval('public.thread_types_id_seq'::regclass);


--
-- Name: warehouses id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.warehouses ALTER COLUMN id SET DEFAULT nextval('public.warehouses_id_seq'::regclass);


--
-- Name: batch_transactions batch_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.batch_transactions
    ADD CONSTRAINT batch_transactions_pkey PRIMARY KEY (id);


--
-- Name: color_supplier color_supplier_color_id_supplier_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.color_supplier
    ADD CONSTRAINT color_supplier_color_id_supplier_id_key UNIQUE (color_id, supplier_id);


--
-- Name: color_supplier color_supplier_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.color_supplier
    ADD CONSTRAINT color_supplier_pkey PRIMARY KEY (id);


--
-- Name: colors colors_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.colors
    ADD CONSTRAINT colors_name_key UNIQUE (name);


--
-- Name: colors colors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.colors
    ADD CONSTRAINT colors_pkey PRIMARY KEY (id);


--
-- Name: employee_permissions employee_permissions_employee_id_permission_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_permissions
    ADD CONSTRAINT employee_permissions_employee_id_permission_id_key UNIQUE (employee_id, permission_id);


--
-- Name: employee_permissions employee_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_permissions
    ADD CONSTRAINT employee_permissions_pkey PRIMARY KEY (id);


--
-- Name: employee_refresh_tokens employee_refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_refresh_tokens
    ADD CONSTRAINT employee_refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: employee_roles employee_roles_employee_id_role_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_roles
    ADD CONSTRAINT employee_roles_employee_id_role_id_key UNIQUE (employee_id, role_id);


--
-- Name: employee_roles employee_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_roles
    ADD CONSTRAINT employee_roles_pkey PRIMARY KEY (id);


--
-- Name: employees employees_employee_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_employee_id_key UNIQUE (employee_id);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- Name: lots lots_lot_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lots
    ADD CONSTRAINT lots_lot_number_key UNIQUE (lot_number);


--
-- Name: lots lots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lots
    ADD CONSTRAINT lots_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_code_key UNIQUE (code);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_role_id_permission_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_permission_id_key UNIQUE (role_id, permission_id);


--
-- Name: roles roles_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_code_key UNIQUE (code);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: suppliers suppliers_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_code_key UNIQUE (code);


--
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);


--
-- Name: thread_allocation_cones thread_allocation_cones_allocation_id_cone_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thread_allocation_cones
    ADD CONSTRAINT thread_allocation_cones_allocation_id_cone_id_key UNIQUE (allocation_id, cone_id);


--
-- Name: thread_allocation_cones thread_allocation_cones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thread_allocation_cones
    ADD CONSTRAINT thread_allocation_cones_pkey PRIMARY KEY (id);


--
-- Name: thread_allocations thread_allocations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thread_allocations
    ADD CONSTRAINT thread_allocations_pkey PRIMARY KEY (id);


--
-- Name: thread_audit_log thread_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thread_audit_log
    ADD CONSTRAINT thread_audit_log_pkey PRIMARY KEY (id);


--
-- Name: thread_conflict_allocations thread_conflict_allocations_conflict_id_allocation_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thread_conflict_allocations
    ADD CONSTRAINT thread_conflict_allocations_conflict_id_allocation_id_key UNIQUE (conflict_id, allocation_id);


--
-- Name: thread_conflict_allocations thread_conflict_allocations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thread_conflict_allocations
    ADD CONSTRAINT thread_conflict_allocations_pkey PRIMARY KEY (id);


--
-- Name: thread_conflicts thread_conflicts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thread_conflicts
    ADD CONSTRAINT thread_conflicts_pkey PRIMARY KEY (id);


--
-- Name: thread_inventory thread_inventory_cone_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thread_inventory
    ADD CONSTRAINT thread_inventory_cone_id_key UNIQUE (cone_id);


--
-- Name: thread_inventory thread_inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thread_inventory
    ADD CONSTRAINT thread_inventory_pkey PRIMARY KEY (id);


--
-- Name: thread_movements thread_movements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thread_movements
    ADD CONSTRAINT thread_movements_pkey PRIMARY KEY (id);


--
-- Name: thread_recovery thread_recovery_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thread_recovery
    ADD CONSTRAINT thread_recovery_pkey PRIMARY KEY (id);


--
-- Name: thread_types thread_types_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thread_types
    ADD CONSTRAINT thread_types_code_key UNIQUE (code);


--
-- Name: thread_types thread_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thread_types
    ADD CONSTRAINT thread_types_pkey PRIMARY KEY (id);


--
-- Name: warehouses warehouses_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.warehouses
    ADD CONSTRAINT warehouses_code_key UNIQUE (code);


--
-- Name: warehouses warehouses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.warehouses
    ADD CONSTRAINT warehouses_pkey PRIMARY KEY (id);


--
-- Name: idx_allocation_cones_allocation; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_allocation_cones_allocation ON public.thread_allocation_cones USING btree (allocation_id);


--
-- Name: idx_allocation_cones_cone; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_allocation_cones_cone ON public.thread_allocation_cones USING btree (cone_id);


--
-- Name: idx_allocations_due_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_allocations_due_date ON public.thread_allocations USING btree (due_date);


--
-- Name: idx_allocations_order_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_allocations_order_id ON public.thread_allocations USING btree (order_id);


--
-- Name: idx_allocations_pending; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_allocations_pending ON public.thread_allocations USING btree (status) WHERE (status = ANY (ARRAY['PENDING'::public.allocation_status, 'SOFT'::public.allocation_status]));


--
-- Name: idx_allocations_priority; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_allocations_priority ON public.thread_allocations USING btree (priority);


--
-- Name: idx_allocations_priority_score; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_allocations_priority_score ON public.thread_allocations USING btree (priority_score DESC);


--
-- Name: idx_allocations_split_from; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_allocations_split_from ON public.thread_allocations USING btree (split_from_id) WHERE (split_from_id IS NOT NULL);


--
-- Name: idx_allocations_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_allocations_status ON public.thread_allocations USING btree (status);


--
-- Name: idx_allocations_thread_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_allocations_thread_type ON public.thread_allocations USING btree (thread_type_id);


--
-- Name: idx_audit_action; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_action ON public.thread_audit_log USING btree (action);


--
-- Name: INDEX idx_audit_action; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.idx_audit_action IS 'Filter audit logs by action type - Loc theo loai thao tac';


--
-- Name: idx_audit_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_created ON public.thread_audit_log USING btree (created_at DESC);


--
-- Name: INDEX idx_audit_created; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.idx_audit_created IS 'Sort audit logs by creation time - Sap xep theo thoi gian';


--
-- Name: idx_audit_record; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_record ON public.thread_audit_log USING btree (table_name, record_id);


--
-- Name: INDEX idx_audit_record; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.idx_audit_record IS 'Filter audit logs by table + record ID - Loc theo bang va ID';


--
-- Name: idx_audit_table; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_table ON public.thread_audit_log USING btree (table_name);


--
-- Name: INDEX idx_audit_table; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.idx_audit_table IS 'Filter audit logs by table name - Loc theo ten bang';


--
-- Name: idx_batch_transactions_from_warehouse; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_batch_transactions_from_warehouse ON public.batch_transactions USING btree (from_warehouse_id);


--
-- Name: idx_batch_transactions_lot_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_batch_transactions_lot_id ON public.batch_transactions USING btree (lot_id);


--
-- Name: idx_batch_transactions_operation_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_batch_transactions_operation_type ON public.batch_transactions USING btree (operation_type);


--
-- Name: idx_batch_transactions_performed_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_batch_transactions_performed_at ON public.batch_transactions USING btree (performed_at DESC);


--
-- Name: idx_batch_transactions_reference; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_batch_transactions_reference ON public.batch_transactions USING btree (reference_number) WHERE (reference_number IS NOT NULL);


--
-- Name: idx_batch_transactions_to_warehouse; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_batch_transactions_to_warehouse ON public.batch_transactions USING btree (to_warehouse_id);


--
-- Name: idx_color_supplier_color_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_color_supplier_color_id ON public.color_supplier USING btree (color_id);


--
-- Name: idx_color_supplier_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_color_supplier_is_active ON public.color_supplier USING btree (is_active) WHERE (is_active = true);


--
-- Name: idx_color_supplier_supplier_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_color_supplier_supplier_id ON public.color_supplier USING btree (supplier_id);


--
-- Name: idx_colors_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_colors_is_active ON public.colors USING btree (is_active) WHERE (is_active = true);


--
-- Name: idx_colors_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_colors_name ON public.colors USING btree (name);


--
-- Name: idx_conflict_allocations_allocation; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conflict_allocations_allocation ON public.thread_conflict_allocations USING btree (allocation_id);


--
-- Name: idx_conflict_allocations_conflict; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conflict_allocations_conflict ON public.thread_conflict_allocations USING btree (conflict_id);


--
-- Name: idx_conflicts_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conflicts_created ON public.thread_conflicts USING btree (created_at DESC);


--
-- Name: idx_conflicts_pending; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conflicts_pending ON public.thread_conflicts USING btree (status) WHERE ((status)::text = 'PENDING'::text);


--
-- Name: idx_conflicts_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conflicts_status ON public.thread_conflicts USING btree (status);


--
-- Name: idx_conflicts_thread_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conflicts_thread_type ON public.thread_conflicts USING btree (thread_type_id);


--
-- Name: idx_employee_permissions_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employee_permissions_employee ON public.employee_permissions USING btree (employee_id);


--
-- Name: idx_employee_permissions_permission; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employee_permissions_permission ON public.employee_permissions USING btree (permission_id);


--
-- Name: idx_employee_roles_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employee_roles_employee ON public.employee_roles USING btree (employee_id);


--
-- Name: idx_employee_roles_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employee_roles_role ON public.employee_roles USING btree (role_id);


--
-- Name: idx_employees_department; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employees_department ON public.employees USING btree (department);


--
-- Name: idx_employees_employee_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employees_employee_id ON public.employees USING btree (employee_id);


--
-- Name: idx_employees_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employees_is_active ON public.employees USING btree (is_active);


--
-- Name: idx_employees_refresh_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employees_refresh_token ON public.employees USING btree (refresh_token);


--
-- Name: idx_lots_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lots_created_at ON public.lots USING btree (created_at DESC);


--
-- Name: idx_lots_lot_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lots_lot_number ON public.lots USING btree (lot_number);


--
-- Name: idx_lots_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lots_status ON public.lots USING btree (status);


--
-- Name: idx_lots_supplier_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lots_supplier_id ON public.lots USING btree (supplier_id);


--
-- Name: idx_lots_thread_type_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lots_thread_type_id ON public.lots USING btree (thread_type_id);


--
-- Name: idx_lots_warehouse_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lots_warehouse_id ON public.lots USING btree (warehouse_id);


--
-- Name: idx_movements_allocation; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_movements_allocation ON public.thread_movements USING btree (allocation_id);


--
-- Name: idx_movements_cone; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_movements_cone ON public.thread_movements USING btree (cone_id);


--
-- Name: idx_movements_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_movements_created ON public.thread_movements USING btree (created_at DESC);


--
-- Name: idx_movements_reference; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_movements_reference ON public.thread_movements USING btree (reference_type, reference_id);


--
-- Name: idx_movements_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_movements_type ON public.thread_movements USING btree (movement_type);


--
-- Name: idx_permissions_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_permissions_code ON public.permissions USING btree (code);


--
-- Name: idx_permissions_module; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_permissions_module ON public.permissions USING btree (module);


--
-- Name: idx_permissions_route; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_permissions_route ON public.permissions USING btree (route_path);


--
-- Name: idx_recovery_cone; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recovery_cone ON public.thread_recovery USING btree (cone_id);


--
-- Name: idx_recovery_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recovery_created ON public.thread_recovery USING btree (created_at DESC);


--
-- Name: idx_recovery_pending; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recovery_pending ON public.thread_recovery USING btree (status) WHERE (status = ANY (ARRAY['INITIATED'::public.recovery_status, 'PENDING_WEIGH'::public.recovery_status, 'WEIGHED'::public.recovery_status]));


--
-- Name: idx_recovery_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recovery_status ON public.thread_recovery USING btree (status);


--
-- Name: idx_refresh_tokens_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_refresh_tokens_employee ON public.employee_refresh_tokens USING btree (employee_id);


--
-- Name: idx_refresh_tokens_expires; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_refresh_tokens_expires ON public.employee_refresh_tokens USING btree (expires_at);


--
-- Name: idx_role_permissions_permission; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_role_permissions_permission ON public.role_permissions USING btree (permission_id);


--
-- Name: idx_role_permissions_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_role_permissions_role ON public.role_permissions USING btree (role_id);


--
-- Name: idx_suppliers_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_suppliers_code ON public.suppliers USING btree (code);


--
-- Name: idx_suppliers_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_suppliers_is_active ON public.suppliers USING btree (is_active) WHERE (is_active = true);


--
-- Name: idx_suppliers_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_suppliers_name ON public.suppliers USING btree (name);


--
-- Name: idx_thread_inventory_available; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thread_inventory_available ON public.thread_inventory USING btree (status) WHERE (status = 'AVAILABLE'::public.cone_status);


--
-- Name: idx_thread_inventory_cone_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thread_inventory_cone_id ON public.thread_inventory USING btree (cone_id);


--
-- Name: idx_thread_inventory_expiry; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thread_inventory_expiry ON public.thread_inventory USING btree (expiry_date) WHERE (expiry_date IS NOT NULL);


--
-- Name: idx_thread_inventory_fefo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thread_inventory_fefo ON public.thread_inventory USING btree (is_partial DESC, expiry_date, received_date) WHERE (status = 'AVAILABLE'::public.cone_status);


--
-- Name: INDEX idx_thread_inventory_fefo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.idx_thread_inventory_fefo IS 'FEFO composite index for allocation - partial cones first, then by expiry, then by received date';


--
-- Name: idx_thread_inventory_is_partial; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thread_inventory_is_partial ON public.thread_inventory USING btree (is_partial) WHERE (is_partial = true);


--
-- Name: idx_thread_inventory_lot_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thread_inventory_lot_id ON public.thread_inventory USING btree (lot_id) WHERE (lot_id IS NOT NULL);


--
-- Name: idx_thread_inventory_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thread_inventory_status ON public.thread_inventory USING btree (status);


--
-- Name: idx_thread_inventory_thread_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thread_inventory_thread_type ON public.thread_inventory USING btree (thread_type_id);


--
-- Name: idx_thread_inventory_warehouse; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thread_inventory_warehouse ON public.thread_inventory USING btree (warehouse_id);


--
-- Name: idx_thread_types_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thread_types_active ON public.thread_types USING btree (is_active) WHERE (is_active = true);


--
-- Name: idx_thread_types_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thread_types_code ON public.thread_types USING btree (code);


--
-- Name: idx_thread_types_color; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thread_types_color ON public.thread_types USING btree (color);


--
-- Name: idx_thread_types_color_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thread_types_color_id ON public.thread_types USING btree (color_id);


--
-- Name: idx_thread_types_color_supplier_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thread_types_color_supplier_id ON public.thread_types USING btree (color_supplier_id);


--
-- Name: idx_thread_types_material; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thread_types_material ON public.thread_types USING btree (material);


--
-- Name: idx_thread_types_supplier; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thread_types_supplier ON public.thread_types USING btree (supplier);


--
-- Name: idx_thread_types_supplier_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thread_types_supplier_id ON public.thread_types USING btree (supplier_id);


--
-- Name: idx_warehouses_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_warehouses_active ON public.warehouses USING btree (is_active);


--
-- Name: idx_warehouses_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_warehouses_code ON public.warehouses USING btree (code);


--
-- Name: idx_warehouses_parent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_warehouses_parent ON public.warehouses USING btree (parent_id);


--
-- Name: idx_warehouses_sort; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_warehouses_sort ON public.warehouses USING btree (parent_id, sort_order);


--
-- Name: idx_warehouses_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_warehouses_type ON public.warehouses USING btree (type);


--
-- Name: thread_allocations audit_thread_allocations; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_thread_allocations AFTER INSERT OR DELETE OR UPDATE ON public.thread_allocations FOR EACH ROW EXECUTE FUNCTION public.thread_audit_trigger_func();


--
-- Name: TRIGGER audit_thread_allocations ON thread_allocations; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TRIGGER audit_thread_allocations ON public.thread_allocations IS 'Audit trigger for allocations - Trigger kiem toan phan bo';


--
-- Name: thread_inventory audit_thread_inventory; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_thread_inventory AFTER INSERT OR DELETE OR UPDATE ON public.thread_inventory FOR EACH ROW EXECUTE FUNCTION public.thread_audit_trigger_func();


--
-- Name: TRIGGER audit_thread_inventory ON thread_inventory; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TRIGGER audit_thread_inventory ON public.thread_inventory IS 'Audit trigger for inventory - Trigger kiem toan ton kho';


--
-- Name: thread_recovery audit_thread_recovery; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_thread_recovery AFTER INSERT OR DELETE OR UPDATE ON public.thread_recovery FOR EACH ROW EXECUTE FUNCTION public.thread_audit_trigger_func();


--
-- Name: TRIGGER audit_thread_recovery ON thread_recovery; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TRIGGER audit_thread_recovery ON public.thread_recovery IS 'Audit trigger for recovery - Trigger kiem toan thu hoi';


--
-- Name: thread_types audit_thread_types; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_thread_types AFTER INSERT OR DELETE OR UPDATE ON public.thread_types FOR EACH ROW EXECUTE FUNCTION public.thread_audit_trigger_func();


--
-- Name: TRIGGER audit_thread_types ON thread_types; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TRIGGER audit_thread_types ON public.thread_types IS 'Audit trigger for thread types - Trigger kiem toan loai chi';


--
-- Name: color_supplier trigger_color_supplier_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_color_supplier_updated_at BEFORE UPDATE ON public.color_supplier FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: colors trigger_colors_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_colors_updated_at BEFORE UPDATE ON public.colors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: lots trigger_lots_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_lots_updated_at BEFORE UPDATE ON public.lots FOR EACH ROW EXECUTE FUNCTION public.update_lots_updated_at();


--
-- Name: suppliers trigger_suppliers_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: employees update_employees_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: thread_allocations update_thread_allocations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_thread_allocations_updated_at BEFORE UPDATE ON public.thread_allocations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: thread_conflicts update_thread_conflicts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_thread_conflicts_updated_at BEFORE UPDATE ON public.thread_conflicts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: thread_inventory update_thread_inventory_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_thread_inventory_updated_at BEFORE UPDATE ON public.thread_inventory FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: thread_recovery update_thread_recovery_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_thread_recovery_updated_at BEFORE UPDATE ON public.thread_recovery FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: thread_types update_thread_types_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_thread_types_updated_at BEFORE UPDATE ON public.thread_types FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: warehouses update_warehouses_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_warehouses_updated_at BEFORE UPDATE ON public.warehouses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: batch_transactions batch_transactions_from_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.batch_transactions
    ADD CONSTRAINT batch_transactions_from_warehouse_id_fkey FOREIGN KEY (from_warehouse_id) REFERENCES public.warehouses(id);


--
-- Name: batch_transactions batch_transactions_lot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.batch_transactions
    ADD CONSTRAINT batch_transactions_lot_id_fkey FOREIGN KEY (lot_id) REFERENCES public.lots(id);


--
-- Name: batch_transactions batch_transactions_to_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.batch_transactions
    ADD CONSTRAINT batch_transactions_to_warehouse_id_fkey FOREIGN KEY (to_warehouse_id) REFERENCES public.warehouses(id);


--
-- Name: color_supplier color_supplier_color_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.color_supplier
    ADD CONSTRAINT color_supplier_color_id_fkey FOREIGN KEY (color_id) REFERENCES public.colors(id) ON DELETE RESTRICT;


--
-- Name: color_supplier color_supplier_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.color_supplier
    ADD CONSTRAINT color_supplier_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE RESTRICT;


--
-- Name: employee_permissions employee_permissions_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_permissions
    ADD CONSTRAINT employee_permissions_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.employees(id);


--
-- Name: employee_permissions employee_permissions_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_permissions
    ADD CONSTRAINT employee_permissions_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: employee_permissions employee_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_permissions
    ADD CONSTRAINT employee_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- Name: employee_refresh_tokens employee_refresh_tokens_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_refresh_tokens
    ADD CONSTRAINT employee_refresh_tokens_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: employee_roles employee_roles_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_roles
    ADD CONSTRAINT employee_roles_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.employees(id);


--
-- Name: employee_roles employee_roles_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_roles
    ADD CONSTRAINT employee_roles_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: employee_roles employee_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_roles
    ADD CONSTRAINT employee_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: warehouses fk_warehouses_parent; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.warehouses
    ADD CONSTRAINT fk_warehouses_parent FOREIGN KEY (parent_id) REFERENCES public.warehouses(id) ON DELETE SET NULL;


--
-- Name: lots lots_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lots
    ADD CONSTRAINT lots_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE SET NULL;


--
-- Name: lots lots_thread_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lots
    ADD CONSTRAINT lots_thread_type_id_fkey FOREIGN KEY (thread_type_id) REFERENCES public.thread_types(id);


--
-- Name: lots lots_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lots
    ADD CONSTRAINT lots_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id);


--
-- Name: role_permissions role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: thread_allocation_cones thread_allocation_cones_allocation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thread_allocation_cones
    ADD CONSTRAINT thread_allocation_cones_allocation_id_fkey FOREIGN KEY (allocation_id) REFERENCES public.thread_allocations(id) ON DELETE CASCADE;


--
-- Name: thread_allocation_cones thread_allocation_cones_cone_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thread_allocation_cones
    ADD CONSTRAINT thread_allocation_cones_cone_id_fkey FOREIGN KEY (cone_id) REFERENCES public.thread_inventory(id);


--
-- Name: thread_allocations thread_allocations_split_from_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thread_allocations
    ADD CONSTRAINT thread_allocations_split_from_id_fkey FOREIGN KEY (split_from_id) REFERENCES public.thread_allocations(id);


--
-- Name: thread_allocations thread_allocations_thread_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thread_allocations
    ADD CONSTRAINT thread_allocations_thread_type_id_fkey FOREIGN KEY (thread_type_id) REFERENCES public.thread_types(id);


--
-- Name: thread_conflict_allocations thread_conflict_allocations_allocation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thread_conflict_allocations
    ADD CONSTRAINT thread_conflict_allocations_allocation_id_fkey FOREIGN KEY (allocation_id) REFERENCES public.thread_allocations(id);


--
-- Name: thread_conflict_allocations thread_conflict_allocations_conflict_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thread_conflict_allocations
    ADD CONSTRAINT thread_conflict_allocations_conflict_id_fkey FOREIGN KEY (conflict_id) REFERENCES public.thread_conflicts(id) ON DELETE CASCADE;


--
-- Name: thread_conflicts thread_conflicts_thread_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thread_conflicts
    ADD CONSTRAINT thread_conflicts_thread_type_id_fkey FOREIGN KEY (thread_type_id) REFERENCES public.thread_types(id);


--
-- Name: thread_inventory thread_inventory_lot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thread_inventory
    ADD CONSTRAINT thread_inventory_lot_id_fkey FOREIGN KEY (lot_id) REFERENCES public.lots(id);


--
-- Name: thread_inventory thread_inventory_thread_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thread_inventory
    ADD CONSTRAINT thread_inventory_thread_type_id_fkey FOREIGN KEY (thread_type_id) REFERENCES public.thread_types(id);


--
-- Name: thread_inventory thread_inventory_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thread_inventory
    ADD CONSTRAINT thread_inventory_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id);


--
-- Name: thread_movements thread_movements_allocation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thread_movements
    ADD CONSTRAINT thread_movements_allocation_id_fkey FOREIGN KEY (allocation_id) REFERENCES public.thread_allocations(id);


--
-- Name: thread_movements thread_movements_cone_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thread_movements
    ADD CONSTRAINT thread_movements_cone_id_fkey FOREIGN KEY (cone_id) REFERENCES public.thread_inventory(id);


--
-- Name: thread_recovery thread_recovery_cone_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thread_recovery
    ADD CONSTRAINT thread_recovery_cone_id_fkey FOREIGN KEY (cone_id) REFERENCES public.thread_inventory(id);


--
-- Name: thread_types thread_types_color_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thread_types
    ADD CONSTRAINT thread_types_color_id_fkey FOREIGN KEY (color_id) REFERENCES public.colors(id) ON DELETE SET NULL;


--
-- Name: thread_types thread_types_color_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thread_types
    ADD CONSTRAINT thread_types_color_supplier_id_fkey FOREIGN KEY (color_supplier_id) REFERENCES public.color_supplier(id) ON DELETE SET NULL;


--
-- Name: thread_types thread_types_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thread_types
    ADD CONSTRAINT thread_types_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict HiHT5wvHZJj00DvJ8MhmU4hyZWmen6Wt29SA33kLyszC6BSvR8YMkQX3fyYfr8w

