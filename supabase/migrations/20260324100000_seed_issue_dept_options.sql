INSERT INTO system_settings (key, value, description)
VALUES (
  'issue_department_options',
  '{"hidden": [], "custom": []}',
  'Cấu hình bộ phận hiển thị khi tạo phiếu xuất: hidden = ẩn từ employees, custom = bổ sung thêm'
)
ON CONFLICT (key) DO NOTHING;
