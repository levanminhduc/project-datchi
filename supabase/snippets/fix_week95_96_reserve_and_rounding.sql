-- Tuần 95 (TSA265054-5N): giữ thêm từ tồn cho 5 màu Coats Astra Tex 27 (thread_type 3) còn thiếu
-- vì fn_reserve_for_week bản cũ đếm cuộn lẻ như cuộn nguyên. Chỉ giữ phần còn thiếu theo số quy đổi.
-- Tuần 96 (W21-24): cập nhật total_cones 5 dòng lấy từ tồn theo công thức làm tròn theo mã hàng + màu hàng
-- (bảng tổng hợp lưu 27/07, trước commit 8e2c1e2). Các dòng này sl_can_dat = 0, không ảnh hưởng đặt NCC.
--
-- CHẠY SAU migration 20260529090000 (fn_reserve_for_week nhận NUMERIC).
-- Chỉ UPDATE, không DELETE. Dry-run: đổi COMMIT cuối file thành ROLLBACK.

BEGIN;

WITH need(color_id, from_stock) AS (
  VALUES (811, 6), (639, 6), (995, 6), (279, 2), (727, 4)
),
held AS (
  SELECT n.color_id, n.from_stock,
         COALESCE(SUM(CASE WHEN i.is_partial THEN 0.3 ELSE 1 END), 0) AS held
  FROM need n
  LEFT JOIN thread_inventory i
    ON i.reserved_week_id = 95
   AND i.thread_type_id = 3
   AND i.color_id = n.color_id
   AND i.status = 'RESERVED_FOR_ORDER'
  GROUP BY n.color_id, n.from_stock
)
SELECT c.name, h.held, h.from_stock - h.held AS missing,
       fn_reserve_for_week(95, 3, h.from_stock - h.held, h.color_id)
FROM held h
JOIN colors c ON c.id = h.color_id
WHERE h.from_stock - h.held > 0;

WITH fix AS (
  SELECT k.tt_id, k.cname, n.needed
  FROM (VALUES (15, 'C9700'), (17, 'C2479'), (13, 'C9700'), (17, 'C5393'), (17, 'C8604')) k(tt_id, cname)
  CROSS JOIN LATERAL (
    SELECT p.needed_cones AS needed
    FROM fn_parse_calculation_cones(96, k.tt_id) p
    JOIN colors c ON c.id = p.color_id
    WHERE c.name = k.cname
  ) n
)
UPDATE thread_order_results r
SET summary_data = (
      SELECT jsonb_agg(
               CASE WHEN f.needed IS NOT NULL THEN jsonb_set(e, '{total_cones}', to_jsonb(f.needed)) ELSE e END
               ORDER BY ord)
      FROM jsonb_array_elements(r.summary_data) WITH ORDINALITY AS a(e, ord)
      LEFT JOIN fix f ON f.tt_id = (e->>'thread_type_id')::int AND f.cname = e->>'thread_color'
    ),
    updated_at = NOW()
WHERE r.week_id = 96;

SELECT e->>'thread_type_id', e->>'thread_color', e->>'total_cones'
FROM thread_order_results r, jsonb_array_elements(r.summary_data) e
WHERE r.week_id = 96
  AND (e->>'thread_type_id', e->>'thread_color') IN (('15','C9700'), ('17','C2479'), ('13','C9700'), ('17','C5393'), ('17','C8604'));

COMMIT;
