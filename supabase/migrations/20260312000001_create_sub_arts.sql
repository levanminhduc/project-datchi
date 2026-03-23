-- ============================================================================
-- Migration: 20260312000001_create_sub_arts.sql
-- Description: Tao bang sub_arts va them sub_art_id vao thread_issue_lines
-- Dependencies: styles, thread_issue_lines
-- ============================================================================

-- ============================================================================
-- SECTION 1: TABLE sub_arts
-- Luu thong tin sub-article cho tung ma hang
-- Mot ma hang co the co 0..N sub_arts
-- ============================================================================

CREATE TABLE sub_arts (
    id SERIAL PRIMARY KEY,
    style_id INTEGER NOT NULL REFERENCES styles(id) ON DELETE CASCADE,
    sub_art_code VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_sub_arts_style_sub_art_code UNIQUE (style_id, sub_art_code)
);

COMMENT ON TABLE sub_arts IS 'Bang sub-article - Phan loai phu cua ma hang';
COMMENT ON COLUMN sub_arts.id IS 'Khoa chinh tu tang';
COMMENT ON COLUMN sub_arts.style_id IS 'FK den styles - Ma hang cha';
COMMENT ON COLUMN sub_arts.sub_art_code IS 'Ma sub-article';
COMMENT ON COLUMN sub_arts.created_at IS 'Thoi diem tao ban ghi';

CREATE INDEX idx_sub_arts_style_id ON sub_arts(style_id);

-- ============================================================================
-- SECTION 2: ALTER thread_issue_lines
-- Them cot sub_art_id (nullable) de luu sub-article khi xuat kho
-- ============================================================================

ALTER TABLE thread_issue_lines
    ADD COLUMN sub_art_id INTEGER REFERENCES sub_arts(id) ON DELETE RESTRICT;

COMMENT ON COLUMN thread_issue_lines.sub_art_id IS 'FK den sub_arts - Sub-article (nullable, chi khi ma hang co sub_arts)';

CREATE INDEX idx_thread_issue_lines_sub_art_id ON thread_issue_lines(sub_art_id);

-- ============================================================================
-- SECTION 3: Reload PostgREST schema cache
-- ============================================================================

NOTIFY pgrst, 'reload schema';
