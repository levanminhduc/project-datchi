-- Bỏ khối "self-heal warehouse drift" khỏi fn_receive_delivery.
--
-- Lý do:
--   Khối này ra đời ở 20260430140000 để dọn một lần dữ liệu lịch sử: các tuần confirm
--   trước commit 4ce9c03 có cone reserved ở kho ngoài selection, vì fn_reserve_for_week
--   hồi đó chưa đọc thread_order_week_warehouses. Tác giả ghi giả định "idempotent:
--   lần nhập kho thứ 2 không còn cone lạc để unreserve".
--
--   Giả định đó sai: fn_transfer_reserved_cones chỉ đổi warehouse_id và không đăng ký
--   kho đích vào thread_order_week_warehouses, nên mỗi lần chuyển cuộn sang kho sản xuất
--   là sinh drift mới. Một đoạn dọn dữ liệu một lần đã thành mìn thường trú trong đường
--   nhận hàng: ngày 2026-07-11 nó tước reserve của 602 cuộn tuần 80 đang ở Kho Xưởng Trước,
--   không ghi thread_movements nên mất sạch dấu vết.
--
-- An toàn:
--   Từ bản 20260707090000 (reserve-all), v_needed_cones và v_already_reserved chỉ nuôi
--   field báo cáo remaining_shortage; vòng lặp tạo cuộn không tham chiếu chúng. Bỏ khối
--   này không đổi số cuộn được reserve. v_warehouse_ids chỉ còn khối này dùng nên bỏ luôn,
--   kèm field unreserved_drift trong JSON trả về (từ nay luôn bằng 0).

BEGIN;

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

  FOR i IN 1..p_received_qty LOOP
    v_cone_id := 'WO-' || v_week_id || '-' || v_thread_type_id || '-' ||
                 TO_CHAR(NOW(), 'YYYYMMDD') || '-' ||
                 LPAD((nextval('thread_inventory_id_seq'))::TEXT, 6, '0');

    INSERT INTO thread_inventory (
      cone_id, thread_type_id, warehouse_id,
      quantity_cones, quantity_meters,
      status, reserved_week_id, received_date, expiry_date, lot_number,
      color_id
    ) VALUES (
      v_cone_id, v_thread_type_id, p_warehouse_id,
      1, COALESCE(v_meters_per_cone, 5000),
      'RESERVED_FOR_ORDER'::cone_status, v_week_id,
      CURRENT_DATE, p_expiry_date, 'WO-' || v_week_id,
      v_color_id
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

  INSERT INTO delivery_receive_logs (delivery_id, quantity, warehouse_id, received_by, idempotency_key)
  VALUES (p_delivery_id, p_received_qty, p_warehouse_id, p_received_by, p_idempotency_key);

  RETURN json_build_object(
    'success', true,
    'cones_created', v_cones_created,
    'cones_reserved', v_cones_created,
    'remaining_shortage', GREATEST(0, v_needed_cones - v_already_reserved - v_cones_created),
    'lot_number', 'WO-' || v_week_id,
    'color_id', v_color_id,
    'auto_return', '{"settled":0,"returned_cones":0,"details":[]}'::JSON
  );
END;
$function$;

COMMENT ON FUNCTION fn_receive_delivery(INTEGER, INTEGER, INTEGER, VARCHAR, DATE, VARCHAR)
  IS 'Atomic receive delivery: idempotency key, reserve ALL received cones for the delivery week (including surplus), no auto-return, no warehouse drift self-heal';

NOTIFY pgrst, 'reload schema';

COMMIT;
