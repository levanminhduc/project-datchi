-- ============================================================================
-- Batch Tracking System - Batch Transactions Table
-- Migration: 20240101000017_batch_transactions.sql
-- Description: Audit log for batch operations (receive, transfer, issue, return)
-- Dependencies: lots, warehouses
-- ============================================================================

-- ============================================================================
-- ENUM: batch_operation_type
-- Types of batch operations
-- ============================================================================

CREATE TYPE batch_operation_type AS ENUM (
    'RECEIVE',      -- Nhập kho hàng loạt
    'TRANSFER',     -- Chuyển kho hàng loạt
    'ISSUE',        -- Xuất kho hàng loạt
    'RETURN'        -- Trả lại hàng loạt
);

COMMENT ON TYPE batch_operation_type IS 'Types of batch operations - Loại thao tác hàng loạt';

-- ============================================================================
-- TABLE: batch_transactions
-- Audit log for all batch operations
-- ============================================================================

CREATE TABLE batch_transactions (
    id SERIAL PRIMARY KEY,
    
    -- Operation type
    operation_type batch_operation_type NOT NULL,
    
    -- References
    lot_id INTEGER REFERENCES lots(id),
    from_warehouse_id INTEGER REFERENCES warehouses(id),
    to_warehouse_id INTEGER REFERENCES warehouses(id),
    
    -- What was moved
    cone_ids INTEGER[] NOT NULL,                       -- Array of cone IDs in batch
    cone_count INTEGER NOT NULL,                       -- Count for quick reference
    
    -- Context
    reference_number VARCHAR(50),                      -- PO number, DO number, etc.
    recipient VARCHAR(200),                            -- Người nhận (for ISSUE)
    notes TEXT,
    
    -- Audit
    performed_by VARCHAR(100),
    performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add column comments (Vietnamese)
COMMENT ON TABLE batch_transactions IS 'Bảng lưu lịch sử các thao tác hàng loạt (nhập/xuất/chuyển kho)';
COMMENT ON COLUMN batch_transactions.id IS 'Khóa chính tự tăng';
COMMENT ON COLUMN batch_transactions.operation_type IS 'Loại thao tác: RECEIVE=nhập kho, TRANSFER=chuyển kho, ISSUE=xuất kho, RETURN=trả lại';
COMMENT ON COLUMN batch_transactions.lot_id IS 'Lô hàng liên quan (nếu có)';
COMMENT ON COLUMN batch_transactions.from_warehouse_id IS 'Kho nguồn (cho chuyển/xuất kho)';
COMMENT ON COLUMN batch_transactions.to_warehouse_id IS 'Kho đích (cho nhập/chuyển kho)';
COMMENT ON COLUMN batch_transactions.cone_ids IS 'Mảng ID các cuộn trong thao tác này';
COMMENT ON COLUMN batch_transactions.cone_count IS 'Số lượng cuộn (để truy vấn nhanh)';
COMMENT ON COLUMN batch_transactions.reference_number IS 'Số tham chiếu bên ngoài (số PO, phiếu xuất kho, v.v.)';
COMMENT ON COLUMN batch_transactions.recipient IS 'Người nhận hàng (cho thao tác xuất kho)';
COMMENT ON COLUMN batch_transactions.notes IS 'Ghi chú thêm về thao tác';
COMMENT ON COLUMN batch_transactions.performed_by IS 'Người thực hiện thao tác';
COMMENT ON COLUMN batch_transactions.performed_at IS 'Thời điểm thực hiện thao tác';

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_batch_transactions_lot_id ON batch_transactions(lot_id);
CREATE INDEX idx_batch_transactions_operation_type ON batch_transactions(operation_type);
CREATE INDEX idx_batch_transactions_performed_at ON batch_transactions(performed_at DESC);
CREATE INDEX idx_batch_transactions_from_warehouse ON batch_transactions(from_warehouse_id);
CREATE INDEX idx_batch_transactions_to_warehouse ON batch_transactions(to_warehouse_id);
CREATE INDEX idx_batch_transactions_reference ON batch_transactions(reference_number) WHERE reference_number IS NOT NULL;
