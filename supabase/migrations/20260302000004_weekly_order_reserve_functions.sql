-- ============================================================================
-- Weekly Order Reserve Inventory - RPC Functions
-- Migration: 20260302000004_weekly_order_reserve_functions.sql
-- Description: Reserve, release, borrow, and confirm functions for WO
-- ============================================================================

-- ============================================================================
-- FUNCTION: fn_reserve_for_week
-- Task 3.1: Reserve AVAILABLE cones for a week with FEFO logic
-- Returns: { reserved, skipped_locked, shortage }
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_reserve_for_week(
  p_week_id INTEGER,
  p_thread_type_id INTEGER,
  p_quantity INTEGER
)
RETURNS JSON AS $$
DECLARE
  v_reserved INTEGER := 0;
  v_skipped INTEGER := 0;
  v_cone RECORD;
  v_available_count INTEGER;
BEGIN
  -- Count total available (including locked)
  SELECT COUNT(*) INTO v_available_count
  FROM thread_inventory
  WHERE thread_type_id = p_thread_type_id
    AND status = 'AVAILABLE'
    AND reserved_week_id IS NULL;

  -- Reserve cones with FEFO, skip locked rows
  FOR v_cone IN
    SELECT id
    FROM thread_inventory
    WHERE thread_type_id = p_thread_type_id
      AND status = 'AVAILABLE'
      AND reserved_week_id IS NULL
    ORDER BY
      is_partial DESC,
      expiry_date ASC NULLS LAST,
      received_date ASC
    FOR UPDATE SKIP LOCKED
    LIMIT p_quantity
  LOOP
    UPDATE thread_inventory
    SET status = 'RESERVED_FOR_ORDER',
        reserved_week_id = p_week_id,
        updated_at = NOW()
    WHERE id = v_cone.id;

    v_reserved := v_reserved + 1;

    EXIT WHEN v_reserved >= p_quantity;
  END LOOP;

  -- Calculate skipped (difference between what we could have gotten vs what we got)
  v_skipped := LEAST(v_available_count, p_quantity) - v_reserved;
  IF v_skipped < 0 THEN v_skipped := 0; END IF;

  RETURN json_build_object(
    'reserved', v_reserved,
    'skipped_locked', v_skipped,
    'shortage', GREATEST(0, p_quantity - v_reserved)
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_reserve_for_week IS 'Reserve AVAILABLE cones for WO week with FEFO, returns {reserved, skipped_locked, shortage}';

-- ============================================================================
-- FUNCTION: fn_release_week_reservations
-- Task 3.2: Release all reserved cones for a week
-- Raises exception if active loans exist
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_release_week_reservations(p_week_id INTEGER)
RETURNS JSON AS $$
DECLARE
  v_loan_count INTEGER;
  v_released INTEGER;
BEGIN
  -- Check for active loans (given or received)
  SELECT COUNT(*) INTO v_loan_count
  FROM thread_order_loans
  WHERE (from_week_id = p_week_id OR to_week_id = p_week_id)
    AND deleted_at IS NULL;

  IF v_loan_count > 0 THEN
    RAISE EXCEPTION 'Không thể hủy khi còn khoản mượn/cho mượn chưa thanh toán (% khoản)', v_loan_count;
  END IF;

  -- Release all reserved cones
  WITH released AS (
    UPDATE thread_inventory
    SET status = 'AVAILABLE',
        reserved_week_id = NULL,
        updated_at = NOW()
    WHERE reserved_week_id = p_week_id
      AND status = 'RESERVED_FOR_ORDER'
    RETURNING id
  )
  SELECT COUNT(*) INTO v_released FROM released;

  RETURN json_build_object(
    'success', true,
    'released_cones', v_released
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_release_week_reservations IS 'Release all reserved cones for a WO week, fails if active loans exist';

-- ============================================================================
-- FUNCTION: fn_borrow_thread
-- Task 3.3: Atomic borrow with row locking per D14
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_borrow_thread(
  p_from_week_id INTEGER,
  p_to_week_id INTEGER,
  p_thread_type_id INTEGER,
  p_quantity INTEGER,
  p_reason TEXT,
  p_user VARCHAR
)
RETURNS JSON AS $$
DECLARE
  v_moved INTEGER := 0;
  v_total_meters NUMERIC(12,4) := 0;
  v_cone RECORD;
  v_loan_id INTEGER;
BEGIN
  -- Lock and move cones
  FOR v_cone IN
    SELECT id, quantity_meters
    FROM thread_inventory
    WHERE reserved_week_id = p_from_week_id
      AND thread_type_id = p_thread_type_id
      AND status = 'RESERVED_FOR_ORDER'
    ORDER BY
      is_partial DESC,
      expiry_date ASC NULLS LAST,
      received_date ASC
    FOR UPDATE SKIP LOCKED
    LIMIT p_quantity
  LOOP
    UPDATE thread_inventory
    SET reserved_week_id = p_to_week_id,
        original_week_id = COALESCE(original_week_id, p_from_week_id),
        updated_at = NOW()
    WHERE id = v_cone.id;

    v_moved := v_moved + 1;
    v_total_meters := v_total_meters + COALESCE(v_cone.quantity_meters, 0);

    EXIT WHEN v_moved >= p_quantity;
  END LOOP;

  -- Check if we moved enough
  IF v_moved < p_quantity THEN
    RAISE EXCEPTION 'Không đủ chỉ để mượn. Yêu cầu: %, có sẵn: %', p_quantity, v_moved;
  END IF;

  -- Create loan record
  INSERT INTO thread_order_loans (
    from_week_id, to_week_id, thread_type_id,
    quantity_cones, quantity_meters, reason, created_by
  ) VALUES (
    p_from_week_id, p_to_week_id, p_thread_type_id,
    v_moved, v_total_meters, p_reason, p_user
  ) RETURNING id INTO v_loan_id;

  RETURN json_build_object(
    'success', true,
    'loan_id', v_loan_id,
    'moved_cones', v_moved,
    'moved_meters', v_total_meters
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_borrow_thread IS 'Atomic borrow thread from one WO week to another with row locking';

-- ============================================================================
-- FUNCTION: fn_confirm_week_with_reserve
-- Task 3.4: Atomic confirm per D8 - lock week, aggregate, reserve all, update status
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_confirm_week_with_reserve(p_week_id INTEGER)
RETURNS JSON AS $$
DECLARE
  v_week RECORD;
  v_summary RECORD;
  v_reserve_result JSON;
  v_all_summaries JSON[] := '{}';
  v_total_reserved INTEGER := 0;
  v_total_shortage INTEGER := 0;
BEGIN
  -- Lock week row FOR UPDATE
  SELECT * INTO v_week
  FROM thread_order_weeks
  WHERE id = p_week_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy tuần đơn hàng với id %', p_week_id;
  END IF;

  IF v_week.status <> 'DRAFT' THEN
    RAISE EXCEPTION 'Chỉ có thể xác nhận tuần ở trạng thái DRAFT. Trạng thái hiện tại: %', v_week.status;
  END IF;

  -- Aggregate requirements by thread_type_id from saved results
  -- Assumes thread_order_results stores calculation_data with thread_type_id and total_cones
  FOR v_summary IN
    SELECT
      (item->>'thread_type_id')::INTEGER AS thread_type_id,
      SUM((item->>'total_cones')::INTEGER) AS needed_cones
    FROM thread_order_results tor,
         json_array_elements(tor.calculation_data) AS item
    WHERE tor.week_id = p_week_id
    GROUP BY (item->>'thread_type_id')::INTEGER
  LOOP
    -- Reserve for each thread type
    v_reserve_result := fn_reserve_for_week(
      p_week_id,
      v_summary.thread_type_id,
      v_summary.needed_cones
    );

    v_all_summaries := array_append(v_all_summaries, json_build_object(
      'thread_type_id', v_summary.thread_type_id,
      'needed', v_summary.needed_cones,
      'reserved', (v_reserve_result->>'reserved')::INTEGER,
      'shortage', (v_reserve_result->>'shortage')::INTEGER
    ));

    v_total_reserved := v_total_reserved + (v_reserve_result->>'reserved')::INTEGER;
    v_total_shortage := v_total_shortage + (v_reserve_result->>'shortage')::INTEGER;
  END LOOP;

  -- Update status to CONFIRMED
  UPDATE thread_order_weeks
  SET status = 'CONFIRMED',
      updated_at = NOW()
  WHERE id = p_week_id;

  RETURN json_build_object(
    'success', true,
    'week_id', p_week_id,
    'total_reserved', v_total_reserved,
    'total_shortage', v_total_shortage,
    'reservation_summary', to_json(v_all_summaries)
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_confirm_week_with_reserve IS 'Atomic confirm WO week with reservation - locks week, reserves all thread types, updates status';

-- ============================================================================
-- FUNCTION: fn_receive_delivery
-- Task 7.1: Atomic receive + auto-reserve per D11
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_receive_delivery(
  p_delivery_id INTEGER,
  p_received_qty INTEGER,
  p_warehouse_id INTEGER,
  p_received_by VARCHAR,
  p_expiry_date DATE DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_delivery RECORD;
  v_week_id INTEGER;
  v_thread_type_id INTEGER;
  v_density NUMERIC;
  v_meters_per_cone NUMERIC;
  v_cone_id VARCHAR;
  v_cone_db_id INTEGER;
  v_cones_created INTEGER := 0;
  v_cones_reserved INTEGER := 0;
  v_current_shortage INTEGER;
  i INTEGER;
BEGIN
  -- Lock delivery row FOR UPDATE
  SELECT tod.*, tow.id AS week_id
  INTO v_delivery
  FROM thread_order_deliveries tod
  JOIN thread_order_weeks tow ON tod.week_id = tow.id
  WHERE tod.id = p_delivery_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy đơn giao hàng với id %', p_delivery_id;
  END IF;

  v_week_id := v_delivery.week_id;
  v_thread_type_id := v_delivery.thread_type_id;

  -- Get thread type info
  SELECT density_grams_per_meter, meters_per_cone
  INTO v_density, v_meters_per_cone
  FROM thread_types
  WHERE id = v_thread_type_id;

  -- Calculate current shortage for this week/thread
  SELECT COALESCE(
    (SELECT SUM((item->>'total_cones')::INTEGER)
     FROM thread_order_results tor,
          json_array_elements(tor.calculation_data) AS item
     WHERE tor.week_id = v_week_id
       AND (item->>'thread_type_id')::INTEGER = v_thread_type_id), 0
  ) - COALESCE(
    (SELECT COUNT(*)
     FROM thread_inventory
     WHERE reserved_week_id = v_week_id
       AND thread_type_id = v_thread_type_id
       AND status = 'RESERVED_FOR_ORDER'), 0
  ) INTO v_current_shortage;

  IF v_current_shortage < 0 THEN v_current_shortage := 0; END IF;

  -- Create cones
  FOR i IN 1..p_received_qty LOOP
    v_cone_id := 'WO-' || v_week_id || '-' || v_thread_type_id || '-' ||
                 TO_CHAR(NOW(), 'YYYYMMDD') || '-' ||
                 LPAD((nextval('thread_inventory_id_seq'))::TEXT, 6, '0');

    INSERT INTO thread_inventory (
      cone_id, thread_type_id, warehouse_id,
      quantity_cones, quantity_meters,
      status, received_date, lot_number
    ) VALUES (
      v_cone_id, v_thread_type_id, p_warehouse_id,
      1, COALESCE(v_meters_per_cone, 5000),
      CASE WHEN v_cones_created < v_current_shortage THEN 'RESERVED_FOR_ORDER' ELSE 'AVAILABLE' END,
      CURRENT_DATE, 'WO-' || v_week_id
    ) RETURNING id INTO v_cone_db_id;

    -- Auto-reserve if there's shortage
    IF v_cones_created < v_current_shortage THEN
      UPDATE thread_inventory
      SET reserved_week_id = v_week_id
      WHERE id = v_cone_db_id;
      v_cones_reserved := v_cones_reserved + 1;
    END IF;

    v_cones_created := v_cones_created + 1;
  END LOOP;

  -- Update delivery received_quantity
  UPDATE thread_order_deliveries
  SET received_quantity = received_quantity + p_received_qty,
      received_by = p_received_by,
      received_at = NOW(),
      warehouse_id = p_warehouse_id,
      inventory_status = CASE
        WHEN received_quantity + p_received_qty >= total_cones THEN 'RECEIVED'
        ELSE 'PARTIAL'
      END,
      updated_at = NOW()
  WHERE id = p_delivery_id;

  RETURN json_build_object(
    'success', true,
    'cones_created', v_cones_created,
    'cones_reserved', v_cones_reserved,
    'remaining_shortage', GREATEST(0, v_current_shortage - v_cones_reserved)
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_receive_delivery IS 'Atomic receive delivery with auto-reserve for WO shortage';
