BEGIN;

WITH original_week23 AS (
  SELECT jsonb_agg(elem ORDER BY ord) AS calc_filtered
    FROM (
      SELECT elem, ord
        FROM thread_order_results,
             jsonb_array_elements(calculation_data) WITH ORDINALITY AS arr(elem, ord)
       WHERE week_id = 23
         AND ord <= 12
    ) sub
),
style14_from_week17 AS (
  SELECT elem
    FROM thread_order_results,
         jsonb_array_elements(calculation_data) AS elem
   WHERE week_id = 17
     AND (elem->>'style_id')::int = 14
)
UPDATE thread_order_results
   SET calculation_data = (SELECT calc_filtered FROM original_week23) || jsonb_build_array((SELECT elem FROM style14_from_week17)),
       updated_at = NOW()
 WHERE week_id = 23;

SELECT week_id, jsonb_array_length(calculation_data) AS calc_rows,
       (SELECT jsonb_agg(elem->'style_id')
          FROM jsonb_array_elements(calculation_data) AS elem) AS style_ids
  FROM thread_order_results
 WHERE week_id = 23;

SELECT week_id, elem->>'style_id' AS style_id, md5(elem::text) AS hash
  FROM thread_order_results, jsonb_array_elements(calculation_data) AS elem
 WHERE week_id = 23 AND (elem->>'style_id')::int IN (12, 14)
 ORDER BY style_id;

COMMIT;
