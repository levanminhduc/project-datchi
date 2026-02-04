-- ============================================================================
-- Thread Restructure Phase 1 - Add FK Columns to thread_types and lots
-- Migration: 20240101000023_thread_types_fks.sql
-- Description: Add nullable FK columns for expand-contract migration pattern
-- Dependencies: colors, suppliers, color_supplier tables
-- ============================================================================

-- ============================================================================
-- ADD FK COLUMNS TO thread_types
-- Nullable during migration period to allow gradual backfill
-- Existing color and supplier VARCHAR columns kept for dual-write
-- ============================================================================

ALTER TABLE thread_types 
    ADD COLUMN color_id INTEGER REFERENCES colors(id) ON DELETE SET NULL,
    ADD COLUMN supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
    ADD COLUMN color_supplier_id INTEGER REFERENCES color_supplier(id) ON DELETE SET NULL;

-- ============================================================================
-- ADD FK COLUMN TO lots
-- Nullable during migration period to allow gradual backfill
-- Existing supplier VARCHAR column kept for dual-write
-- ============================================================================

ALTER TABLE lots
    ADD COLUMN supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL;

-- ============================================================================
-- COMMENTS (Vietnamese)
-- ============================================================================

COMMENT ON COLUMN thread_types.color_id IS 'FK đến bảng colors (normalized) - nullable trong giai đoạn migration';
COMMENT ON COLUMN thread_types.supplier_id IS 'FK đến bảng suppliers (normalized) - nullable trong giai đoạn migration';
COMMENT ON COLUMN thread_types.color_supplier_id IS 'FK đến bảng color_supplier - tham chiếu giá màu-NCC (tùy chọn)';
COMMENT ON COLUMN lots.supplier_id IS 'FK đến bảng suppliers (normalized) - nullable trong giai đoạn migration';

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_thread_types_color_id ON thread_types(color_id);
CREATE INDEX idx_thread_types_supplier_id ON thread_types(supplier_id);
CREATE INDEX idx_thread_types_color_supplier_id ON thread_types(color_supplier_id);
CREATE INDEX idx_lots_supplier_id ON lots(supplier_id);
