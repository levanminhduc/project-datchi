-- ============================================================================
-- Thread Restructure Phase 1 - Color-Supplier Junction Table
-- Migration: 20240101000022_color_supplier.sql
-- Description: Junction table for many-to-many color-supplier relationship with pricing
-- Dependencies: colors, suppliers tables
-- ============================================================================

-- ============================================================================
-- TABLE: color_supplier
-- Junction table linking colors to suppliers with pricing information
-- ============================================================================

CREATE TABLE color_supplier (
    id SERIAL PRIMARY KEY,
    
    color_id INTEGER NOT NULL REFERENCES colors(id) ON DELETE RESTRICT,
    supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    price_per_kg DECIMAL(10,2),
    min_order_qty INTEGER,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(color_id, supplier_id)
);

-- ============================================================================
-- COMMENTS (Vietnamese)
-- ============================================================================

COMMENT ON TABLE color_supplier IS 'Bảng liên kết màu-nhà cung cấp với thông tin giá - Color-Supplier junction with pricing';
COMMENT ON COLUMN color_supplier.id IS 'Khóa chính tự tăng';
COMMENT ON COLUMN color_supplier.color_id IS 'FK đến bảng colors - mã màu';
COMMENT ON COLUMN color_supplier.supplier_id IS 'FK đến bảng suppliers - mã nhà cung cấp';
COMMENT ON COLUMN color_supplier.price_per_kg IS 'Giá mỗi kg (VND)';
COMMENT ON COLUMN color_supplier.min_order_qty IS 'Số lượng đặt tối thiểu (kg)';
COMMENT ON COLUMN color_supplier.is_active IS 'Trạng thái hoạt động - TRUE=đang cung cấp, FALSE=ngừng cung cấp';
COMMENT ON COLUMN color_supplier.created_at IS 'Thời điểm tạo bản ghi';
COMMENT ON COLUMN color_supplier.updated_at IS 'Thời điểm cập nhật gần nhất';

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_color_supplier_color_id ON color_supplier(color_id);
CREATE INDEX idx_color_supplier_supplier_id ON color_supplier(supplier_id);
CREATE INDEX idx_color_supplier_is_active ON color_supplier(is_active) WHERE is_active = TRUE;

-- ============================================================================
-- TRIGGER: Update updated_at on modification
-- Uses existing update_updated_at_column() from thread_types migration
-- ============================================================================

CREATE TRIGGER trigger_color_supplier_updated_at
    BEFORE UPDATE ON color_supplier
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
