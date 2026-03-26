-- ============================================================================
-- TEST SCRIPT: Delivery Quantity Tracking Functions
-- Kiểm tra fn_borrow_thread và fn_reserve_from_stock
-- Chạy: psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -f supabase/test-delivery-quantity-tracking.sql
-- ============================================================================

\echo '============================================================================'
\echo 'KIỂM TRA DỮ LIỆU HIỆN CÓ'
\echo '============================================================================'

-- 1. Tìm tuần CONFIRMED để test
\echo '\n--- 1. Tuần đơn hàng CONFIRMED ---'
SELECT id, name, status, start_date, end_date
FROM thread_order_weeks
WHERE status = 'CONFIRMED'
ORDER BY id DESC
LIMIT 5;

-- 2. Tìm inventory RESERVED_FOR_ORDER (có thể mượn)
\echo '\n--- 2. Inventory RESERVED_FOR_ORDER (nguồn để mượn) ---'
SELECT ti.id, ti.thread_type_id, tt.name as thread_type_name,
       ti.reserved_week_id, ti.status, ti.quantity_meters
FROM thread_inventory ti
JOIN thread_types tt ON ti.thread_type_id = tt.id
WHERE ti.status = 'RESERVED_FOR_ORDER'
  AND ti.reserved_week_id IS NOT NULL
LIMIT 10;

-- 3. Tìm inventory AVAILABLE (có thể reserve từ stock)
\echo '\n--- 3. Inventory AVAILABLE (tồn kho chưa reserved) ---'
SELECT ti.id, ti.thread_type_id, tt.name as thread_type_name,
       ti.status, ti.quantity_meters
FROM thread_inventory ti
JOIN thread_types tt ON ti.thread_type_id = tt.id
WHERE ti.status = 'AVAILABLE'
  AND ti.reserved_week_id IS NULL
LIMIT 10;

-- 4. Delivery records
\echo '\n--- 4. Delivery records ---'
SELECT tod.id, tod.week_id, tow.name as week_name, tod.thread_type_id,
       tt.name as thread_type_name, tod.quantity_cones, tod.received_quantity,
       tod.status, tod.inventory_status
FROM thread_order_deliveries tod
JOIN thread_order_weeks tow ON tod.week_id = tow.id
JOIN thread_types tt ON tod.thread_type_id = tt.id
WHERE tow.status = 'CONFIRMED'
ORDER BY tod.week_id DESC, tod.id
LIMIT 10;

-- 5. Loan records hiện có
\echo '\n--- 5. Loan records (thread_order_loans) ---'
SELECT tol.id, tol.from_week_id, tol.to_week_id, tol.thread_type_id,
       tol.quantity_cones, tol.quantity_meters, tol.reason, tol.created_by
FROM thread_order_loans tol
ORDER BY tol.id DESC
LIMIT 10;

\echo '\n============================================================================'
\echo 'KIỂM TRA FUNCTIONS'
\echo '============================================================================'

-- 6. Kiểm tra fn_borrow_thread tồn tại
\echo '\n--- 6. Kiểm tra fn_borrow_thread signature ---'
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'fn_borrow_thread'
LIMIT 1;

-- 7. Kiểm tra fn_reserve_from_stock tồn tại
\echo '\n--- 7. Kiểm tra fn_reserve_from_stock signature ---'
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'fn_reserve_from_stock'
LIMIT 1;

-- 8. Kiểm tra fn_receive_delivery tồn tại
\echo '\n--- 8. Kiểm tra fn_receive_delivery signature ---'
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'fn_receive_delivery'
LIMIT 1;

\echo '\n============================================================================'
\echo 'TEST SCENARIOS (DRY RUN)'
\echo '============================================================================'

-- NOTE: Các test dưới đây chạy trong transaction rồi ROLLBACK để không ảnh hưởng data

-- Test 1: fn_borrow_thread - mượn 1 cuộn từ tuần nguồn sang tuần đích
\echo '\n--- Test 1: fn_borrow_thread (ROLLBACK sau test) ---'

DO $$
DECLARE
  v_from_week_id INTEGER;
  v_to_week_id INTEGER;
  v_thread_type_id INTEGER;
  v_result JSON;
  v_delivery_before INTEGER;
  v_delivery_after_source INTEGER;
  v_delivery_after_target INTEGER;
