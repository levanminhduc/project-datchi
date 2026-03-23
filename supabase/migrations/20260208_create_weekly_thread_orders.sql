-- ============================================================================
-- Migration: 20260208_create_weekly_thread_orders.sql
-- Description: Tao bang dat chi theo tuan - Weekly thread ordering tables
-- Dependencies: styles, colors
-- ============================================================================

-- ============================================================================
-- TABLE: thread_order_weeks
-- Tuan dat chi - Each record represents one ordering week
-- ============================================================================

CREATE TABLE thread_order_weeks (
    id SERIAL PRIMARY KEY,

    -- Week information
    week_name VARCHAR(50) NOT NULL,
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    notes TEXT,
    created_by VARCHAR(50),

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE thread_order_weeks IS 'Tuan dat chi - Weekly thread order periods';

COMMENT ON COLUMN thread_order_weeks.id IS 'Khoa chinh tu tang';
COMMENT ON COLUMN thread_order_weeks.week_name IS 'Ten tuan (vd: Tuan 6 - 2026)';
COMMENT ON COLUMN thread_order_weeks.start_date IS 'Ngay bat dau tuan';
COMMENT ON COLUMN thread_order_weeks.end_date IS 'Ngay ket thuc tuan';
COMMENT ON COLUMN thread_order_weeks.status IS 'Trang thai: draft, confirmed, calculated, closed';
COMMENT ON COLUMN thread_order_weeks.notes IS 'Ghi chu';
COMMENT ON COLUMN thread_order_weeks.created_by IS 'Nguoi tao';
COMMENT ON COLUMN thread_order_weeks.created_at IS 'Thoi diem tao ban ghi';
COMMENT ON COLUMN thread_order_weeks.updated_at IS 'Thoi diem cap nhat gan nhat';

-- ============================================================================
-- TRIGGER: Update updated_at on modification
-- ============================================================================

CREATE TRIGGER trigger_thread_order_weeks_updated_at
    BEFORE UPDATE ON thread_order_weeks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE: thread_order_items
-- Chi tiet don dat chi theo tuan - Items per week (style + color + quantity)
-- ============================================================================

CREATE TABLE thread_order_items (
    id SERIAL PRIMARY KEY,

    -- Foreign Keys
    week_id INTEGER NOT NULL REFERENCES thread_order_weeks(id) ON DELETE CASCADE,
    style_id INTEGER NOT NULL REFERENCES styles(id) ON DELETE RESTRICT,
    color_id INTEGER NOT NULL REFERENCES colors(id) ON DELETE RESTRICT,

    -- Order detail
    quantity INTEGER NOT NULL CHECK (quantity > 0),

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Unique constraint: one entry per style+color per week
    UNIQUE(week_id, style_id, color_id)
);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE thread_order_items IS 'Chi tiet don dat chi - Order items per week (style + color + quantity)';

COMMENT ON COLUMN thread_order_items.id IS 'Khoa chinh tu tang';
COMMENT ON COLUMN thread_order_items.week_id IS 'FK den bang thread_order_weeks - Tuan dat chi';
COMMENT ON COLUMN thread_order_items.style_id IS 'FK den bang styles - Ma hang san pham';
COMMENT ON COLUMN thread_order_items.color_id IS 'FK den bang colors - Mau sac';
COMMENT ON COLUMN thread_order_items.quantity IS 'So luong san pham can dat chi (phai > 0)';
COMMENT ON COLUMN thread_order_items.created_at IS 'Thoi diem tao ban ghi';

-- ============================================================================
-- TABLE: thread_order_results
-- Ket qua tinh toan chi cho tuan - Calculation results stored as JSON
-- ============================================================================

CREATE TABLE thread_order_results (
    id SERIAL PRIMARY KEY,

    -- Foreign Key
    week_id INTEGER NOT NULL REFERENCES thread_order_weeks(id) ON DELETE CASCADE,

    -- Result data
    calculation_data JSONB NOT NULL,
    summary_data JSONB NOT NULL,

    -- Timestamps
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- One result set per week
    UNIQUE(week_id)
);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE thread_order_results IS 'Ket qua tinh toan chi - Thread calculation results per week';

COMMENT ON COLUMN thread_order_results.id IS 'Khoa chinh tu tang';
COMMENT ON COLUMN thread_order_results.week_id IS 'FK den bang thread_order_weeks - Tuan dat chi';
COMMENT ON COLUMN thread_order_results.calculation_data IS 'Du lieu tinh toan chi tiet (JSONB)';
COMMENT ON COLUMN thread_order_results.summary_data IS 'Du lieu tong hop (JSONB)';
COMMENT ON COLUMN thread_order_results.calculated_at IS 'Thoi diem tinh toan';

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_thread_order_items_week_id ON thread_order_items(week_id);
CREATE INDEX idx_thread_order_items_style_id ON thread_order_items(style_id);
CREATE INDEX idx_thread_order_weeks_status ON thread_order_weeks(status);
