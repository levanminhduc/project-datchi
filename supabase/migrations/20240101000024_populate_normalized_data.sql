-- ============================================================================
-- Thread Restructure Phase 1 - Populate Normalized Data
-- Migration: 20240101000024_populate_normalized_data.sql
-- Description: Backfill existing data into normalized tables
-- Dependencies: colors, suppliers, color_supplier, thread_types, lots tables
-- ============================================================================

-- ============================================================================
-- STEP 1: Extract distinct colors from thread_types
-- ============================================================================

INSERT INTO colors (name, hex_code)
SELECT DISTINCT 
    COALESCE(NULLIF(TRIM(color), ''), 'Không xác định') as name,
    COALESCE(NULLIF(TRIM(color_code), ''), '#808080') as hex_code
FROM thread_types
WHERE color IS NOT NULL OR color_code IS NOT NULL
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- STEP 2: Extract distinct suppliers from both thread_types and lots
-- ============================================================================

INSERT INTO suppliers (code, name)
SELECT DISTINCT 
    UPPER(REPLACE(REPLACE(TRIM(supplier), ' ', '-'), '.', '')) as code,
    TRIM(supplier) as name
FROM (
    SELECT supplier FROM thread_types WHERE supplier IS NOT NULL AND TRIM(supplier) != ''
    UNION
    SELECT supplier FROM lots WHERE supplier IS NOT NULL AND TRIM(supplier) != ''
) all_suppliers
WHERE supplier IS NOT NULL AND TRIM(supplier) != ''
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- STEP 3: Backfill thread_types.color_id by matching color name
-- ============================================================================

UPDATE thread_types tt
SET color_id = c.id
FROM colors c
WHERE (
    LOWER(TRIM(tt.color)) = LOWER(c.name) 
    OR TRIM(tt.color_code) = c.hex_code
)
AND tt.color_id IS NULL;

-- ============================================================================
-- STEP 4: Backfill thread_types.supplier_id by matching supplier name
-- ============================================================================

UPDATE thread_types tt
SET supplier_id = s.id
FROM suppliers s
WHERE LOWER(TRIM(tt.supplier)) = LOWER(s.name)
AND tt.supplier_id IS NULL;

-- ============================================================================
-- STEP 5: Backfill lots.supplier_id by matching supplier name
-- ============================================================================

UPDATE lots l
SET supplier_id = s.id
FROM suppliers s
WHERE LOWER(TRIM(l.supplier)) = LOWER(s.name)
AND l.supplier_id IS NULL;

-- ============================================================================
-- STEP 6: Create color_supplier junction records from existing combinations
-- ============================================================================

INSERT INTO color_supplier (color_id, supplier_id)
SELECT DISTINCT color_id, supplier_id
FROM thread_types
WHERE color_id IS NOT NULL AND supplier_id IS NOT NULL
ON CONFLICT (color_id, supplier_id) DO NOTHING;

-- ============================================================================
-- STEP 7: Verification queries
-- ============================================================================

DO $$
DECLARE
    total_colors INTEGER;
    total_suppliers INTEGER;
    total_color_supplier INTEGER;
    unmapped_tt_colors INTEGER;
    unmapped_tt_suppliers INTEGER;
    unmapped_lot_suppliers INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_colors FROM colors;
    SELECT COUNT(*) INTO total_suppliers FROM suppliers;
    SELECT COUNT(*) INTO total_color_supplier FROM color_supplier;
    
    SELECT COUNT(*) INTO unmapped_tt_colors 
    FROM thread_types 
    WHERE color IS NOT NULL AND TRIM(color) != '' AND color_id IS NULL;
    
    SELECT COUNT(*) INTO unmapped_tt_suppliers 
    FROM thread_types 
    WHERE supplier IS NOT NULL AND TRIM(supplier) != '' AND supplier_id IS NULL;
    
    SELECT COUNT(*) INTO unmapped_lot_suppliers 
    FROM lots 
    WHERE supplier IS NOT NULL AND TRIM(supplier) != '' AND supplier_id IS NULL;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Migration Results:';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total colors created: %', total_colors;
    RAISE NOTICE 'Total suppliers created: %', total_suppliers;
    RAISE NOTICE 'Total color_supplier records: %', total_color_supplier;
    RAISE NOTICE '----------------------------------------';
    RAISE NOTICE 'Unmapped thread_types colors: %', unmapped_tt_colors;
    RAISE NOTICE 'Unmapped thread_types suppliers: %', unmapped_tt_suppliers;
    RAISE NOTICE 'Unmapped lots suppliers: %', unmapped_lot_suppliers;
    RAISE NOTICE '========================================';
    
    IF unmapped_tt_colors > 0 OR unmapped_tt_suppliers > 0 OR unmapped_lot_suppliers > 0 THEN
        RAISE WARNING 'Some records could not be mapped. Review data manually.';
    ELSE
        RAISE NOTICE 'SUCCESS: All records mapped successfully!';
    END IF;
END $$;
