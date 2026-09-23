-- Liên kết cuộn chỉ với lần nhập kho + hai RPC ghi giảm tồn kho theo tuần.
--
-- Bối cảnh:
--   thread_inventory không có cột nào trỏ về delivery_receive_logs. Cuộn tạo bởi
--   fn_receive_delivery chỉ mang lot_number = 'WO-<week>' và received_date, nên không
--   xác định được chính xác các cuộn thuộc một lần nhập cụ thể. Thiếu mối nối này thì
--   không hoàn tác được một lần nhập nhầm.
--
-- Thay đổi:
--   1. thread_inventory.receive_log_id  — cuộn thuộc lần nhập nào (không đặt FK để
--      không ràng buộc ngược lên bảng log).
--   2. delivery_receive_logs.reverted_at/by/reason — đánh dấu lần nhập đã hoàn tác,
--      không xóa dòng.
--   3. fn_receive_delivery ghi log TRƯỚC khi tạo cuộn để gán receive_log_id.
--   4. fn_write_off_week_cones  — lõi ghi giảm: cuộn → WRITTEN_OFF + thread_movements.
--   5. fn_revert_delivery_receive — hoàn tác nguyên một lần nhập.
--
-- An toàn: hoàn toàn additive. Không DELETE/TRUNCATE/DROP. Backfill chỉ UPDATE các dòng
-- đang có receive_log_id NULL, và chỉ với delivery có đúng một lần nhập (không đoán).

BEGIN;

ALTER TABLE thread_inventory ADD COLUMN IF NOT EXISTS receive_log_id INTEGER;

CREATE INDEX IF NOT EXISTS idx_inventory_receive_log
  ON thread_inventory(receive_log_id) WHERE receive_log_id IS NOT NULL;

ALTER TABLE delivery_receive_logs
  ADD COLUMN IF NOT EXISTS reverted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reverted_by VARCHAR(100),
  ADD COLUMN IF NOT EXISTS revert_reason TEXT;

-- Backfill chỉ gắn khi chắc chắn: delivery có đúng một lần nhập, khớp cả màu, và số cuộn
-- ứng viên bằng đúng số đã nhập của lần đó. Không khớp thì để NULL — UI sẽ khóa nút hoàn tác
-- thay vì đoán sai. Một delivery lấy màu từ thread_color nên hai màu của cùng loại chỉ trong
-- một tuần là hai delivery riêng, phải tách bằng color_id chứ không gộp theo thread_type.
DO $backfill$
DECLARE
  v_updated INTEGER;
BEGIN
  WITH single_log AS (
    SELECT l.id AS log_id, l.warehouse_id, l.quantity,
           d.week_id, d.thread_type_id,
           (SELECT c.id FROM colors c WHERE c.name = d.thread_color LIMIT 1) AS color_id
    FROM delivery_receive_logs l
    JOIN thread_order_deliveries d ON d.id = l.delivery_id
    WHERE (SELECT COUNT(*) FROM delivery_receive_logs x WHERE x.delivery_id = l.delivery_id) = 1
  ),
  candidates AS (
    SELECT s.log_id, s.quantity, ti.id AS cone_pk
    FROM single_log s
    JOIN thread_inventory ti
      ON ti.receive_log_id IS NULL
     AND ti.lot_number = 'WO-' || s.week_id
     AND ti.thread_type_id = s.thread_type_id
     AND ti.warehouse_id = s.warehouse_id
     AND ti.reserved_week_id = s.week_id
     AND ((s.color_id IS NULL AND ti.color_id IS NULL) OR ti.color_id = s.color_id)
  ),
  exact_match AS (
    SELECT log_id FROM candidates GROUP BY log_id, quantity HAVING COUNT(*) = quantity
  )
  UPDATE thread_inventory ti
  SET receive_log_id = c.log_id
  FROM candidates c
  WHERE ti.id = c.cone_pk
    AND c.log_id IN (SELECT log_id FROM exact_match);

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RAISE NOTICE 'Backfill receive_log_id: % cuộn', v_updated;
END
$backfill$;

