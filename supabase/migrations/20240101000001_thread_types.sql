-- ============================================================================
-- Thread Management System - Thread Types Table
-- Migration: 001_thread_types.sql
-- Description: Master data table for thread specifications
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Create thread_material enum for thread composition classification
CREATE TYPE thread_material AS ENUM (
    'polyester',  -- Chỉ Polyester
    'cotton',     -- Chỉ Cotton
    'nylon',      -- Chỉ Nylon
    'silk',       -- Chỉ Lụa
    'rayon',      -- Chỉ Rayon
    'mixed'       -- Chỉ Pha
);

-- ============================================================================
-- FUNCTION: update_updated_at_column
-- Auto-update updated_at timestamp on row updates
-- Note: Created if not exists to avoid conflicts with other migrations
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TABLE: thread_types
-- Master data for thread specifications including density conversion factors
-- ============================================================================

CREATE TABLE IF NOT EXISTS thread_types (
    -- Primary key
    id SERIAL PRIMARY KEY,
    
    -- Thread identification
    code VARCHAR(50) UNIQUE NOT NULL,           -- Mã chỉ SKU (e.g., 'T-RED-40', 'TEX40-WHT-001')
    name VARCHAR(200) NOT NULL,                 -- Tên hiển thị
    
    -- Color specifications
    color VARCHAR(50),                          -- Tên màu (e.g., 'Đỏ', 'Xanh dương')
    color_code VARCHAR(7),                      -- Mã màu Hex (e.g., '#FF0000')
    
    -- Thread physical properties
    material thread_material DEFAULT 'polyester', -- Chất liệu chỉ
    tex_number DECIMAL(8,2),                    -- Độ dày chỉ theo hệ TEX (grams/1000m)
    
    -- CRITICAL: Conversion factor for weight-to-meters calculation
    -- Formula: meters = (weight_grams / density_grams_per_meter)
    -- High precision (6 decimals) required for accurate inventory tracking
    density_grams_per_meter DECIMAL(10,6) NOT NULL, -- Hệ số chuyển đổi (g/m)
    
    -- Standard cone specifications
    meters_per_cone DECIMAL(12,2),              -- Số mét tiêu chuẩn/cuộn đầy
    
    -- Supplier information
    supplier VARCHAR(200),                      -- Tên nhà cung cấp
    
    -- Reorder management
    reorder_level_meters DECIMAL(12,2) DEFAULT 1000, -- Mức cảnh báo đặt hàng lại (mét)
    lead_time_days INTEGER DEFAULT 7,           -- Thời gian giao hàng của NCC (ngày)
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,             -- Còn sử dụng hay không
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add table comment
COMMENT ON TABLE thread_types IS 'Master data for thread specifications - Bảng dữ liệu chủ về thông số chỉ may';

-- Add column comments
COMMENT ON COLUMN thread_types.code IS 'Thread SKU code - Mã SKU chỉ (unique)';
COMMENT ON COLUMN thread_types.name IS 'Display name - Tên hiển thị';
COMMENT ON COLUMN thread_types.color IS 'Color name - Tên màu sắc';
COMMENT ON COLUMN thread_types.color_code IS 'Hex color code - Mã màu Hex (#RRGGBB)';
COMMENT ON COLUMN thread_types.material IS 'Thread material type - Loại chất liệu chỉ';
COMMENT ON COLUMN thread_types.tex_number IS 'TEX number (thread thickness) - Độ mảnh TEX';
COMMENT ON COLUMN thread_types.density_grams_per_meter IS 'Weight-to-length conversion factor - Hệ số chuyển đổi khối lượng sang chiều dài';
COMMENT ON COLUMN thread_types.meters_per_cone IS 'Standard meters per full cone - Số mét tiêu chuẩn mỗi cuộn đầy';
COMMENT ON COLUMN thread_types.supplier IS 'Supplier name - Tên nhà cung cấp';
COMMENT ON COLUMN thread_types.reorder_level_meters IS 'Reorder alert threshold in meters - Ngưỡng cảnh báo đặt hàng lại (mét)';
COMMENT ON COLUMN thread_types.lead_time_days IS 'Supplier lead time in days - Thời gian giao hàng NCC (ngày)';
COMMENT ON COLUMN thread_types.is_active IS 'Active status - Trạng thái hoạt động';

-- ============================================================================
-- TRIGGER: Auto-update updated_at on row modification
-- ============================================================================

CREATE TRIGGER update_thread_types_updated_at
    BEFORE UPDATE ON thread_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INDEXES: Optimize common query patterns
-- ============================================================================

-- Primary lookup by code (already unique, but explicit index for clarity)
CREATE INDEX IF NOT EXISTS idx_thread_types_code ON thread_types(code);

-- Filter by color for production matching
CREATE INDEX IF NOT EXISTS idx_thread_types_color ON thread_types(color);

-- Filter by material type
CREATE INDEX IF NOT EXISTS idx_thread_types_material ON thread_types(material);

-- Filter active/inactive threads (partial index for active only)
CREATE INDEX IF NOT EXISTS idx_thread_types_active ON thread_types(is_active) WHERE is_active = TRUE;

-- Filter by supplier for procurement
CREATE INDEX IF NOT EXISTS idx_thread_types_supplier ON thread_types(supplier);

-- ============================================================================
-- SEED DATA (Optional - uncomment if needed for testing)
-- ============================================================================

-- INSERT INTO thread_types (code, name, color, color_code, material, tex_number, density_grams_per_meter, meters_per_cone, supplier, reorder_level_meters, lead_time_days)
-- VALUES
--     ('T-RED-40', 'Chỉ Polyester Đỏ TEX40', 'Đỏ', '#FF0000', 'polyester', 40.00, 0.040000, 5000.00, 'Công ty TNHH ABC', 1000.00, 7),
--     ('T-BLU-40', 'Chỉ Polyester Xanh TEX40', 'Xanh dương', '#0000FF', 'polyester', 40.00, 0.040000, 5000.00, 'Công ty TNHH ABC', 1000.00, 7),
--     ('T-WHT-60', 'Chỉ Cotton Trắng TEX60', 'Trắng', '#FFFFFF', 'cotton', 60.00, 0.060000, 3000.00, 'Công ty XYZ', 1500.00, 10),
--     ('T-BLK-40', 'Chỉ Polyester Đen TEX40', 'Đen', '#000000', 'polyester', 40.00, 0.040000, 5000.00, 'Công ty TNHH ABC', 1000.00, 7),
--     ('T-GRN-50', 'Chỉ Nylon Xanh Lá TEX50', 'Xanh lá', '#00FF00', 'nylon', 50.00, 0.050000, 4000.00, 'Công ty DEF', 800.00, 5)
-- ON CONFLICT (code) DO NOTHING;
