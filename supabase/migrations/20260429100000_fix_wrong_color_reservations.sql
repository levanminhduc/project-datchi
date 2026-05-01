-- Migration: Fix wrong color reservations
-- Problem: Reserve from stock didn't check color_id, so cones with wrong colors were reserved
-- Solution: Unreserve wrong-color cones, then re-reserve with correct colors from available stock

BEGIN;

-- Step 1: Create temp table to track what needs to be fixed
CREATE TEMP TABLE fix_reservations AS
WITH week_bom AS (
  -- Get BOM requirements for all CONFIRMED weeks that have reserved cones
  SELECT
    w.id as week_id,
    b.thread_type_id,
    b.color_id as bom_color_id,
    b.needed_cones
  FROM thread_order_weeks w
  CROSS JOIN LATERAL fn_parse_calculation_cones(w.id) b
  WHERE w.status = 'CONFIRMED'
    AND EXISTS (SELECT 1 FROM thread_inventory WHERE reserved_week_id = w.id)
),
reserved_cones AS (
  -- Get currently reserved cones grouped by week, thread_type, color
  SELECT
    reserved_week_id as week_id,
    thread_type_id,
    color_id,
    COUNT(*) as reserved_count
  FROM thread_inventory
  WHERE reserved_week_id IS NOT NULL
  GROUP BY reserved_week_id, thread_type_id, color_id
)
SELECT
  r.week_id,
  r.thread_type_id,
  r.color_id as wrong_color_id,
  r.reserved_count as cones_to_unreserve,
  b.bom_color_id as correct_color_id,
  b.needed_cones
FROM reserved_cones r
LEFT JOIN week_bom b ON r.week_id = b.week_id
  AND r.thread_type_id = b.thread_type_id
WHERE b.bom_color_id IS NULL  -- Reserved but not in BOM at all
   OR b.bom_color_id != r.color_id;  -- Reserved with wrong color

-- Log what we're about to fix
DO $$
DECLARE
  total_wrong INTEGER;
  total_cones INTEGER;
BEGIN
  SELECT COUNT(*), COALESCE(SUM(cones_to_unreserve), 0)
  INTO total_wrong, total_cones
  FROM fix_reservations;

  RAISE NOTICE 'Found % wrong reservation groups, % total cones to unreserve', total_wrong, total_cones;
END $$;

-- Step 2: Unreserve all wrong-color cones
UPDATE thread_inventory i
SET
  reserved_week_id = NULL,
  status = 'AVAILABLE',
  updated_at = NOW()
FROM fix_reservations f
WHERE i.reserved_week_id = f.week_id
  AND i.thread_type_id = f.thread_type_id
  AND i.color_id = f.wrong_color_id;

-- Log unreserved count
DO $$
DECLARE
  unreserved_count INTEGER;
BEGIN
  GET DIAGNOSTICS unreserved_count = ROW_COUNT;
  RAISE NOTICE 'Unreserved % cones with wrong colors', unreserved_count;
END $$;

-- Step 3: Re-reserve directly (bypass fn_reserve_from_stock which requires delivery records)
-- Use FEFO: partial cones first (quantity_meters < meters_per_cone), then by expiry_date
DO $$
DECLARE
  rec RECORD;
  cone RECORD;
  total_reserved INTEGER := 0;
  reserved_this_batch INTEGER;
  shortage INTEGER;
BEGIN
  FOR rec IN
    SELECT DISTINCT
      b.week_id,
      b.thread_type_id,
      b.color_id as bom_color_id,
      b.needed_cones,
      COALESCE(already.reserved_count, 0) as already_reserved
    FROM (
      SELECT w.id as week_id, pc.thread_type_id, pc.color_id, pc.needed_cones
      FROM thread_order_weeks w
      CROSS JOIN LATERAL fn_parse_calculation_cones(w.id) pc
      WHERE w.status = 'CONFIRMED'
        AND EXISTS (SELECT 1 FROM fix_reservations f WHERE f.week_id = w.id)
    ) b
    LEFT JOIN (
      SELECT reserved_week_id, thread_type_id, color_id, COUNT(*) as reserved_count
      FROM thread_inventory
      WHERE reserved_week_id IS NOT NULL
      GROUP BY reserved_week_id, thread_type_id, color_id
    ) already ON b.week_id = already.reserved_week_id
      AND b.thread_type_id = already.thread_type_id
      AND b.color_id = already.color_id
    WHERE b.needed_cones > COALESCE(already.reserved_count, 0)
    ORDER BY b.week_id, b.thread_type_id
  LOOP
    shortage := rec.needed_cones - rec.already_reserved;
    reserved_this_batch := 0;

    -- Reserve available cones with correct color using FEFO
    FOR cone IN
      SELECT i.id
      FROM thread_inventory i
      LEFT JOIN thread_types tt ON tt.id = i.thread_type_id
      WHERE i.thread_type_id = rec.thread_type_id
        AND i.color_id = rec.bom_color_id
        AND i.status = 'AVAILABLE'
        AND i.reserved_week_id IS NULL
      ORDER BY
        CASE WHEN i.quantity_meters < COALESCE(tt.meters_per_cone, 5000) THEN 0 ELSE 1 END,
        i.expiry_date NULLS LAST,
        i.received_date
      LIMIT shortage
    LOOP
      UPDATE thread_inventory
      SET reserved_week_id = rec.week_id,
          status = 'RESERVED_FOR_ORDER',
          updated_at = NOW()
      WHERE id = cone.id;

      reserved_this_batch := reserved_this_batch + 1;
    END LOOP;

    IF reserved_this_batch > 0 THEN
      total_reserved := total_reserved + reserved_this_batch;
      RAISE NOTICE 'Week %: Reserved % cones for thread_type=%, color=%',
        rec.week_id, reserved_this_batch, rec.thread_type_id, rec.bom_color_id;
    END IF;
  END LOOP;

  RAISE NOTICE 'Total re-reserved with correct colors: % cones', total_reserved;
END $$;

-- Step 4: Generate summary report
DO $$
DECLARE
  rec RECORD;
BEGIN
  RAISE NOTICE '=== FINAL SUMMARY ===';

  FOR rec IN
    SELECT
      w.id as week_id,
      w.week_name,
      COUNT(i.id) as total_reserved,
      COUNT(i.id) FILTER (
        WHERE EXISTS (
          SELECT 1 FROM fn_parse_calculation_cones(w.id) b
          WHERE b.thread_type_id = i.thread_type_id AND b.color_id = i.color_id
        )
      ) as correct_reserved
    FROM thread_order_weeks w
    LEFT JOIN thread_inventory i ON i.reserved_week_id = w.id
    WHERE w.status = 'CONFIRMED'
    GROUP BY w.id, w.week_name
    HAVING COUNT(i.id) > 0
    ORDER BY w.id
    LIMIT 10
  LOOP
    RAISE NOTICE 'Week % (%): % reserved, % correct',
      rec.week_id, rec.week_name, rec.total_reserved, rec.correct_reserved;
  END LOOP;
END $$;

DROP TABLE fix_reservations;

COMMIT;
