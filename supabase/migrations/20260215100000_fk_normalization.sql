BEGIN;

UPDATE thread_types t
SET color_id = c.id
FROM colors c
WHERE t.color_id IS NULL
  AND LOWER(TRIM(t.color)) = LOWER(TRIM(c.name));

UPDATE thread_types t
SET supplier_id = s.id
FROM suppliers s
WHERE t.supplier_id IS NULL
  AND LOWER(TRIM(t.supplier)) = LOWER(TRIM(s.name));

DO $$
DECLARE
  v_unmatched_colors INTEGER;
  v_unmatched_suppliers INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_unmatched_colors
  FROM thread_types
  WHERE color IS NOT NULL AND color_id IS NULL;

  SELECT COUNT(*) INTO v_unmatched_suppliers
  FROM thread_types
  WHERE supplier IS NOT NULL AND supplier_id IS NULL;

  IF v_unmatched_colors > 0 THEN
    RAISE EXCEPTION 'Found % thread_types with unmatched color', v_unmatched_colors;
  END IF;

  IF v_unmatched_suppliers > 0 THEN
    RAISE EXCEPTION 'Found % thread_types with unmatched supplier', v_unmatched_suppliers;
  END IF;
END $$;

ALTER TABLE thread_types
  ALTER COLUMN color_id SET NOT NULL,
  ALTER COLUMN supplier_id SET NOT NULL;

DROP VIEW IF EXISTS v_stock_summary;
DROP VIEW IF EXISTS v_issue_reconciliation_v2;

CREATE VIEW v_stock_summary AS
SELECT
  ts.thread_type_id,
  tt.code AS thread_code,
  tt.name AS thread_name,
  c.name AS thread_color,
  ts.warehouse_id,
  w.code AS warehouse_code,
  w.name AS warehouse_name,
  SUM(ts.qty_full_cones) AS total_full_cones,
  SUM(ts.qty_partial_cones) AS total_partial_cones,
  SUM(ts.qty_full_cones)::NUMERIC
    + SUM(ts.qty_partial_cones)::NUMERIC
    * COALESCE(
        (SELECT value::NUMERIC FROM system_settings WHERE key = 'partial_cone_ratio'),
        0.3
      ) AS total_equivalent_cones
FROM thread_stock ts
JOIN thread_types tt ON ts.thread_type_id = tt.id
JOIN colors c ON tt.color_id = c.id
JOIN warehouses w ON ts.warehouse_id = w.id
GROUP BY ts.thread_type_id, tt.code, tt.name, c.name, ts.warehouse_id, w.code, w.name;

CREATE VIEW v_issue_reconciliation_v2 AS
WITH partial_ratio AS (
  SELECT COALESCE(
    (SELECT value::NUMERIC FROM system_settings WHERE key = 'partial_cone_ratio'),
    0.3
  ) AS ratio
)
SELECT
  ti.id AS issue_id,
  ti.issue_code,
  ti.department,
  ti.status AS issue_status,
  ti.created_by,
  ti.created_at AS issue_date,
  til.id AS line_id,
  til.po_id,
  po.po_number,
  til.style_id,
  s.style_code,
  til.color_id,
  c.name AS color_name,
  til.thread_type_id,
  tt.code AS thread_code,
  tt.name AS thread_name,
  c2.name AS thread_color,
  til.quota_cones,
  til.issued_full,
  til.issued_partial,
  til.returned_full,
  til.returned_partial,
  (til.issued_full - til.returned_full)::NUMERIC
    + (til.issued_partial - til.returned_partial)::NUMERIC * pr.ratio
    AS consumed_equivalent_cones,
  til.issued_full - til.returned_full AS consumed_full_cones,
  til.issued_partial - til.returned_partial AS consumed_partial_cones,
  CASE
    WHEN til.quota_cones IS NOT NULL AND til.quota_cones > 0 THEN
      ROUND(
        (((til.issued_full - til.returned_full)::NUMERIC
          + (til.issued_partial - til.returned_partial)::NUMERIC * pr.ratio)
         / til.quota_cones) * 100, 2)
    ELSE NULL
  END AS consumption_percentage,
  CASE
    WHEN til.quota_cones IS NOT NULL AND til.quota_cones > 0 THEN
      ((til.issued_full - til.returned_full)::NUMERIC
        + (til.issued_partial - til.returned_partial)::NUMERIC * pr.ratio) > til.quota_cones
    ELSE false
  END AS is_over_quota,
  til.over_quota_notes,
  pr.ratio AS partial_cone_ratio
FROM thread_issues ti
JOIN thread_issue_lines til ON ti.id = til.issue_id
CROSS JOIN partial_ratio pr
LEFT JOIN purchase_orders po ON til.po_id = po.id
LEFT JOIN styles s ON til.style_id = s.id
LEFT JOIN colors c ON til.color_id = c.id
LEFT JOIN thread_types tt ON til.thread_type_id = tt.id
LEFT JOIN colors c2 ON tt.color_id = c2.id;

ALTER TABLE thread_types
  DROP COLUMN color,
  DROP COLUMN color_code,
  DROP COLUMN supplier;

NOTIFY pgrst, 'reload schema';

COMMIT;
