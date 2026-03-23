-- ============================================================================
-- Check and diagnose thread specs data for Issue V2
-- ============================================================================

-- 1. Check style_thread_specs
SELECT 'style_thread_specs' as table_name, COUNT(*) as row_count FROM style_thread_specs;

-- 2. Check style_color_thread_specs
SELECT 'style_color_thread_specs' as table_name, COUNT(*) as row_count FROM style_color_thread_specs;

-- 3. Check thread_types
SELECT 'thread_types' as table_name, COUNT(*) as row_count FROM thread_types;

-- 4. Get sample data from style_color_thread_specs with joins
SELECT
  scts.id,
  scts.style_thread_spec_id,
  scts.color_id,
  scts.thread_type_id,
  sts.style_id,
  sts.meters_per_unit,
  tt.code as thread_code,
  tt.name as thread_name
FROM style_color_thread_specs scts
JOIN style_thread_specs sts ON sts.id = scts.style_thread_spec_id
JOIN thread_types tt ON tt.id = scts.thread_type_id
LIMIT 10;

-- 5. Check if style_id=1, color_id=1 has any specs
SELECT
  scts.id,
  scts.color_id,
  scts.thread_type_id,
  sts.style_id,
  sts.meters_per_unit
FROM style_color_thread_specs scts
JOIN style_thread_specs sts ON sts.id = scts.style_thread_spec_id
WHERE sts.style_id = 1 AND scts.color_id = 1;

-- ============================================================================
-- If no data, you need to:
-- 1. Create style_thread_specs entries for your styles
-- 2. Create style_color_thread_specs entries linking to thread_types
-- ============================================================================

-- Example: Create test data if style_thread_specs is empty
-- INSERT INTO style_thread_specs (style_id, supplier_id, process_name, tex_id, meters_per_unit)
-- SELECT 1, 1, 'May than', id, 50.0 FROM thread_types LIMIT 1;

-- Example: Create style_color_thread_specs if empty
-- INSERT INTO style_color_thread_specs (style_thread_spec_id, color_id, thread_type_id)
-- SELECT sts.id, 1, tt.id
-- FROM style_thread_specs sts
-- CROSS JOIN thread_types tt
-- WHERE sts.style_id = 1
-- LIMIT 3;
