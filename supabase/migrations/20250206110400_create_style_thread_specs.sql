-- ============================================================================
-- Migration: 20250206110400_create_style_thread_specs.sql
-- Description: Bang dinh muc chi template - Template thread specs per style
-- Dependencies: styles, suppliers, thread_types
-- ============================================================================

-- ============================================================================
-- TABLE: style_thread_specs
-- ============================================================================

CREATE TABLE style_thread_specs (
    id SERIAL PRIMARY KEY,
    
    -- Foreign Keys
    style_id INTEGER NOT NULL REFERENCES styles(id) ON DELETE CASCADE,
    supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    
    -- Specification details
    process_name VARCHAR(255) NOT NULL,
    tex_id INTEGER REFERENCES thread_types(id) ON DELETE SET NULL,
    meters_per_unit DECIMAL(10,2) NOT NULL DEFAULT 0,
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- COMMENTS (Vietnamese + English)
-- ============================================================================

COMMENT ON TABLE style_thread_specs IS 'Bang dinh muc chi template - Template thread specs per style';

COMMENT ON COLUMN style_thread_specs.id IS 'Khoa chinh tu tang';
COMMENT ON COLUMN style_thread_specs.style_id IS 'FK den bang styles - Ma hang san pham';
COMMENT ON COLUMN style_thread_specs.supplier_id IS 'FK den bang suppliers - Ma nha cung cap';
COMMENT ON COLUMN style_thread_specs.process_name IS 'Ten cong doan (vd: May than, May tay, v.v.)';
COMMENT ON COLUMN style_thread_specs.tex_id IS 'FK den bang thread_types - Loai chi (Tex)';
COMMENT ON COLUMN style_thread_specs.meters_per_unit IS 'Dinh muc met chi / 1 san pham';
COMMENT ON COLUMN style_thread_specs.notes IS 'Ghi chu';
COMMENT ON COLUMN style_thread_specs.created_at IS 'Thoi diem tao ban ghi';
COMMENT ON COLUMN style_thread_specs.updated_at IS 'Thoi diem cap nhat gan nhat';

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_style_thread_specs_style_id ON style_thread_specs(style_id);
CREATE INDEX idx_style_thread_specs_supplier_id ON style_thread_specs(supplier_id);
CREATE INDEX idx_style_thread_specs_tex_id ON style_thread_specs(tex_id);

-- ============================================================================
-- TRIGGER: Update updated_at on modification
-- ============================================================================

CREATE TRIGGER trigger_style_thread_specs_updated_at
    BEFORE UPDATE ON style_thread_specs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
