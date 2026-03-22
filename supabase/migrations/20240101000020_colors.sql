-- ============================================================================
-- Thread Restructure Phase 1 - Colors Master Table
-- Migration: 20240101000020_colors.sql
-- Description: Master data table for standardized color definitions
-- Dependencies: update_updated_at_column() function from thread_types migration
-- ============================================================================

-- ============================================================================
-- TABLE: colors
-- Master data for standardized color definitions with optional industry codes
-- ============================================================================

CREATE TABLE colors (
    id SERIAL PRIMARY KEY,
    
    name VARCHAR(100) NOT NULL UNIQUE,
    hex_code VARCHAR(7) NOT NULL,
    pantone_code VARCHAR(20),
    ral_code VARCHAR(20),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- COMMENTS (Vietnamese)
-- ============================================================================

COMMENT ON TABLE colors IS 'Bảng danh mục màu sắc chuẩn - Colors master data';
COMMENT ON COLUMN colors.id IS 'Khóa chính tự tăng';
COMMENT ON COLUMN colors.name IS 'Tên màu (unique) - VD: Đỏ, Xanh dương';
COMMENT ON COLUMN colors.hex_code IS 'Mã màu Hex (#RRGGBB) - VD: #FF0000';
COMMENT ON COLUMN colors.pantone_code IS 'Mã màu Pantone (tùy chọn) - VD: 186C';
COMMENT ON COLUMN colors.ral_code IS 'Mã màu RAL (tùy chọn) - VD: RAL 3020';
COMMENT ON COLUMN colors.is_active IS 'Trạng thái hoạt động - TRUE=đang dùng, FALSE=ngừng dùng';
COMMENT ON COLUMN colors.created_at IS 'Thời điểm tạo bản ghi';
COMMENT ON COLUMN colors.updated_at IS 'Thời điểm cập nhật gần nhất';

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_colors_name ON colors(name);
CREATE INDEX idx_colors_is_active ON colors(is_active) WHERE is_active = TRUE;

-- ============================================================================
-- TRIGGER: Update updated_at on modification
-- Uses existing update_updated_at_column() from thread_types migration
-- ============================================================================

CREATE TRIGGER trigger_colors_updated_at
    BEFORE UPDATE ON colors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
