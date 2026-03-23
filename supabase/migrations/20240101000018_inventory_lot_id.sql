-- ============================================================================
-- Batch Tracking System - Add lot_id to thread_inventory
-- Migration: 20240101000018_inventory_lot_id.sql
-- Description: Add lot_id FK column to thread_inventory for lot linking
-- Dependencies: lots, thread_inventory
-- ============================================================================

-- ============================================================================
-- ADD lot_id COLUMN
-- Nullable FK to allow gradual migration of existing data
-- ============================================================================

ALTER TABLE thread_inventory 
    ADD COLUMN lot_id INTEGER REFERENCES lots(id);

COMMENT ON COLUMN thread_inventory.lot_id IS 'Tham chiếu đến lô hàng trong bảng lots (nullable để hỗ trợ dữ liệu cũ)';

-- ============================================================================
-- INDEX for lot_id lookups
-- ============================================================================

CREATE INDEX idx_thread_inventory_lot_id ON thread_inventory(lot_id) WHERE lot_id IS NOT NULL;
