BEGIN;

ALTER TABLE thread_types
  ALTER COLUMN color_id DROP NOT NULL;

DROP VIEW IF EXISTS v_stock_summary;

CREATE VIEW v_stock_summary AS
SELECT
  ti.thread_type_id,
  tt.code AS thread_code,
  tt.name AS thread_name,
  c.name AS thread_color,
  ti.warehouse_id,
  w.code AS warehouse_code,
  w.name AS warehouse_name,
  COUNT(*) FILTER (WHERE NOT ti.is_partial) AS total_full_cones,
  COUNT(*) FILTER (WHERE ti.is_partial) AS total_partial_cones,
  COUNT(*) FILTER (WHERE NOT ti.is_partial)::NUMERIC
    + COUNT(*) FILTER (WHERE ti.is_partial)::NUMERIC
    * COALESCE(fn_get_partial_cone_ratio(), 0.3) AS total_equivalent_cones
FROM thread_inventory ti
JOIN thread_types tt ON ti.thread_type_id = tt.id
LEFT JOIN colors c ON tt.color_id = c.id
JOIN warehouses w ON ti.warehouse_id = w.id
WHERE ti.status IN ('AVAILABLE', 'RECEIVED', 'INSPECTED', 'SOFT_ALLOCATED', 'HARD_ALLOCATED')
GROUP BY ti.thread_type_id, tt.code, tt.name, c.name, ti.warehouse_id, w.code, w.name;

NOTIFY pgrst, 'reload schema';

COMMIT;
