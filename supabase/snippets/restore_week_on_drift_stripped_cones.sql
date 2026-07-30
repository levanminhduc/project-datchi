-- Hoàn nguyên tuần cho các cuộn bị TƯỚC reserve không đúng nghiệp vụ.
--
-- Phạm vi: CHỈ cuộn đã từng có reserved_week_id rồi bị gỡ mà không có hành động
-- nghiệp vụ nào (không xuất, không trả kho, không hoàn tất tuần, không hủy tuần).
-- KHÔNG bao gồm cuộn chưa từng được gán tuần (nhóm bị cap shortage lúc tạo) và
-- KHÔNG bao gồm cuộn lẻ từ trả kho — hai nhóm đó đúng nghiệp vụ, để nguyên.
--
-- Hai lô mục tiêu, nhận dạng bằng dấu vân tay updated_at chính xác tới micro giây:
--   1) 2026-07-11 09:15:13.663197+07 — 602 cuộn, tuần 80, thread_type 18, màu C9700,
--      kho 4 (Xưởng Trước). Nguyên nhân: khối drift-heal trong fn_receive_delivery
--      chạy khi nhận thêm 183 cuộn (delivery_receive_logs id 826).
--      Tuần 80 cần 3.146, đang giữ 2.031 → còn thiếu 1.115, nên hoàn nguyên 602 không vượt nhu cầu.
--   2) 2026-07-20 14:10:13.728056+07 — 14 cuộn, tuần 14, thread_type 76, màu 117,
--      kho 3 (Dệt Kim). Nguyên nhân CHƯA xác định: không trùng receive log nào,
--      không có thread_movements. Tuần 14 cần đúng 14 cuộn và đang giữ 0 → hoàn nguyên
--      đưa về khớp chính xác nhu cầu.
--
-- CHẠY SAU migration 20260730090000 (bỏ khối drift-heal). Nếu chạy trước, lần nhận
-- hàng kế tiếp cho cùng tuần/loại/màu sẽ tước lại đúng những cuộn này.
--
-- Chỉ UPDATE và INSERT, không DELETE. Có assertion số lượng: lệch là RAISE, transaction
-- tự rollback, không bao giờ apply nửa vời.
-- Dry-run: đổi COMMIT cuối file thành ROLLBACK.

BEGIN;

CREATE TEMP TABLE tmp_drift_stripped ON COMMIT DROP AS
SELECT ti.id,
       ti.quantity_meters,
       substring(ti.lot_number FROM 'WO-([0-9]+)')::int AS week_id
FROM thread_inventory ti
WHERE ti.lot_number ~ '^WO-[0-9]+$'
  AND ti.status = 'AVAILABLE'
  AND ti.reserved_week_id IS NULL
  AND NOT ti.is_partial
  AND ti.updated_at IN (
    '2026-07-11 09:15:13.663197+07'::timestamptz,
    '2026-07-20 14:10:13.728056+07'::timestamptz
  );

DO $$
DECLARE
  v_total INTEGER;
  v_w80 INTEGER;
  v_w14 INTEGER;
BEGIN
  SELECT count(*), count(*) FILTER (WHERE week_id = 80), count(*) FILTER (WHERE week_id = 14)
  INTO v_total, v_w80, v_w14
  FROM tmp_drift_stripped;

  IF v_total <> 616 OR v_w80 <> 602 OR v_w14 <> 14 THEN
    RAISE EXCEPTION 'So luong khong khop mong doi: tong=% (can 616), tuan80=% (can 602), tuan14=% (can 14). Dung lai de kiem tra.',
      v_total, v_w80, v_w14;
  END IF;

  RAISE NOTICE 'Xac nhan pham vi: % cuon (tuan 80: %, tuan 14: %)', v_total, v_w80, v_w14;
END $$;

UPDATE thread_inventory ti
SET status = 'RESERVED_FOR_ORDER'::cone_status,
    reserved_week_id = t.week_id,
    updated_at = NOW()
FROM tmp_drift_stripped t
WHERE ti.id = t.id;

INSERT INTO thread_movements (
  cone_id, movement_type, quantity_meters, from_status, to_status,
  reference_type, reference_id, performed_by, notes
)
SELECT t.id, 'ADJUSTMENT'::movement_type, t.quantity_meters,
       'AVAILABLE', 'RESERVED_FOR_ORDER',
       'WEEK', t.week_id::TEXT, 'SYSTEM-FIX-DRIFT',
       'Hoan nguyen tuan #' || t.week_id || ' cho cuon bi drift-heal tuoc reserve khong dung nghiep vu'
FROM tmp_drift_stripped t;

SELECT reserved_week_id AS tuan, thread_type_id AS loai, warehouse_id AS kho,
       status, count(*) AS cuon
FROM thread_inventory
WHERE id IN (SELECT id FROM tmp_drift_stripped)
GROUP BY 1, 2, 3, 4
ORDER BY 5 DESC;

SELECT count(*) AS con_lai_bi_tuoc_chua_xu_ly
FROM thread_inventory
WHERE lot_number ~ '^WO-[0-9]+$'
  AND status = 'AVAILABLE'
  AND reserved_week_id IS NULL
  AND NOT is_partial
  AND updated_at <> created_at;

COMMIT;
