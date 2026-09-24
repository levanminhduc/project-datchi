-- Nhả các cuộn bị giữ nhầm màu do định mức trống màu chỉ (thread_color_id NULL).
--
-- Nguyên nhân: fn_reserve_for_week bản cũ coi màu NULL là "màu nào cũng được", nên khi xác nhận
-- tuần (hoặc gỡ PO) các dòng định mức trống màu đã giữ cuộn lẻ/cũ nhất của bất kỳ màu nào.
-- Đã chặn bằng migration 20260924100000_skip_null_color_reserve_for_week.sql.
--
-- CHẠY SAU migration 20260529090000, 20260924090000, 20260924100000. Nếu chạy trước, lần gỡ PO
-- kế tiếp sẽ giữ nhầm lại.
--
-- Phạm vi: cuộn đang RESERVED_FOR_ORDER cho tuần CONFIRMED, thuộc loại chỉ có dòng màu NULL
-- trong fn_parse_calculation_cones, màu không có trong bảng tổng hợp và không có đợt giao của tuần,
-- lần gán tuần gần nhất đi từ AVAILABLE (tồn chung), và không phải lô nhập cho chính tuần (WO-<tuần>).
--
-- Chỉ UPDATE và INSERT thread_movements, không DELETE.
-- Dry-run: đổi COMMIT cuối file thành ROLLBACK.

BEGIN;

CREATE TEMP TABLE tmp_null_color_cones ON COMMIT DROP AS
WITH null_rows AS (
  SELECT w.id AS week_id, p.thread_type_id
  FROM thread_order_weeks w
  CROSS JOIN LATERAL fn_parse_calculation_cones(w.id) p
  WHERE w.status = 'CONFIRMED' AND p.color_id IS NULL
)
SELECT i.id, n.week_id, i.thread_type_id, c.name AS color, i.quantity_meters
FROM null_rows n
JOIN thread_inventory i
  ON i.reserved_week_id = n.week_id
 AND i.thread_type_id = n.thread_type_id
 AND i.status = 'RESERVED_FOR_ORDER'
JOIN colors c ON c.id = i.color_id
JOIN LATERAL (
  SELECT a.action, a.old_values
  FROM thread_audit_log a
  WHERE a.table_name = 'thread_inventory'
    AND a.record_id = i.id
    AND a.new_values->>'reserved_week_id' = n.week_id::text
    AND a.old_values->>'reserved_week_id' IS DISTINCT FROM n.week_id::text
  ORDER BY a.created_at DESC
  LIMIT 1
) ev ON ev.action = 'UPDATE' AND ev.old_values->>'status' = 'AVAILABLE'
WHERE i.lot_number IS DISTINCT FROM 'WO-' || n.week_id
  AND NOT EXISTS (
    SELECT 1
    FROM thread_order_results r, jsonb_array_elements(r.summary_data) e
    WHERE r.week_id = n.week_id
      AND (e->>'thread_type_id')::int = i.thread_type_id
      AND e->>'thread_color' = c.name
  )
  AND NOT EXISTS (
    SELECT 1
    FROM thread_order_deliveries d
    WHERE d.week_id = n.week_id
      AND d.thread_type_id = i.thread_type_id
      AND d.thread_color = c.name
  );

SELECT week_id, thread_type_id, string_agg(DISTINCT color, ',') AS colors, count(*) AS cones
FROM tmp_null_color_cones
GROUP BY week_id, thread_type_id
ORDER BY week_id, thread_type_id;

UPDATE thread_inventory ti
SET status = 'AVAILABLE',
    reserved_week_id = NULL,
    updated_at = NOW()
FROM tmp_null_color_cones t
WHERE ti.id = t.id
  AND ti.status = 'RESERVED_FOR_ORDER'
  AND ti.reserved_week_id = t.week_id;

INSERT INTO thread_movements (
  cone_id, movement_type, quantity_meters, from_status, to_status,
  reference_type, reference_id, performed_by, notes
)
SELECT t.id, 'ADJUSTMENT', fn_nonzero_meters(t.quantity_meters),
       'RESERVED_FOR_ORDER', 'AVAILABLE',
       'WEEK', t.week_id::text, 'system',
       'Nhả cuộn giữ nhầm màu ' || t.color || ' do định mức tuần trống màu chỉ'
FROM tmp_null_color_cones t;

DO $$
DECLARE
  v_total INTEGER;
  v_left INTEGER;
BEGIN
  SELECT count(*) INTO v_total FROM tmp_null_color_cones;
  SELECT count(*) INTO v_left
  FROM thread_inventory ti
  JOIN tmp_null_color_cones t ON t.id = ti.id
  WHERE ti.status <> 'AVAILABLE' OR ti.reserved_week_id IS NOT NULL;

  IF v_left <> 0 THEN
    RAISE EXCEPTION 'Con % cuon chua nha duoc tren tong %. Dung lai de kiem tra.', v_left, v_total;
  END IF;

  RAISE NOTICE 'Da nha % cuon giu nham mau', v_total;
END $$;

COMMIT;
