-- ============================================================================
-- Thread Restructure Phase 1 - Suppliers Master Table
-- Migration: 20240101000021_suppliers.sql
-- Description: Master data table for supplier information
-- Dependencies: update_updated_at_column() function from thread_types migration
-- ============================================================================

-- ============================================================================
-- TABLE: suppliers
-- Master data for supplier information with contact details
-- ============================================================================

CREATE TABLE suppliers (
    id SERIAL PRIMARY KEY,
    
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    contact_name VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    lead_time_days INTEGER DEFAULT 7,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- COMMENTS (Vietnamese)
-- ============================================================================

COMMENT ON TABLE suppliers IS 'Bảng danh mục nhà cung cấp - Suppliers master data';
COMMENT ON COLUMN suppliers.id IS 'Khóa chính tự tăng';
COMMENT ON COLUMN suppliers.code IS 'Mã nhà cung cấp (unique) - VD: SUP-001, NCC-ABC';
COMMENT ON COLUMN suppliers.name IS 'Tên đầy đủ nhà cung cấp';
COMMENT ON COLUMN suppliers.contact_name IS 'Tên người liên hệ';
COMMENT ON COLUMN suppliers.phone IS 'Số điện thoại liên hệ';
COMMENT ON COLUMN suppliers.email IS 'Email liên hệ';
COMMENT ON COLUMN suppliers.address IS 'Địa chỉ nhà cung cấp';
COMMENT ON COLUMN suppliers.lead_time_days IS 'Thời gian giao hàng tiêu chuẩn (ngày)';
COMMENT ON COLUMN suppliers.is_active IS 'Trạng thái hoạt động - TRUE=đang hợp tác, FALSE=ngừng hợp tác';
COMMENT ON COLUMN suppliers.created_at IS 'Thời điểm tạo bản ghi';
COMMENT ON COLUMN suppliers.updated_at IS 'Thời điểm cập nhật gần nhất';

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_suppliers_code ON suppliers(code);
CREATE INDEX idx_suppliers_name ON suppliers(name);
CREATE INDEX idx_suppliers_is_active ON suppliers(is_active) WHERE is_active = TRUE;

-- ============================================================================
-- TRIGGER: Update updated_at on modification
-- Uses existing update_updated_at_column() from thread_types migration
-- ============================================================================

CREATE TRIGGER trigger_suppliers_updated_at
    BEFORE UPDATE ON suppliers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
