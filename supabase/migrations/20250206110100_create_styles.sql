-- ============================================================================
-- Migration: 20250206110100_create_styles.sql
-- Description: Bang ma hang (Styles)
-- Dependencies: None
-- ============================================================================

-- ============================================================================
-- TABLE: styles
-- ============================================================================

CREATE TABLE styles (
    id SERIAL PRIMARY KEY,
    
    -- Style information
    style_code VARCHAR(50) NOT NULL UNIQUE,
    style_name VARCHAR(255) NOT NULL,
    description TEXT,
    fabric_type VARCHAR(100),
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- COMMENTS (Vietnamese + English)
-- ============================================================================

COMMENT ON TABLE styles IS 'Bang ma hang san pham - Product Style Master Data';

COMMENT ON COLUMN styles.id IS 'Khoa chinh tu tang';
COMMENT ON COLUMN styles.style_code IS 'Ma hang (unique) - Style Code';
COMMENT ON COLUMN styles.style_name IS 'Ten ma hang - Style Name';
COMMENT ON COLUMN styles.description IS 'Mo ta ma hang - Description';
COMMENT ON COLUMN styles.fabric_type IS 'Loai vai - Fabric Type';
COMMENT ON COLUMN styles.created_at IS 'Thoi diem tao ban ghi';
COMMENT ON COLUMN styles.updated_at IS 'Thoi diem cap nhat gan nhat';

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_styles_style_code ON styles(style_code);
CREATE INDEX idx_styles_style_name ON styles(style_name);

-- ============================================================================
-- TRIGGER: Update updated_at on modification
-- ============================================================================

CREATE TRIGGER trigger_styles_updated_at
    BEFORE UPDATE ON styles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
