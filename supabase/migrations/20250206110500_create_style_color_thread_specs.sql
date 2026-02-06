-- ============================================================================
-- Migration: 20250206110500_create_style_color_thread_specs.sql
-- Description: Bang dinh muc chi chi tiet theo mau - Color-specific thread specs
-- Dependencies: style_thread_specs, colors, thread_types
-- ============================================================================

-- ============================================================================
-- TABLE: style_color_thread_specs
-- ============================================================================

CREATE TABLE style_color_thread_specs (
    id SERIAL PRIMARY KEY,
    
    -- Foreign Keys
    style_thread_spec_id INTEGER NOT NULL REFERENCES style_thread_specs(id) ON DELETE CASCADE,
    color_id INTEGER NOT NULL REFERENCES colors(id) ON DELETE RESTRICT,
    thread_type_id INTEGER NOT NULL REFERENCES thread_types(id) ON DELETE RESTRICT,
    
    -- Additional notes
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(style_thread_spec_id, color_id)
);

-- ============================================================================
-- COMMENTS (Vietnamese + English)
-- ============================================================================

COMMENT ON TABLE style_color_thread_specs IS 'Bang dinh muc chi chi tiet theo mau - Color-specific thread specs';

COMMENT ON COLUMN style_color_thread_specs.id IS 'Khoa chinh tu tang';
COMMENT ON COLUMN style_color_thread_specs.style_thread_spec_id IS 'FK den bang style_thread_specs - Template dinh muc';
COMMENT ON COLUMN style_color_thread_specs.color_id IS 'FK den bang colors - Ma mau chi cu the';
COMMENT ON COLUMN style_color_thread_specs.thread_type_id IS 'FK den bang thread_types - Loai chi day du (NCC + Tex + Mau)';
COMMENT ON COLUMN style_color_thread_specs.notes IS 'Ghi chu';
COMMENT ON COLUMN style_color_thread_specs.created_at IS 'Thoi diem tao ban ghi';
COMMENT ON COLUMN style_color_thread_specs.updated_at IS 'Thoi diem cap nhat gan nhat';

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_style_color_thread_specs_spec_id ON style_color_thread_specs(style_thread_spec_id);
CREATE INDEX idx_style_color_thread_specs_color_id ON style_color_thread_specs(color_id);
CREATE INDEX idx_style_color_thread_specs_thread_type_id ON style_color_thread_specs(thread_type_id);

-- ============================================================================
-- TRIGGER: Update updated_at on modification
-- ============================================================================

CREATE TRIGGER trigger_style_color_thread_specs_updated_at
    BEFORE UPDATE ON style_color_thread_specs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
