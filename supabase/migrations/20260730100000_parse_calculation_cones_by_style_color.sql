-- Nhu cầu cuộn: làm tròn lên tại cấp (mã hàng + màu hàng + loại chỉ + màu chỉ) rồi mới cộng.
--
-- Lý do:
--   Kho xuất theo PO — mã hàng — màu hàng (thread_issue_lines không có cột công đoạn), và phần
--   thừa của cuộn cuối khi trả về kho thành hàng tự do dùng cho mọi tuần chứ không quay lại phục
--   vụ mã kế tiếp của chính tuần đó. Vì vậy mỗi tổ hợp mã + màu phải đủ cuộn nguyên.
--
--   Bản cũ CEIL từng dòng công đoạn rồi SUM: nhiều công đoạn của cùng một mã + màu cùng dùng một
--   loại chỉ bị làm tròn nhiều lần, thổi phồng nhu cầu. Tuần 80 thừa 14 cuộn so với lượng thực xuất.
--   Bảng tổng hợp phía frontend thì ngược lại — gộp hết mét rồi làm tròn một lần, hụt 75 cuộn.
--   Cả hai đều lệch so với cấp độ xuất kho; nay thống nhất về cấp (mã hàng + màu hàng).
--
-- Kiểm chứng trên tuần 80: loại chỉ 18 màu 1101 từ 3.146 về 3.143, tổng tuần từ 8.811 về 8.797.
--
-- Đi kèm sửa frontend cùng đợt: useWeeklyOrderCalculation.ts (bảng tổng hợp, nguồn của đơn đặt
-- hàng) và ResultsDetailView.vue (bảng chi tiết). Ba nơi phải cùng một công thức.

BEGIN;

CREATE OR REPLACE FUNCTION public.fn_parse_calculation_cones(
  p_week_id integer,
  p_thread_type_id integer DEFAULT NULL::integer
)
RETURNS TABLE(thread_type_id integer, color_id integer, needed_cones integer)
LANGUAGE plpgsql
STABLE
AS $function$
BEGIN
  RETURN QUERY
  WITH parsed AS (
    SELECT
      (style_result.value->>'style_id')::INTEGER AS style_id,
      COALESCE((cb.value->>'color_id')::INTEGER, -1) AS style_color_id,
      COALESCE(
        (cb.value->>'thread_type_id')::INTEGER,
        (calc.value->>'spec_id')::INTEGER
      ) AS tt_id,
      CASE
        WHEN cb.value IS NOT NULL THEN cb.value->>'thread_color'
        ELSE calc.value->>'thread_color'
      END AS thread_color_name,
      CASE
        WHEN cb.value IS NOT NULL THEN COALESCE((cb.value->>'total_meters')::NUMERIC, 0)
        ELSE COALESCE((calc.value->>'total_meters')::NUMERIC, 0)
      END AS meters,
      CASE
        WHEN cb.value IS NOT NULL THEN NULLIF(COALESCE(
          (cb.value->>'meters_per_cone')::NUMERIC,
          (calc.value->>'meters_per_cone')::NUMERIC
        ), 0)
        ELSE NULLIF((calc.value->>'meters_per_cone')::NUMERIC, 0)
      END AS meters_per_cone
    FROM thread_order_results tor,
         jsonb_array_elements(tor.calculation_data) AS style_result,
         jsonb_array_elements(style_result.value->'calculations') AS calc
         LEFT JOIN LATERAL jsonb_array_elements(calc.value->'color_breakdown') AS cb ON true
    WHERE tor.week_id = p_week_id
      AND (
        cb.value IS NOT NULL
        OR calc.value->'color_breakdown' IS NULL
        OR jsonb_array_length(calc.value->'color_breakdown') = 0
      )
  ),
  per_issue_group AS (
    SELECT
      p.tt_id,
      p.thread_color_name,
      CEIL(SUM(p.meters) / MAX(p.meters_per_cone)) AS cones
    FROM parsed p
    WHERE p.tt_id IS NOT NULL
      AND p.meters_per_cone IS NOT NULL
    GROUP BY p.style_id, p.style_color_id, p.tt_id, p.thread_color_name
  )
  SELECT g.tt_id, c.id, SUM(g.cones)::INTEGER
  FROM per_issue_group g
  LEFT JOIN colors c ON c.name = g.thread_color_name
  WHERE g.cones IS NOT NULL
    AND g.cones > 0
    AND (p_thread_type_id IS NULL OR g.tt_id = p_thread_type_id)
  GROUP BY g.tt_id, c.id;
END;
$function$;

COMMENT ON FUNCTION fn_parse_calculation_cones(integer, integer)
  IS 'Nhu cầu cuộn theo tuần: CEIL tại cấp (mã hàng + màu hàng + loại chỉ + màu chỉ) rồi SUM, khớp cấp độ xuất kho';

NOTIFY pgrst, 'reload schema';

COMMIT;
