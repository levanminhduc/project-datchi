-- Check thread_stock for specific thread types
SELECT 
  ts.id,
  ts.thread_type_id,
  tt.code,
  tt.name,
  ts.warehouse_id,
  ts.qty_full_cones,
  ts.qty_partial_cones,
  ts.qty_kg
FROM thread_stock ts
JOIN thread_types tt ON tt.id = ts.thread_type_id
WHERE ts.thread_type_id IN (21, 39, 11)
ORDER BY ts.thread_type_id;

-- Check all thread_stock
SELECT 
  ts.thread_type_id,
  tt.code,
  SUM(ts.qty_full_cones) as total_full,
  SUM(ts.qty_partial_cones) as total_partial
FROM thread_stock ts
JOIN thread_types tt ON tt.id = ts.thread_type_id
GROUP BY ts.thread_type_id, tt.code
ORDER BY ts.thread_type_id
LIMIT 20;
