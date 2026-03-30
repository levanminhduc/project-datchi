INSERT INTO permissions (code, name, description, module, resource, action, is_page_access) VALUES
  ('guides.view', 'Xem hướng dẫn', 'Xem danh sách và chi tiết hướng dẫn sử dụng', 'guides', 'guides', 'VIEW', true),
  ('guides.create', 'Tạo hướng dẫn', 'Tạo mới hướng dẫn sử dụng', 'guides', 'guides', 'CREATE', false),
  ('guides.edit', 'Sửa hướng dẫn', 'Chỉnh sửa và xuất bản hướng dẫn sử dụng', 'guides', 'guides', 'EDIT', false)
ON CONFLICT (code) DO NOTHING;
