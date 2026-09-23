-- ============================================================================
-- Migration: 20260730110000_create_weekly_order_edit_unlocks.sql
-- Description: Cho phep ROOT mo khoa chinh sua mot tuan dat hang trong thoi han
--              va ghi nhat ky thao tac theo tuan
-- Dependencies: thread_order_weeks, thread_audit_log, fn_update_updated_at_column()
-- ============================================================================

CREATE TABLE IF NOT EXISTS weekly_order_edit_unlocks (
    id SERIAL PRIMARY KEY,

    week_id INTEGER NOT NULL REFERENCES thread_order_weeks(id) ON DELETE CASCADE,

    granted_by VARCHAR(100) NOT NULL,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,

    revoked_at TIMESTAMPTZ,
    revoked_by VARCHAR(100),

    reason TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE weekly_order_edit_unlocks IS 'Phien mo khoa chinh sua tuan dat hang danh cho ROOT';

COMMENT ON COLUMN weekly_order_edit_unlocks.week_id IS 'FK den thread_order_weeks - Tuan duoc mo khoa';
COMMENT ON COLUMN weekly_order_edit_unlocks.granted_by IS 'Ma nhan vien ROOT da mo khoa';
COMMENT ON COLUMN weekly_order_edit_unlocks.granted_at IS 'Thoi diem mo khoa';
COMMENT ON COLUMN weekly_order_edit_unlocks.expires_at IS 'Thoi diem het han - sau moc nay guard khoa lai';
COMMENT ON COLUMN weekly_order_edit_unlocks.revoked_at IS 'Thoi diem khoa lai thu cong (NULL neu chua khoa)';
COMMENT ON COLUMN weekly_order_edit_unlocks.revoked_by IS 'Ma nhan vien da khoa lai';
COMMENT ON COLUMN weekly_order_edit_unlocks.reason IS 'Ly do mo khoa';

CREATE INDEX IF NOT EXISTS idx_weekly_order_edit_unlocks_week
    ON weekly_order_edit_unlocks(week_id, expires_at DESC);

CREATE OR REPLACE TRIGGER trigger_weekly_order_edit_unlocks_updated_at
    BEFORE UPDATE ON weekly_order_edit_unlocks
    FOR EACH ROW
    EXECUTE FUNCTION fn_update_updated_at_column();

-- ============================================================================
-- Nhat ky thao tac theo tuan: tai dung thread_audit_log, them cot loc week_id
-- ============================================================================

ALTER TABLE thread_audit_log ADD COLUMN IF NOT EXISTS week_id INTEGER;

COMMENT ON COLUMN thread_audit_log.week_id IS 'Tuan dat hang lien quan (NULL voi cac ban ghi khong thuoc tuan nao)';

CREATE INDEX IF NOT EXISTS idx_audit_week
    ON thread_audit_log(week_id, created_at DESC)
    WHERE week_id IS NOT NULL;