CREATE OR REPLACE FUNCTION public.fn_receive_delivery(
  p_delivery_id INTEGER,
  p_received_qty INTEGER,
  p_warehouse_id INTEGER,
  p_received_by VARCHAR,
  p_expiry_date DATE DEFAULT NULL,
  p_idempotency_key VARCHAR DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_delivery RECORD;
  v_week_id INTEGER;
  v_thread_type_id INTEGER;
  v_color_id INTEGER;
  v_density NUMERIC;
  v_meters_per_cone NUMERIC;
  v_cone_id VARCHAR;
  v_cones_created INTEGER := 0;
  v_needed_cones INTEGER;
  v_already_reserved INTEGER;
  v_thread_color_name TEXT;
  v_receive_log_id INTEGER;
  i INTEGER;
BEGIN
  SELECT tod.*, tow.id AS week_id
  INTO v_delivery
  FROM thread_order_deliveries tod
  JOIN thread_order_weeks tow ON tod.week_id = tow.id
  WHERE tod.id = p_delivery_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Khong tim thay don giao hang voi id %', p_delivery_id;
  END IF;

  v_week_id := v_delivery.week_id;
  v_thread_type_id := v_delivery.thread_type_id;

  IF p_idempotency_key IS NOT NULL AND EXISTS (
    SELECT 1 FROM delivery_receive_logs WHERE idempotency_key = p_idempotency_key
  ) THEN
    RETURN json_build_object(
      'success', true,
      'duplicate', true,
      'cones_created', 0,
      'cones_reserved', 0,
      'remaining_shortage', 0,
      'lot_number', 'WO-' || v_week_id,
      'auto_return', '{"settled":0,"returned_cones":0,"details":[]}'::JSON
    );
  END IF;

  SELECT density_grams_per_meter, meters_per_cone, color_id
  INTO v_density, v_meters_per_cone, v_color_id
  FROM thread_types
  WHERE id = v_thread_type_id;

  IF v_color_id IS NULL THEN
    v_thread_color_name := v_delivery.thread_color;

    IF v_thread_color_name IS NULL OR LENGTH(v_thread_color_name) = 0 THEN
      SELECT elem->>'thread_color'
      INTO v_thread_color_name
      FROM thread_order_results tor,
           jsonb_array_elements(tor.summary_data) elem
      WHERE tor.week_id = v_week_id
        AND (elem->>'thread_type_id')::int = v_thread_type_id
        AND LENGTH(elem->>'thread_color') > 0
      LIMIT 1;
    END IF;

    IF v_thread_color_name IS NOT NULL THEN
      SELECT id INTO v_color_id
      FROM colors
      WHERE name = v_thread_color_name
      LIMIT 1;
    END IF;
  END IF;

  SELECT COALESCE(SUM(p.needed_cones), 0) INTO v_needed_cones
  FROM fn_parse_calculation_cones(v_week_id, v_thread_type_id) p
  WHERE (v_color_id IS NULL AND p.color_id IS NULL)
     OR (v_color_id IS NOT NULL AND p.color_id = v_color_id);

  IF v_needed_cones IS NULL THEN v_needed_cones := 0; END IF;

  v_needed_cones := GREATEST(COALESCE(v_delivery.quantity_cones, 0), v_needed_cones);

  SELECT COUNT(*) INTO v_already_reserved
  FROM thread_inventory
  WHERE reserved_week_id = v_week_id
    AND thread_type_id = v_thread_type_id
    AND status = 'RESERVED_FOR_ORDER'
    AND (
      (v_color_id IS NULL AND color_id IS NULL)
      OR (v_color_id IS NOT NULL AND color_id = v_color_id)
    );

  INSERT INTO delivery_receive_logs (delivery_id, quantity, warehouse_id, received_by, idempotency_key)
  VALUES (p_delivery_id, p_received_qty, p_warehouse_id, p_received_by, p_idempotency_key)
  RETURNING id INTO v_receive_log_id;

  FOR i IN 1..p_received_qty LOOP
    v_cone_id := 'WO-' || v_week_id || '-' || v_thread_type_id || '-' ||
                 TO_CHAR(NOW(), 'YYYYMMDD') || '-' ||
                 LPAD((nextval('thread_inventory_id_seq'))::TEXT, 6, '0');

    INSERT INTO thread_inventory (
      cone_id, thread_type_id, warehouse_id,
      quantity_cones, quantity_meters,
      status, reserved_week_id, received_date, expiry_date, lot_number,
      color_id, receive_log_id
    ) VALUES (
      v_cone_id, v_thread_type_id, p_warehouse_id,
      1, COALESCE(v_meters_per_cone, 5000),
      'RESERVED_FOR_ORDER'::cone_status, v_week_id,
      CURRENT_DATE, p_expiry_date, 'WO-' || v_week_id,
      v_color_id, v_receive_log_id
    );

    v_cones_created := v_cones_created + 1;
  END LOOP;

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
    'cones_reserved', v_cones_created,
    'remaining_shortage', GREATEST(0, v_needed_cones - v_already_reserved - v_cones_created),
    'lot_number', 'WO-' || v_week_id,
    'color_id', v_color_id,
    'receive_log_id', v_receive_log_id,
    'auto_return', '{"settled":0,"returned_cones":0,"details":[]}'::JSON
  );
