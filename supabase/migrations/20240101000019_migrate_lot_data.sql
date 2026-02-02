-- ============================================================================
-- Data Migration: Migrate existing lot_number data to lots table
-- Migration: 20240101000019_migrate_lot_data.sql
-- Description: Create lot records from existing cone data and link cones to lots
-- Dependencies: 20240101000016_lots.sql, 20240101000018_inventory_lot_id.sql
-- ============================================================================

-- ============================================================================
-- STEP 1: Create lot records from existing distinct lot_number combinations
-- For each unique (lot_number, thread_type_id) pair, create a lot record
-- Uses the most common warehouse_id found for that combination
-- ============================================================================

INSERT INTO lots (
    lot_number,
    thread_type_id,
    warehouse_id,
    production_date,
    expiry_date,
    supplier,
    total_cones,
    available_cones,
    status,
    notes,
    created_at
)
SELECT 
    ti.lot_number,
    ti.thread_type_id,
    -- Use the most common warehouse for this lot
    (
        SELECT warehouse_id 
        FROM thread_inventory ti2 
        WHERE ti2.lot_number = ti.lot_number 
          AND ti2.thread_type_id = ti.thread_type_id
        GROUP BY warehouse_id 
        ORDER BY COUNT(*) DESC 
        LIMIT 1
    ) AS warehouse_id,
    -- Use the earliest received date as production date estimate
    MIN(ti.received_date) AS production_date,
    -- Use the earliest expiry date from this lot
    MIN(ti.expiry_date) AS expiry_date,
    -- Supplier unknown for migrated data
    NULL AS supplier,
    -- Count total cones in this lot
    COUNT(*) AS total_cones,
    -- Count available cones in this lot
    COUNT(*) FILTER (WHERE ti.status = 'AVAILABLE') AS available_cones,
    -- Determine status based on available cones
    CASE 
        WHEN COUNT(*) FILTER (WHERE ti.status = 'AVAILABLE') > 0 THEN 'ACTIVE'::lot_status
        ELSE 'DEPLETED'::lot_status
    END AS status,
    -- Add migration note
    'Migrated from existing lot_number data' AS notes,
    -- Use earliest cone creation date
    MIN(ti.created_at) AS created_at
FROM thread_inventory ti
WHERE ti.lot_number IS NOT NULL 
  AND ti.lot_number != ''
  AND ti.lot_id IS NULL  -- Only migrate cones not yet linked to lots
GROUP BY ti.lot_number, ti.thread_type_id
ON CONFLICT (lot_number) DO NOTHING;  -- Skip if lot already exists

-- ============================================================================
-- STEP 2: Update thread_inventory with lot_id FK
-- Link each cone to its corresponding lot based on lot_number match
-- ============================================================================

UPDATE thread_inventory ti
SET lot_id = lots.id
FROM lots
WHERE ti.lot_number = lots.lot_number
  AND ti.thread_type_id = lots.thread_type_id
  AND ti.lot_id IS NULL;  -- Only update cones not yet linked

-- ============================================================================
-- STEP 3: Verify migration results
-- Log counts for verification
-- ============================================================================

DO $$
DECLARE
    total_lots_created INTEGER;
    total_cones_linked INTEGER;
    cones_without_lot INTEGER;
BEGIN
    -- Count lots created
    SELECT COUNT(*) INTO total_lots_created 
    FROM lots 
    WHERE notes = 'Migrated from existing lot_number data';
    
    -- Count cones linked to lots
    SELECT COUNT(*) INTO total_cones_linked 
    FROM thread_inventory 
    WHERE lot_id IS NOT NULL;
    
    -- Count cones still without lot (null lot_number)
    SELECT COUNT(*) INTO cones_without_lot 
    FROM thread_inventory 
    WHERE lot_id IS NULL;
    
    RAISE NOTICE '=== Migration Results ===';
    RAISE NOTICE 'Lots created from migration: %', total_lots_created;
    RAISE NOTICE 'Cones linked to lots: %', total_cones_linked;
    RAISE NOTICE 'Cones without lot_id (null lot_number): %', cones_without_lot;
END $$;

-- ============================================================================
-- OPTIONAL STEP 4: Update lot cone counts (in case of discrepancies)
-- This ensures total_cones and available_cones are accurate
-- ============================================================================

UPDATE lots l
SET 
    total_cones = (
        SELECT COUNT(*) 
        FROM thread_inventory ti 
        WHERE ti.lot_id = l.id
    ),
    available_cones = (
        SELECT COUNT(*) 
        FROM thread_inventory ti 
        WHERE ti.lot_id = l.id 
          AND ti.status = 'AVAILABLE'
    ),
    status = CASE 
        WHEN (
            SELECT COUNT(*) 
            FROM thread_inventory ti 
            WHERE ti.lot_id = l.id 
              AND ti.status = 'AVAILABLE'
        ) > 0 THEN 'ACTIVE'::lot_status
        ELSE 'DEPLETED'::lot_status
    END
WHERE l.notes = 'Migrated from existing lot_number data';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
