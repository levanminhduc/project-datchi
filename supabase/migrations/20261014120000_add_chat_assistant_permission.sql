INSERT INTO permissions (code, name, description, module, resource, action, route_path, is_page_access, sort_order)
VALUES (
  'chat.assistant.use',
  'Dùng trợ lý AI',
  'Hỏi trợ lý AI tra cứu tồn kho, mã hàng, đơn hàng trong phạm vi quyền xem của mình',
  'chat',
  'assistant',
  'VIEW',
  '/thread/chat-assistant',
  true,
  924
)
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code IN ('admin', 'warehouse_manager', 'warehouse_staff', 'planning', 'production', 'viewer')
  AND p.code = 'chat.assistant.use'
ON CONFLICT (role_id, permission_id) DO NOTHING;