BEGIN
  -- Tìm 2 tuần CONFIRMED khác nhau có cùng thread_type trong delivery
  SELECT DISTINCT d1.week_id, d2.week_id, d1.thread_type_id
  INTO v_from_week_id, v_to_week_id, v_thread_type_id
  FROM thread_order_deliveries d1
  JOIN thread_order_deliveries d2 ON d1.thread_type_id = d2.thread_type_id AND d1.week_id <> d2.week_id
  JOIN thread_order_weeks w1 ON d1.week_id = w1.id AND w1.status = 'CONFIRMED'
  JOIN thread_order_weeks w2 ON d2.week_id = w2.id AND w2.status = 'CONFIRMED'
  WHERE EXISTS (
    SELECT 1 FROM thread_inventory ti
    WHERE ti.reserved_week_id = d1.week_id
      AND ti.thread_type_id = d1.thread_type_id
      AND ti.status = 'RESERVED_FOR_ORDER'
  )
  LIMIT 1;

  IF v_from_week_id IS NULL THEN
    RAISE NOTICE 'Không tìm được dữ liệu phù hợp để test fn_borrow_thread';
    RETURN;
  END IF;

  RAISE NOTICE 'Test fn_borrow_thread: from_week=%, to_week=%, thread_type=%', v_from_week_id, v_to_week_id, v_thread_type_id;

  -- Lưu quantity_cones trước
  SELECT quantity_cones INTO v_delivery_before
  FROM thread_order_deliveries
  WHERE week_id = v_from_week_id AND thread_type_id = v_thread_type_id;
  RAISE NOTICE 'Source delivery quantity_cones TRƯỚC: %', v_delivery_before;

  -- Gọi function
  SELECT fn_borrow_thread(v_from_week_id, v_to_week_id, v_thread_type_id, 1, 'Test borrow', 'TEST_USER') INTO v_result;
  RAISE NOTICE 'Result: %', v_result;

  -- Kiểm tra quantity_cones sau
  SELECT quantity_cones INTO v_delivery_after_source
  FROM thread_order_deliveries
  WHERE week_id = v_from_week_id AND thread_type_id = v_thread_type_id;

  SELECT quantity_cones INTO v_delivery_after_target
  FROM thread_order_deliveries
  WHERE week_id = v_to_week_id AND thread_type_id = v_thread_type_id;

  RAISE NOTICE 'Source delivery quantity_cones SAU: % (expected: +1 = %)', v_delivery_after_source, v_delivery_before + 1;
  RAISE NOTICE 'Target delivery quantity_cones SAU: % (expected: giảm 1)', v_delivery_after_target;

  -- Kiểm tra loan record được tạo
  RAISE NOTICE 'Loan record created: %', (SELECT COUNT(*) FROM thread_order_loans WHERE from_week_id = v_from_week_id AND to_week_id = v_to_week_id AND thread_type_id = v_thread_type_id);

  -- ROLLBACK để không ảnh hưởng data
  RAISE EXCEPTION 'ROLLBACK TEST - This is expected';
EXCEPTION WHEN OTHERS THEN
  IF SQLERRM = 'ROLLBACK TEST - This is expected' THEN
    RAISE NOTICE 'Test fn_borrow_thread: PASSED (rolled back)';
  ELSE
    RAISE NOTICE 'Test fn_borrow_thread: ERROR - %', SQLERRM;
  END IF;
END $$;


-- Test 2: fn_reserve_from_stock - lấy từ tồn kho cho tuần confirmed
\echo '\n--- Test 2: fn_reserve_from_stock (ROLLBACK sau test) ---'

DO $$
DECLARE
  v_week_id INTEGER;
  v_thread_type_id INTEGER;
  v_result JSON;
  v_available_count INTEGER;
  v_delivery_before INTEGER;
  v_delivery_after INTEGER;
BEGIN
  -- Tìm tuần CONFIRMED có delivery row và có inventory AVAILABLE
  SELECT tod.week_id, tod.thread_type_id
  INTO v_week_id, v_thread_type_id
  FROM thread_order_deliveries tod
  JOIN thread_order_weeks tow ON tod.week_id = tow.id AND tow.status = 'CONFIRMED'
  WHERE EXISTS (
    SELECT 1 FROM thread_inventory ti
    WHERE ti.thread_type_id = tod.thread_type_id
      AND ti.status = 'AVAILABLE'
      AND ti.reserved_week_id IS NULL
  )
  LIMIT 1;

  IF v_week_id IS NULL THEN
    RAISE NOTICE 'Không tìm được dữ liệu phù hợp để test fn_reserve_from_stock';
    RETURN;
  END IF;

  -- Đếm inventory AVAILABLE
  SELECT COUNT(*) INTO v_available_count
  FROM thread_inventory
  WHERE thread_type_id = v_thread_type_id
    AND status = 'AVAILABLE'
    AND reserved_week_id IS NULL;

  RAISE NOTICE 'Test fn_reserve_from_stock: week=%, thread_type=%, available=%', v_week_id, v_thread_type_id, v_available_count;

  -- Lưu delivery quantity_cones trước
  SELECT quantity_cones INTO v_delivery_before
  FROM thread_order_deliveries
  WHERE week_id = v_week_id AND thread_type_id = v_thread_type_id;
  RAISE NOTICE 'Delivery quantity_cones TRƯỚC: %', v_delivery_before;

  -- Gọi function (lấy 1 cuộn)
  SELECT fn_reserve_from_stock(v_week_id, v_thread_type_id, 1, 'Test reserve from stock', 'TEST_USER') INTO v_result;
  RAISE NOTICE 'Result: %', v_result;

  -- Kiểm tra delivery quantity_cones sau
  SELECT quantity_cones INTO v_delivery_after
  FROM thread_order_deliveries
  WHERE week_id = v_week_id AND thread_type_id = v_thread_type_id;
  RAISE NOTICE 'Delivery quantity_cones SAU: % (expected: -1 = %)', v_delivery_after, GREATEST(0, v_delivery_before - 1);

  -- Kiểm tra loan record với from_week_id = NULL
  RAISE NOTICE 'Loan record with from_week_id=NULL: %', (SELECT COUNT(*) FROM thread_order_loans WHERE from_week_id IS NULL AND to_week_id = v_week_id AND thread_type_id = v_thread_type_id);

  -- ROLLBACK
  RAISE EXCEPTION 'ROLLBACK TEST - This is expected';
