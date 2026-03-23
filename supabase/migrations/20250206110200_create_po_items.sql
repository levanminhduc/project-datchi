-- ============================================================================
-- Migration: 20250206110200_create_po_items.sql
-- Description: Bang chi tiet don hang (PO Items) - Junction PO va Style
-- Dependencies: purchase_orders, styles
-- ============================================================================

-- ============================================================================
-- TABLE: po_items
-- ============================================================================

CREATE TABLE po_items (
    id SERIAL PRIMARY KEY,
    
    -- Foreign Keys
    po_id INTEGER NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    style_id INTEGER NOT NULL REFERENCES styles(id) ON DELETE RESTRICT,
    
    -- Quantity and notes
    quantity INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- COMMENTS (Vietnamese + English)
-- ============================================================================

COMMENT ON TABLE po_items IS 'Bang chi tiet don hang - Lien ket PO va Style - PO Items junction table';

COMMENT ON COLUMN po_items.id IS 'Khoa chinh tu tang';
COMMENT ON COLUMN po_items.po_id IS 'FK den bang purchase_orders - Ma don hang';
COMMENT ON COLUMN po_items.style_id IS 'FK den bang styles - Ma hang san pham';
COMMENT ON COLUMN po_items.quantity IS 'So luong dat hang';
COMMENT ON COLUMN po_items.notes IS 'Ghi chu';
COMMENT ON COLUMN po_items.created_at IS 'Thoi diem tao ban ghi';
COMMENT ON COLUMN po_items.updated_at IS 'Thoi diem cap nhat gan nhat';

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_po_items_po_id ON po_items(po_id);
CREATE INDEX idx_po_items_style_id ON po_items(style_id);

-- ============================================================================
-- TRIGGER: Update updated_at on modification
-- ============================================================================

CREATE TRIGGER trigger_po_items_updated_at
    BEFORE UPDATE ON po_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
