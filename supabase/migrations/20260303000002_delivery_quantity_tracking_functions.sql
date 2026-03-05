-- ============================================================================
-- Delivery Quantity Tracking - RPC Functions
-- Migration: 20260303000002_delivery_quantity_tracking_functions.sql
-- Description: Modify fn_borrow_thread to adjust delivery, create fn_reserve_from_stock
-- ============================================================================

BEGIN;

-- ============================================================================
-- Task 2.1-2.3: Modify fn_borrow_thread to UPDATE delivery quantity_cones
-- Source week: quantity_cones += v_moved (needs more from supplier)
-- Target week: quantity_cones = GREATEST(0, quantity_cones - v_moved) (needs less)
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
  v_supplier_id INTEGER;
  v_delivery_date DATE;
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

  -- Task 2.1: Source week needs MORE from supplier (lost inventory to target)
  UPDATE thread_order_deliveries
  SET quantity_cones = quantity_cones + v_moved,
      updated_at = NOW()
  WHERE week_id = p_from_week_id
    AND thread_type_id = p_thread_type_id;

  -- Task 2.3: If source delivery doesn't exist, create it
  IF NOT FOUND THEN
    -- Get supplier_id from summary_data
    SELECT (item->>'supplier_id')::INTEGER,
           COALESCE((item->>'delivery_date')::DATE, (SELECT end_date FROM thread_order_weeks WHERE id = p_from_week_id))
    INTO v_supplier_id, v_delivery_date
    FROM thread_order_results tor,
         json_array_elements(tor.summary_data) AS item
    WHERE tor.week_id = p_from_week_id
      AND (item->>'thread_type_id')::INTEGER = p_thread_type_id
    LIMIT 1;

    IF v_supplier_id IS NOT NULL THEN
      INSERT INTO thread_order_deliveries (week_id, thread_type_id, supplier_id, delivery_date, quantity_cones, status)
      VALUES (p_from_week_id, p_thread_type_id, v_supplier_id, COALESCE(v_delivery_date, CURRENT_DATE + 7), v_moved, 'PENDING')
      ON CONFLICT (week_id, thread_type_id) DO UPDATE
      SET quantity_cones = thread_order_deliveries.quantity_cones + v_moved,
          updated_at = NOW();
    END IF;
  END IF;

  -- Task 2.2: Target week needs LESS from supplier (got inventory from source)
  UPDATE thread_order_deliveries
  SET quantity_cones = GREATEST(0, quantity_cones - v_moved),
      updated_at = NOW()
  WHERE week_id = p_to_week_id
    AND thread_type_id = p_thread_type_id;

  RETURN json_build_object(
    'success', true,
    'loan_id', v_loan_id,
    'moved_cones', v_moved,
    'moved_meters', v_total_meters
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_borrow_thread IS 'Atomic borrow thread from one WO week to another with row locking and delivery quantity adjustment';

-- ============================================================================
-- Task 2.4-2.8: Create fn_reserve_from_stock function
-- Reserve AVAILABLE cones for a CONFIRMED week, create loan with from_week_id=NULL
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_reserve_from_stock(
  p_week_id INTEGER,
  p_thread_type_id INTEGER,
  p_quantity INTEGER,
  p_reason TEXT,
  p_user VARCHAR
)
RETURNS JSON AS $$
DECLARE
  v_week_status VARCHAR;
  v_reserved INTEGER := 0;
  v_total_meters NUMERIC(12,4) := 0;
  v_cone RECORD;
  v_loan_id INTEGER;
  v_shortage INTEGER;
  v_delivery_exists BOOLEAN;
BEGIN
  -- Task 2.5: Validate week is CONFIRMED
  SELECT status INTO v_week_status
  FROM thread_order_weeks
  WHERE id = p_week_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy tuần đơn hàng với id %', p_week_id;
  END IF;

  IF v_week_status <> 'CONFIRMED' THEN
    RAISE EXCEPTION 'Chỉ có thể lấy từ tồn kho cho tuần đã xác nhận';
  END IF;

  -- Task 2.5.1: Validate delivery row exists for this thread type
  SELECT EXISTS(
    SELECT 1 FROM thread_order_deliveries
    WHERE week_id = p_week_id AND thread_type_id = p_thread_type_id
  ) INTO v_delivery_exists;

  IF NOT v_delivery_exists THEN
    RAISE EXCEPTION 'Không có dữ liệu giao hàng cho loại chỉ này trong tuần đơn hàng';
  END IF;

  -- Task 2.6: Reserve AVAILABLE cones with FEFO logic
  FOR v_cone IN
    SELECT id, quantity_meters
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
    SET status = 'RESERVED_FOR_ORDER'::cone_status,
        reserved_week_id = p_week_id,
        updated_at = NOW()
    WHERE id = v_cone.id;

    v_reserved := v_reserved + 1;
    v_total_meters := v_total_meters + COALESCE(v_cone.quantity_meters, 0);

    EXIT WHEN v_reserved >= p_quantity;
  END LOOP;

  -- Only create loan and adjust delivery if we reserved something
  IF v_reserved > 0 THEN
    -- Task 2.7: Create loan record with from_week_id = NULL (indicates stock)
    INSERT INTO thread_order_loans (
      from_week_id, to_week_id, thread_type_id,
      quantity_cones, quantity_meters, reason, created_by
    ) VALUES (
      NULL, p_week_id, p_thread_type_id,
      v_reserved, v_total_meters, COALESCE(p_reason, 'Lấy từ tồn kho'), p_user
    ) RETURNING id INTO v_loan_id;

    -- Task 2.8: Adjust delivery quantity_cones (reduce expected from supplier)
    UPDATE thread_order_deliveries
    SET quantity_cones = GREATEST(0, quantity_cones - v_reserved),
        updated_at = NOW()
    WHERE week_id = p_week_id
      AND thread_type_id = p_thread_type_id;
  END IF;

  -- Calculate remaining shortage
  v_shortage := GREATEST(0, p_quantity - v_reserved);

  RETURN json_build_object(
    'success', true,
    'reserved', v_reserved,
    'shortage', v_shortage,
    'loan_id', v_loan_id
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_reserve_from_stock IS 'Reserve available stock for confirmed WO week, creates loan with from_week_id=NULL for audit';

-- ============================================================================
-- Task 2.9: Update fn_receive_delivery to use quantity_cones instead of total_cones
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

  -- Task 2.9: Calculate current shortage based on quantity_cones from delivery record
  -- Instead of deriving from calculation_data.total_cones
  v_current_shortage := GREATEST(0,
    v_delivery.quantity_cones - COALESCE(
      (SELECT COUNT(*)
       FROM thread_inventory
       WHERE reserved_week_id = v_week_id
         AND thread_type_id = v_thread_type_id
         AND status = 'RESERVED_FOR_ORDER'), 0
    )
  );

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
      CASE WHEN v_cones_created < v_current_shortage THEN 'RESERVED_FOR_ORDER'::cone_status ELSE 'AVAILABLE'::cone_status END,
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

  -- Task 2.9: Update delivery using quantity_cones (not total_cones)
  UPDATE thread_order_deliveries
  SET received_quantity = received_quantity + p_received_qty,
      received_by = p_received_by,
      received_at = NOW(),
      warehouse_id = p_warehouse_id,
      inventory_status = CASE
        WHEN received_quantity + p_received_qty >= quantity_cones THEN 'RECEIVED'::inventory_receipt_status
        ELSE 'PARTIAL'::inventory_receipt_status
      END,
      updated_at = NOW()
  WHERE id = p_delivery_id;

  RETURN json_build_object(
    'success', true,
    'cones_created', v_cones_created,
    'cones_reserved', v_cones_reserved,
    'remaining_shortage', GREATEST(0, v_current_shortage - v_cones_reserved),
    'lot_number', 'WO-' || v_week_id
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_receive_delivery IS 'Atomic receive delivery with auto-reserve for WO shortage, uses quantity_cones from delivery';

NOTIFY pgrst, 'reload schema';

COMMIT;
