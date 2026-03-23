-- ============================================================================
-- Migration: 20260302000001_po_items_management.sql
-- Description: Add po_items management: soft delete, history tracking, audit trigger, permissions
-- Dependencies: purchase_orders, po_items, styles, employees, fn_thread_audit_trigger_func
-- ============================================================================

-- ============================================================================
-- 1.1: Add deleted_at column to po_items table for soft delete
-- ============================================================================

ALTER TABLE po_items ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

COMMENT ON COLUMN po_items.deleted_at IS 'Thoi diem xoa mem - Soft delete timestamp';

-- ============================================================================
-- 1.2: Create unique partial index to prevent duplicate styles in same PO (active items only)
-- ============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_po_items_po_style_active
  ON po_items(po_id, style_id)
  WHERE deleted_at IS NULL;

COMMENT ON INDEX idx_po_items_po_style_active IS 'Unique constraint: one style per PO (excluding deleted items)';

-- ============================================================================
-- 1.3: Create enum for po_item_history change types
-- MUST be created BEFORE table that uses it
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE po_item_change_type AS ENUM ('CREATE', 'UPDATE', 'DELETE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

COMMENT ON TYPE po_item_change_type IS 'Loai thay doi po_item: CREATE, UPDATE, DELETE';

-- ============================================================================
-- 1.4: Create po_item_history table for business-level change tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS po_item_history (
  id SERIAL PRIMARY KEY,
  po_item_id INTEGER NOT NULL REFERENCES po_items(id) ON DELETE CASCADE,
  change_type po_item_change_type NOT NULL,
  previous_quantity INTEGER,
  new_quantity INTEGER,
  changed_by INTEGER NOT NULL REFERENCES employees(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE po_item_history IS 'Lich su thay doi so luong po_item - PO Item change history';
COMMENT ON COLUMN po_item_history.po_item_id IS 'FK den po_items - Reference to PO item';
COMMENT ON COLUMN po_item_history.change_type IS 'Loai thay doi: CREATE, UPDATE, DELETE';
COMMENT ON COLUMN po_item_history.previous_quantity IS 'So luong truoc thay doi';
COMMENT ON COLUMN po_item_history.new_quantity IS 'So luong sau thay doi';
COMMENT ON COLUMN po_item_history.changed_by IS 'FK den employees - Nguoi thuc hien thay doi';
COMMENT ON COLUMN po_item_history.notes IS 'Ghi chu them';
COMMENT ON COLUMN po_item_history.created_at IS 'Thoi diem tao ban ghi';

-- ============================================================================
-- 1.5: Attach audit trigger to po_items table
-- Uses existing fn_thread_audit_trigger_func (from 20240101000008_thread_audit.sql)
-- ============================================================================

DROP TRIGGER IF EXISTS audit_po_items ON po_items;

CREATE TRIGGER audit_po_items
  AFTER INSERT OR UPDATE OR DELETE ON po_items
  FOR EACH ROW EXECUTE FUNCTION fn_thread_audit_trigger_func();

COMMENT ON TRIGGER audit_po_items ON po_items IS 'Audit trigger for po_items - Trigger kiem toan chi tiet don hang';

-- ============================================================================
-- 1.6: Add indexes for po_item_history
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_po_item_history_po_item_id
  ON po_item_history(po_item_id);

CREATE INDEX IF NOT EXISTS idx_po_item_history_created_at
  ON po_item_history(created_at DESC);

COMMENT ON INDEX idx_po_item_history_po_item_id IS 'Index for fast history lookup by po_item_id';
COMMENT ON INDEX idx_po_item_history_created_at IS 'Index for sorting history by time';

-- ============================================================================
-- 1.7: Add new permissions for PO management
-- ============================================================================

INSERT INTO permissions (code, name, description, module, resource, action, route_path, is_page_access, sort_order) VALUES
('thread.purchase-orders.view', 'Xem Đơn Hàng (PO)', 'Quyền xem danh sách đơn hàng PO', 'thread', 'purchase-orders', 'VIEW', '/thread/purchase-orders', true, 125),
('thread.purchase-orders.create', 'Tạo Đơn Hàng (PO)', 'Quyền tạo đơn hàng PO mới', 'thread', 'purchase-orders', 'CREATE', NULL, false, 126),
('thread.purchase-orders.edit', 'Sửa Đơn Hàng (PO)', 'Quyền chỉnh sửa đơn hàng PO', 'thread', 'purchase-orders', 'EDIT', NULL, false, 127),
('thread.purchase-orders.delete', 'Xóa Đơn Hàng (PO)', 'Quyền xóa đơn hàng PO', 'thread', 'purchase-orders', 'DELETE', NULL, false, 128),
('thread.purchase-orders.import', 'Import Đơn Hàng (PO)', 'Quyền import đơn hàng PO từ Excel', 'thread', 'purchase-orders', 'MANAGE', '/thread/purchase-orders/import', true, 129)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- ROLE-PERMISSION MAPPINGS for PO permissions
-- ============================================

-- Admin: All PO permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'admin'
  AND p.code IN (
    'thread.purchase-orders.view',
    'thread.purchase-orders.create',
    'thread.purchase-orders.edit',
    'thread.purchase-orders.delete',
    'thread.purchase-orders.import'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Warehouse Manager: view, create, edit, import (no delete)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'warehouse_manager'
  AND p.code IN (
    'thread.purchase-orders.view',
    'thread.purchase-orders.create',
    'thread.purchase-orders.edit',
    'thread.purchase-orders.import'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Planning: view, create, edit, import (no delete)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'planning'
  AND p.code IN (
    'thread.purchase-orders.view',
    'thread.purchase-orders.create',
    'thread.purchase-orders.edit',
    'thread.purchase-orders.import'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Production: view only
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'production'
  AND p.code IN (
    'thread.purchase-orders.view'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Viewer: view only
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'viewer'
  AND p.code IN (
    'thread.purchase-orders.view'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