END;
$function$;

COMMENT ON FUNCTION fn_receive_delivery(INTEGER, INTEGER, INTEGER, VARCHAR, DATE, VARCHAR)
  IS 'Atomic receive delivery: idempotency key, reserve ALL received cones for the delivery week, tag each cone with receive_log_id';

CREATE OR REPLACE FUNCTION public.fn_write_off_week_cones(
  p_week_id INTEGER,
  p_thread_type_id INTEGER,
  p_color_id INTEGER,
  p_quantity INTEGER,
  p_receive_log_id INTEGER,
  p_reason TEXT,
  p_performed_by VARCHAR
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_eligible INTEGER;
  v_locked INTEGER;
  v_cone RECORD;
  v_written_off INTEGER := 0;
  v_cone_ids INTEGER[] := ARRAY[]::INTEGER[];
  v_reference_type VARCHAR;
  v_reference_id VARCHAR;
BEGIN
  IF p_quantity IS NULL OR p_quantity < 1 THEN
    RAISE EXCEPTION 'Số cuộn cần loại bỏ phải lớn hơn 0';
  END IF;

  v_reference_type := CASE WHEN p_receive_log_id IS NULL THEN 'WEEK_STOCK_ADJUST' ELSE 'RECEIVE_REVERT' END;
  v_reference_id := COALESCE(p_receive_log_id::VARCHAR, p_week_id::VARCHAR);

  SELECT COUNT(*) INTO v_eligible
  FROM thread_inventory
  WHERE reserved_week_id = p_week_id
    AND (p_thread_type_id IS NULL OR thread_type_id = p_thread_type_id)
    AND (
      p_receive_log_id IS NOT NULL
      OR (p_color_id IS NULL AND color_id IS NULL)
      OR (p_color_id IS NOT NULL AND color_id = p_color_id)
    )
    AND (p_receive_log_id IS NULL OR receive_log_id = p_receive_log_id)
    AND status IN ('RESERVED_FOR_ORDER', 'AVAILABLE', 'RECEIVED', 'INSPECTED');

  SELECT COUNT(*) INTO v_locked
  FROM thread_inventory
  WHERE reserved_week_id = p_week_id
    AND (p_thread_type_id IS NULL OR thread_type_id = p_thread_type_id)
    AND (
      p_receive_log_id IS NOT NULL
      OR (p_color_id IS NULL AND color_id IS NULL)
      OR (p_color_id IS NOT NULL AND color_id = p_color_id)
    )
    AND (p_receive_log_id IS NULL OR receive_log_id = p_receive_log_id)
    AND status NOT IN ('RESERVED_FOR_ORDER', 'AVAILABLE', 'RECEIVED', 'INSPECTED');

  IF v_eligible < p_quantity THEN
    RAISE EXCEPTION 'Không đủ cuộn còn nguyên để loại bỏ. Cần % cuộn, chỉ còn % cuộn chưa sử dụng (% cuộn đã xuất, đã chuyển đi hoặc đã loại bỏ)',
      p_quantity, v_eligible, v_locked;
  END IF;

  FOR v_cone IN
    SELECT id, quantity_meters, status
    FROM thread_inventory
    WHERE reserved_week_id = p_week_id
      AND (p_thread_type_id IS NULL OR thread_type_id = p_thread_type_id)
      AND (
        p_receive_log_id IS NOT NULL
        OR (p_color_id IS NULL AND color_id IS NULL)
        OR (p_color_id IS NOT NULL AND color_id = p_color_id)
      )
      AND (p_receive_log_id IS NULL OR receive_log_id = p_receive_log_id)
      AND status IN ('RESERVED_FOR_ORDER', 'AVAILABLE', 'RECEIVED', 'INSPECTED')
    ORDER BY received_date DESC, id DESC
    FOR UPDATE
    LIMIT p_quantity
  LOOP
    UPDATE thread_inventory
    SET status = 'WRITTEN_OFF'::cone_status,
        updated_at = NOW()
    WHERE id = v_cone.id;

    INSERT INTO thread_movements (
      cone_id, movement_type, quantity_meters,
      from_status, to_status,
      reference_type, reference_id,
      performed_by, notes
    ) VALUES (
      v_cone.id, 'WRITE_OFF'::movement_type,
      -GREATEST(COALESCE(v_cone.quantity_meters, 0), 0.0001),
      v_cone.status, 'WRITTEN_OFF'::cone_status,
      v_reference_type, v_reference_id,
      p_performed_by, p_reason
    );

    v_cone_ids := array_append(v_cone_ids, v_cone.id);
    v_written_off := v_written_off + 1;
  END LOOP;

  RETURN json_build_object(
    'success', true,
    'written_off', v_written_off,
    'cone_ids', v_cone_ids
  );
END;
$function$;

COMMENT ON FUNCTION fn_write_off_week_cones(INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, TEXT, VARCHAR)
  IS 'Ghi giảm tồn kho của tuần: cuộn chưa sử dụng → WRITTEN_OFF + thread_movements. Không đủ cuộn còn nguyên thì báo lỗi, không loại bỏ một phần';

CREATE OR REPLACE FUNCTION public.fn_revert_delivery_receive(
  p_log_id INTEGER,
  p_performed_by VARCHAR,
  p_reason TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_log RECORD;
  v_delivery RECORD;
  v_tagged INTEGER;
  v_write_off JSON;
BEGIN
  SELECT * INTO v_log
  FROM delivery_receive_logs
  WHERE id = p_log_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy lần nhập kho với id %', p_log_id;
  END IF;

  IF v_log.reverted_at IS NOT NULL THEN
    RAISE EXCEPTION 'Lần nhập kho này đã được hoàn tác trước đó';
  END IF;

  SELECT * INTO v_delivery
  FROM thread_order_deliveries
  WHERE id = v_log.delivery_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy dòng giao hàng của lần nhập này';
  END IF;

  SELECT COUNT(*) INTO v_tagged
  FROM thread_inventory
  WHERE receive_log_id = p_log_id;

  IF v_tagged <> v_log.quantity THEN
    RAISE EXCEPTION 'Số cuộn gắn với lần nhập này (%) không khớp số đã nhập (%). Không hoàn tác tự động được, dùng chức năng điều chỉnh tồn kho của tuần',
      v_tagged, v_log.quantity;
  END IF;

  v_write_off := fn_write_off_week_cones(
    v_delivery.week_id,
    v_delivery.thread_type_id,
    NULL,
    v_log.quantity,
    p_log_id,
    COALESCE(p_reason, 'Hoàn tác lần nhập kho'),
    p_performed_by
  );

  UPDATE thread_order_deliveries
  SET received_quantity = GREATEST(0, received_quantity - v_log.quantity),
      inventory_status = CASE
        WHEN GREATEST(0, received_quantity - v_log.quantity) >= quantity_cones THEN 'RECEIVED'::inventory_receipt_status
        WHEN GREATEST(0, received_quantity - v_log.quantity) > 0 THEN 'PARTIAL'::inventory_receipt_status
        ELSE 'PENDING'::inventory_receipt_status
      END,
      updated_at = NOW()
  WHERE id = v_log.delivery_id;

  UPDATE delivery_receive_logs
  SET reverted_at = NOW(),
      reverted_by = p_performed_by,
      revert_reason = p_reason
  WHERE id = p_log_id;

  RETURN json_build_object(
    'success', true,
    'week_id', v_delivery.week_id,
    'delivery_id', v_log.delivery_id,
    'reverted_quantity', v_log.quantity,
    'written_off', (v_write_off->>'written_off')::INTEGER
  );
END;
$function$;

COMMENT ON FUNCTION fn_revert_delivery_receive(INTEGER, VARCHAR, TEXT)
  IS 'Hoàn tác nguyên một lần nhập kho: ghi giảm đúng các cuộn của lần nhập, trừ received_quantity, đánh dấu log đã hoàn tác';

NOTIFY pgrst, 'reload schema';

COMMIT;
