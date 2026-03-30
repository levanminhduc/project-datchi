INSERT INTO public.permissions (code, name, description, module, resource, action, route_path, is_page_access, sort_order)
VALUES ('settings.manage', 'Quản lý Cài Đặt', 'Quyền quản lý cài đặt hệ thống (bao gồm kênh thông báo)', 'settings', 'main', 'MANAGE', NULL, false, 402)
ON CONFLICT (code) DO NOTHING;
