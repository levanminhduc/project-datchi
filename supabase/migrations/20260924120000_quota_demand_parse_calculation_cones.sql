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
  ),
  computed AS (
    SELECT g.tt_id, c.id AS color_id, SUM(g.cones) AS cones
    FROM per_issue_group g
    LEFT JOIN colors c ON c.name = g.thread_color_name
    WHERE g.cones IS NOT NULL
      AND g.cones > 0
      AND (p_thread_type_id IS NULL OR g.tt_id = p_thread_type_id)
    GROUP BY g.tt_id, c.id
  ),
  quota AS (
    SELECT
      (s.value->>'thread_type_id')::INTEGER AS tt_id,
      COALESCE(NULLIF((s.value->>'thread_color_id')::INTEGER, 0), sc.id) AS color_id,
      MIN((s.value->>'quota_cones')::NUMERIC) AS quota_cones
    FROM thread_order_results tor,
         jsonb_array_elements(tor.summary_data) AS s
         LEFT JOIN colors sc ON sc.name = s.value->>'thread_color'
    WHERE tor.week_id = p_week_id
      AND jsonb_typeof(tor.summary_data) = 'array'
      AND s.value->>'quota_cones' IS NOT NULL
    GROUP BY 1, 2
  )
  SELECT
    cp.tt_id,
    cp.color_id,
    (CASE
      WHEN q.quota_cones IS NULL THEN cp.cones
      ELSE LEAST(cp.cones, GREATEST(CEIL(q.quota_cones), 0))
    END)::INTEGER
  FROM computed cp
  LEFT JOIN quota q
    ON q.tt_id = cp.tt_id
   AND q.color_id IS NOT DISTINCT FROM cp.color_id;
END;
$function$;

NOTIFY pgrst, 'reload schema';

COMMIT;
