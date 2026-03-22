-- ============================================================================
-- Migration: 20260209_add_po_id_to_thread_order_items.sql
-- Description: Them cot po_id vao thread_order_items de lien ket voi PO
-- Dependencies: purchase_orders, thread_order_items
-- ============================================================================

-- Them cot po_id
ALTER TABLE thread_order_items
  ADD COLUMN po_id INTEGER REFERENCES purchase_orders(id) ON DELETE RESTRICT;

-- Xoa constraint cu (week_id, style_id, color_id)
ALTER TABLE thread_order_items
  DROP CONSTRAINT thread_order_items_week_id_style_id_color_id_key;

-- Them constraint moi bao gom po_id
ALTER TABLE thread_order_items
  ADD CONSTRAINT thread_order_items_week_po_style_color_key
  UNIQUE(week_id, po_id, style_id, color_id);

-- Index cho po_id
CREATE INDEX idx_thread_order_items_po_id ON thread_order_items(po_id);

-- Comment
COMMENT ON COLUMN thread_order_items.po_id IS 'FK den bang purchase_orders - Don hang (PO)';
