BEGIN;

UPDATE thread_inventory
   SET reserved_week_id = 23,
       updated_at = NOW()
 WHERE reserved_week_id = 17
   AND status = 'RESERVED_FOR_ORDER';

SELECT id, cone_id, reserved_week_id, original_week_id, updated_at
  FROM thread_inventory
 WHERE id IN (46392, 46393, 46394);

SELECT reserved_week_id, COUNT(*) AS cones
  FROM thread_inventory
 WHERE reserved_week_id IN (17, 23)
   AND status = 'RESERVED_FOR_ORDER'
 GROUP BY reserved_week_id
 ORDER BY reserved_week_id;

COMMIT;
