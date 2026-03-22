BEGIN;

DROP FUNCTION IF EXISTS fn_calculate_quota();
DROP FUNCTION IF EXISTS fn_check_quota();
DROP FUNCTION IF EXISTS fn_update_system_settings_timestamp();

DROP INDEX IF EXISTS idx_colors_name;
DROP INDEX IF EXISTS idx_employees_employee_id;
DROP INDEX IF EXISTS idx_permissions_code;
DROP INDEX IF EXISTS idx_suppliers_code;
DROP INDEX IF EXISTS idx_styles_style_code;
DROP INDEX IF EXISTS idx_purchase_orders_po_number;
DROP INDEX IF EXISTS idx_thread_types_code;
DROP INDEX IF EXISTS idx_warehouses_code;
DROP INDEX IF EXISTS idx_lots_lot_number;
DROP INDEX IF EXISTS idx_thread_issues_issue_code;
DROP INDEX IF EXISTS idx_thread_inventory_cone_id;

ALTER TYPE permission_action RENAME VALUE 'view' TO 'VIEW';
ALTER TYPE permission_action RENAME VALUE 'create' TO 'CREATE';
ALTER TYPE permission_action RENAME VALUE 'edit' TO 'EDIT';
ALTER TYPE permission_action RENAME VALUE 'delete' TO 'DELETE';
ALTER TYPE permission_action RENAME VALUE 'manage' TO 'MANAGE';

DO $$ BEGIN
  CREATE TYPE po_priority AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

UPDATE purchase_orders SET priority = UPPER(COALESCE(priority, 'normal')) WHERE priority IS NOT NULL;
UPDATE purchase_orders SET priority = 'NORMAL' WHERE priority IS NULL;

ALTER TABLE purchase_orders ALTER COLUMN priority DROP DEFAULT;
ALTER TABLE purchase_orders ALTER COLUMN priority TYPE po_priority USING priority::po_priority;
ALTER TABLE purchase_orders ALTER COLUMN priority SET DEFAULT 'NORMAL'::po_priority;
ALTER TABLE purchase_orders ALTER COLUMN priority SET NOT NULL;

DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM ('STOCK_ALERT', 'BATCH_RECEIVE', 'BATCH_ISSUE', 'ALLOCATION', 'CONFLICT', 'RECOVERY', 'WEEKLY_ORDER');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE notifications DROP CONSTRAINT IF EXISTS chk_notification_type;
ALTER TABLE notifications ALTER COLUMN type TYPE notification_type USING type::notification_type;

ALTER INDEX IF EXISTS idx_return_logs_issue_id RENAME TO idx_thread_issue_return_logs_issue_id;
ALTER INDEX IF EXISTS idx_return_logs_line_id RENAME TO idx_thread_issue_return_logs_line_id;

ALTER INDEX IF EXISTS idx_refresh_tokens_employee RENAME TO idx_employee_refresh_tokens_employee_id;
ALTER INDEX IF EXISTS idx_refresh_tokens_expires RENAME TO idx_employee_refresh_tokens_expires_at;

ALTER INDEX IF EXISTS idx_warehouses_active RENAME TO idx_warehouses_is_active;

ALTER TABLE color_supplier DROP CONSTRAINT IF EXISTS color_supplier_color_id_supplier_id_key;
ALTER TABLE color_supplier ADD CONSTRAINT uq_color_supplier_color_supplier UNIQUE (color_id, supplier_id);

ALTER TABLE thread_type_supplier DROP CONSTRAINT IF EXISTS thread_type_supplier_thread_type_id_supplier_id_key;
ALTER TABLE thread_type_supplier ADD CONSTRAINT uq_thread_type_supplier_type_supplier UNIQUE (thread_type_id, supplier_id);

ALTER TABLE thread_type_supplier DROP CONSTRAINT IF EXISTS thread_type_supplier_supplier_id_supplier_item_code_key;
ALTER TABLE thread_type_supplier ADD CONSTRAINT uq_thread_type_supplier_supplier_item UNIQUE (supplier_id, supplier_item_code);

ALTER TABLE lots DROP COLUMN IF EXISTS supplier;
ALTER TABLE employee_roles DROP COLUMN IF EXISTS assigned_at;
ALTER TABLE employee_permissions DROP COLUMN IF EXISTS assigned_at;

UPDATE thread_order_items SET updated_at = NOW() WHERE updated_at IS NULL;
ALTER TABLE thread_order_items ALTER COLUMN updated_at SET NOT NULL;

UPDATE thread_order_results SET created_at = NOW() WHERE created_at IS NULL;
UPDATE thread_order_results SET updated_at = NOW() WHERE updated_at IS NULL;
ALTER TABLE thread_order_results ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE thread_order_results ALTER COLUMN updated_at SET NOT NULL;

DROP VIEW IF EXISTS v_issue_reconciliation_v2;

CREATE VIEW v_issue_reconciliation AS
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

NOTIFY pgrst, 'reload schema';

COMMIT;
