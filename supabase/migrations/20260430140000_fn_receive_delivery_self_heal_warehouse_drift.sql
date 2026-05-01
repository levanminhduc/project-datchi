-- Self-heal warehouse drift in fn_receive_delivery.
--
-- Background:
--   Trước commit 4ce9c03, fn_reserve_for_week không đọc thread_order_week_warehouses
--   nên các tuần đặt hàng confirm trước fix có cone reserved ở các kho ngoài selection.
--   Khi nhập kho, fn_receive_delivery cũ tính v_already_reserved trên TẤT CẢ kho
--   → shortage thấp hơn thực tế ở kho user chọn → cone mới tạo ra ít RESERVED hơn cần.
--
-- Fix:
--   1. Đọc warehouse_ids của week từ thread_order_week_warehouses.
--   2. Nếu week có warehouse selection: unreserve cone reserved ở kho ngoài selection
--      (chỉ cho cùng thread_type + color của delivery đang nhập, và chỉ cone full
--      quantity_meters >= meters_per_cone để tránh động cone đã xài dở).
--   3. Tính lại v_already_reserved chỉ trong các kho đã chọn.
--
-- An toàn:
--   - Idempotent: lần nhập kho thứ 2 không còn cone lạc để unreserve.
--   - Tuần không có warehouse selection (NULL) → giữ behavior cũ.
--   - Cone partial không bị động.

BEGIN;

CREATE OR REPLACE FUNCTION public.fn_receive_delivery(
  p_delivery_id INTEGER,
  p_received_qty INTEGER,
  p_warehouse_id INTEGER,
  p_received_by VARCHAR,
  p_expiry_date DATE DEFAULT NULL
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
  v_cone_db_id INTEGER;
  v_cones_created INTEGER := 0;
  v_cones_reserved INTEGER := 0;
  v_needed_cones INTEGER;
  v_already_reserved INTEGER;
  v_current_shortage INTEGER;
  v_available_cone_ids INTEGER[] := '{}';
  v_auto_return JSON;
  v_thread_color_name TEXT;
  v_warehouse_ids INTEGER[];
  v_unreserved_drift INTEGER := 0;
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

  SELECT ARRAY_AGG(warehouse_id ORDER BY warehouse_id)
  INTO v_warehouse_ids
  FROM thread_order_week_warehouses
  WHERE week_id = v_week_id;

  IF v_warehouse_ids IS NOT NULL THEN
    UPDATE thread_inventory
    SET reserved_week_id = NULL,
        status = 'AVAILABLE'::cone_status,
        updated_at = NOW()
    WHERE reserved_week_id = v_week_id
      AND thread_type_id = v_thread_type_id
      AND status = 'RESERVED_FOR_ORDER'
      AND (
        (v_color_id IS NULL AND color_id IS NULL)
        OR (v_color_id IS NOT NULL AND color_id = v_color_id)
      )
      AND warehouse_id <> ALL(v_warehouse_ids)
      AND quantity_meters >= COALESCE(v_meters_per_cone, 5000);

    GET DIAGNOSTICS v_unreserved_drift = ROW_COUNT;
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
    )
    AND (v_warehouse_ids IS NULL OR warehouse_id = ANY(v_warehouse_ids));

  v_current_shortage := GREATEST(0, v_needed_cones - v_already_reserved);

  FOR i IN 1..p_received_qty LOOP
    v_cone_id := 'WO-' || v_week_id || '-' || v_thread_type_id || '-' ||
                 TO_CHAR(NOW(), 'YYYYMMDD') || '-' ||
                 LPAD((nextval('thread_inventory_id_seq'))::TEXT, 6, '0');

    INSERT INTO thread_inventory (
      cone_id, thread_type_id, warehouse_id,
      quantity_cones, quantity_meters,
      status, received_date, expiry_date, lot_number,
      color_id
    ) VALUES (
      v_cone_id, v_thread_type_id, p_warehouse_id,
      1, COALESCE(v_meters_per_cone, 5000),
      CASE WHEN v_cones_created < v_current_shortage THEN 'RESERVED_FOR_ORDER'::cone_status ELSE 'AVAILABLE'::cone_status END,
      CURRENT_DATE, p_expiry_date, 'WO-' || v_week_id,
      v_color_id
    ) RETURNING id INTO v_cone_db_id;

    IF v_cones_created < v_current_shortage THEN
      UPDATE thread_inventory
      SET reserved_week_id = v_week_id
      WHERE id = v_cone_db_id;
      v_cones_reserved := v_cones_reserved + 1;
    ELSE
      v_available_cone_ids := array_append(v_available_cone_ids, v_cone_db_id);
    END IF;

    v_cones_created := v_cones_created + 1;
  END LOOP;

  v_auto_return := '{"settled":0,"returned_cones":0,"details":[]}'::JSON;
  IF array_length(v_available_cone_ids, 1) > 0 THEN
    v_auto_return := fn_auto_return_loans(v_week_id, v_thread_type_id, v_available_cone_ids);
  END IF;

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

  INSERT INTO delivery_receive_logs (delivery_id, quantity, warehouse_id, received_by)
  VALUES (p_delivery_id, p_received_qty, p_warehouse_id, p_received_by);

  RETURN json_build_object(
    'success', true,
    'cones_created', v_cones_created,
    'cones_reserved', v_cones_reserved,
    'remaining_shortage', GREATEST(0, v_current_shortage - v_cones_reserved),
    'lot_number', 'WO-' || v_week_id,
    'color_id', v_color_id,
    'auto_return', v_auto_return,
    'unreserved_drift', v_unreserved_drift
  );
END;
$function$;

COMMENT ON FUNCTION fn_receive_delivery(INTEGER, INTEGER, INTEGER, VARCHAR, DATE)
  IS 'Atomic receive delivery: self-heal warehouse drift, per-color shortage, auto-reserve, receive log, optional auto-return';

NOTIFY pgrst, 'reload schema';

COMMIT;
