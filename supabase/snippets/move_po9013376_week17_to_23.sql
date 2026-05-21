BEGIN;

UPDATE thread_order_items
   SET week_id = 23,
       updated_at = NOW()
 WHERE id = 173
   AND week_id = 17
   AND po_id = 146;

UPDATE thread_order_results
   SET calculation_data = calculation_data || (
         SELECT calculation_data
           FROM thread_order_results
          WHERE week_id = 17
       ),
       updated_at = NOW()
 WHERE week_id = 23;

SELECT id, week_id, po_id, style_id, style_color_id, quantity
  FROM thread_order_items
 WHERE id = 173;

SELECT week_id, jsonb_array_length(calculation_data) AS calc_rows,
       (SELECT jsonb_agg(elem->'style_id')
          FROM jsonb_array_elements(calculation_data) AS elem) AS style_ids
  FROM thread_order_results
 WHERE week_id IN (17, 23)
 ORDER BY week_id;

COMMIT;
