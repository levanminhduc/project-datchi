-- ============================================================================
-- Batch Tracking System - Lots Table
-- Migration: 20240101000016_lots.sql
-- Description: Lot entity for batch/lot lifecycle management
-- Dependencies: thread_types, warehouses
-- ============================================================================

-- ============================================================================
-- ENUM: lot_status
-- Represents the lifecycle states of a lot
-- ============================================================================

CREATE TYPE lot_status AS ENUM (
    'ACTIVE',       -- Lô đang hoạt động - có cuộn available
    'DEPLETED',     -- Lô đã hết - không còn cuộn available
    'EXPIRED',      -- Lô đã hết hạn - quá expiry_date
    'QUARANTINE'    -- Lô đang cách ly - có vấn đề QC
);

COMMENT ON TYPE lot_status IS 'Lifecycle states for lots - Trạng thái vòng đời của lô hàng';

-- ============================================================================
-- TABLE: lots
-- Lot entity for tracking batch/lot information
-- ============================================================================

CREATE TABLE lots (
    id SERIAL PRIMARY KEY,
    
    -- Lot identification
    lot_number VARCHAR(50) UNIQUE NOT NULL,           -- Mã lô (e.g., LOT-2026-001)
    
    -- References
    thread_type_id INTEGER NOT NULL REFERENCES thread_types(id),
    warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
    
    -- Lot metadata
    production_date DATE,                              -- Ngày sản xuất
    expiry_date DATE,                                  -- Ngày hết hạn
    supplier VARCHAR(200),                             -- Nhà cung cấp
    
    -- Quantities (denormalized for performance)
    total_cones INTEGER NOT NULL DEFAULT 0,            -- Tổng số cuộn trong lô
    available_cones INTEGER NOT NULL DEFAULT 0,        -- Số cuộn còn available
    
    -- Status
    status lot_status NOT NULL DEFAULT 'ACTIVE',
    
    -- Additional info
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add column comments (Vietnamese)
COMMENT ON TABLE lots IS 'Bảng quản lý lô hàng chỉ - theo dõi vòng đời từ nhập đến xuất kho';
COMMENT ON COLUMN lots.id IS 'Khóa chính tự tăng';
COMMENT ON COLUMN lots.lot_number IS 'Mã lô duy nhất (VD: LOT-2026-001)';
COMMENT ON COLUMN lots.thread_type_id IS 'Tham chiếu đến loại chỉ trong bảng thread_types';
COMMENT ON COLUMN lots.warehouse_id IS 'Kho hiện tại đang chứa lô hàng';
COMMENT ON COLUMN lots.production_date IS 'Ngày sản xuất của lô hàng';
COMMENT ON COLUMN lots.expiry_date IS 'Ngày hết hạn sử dụng';
COMMENT ON COLUMN lots.supplier IS 'Tên nhà cung cấp';
COMMENT ON COLUMN lots.total_cones IS 'Tổng số cuộn trong lô (denormalized để tăng hiệu suất)';
COMMENT ON COLUMN lots.available_cones IS 'Số cuộn còn sẵn sàng sử dụng (chưa xuất kho)';
COMMENT ON COLUMN lots.status IS 'Trạng thái lô: ACTIVE=đang dùng, DEPLETED=đã hết, EXPIRED=hết hạn, QUARANTINE=cách ly';
COMMENT ON COLUMN lots.notes IS 'Ghi chú thêm về lô hàng';
COMMENT ON COLUMN lots.created_at IS 'Thời điểm tạo bản ghi';
COMMENT ON COLUMN lots.updated_at IS 'Thời điểm cập nhật gần nhất';

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_lots_lot_number ON lots(lot_number);
CREATE INDEX idx_lots_status ON lots(status);
CREATE INDEX idx_lots_warehouse_id ON lots(warehouse_id);
CREATE INDEX idx_lots_thread_type_id ON lots(thread_type_id);
CREATE INDEX idx_lots_created_at ON lots(created_at DESC);

-- ============================================================================
-- TRIGGER: Update updated_at on modification
-- ============================================================================

CREATE OR REPLACE FUNCTION update_lots_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_lots_updated_at
    BEFORE UPDATE ON lots
    FOR EACH ROW
    EXECUTE FUNCTION update_lots_updated_at();
