BEGIN;

ALTER TABLE thread_order_weeks
  ADD COLUMN IF NOT EXISTS leader_signed_by INTEGER REFERENCES employees(id),
  ADD COLUMN IF NOT EXISTS leader_signed_at TIMESTAMPTZ;

INSERT INTO permissions (code, name, description, module, resource, action, route_path, is_page_access, sort_order)
VALUES (
  'thread.leader.sign',
  'Lãnh Đạo Ký Duyệt',
  'Quyền ký duyệt đơn đặt hàng tuần',
  'thread',
  'leader',
  'MANAGE',
  '/thread/weekly-order/leader-review',
  true,
  65
)
ON CONFLICT (code) DO NOTHING;

NOTIFY pgrst, 'reload schema';

COMMIT;
