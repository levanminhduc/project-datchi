-- ============================================================================
-- Thread Type - Supplier Junction Table
-- Migration: 20240101000026_thread_type_supplier.sql
-- Description: Junction table for many-to-many thread_type-supplier relationship
--              Each thread type can be sourced from multiple suppliers,
--              each with their own supplier_item_code and unit_price
-- Dependencies: thread_types, suppliers tables
-- ============================================================================

-- ============================================================================
-- TABLE: thread_type_supplier
-- Junction table linking thread types to suppliers with supplier-specific info
-- ============================================================================

CREATE TABLE thread_type_supplier (
    id SERIAL PRIMARY KEY,
    
    -- Foreign Keys
    thread_type_id INTEGER NOT NULL REFERENCES thread_types(id) ON DELETE CASCADE,
    supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    
    -- Supplier-specific data
    supplier_item_code VARCHAR(100) NOT NULL,  -- Mã hàng của NCC (e.g., Astra-9700, Perma-9700)
    unit_price DECIMAL(12,4),                  -- Giá mỗi đơn vị (có thể USD hoặc VND)
    
    -- Metadata
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT,                                -- Ghi chú thêm
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(thread_type_id, supplier_id),       -- Mỗi cặp thread_type-supplier chỉ có 1 bản ghi
    UNIQUE(supplier_id, supplier_item_code)    -- Mã hàng của NCC phải unique trong NCC đó
);

-- ============================================================================
-- COMMENTS (Vietnamese + English)
-- ============================================================================

COMMENT ON TABLE thread_type_supplier IS 'Bảng liên kết loại chỉ - nhà cung cấp với mã hàng và giá riêng - Thread Type-Supplier junction with supplier-specific item codes and pricing';

COMMENT ON COLUMN thread_type_supplier.id IS 'Khóa chính tự tăng';
COMMENT ON COLUMN thread_type_supplier.thread_type_id IS 'FK đến bảng thread_types - mã loại chỉ';
COMMENT ON COLUMN thread_type_supplier.supplier_id IS 'FK đến bảng suppliers - mã nhà cung cấp';
COMMENT ON COLUMN thread_type_supplier.supplier_item_code IS 'Mã hàng riêng của NCC (vd: Astra-9700, Perma-9700) - Supplier-specific item code';
COMMENT ON COLUMN thread_type_supplier.unit_price IS 'Giá mỗi đơn vị theo NCC này - Unit price from this supplier';
COMMENT ON COLUMN thread_type_supplier.is_active IS 'Trạng thái hoạt động - TRUE=đang cung cấp, FALSE=ngừng cung cấp';
COMMENT ON COLUMN thread_type_supplier.notes IS 'Ghi chú thêm về mối quan hệ NCC-loại chỉ này';
COMMENT ON COLUMN thread_type_supplier.created_at IS 'Thời điểm tạo bản ghi';
COMMENT ON COLUMN thread_type_supplier.updated_at IS 'Thời điểm cập nhật gần nhất';

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index for looking up suppliers of a thread type
CREATE INDEX idx_thread_type_supplier_thread_type_id ON thread_type_supplier(thread_type_id);

-- Index for looking up thread types of a supplier
CREATE INDEX idx_thread_type_supplier_supplier_id ON thread_type_supplier(supplier_id);

-- Index for active records only (partial index)
CREATE INDEX idx_thread_type_supplier_is_active ON thread_type_supplier(is_active) WHERE is_active = TRUE;

-- Index for searching by supplier item code
CREATE INDEX idx_thread_type_supplier_item_code ON thread_type_supplier(supplier_item_code);

-- ============================================================================
-- TRIGGER: Update updated_at on modification
-- Uses existing update_updated_at_column() from thread_types migration
-- ============================================================================

CREATE TRIGGER trigger_thread_type_supplier_updated_at
    BEFORE UPDATE ON thread_type_supplier
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
