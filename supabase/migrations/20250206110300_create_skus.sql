-- ============================================================================
-- Migration: 20250206110300_create_skus.sql
-- Description: Bang SKU - Chi tiet Style + Color + Size
-- Dependencies: po_items, colors
-- ============================================================================

-- ============================================================================
-- TABLE: skus
-- ============================================================================

CREATE TABLE skus (
    id SERIAL PRIMARY KEY,
    
    -- Foreign Keys
    po_item_id INTEGER NOT NULL REFERENCES po_items(id) ON DELETE CASCADE,
    color_id INTEGER NOT NULL REFERENCES colors(id) ON DELETE RESTRICT,
    
    -- SKU details
    size VARCHAR(50),
    quantity INTEGER NOT NULL DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- COMMENTS (Vietnamese + English)
-- ============================================================================

COMMENT ON TABLE skus IS 'Bang SKU - Chi tiet Style + Mau + Size - SKU details table';

COMMENT ON COLUMN skus.id IS 'Khoa chinh tu tang';
COMMENT ON COLUMN skus.po_item_id IS 'FK den bang po_items - Ma chi tiet don hang';
COMMENT ON COLUMN skus.color_id IS 'FK den bang colors - Ma mau sac';
COMMENT ON COLUMN skus.size IS 'Kich thuoc (Size)';
COMMENT ON COLUMN skus.quantity IS 'So luong';
COMMENT ON COLUMN skus.created_at IS 'Thoi diem tao ban ghi';
COMMENT ON COLUMN skus.updated_at IS 'Thoi diem cap nhat gan nhat';

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_skus_po_item_id ON skus(po_item_id);
CREATE INDEX idx_skus_color_id ON skus(color_id);

-- ============================================================================
-- TRIGGER: Update updated_at on modification
-- ============================================================================

CREATE TRIGGER trigger_skus_updated_at
    BEFORE UPDATE ON skus
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
