-- Fix: fn_parse_calculation_cones CEIL từng dòng color_breakdown rồi SUM → thừa cuộn
-- Đúng: SUM raw total_meters trước, CEIL(SUM / meters_per_cone) sau
-- VD: 14 dòng BK × CEIL(~800/8500)=1 → SUM=14 (sai)
--     SUM(~106888) / 8500 → CEIL=13 (đúng, khớp summary_data)

BEGIN;

CREATE OR REPLACE FUNCTION fn_parse_calculation_cones(
  p_week_id INTEGER,
  p_thread_type_id INTEGER DEFAULT NULL
)
RETURNS TABLE(thread_type_id INTEGER, color_id INTEGER, needed_cones INTEGER) AS $$
BEGIN
  RETURN QUERY
  WITH parsed AS (
    SELECT
      COALESCE(
        (cb.value->>'thread_type_id')::INTEGER,
        (calc.value->>'spec_id')::INTEGER
      ) AS tt_id,
      CASE
        WHEN cb.value IS NOT NULL THEN cb.value->>'thread_color'
        ELSE calc.value->>'thread_color'
      END AS thread_color_name,
      CASE
        WHEN cb.value IS NOT NULL THEN
          COALESCE((cb.value->>'total_meters')::NUMERIC, 0)
        ELSE
          COALESCE((calc.value->>'total_meters')::NUMERIC, 0)
      END AS total_meters,
      CASE
        WHEN cb.value IS NOT NULL THEN
          COALESCE(
            (cb.value->>'meters_per_cone')::NUMERIC,
            (calc.value->>'meters_per_cone')::NUMERIC
          )
        ELSE
          (calc.value->>'meters_per_cone')::NUMERIC
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
  )
  SELECT
    p.tt_id,
    c.id,
    CEIL(SUM(p.total_meters) / NULLIF(MAX(p.meters_per_cone), 0))::INTEGER
  FROM parsed p
  LEFT JOIN colors c ON c.name = p.thread_color_name
  WHERE p.tt_id IS NOT NULL
    AND p.total_meters > 0
    AND (p_thread_type_id IS NULL OR p.tt_id = p_thread_type_id)
  GROUP BY p.tt_id, c.id;
END;
$$ LANGUAGE plpgsql STABLE;

COMMIT;