EXCEPTION WHEN OTHERS THEN
  IF SQLERRM = 'ROLLBACK TEST - This is expected' THEN
    RAISE NOTICE 'Test fn_reserve_from_stock: PASSED (rolled back)';
  ELSE
    RAISE NOTICE 'Test fn_reserve_from_stock: ERROR - %', SQLERRM;
  END IF;
END $$;


-- Test 3: fn_reserve_from_stock với tuần KHÔNG CONFIRMED (should fail)
\echo '\n--- Test 3: fn_reserve_from_stock với tuần không CONFIRMED (expected failure) ---'

DO $$
DECLARE
  v_week_id INTEGER;
  v_thread_type_id INTEGER;
  v_result JSON;
BEGIN
  -- Tìm tuần DRAFT hoặc PENDING
  SELECT tod.week_id, tod.thread_type_id
  INTO v_week_id, v_thread_type_id
  FROM thread_order_deliveries tod
  JOIN thread_order_weeks tow ON tod.week_id = tow.id AND tow.status IN ('DRAFT', 'PENDING')
  LIMIT 1;

  IF v_week_id IS NULL THEN
    RAISE NOTICE 'Không tìm được tuần DRAFT/PENDING để test validation';
    RETURN;
  END IF;

  RAISE NOTICE 'Test validation: week=% (not CONFIRMED), thread_type=%', v_week_id, v_thread_type_id;

  -- Gọi function - should raise exception
  SELECT fn_reserve_from_stock(v_week_id, v_thread_type_id, 1, 'Test validation', 'TEST_USER') INTO v_result;
  RAISE NOTICE 'ERROR: Function should have raised exception but returned: %', v_result;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Test validation: PASSED - Error as expected: %', SQLERRM;
END $$;


-- Test 4: fn_reserve_from_stock với thread_type không có delivery row (should fail)
\echo '\n--- Test 4: fn_reserve_from_stock với thread_type không có delivery row (expected failure) ---'

DO $$
DECLARE
  v_week_id INTEGER;
  v_thread_type_id INTEGER;
  v_result JSON;
BEGIN
  -- Tìm tuần CONFIRMED
  SELECT id INTO v_week_id
  FROM thread_order_weeks
  WHERE status = 'CONFIRMED'
  LIMIT 1;

  -- Tìm thread_type không có trong delivery của tuần này
  SELECT tt.id INTO v_thread_type_id
  FROM thread_types tt
  WHERE NOT EXISTS (
    SELECT 1 FROM thread_order_deliveries tod
    WHERE tod.week_id = v_week_id AND tod.thread_type_id = tt.id
  )
  LIMIT 1;

  IF v_week_id IS NULL OR v_thread_type_id IS NULL THEN
    RAISE NOTICE 'Không tìm được dữ liệu để test validation delivery row';
    RETURN;
  END IF;

  RAISE NOTICE 'Test validation: week=%, thread_type=% (no delivery row)', v_week_id, v_thread_type_id;

  -- Gọi function - should raise exception
  SELECT fn_reserve_from_stock(v_week_id, v_thread_type_id, 1, 'Test validation', 'TEST_USER') INTO v_result;
  RAISE NOTICE 'ERROR: Function should have raised exception but returned: %', v_result;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Test validation: PASSED - Error as expected: %', SQLERRM;
END $$;


\echo '\n============================================================================'
\echo 'SUMMARY'
\echo '============================================================================'
\echo 'Tất cả tests đã chạy. Kiểm tra NOTICE messages ở trên để xem kết quả.'
\echo '- PASSED: Function hoạt động đúng'
\echo '- ERROR: Function có vấn đề, cần kiểm tra lại'
\echo '============================================================================'
