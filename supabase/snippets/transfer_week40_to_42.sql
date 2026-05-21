-- Transfer week 40 (AW26 DROP2) → week 42 (AW26 DROP 3)
-- Executed: 2026-05-21
-- Result: 127 cones flipped, 4 items moved, 1 style merged (style 5), 0 duplicates

BEGIN;

-- A. Flip reserved_week_id
UPDATE thread_inventory
   SET reserved_week_id = 42, updated_at = NOW()
 WHERE reserved_week_id = 40
   AND status = 'RESERVED_FOR_ORDER';
-- UPDATE 127

-- B. Move thread_order_items
UPDATE thread_order_items
   SET week_id = 42, updated_at = NOW()
 WHERE week_id = 40;
-- UPDATE 4

-- C. Merge calculation_data (dedup)
WITH existing_styles AS (
  SELECT DISTINCT (elem->>'style_id')::int AS style_id
    FROM thread_order_results, jsonb_array_elements(calculation_data) AS elem
   WHERE week_id = 42
),
new_calc_entries AS (
  SELECT jsonb_agg(elem) AS entries
    FROM thread_order_results, jsonb_array_elements(calculation_data) AS elem
   WHERE week_id = 40
     AND (elem->>'style_id')::int NOT IN (SELECT style_id FROM existing_styles)
)
UPDATE thread_order_results
   SET calculation_data = calculation_data || COALESCE((SELECT entries FROM new_calc_entries), '[]'::jsonb),
       updated_at = NOW()
 WHERE week_id = 42;
-- UPDATE 1

COMMIT;

-- Rollback info:
-- Cone IDs: SELECT id FROM thread_inventory WHERE reserved_week_id=42 AND status='RESERVED_FOR_ORDER' (127 cones from week 40)
-- Item IDs moved: 3747, 3748, 3749, 3750
-- To rollback cones: UPDATE thread_inventory SET reserved_week_id=40 WHERE id IN (SELECT id FROM thread_inventory WHERE reserved_week_id=42 ... original 127)
-- To rollback items: UPDATE thread_order_items SET week_id=40 WHERE id IN (3747, 3748, 3749, 3750)
