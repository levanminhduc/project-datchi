-- Add permission for exporting issue history report
-- Export is a read-only operation on issue data, so action uses VIEW.
INSERT INTO permissions (
  code,
  name,
  description,
  module,
  resource,
  action,
  route_path,
  is_page_access,
  sort_order
)
VALUES (
  'thread.issues.export-history',
  'Xuất Báo Cáo Lịch Sử Xuất Chỉ',
  'Cho phép xuất file Excel báo cáo lịch sử xuất chỉ theo khoảng thời gian',
  'thread',
  'issues',
  'VIEW'::permission_action,
  '/thread/issues/export-history',
  true,
  100
)
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE p.code = 'thread.issues.export-history'
  AND r.name IN ('Quản trị viên', 'Quản lý Kho', 'Kế hoạch', 'Xem báo cáo')
ON CONFLICT (role_id, permission_id) DO NOTHING;
