INSERT INTO system_settings (key, value, description)
VALUES (
  'employee_detail_fields',
  '{
    "fields": [
      { "key": "employee_id", "label": "Mã nhân viên", "visible": true, "order": 1, "required": true },
      { "key": "full_name", "label": "Họ tên", "visible": true, "order": 2, "required": true },
      { "key": "department", "label": "Phòng ban", "visible": true, "order": 3 },
      { "key": "chuc_vu", "label": "Chức vụ", "visible": true, "order": 4 },
      { "key": "is_active", "label": "Trạng thái", "visible": true, "order": 5 },
      { "key": "created_at", "label": "Ngày tạo", "visible": true, "order": 6 },
      { "key": "updated_at", "label": "Cập nhật lần cuối", "visible": true, "order": 7 },
      { "key": "last_login_at", "label": "Lần đăng nhập cuối", "visible": false, "order": 8 },
      { "key": "must_change_password", "label": "Phải đổi mật khẩu", "visible": false, "order": 9 },
      { "key": "password_changed_at", "label": "Đổi MK lần cuối", "visible": false, "order": 10 },
      { "key": "failed_login_attempts", "label": "Số lần đăng nhập sai", "visible": false, "order": 11 },
      { "key": "locked_until", "label": "Khóa tài khoản đến", "visible": false, "order": 12 }
    ]
  }'::jsonb,
  'Cấu hình các trường hiển thị trong dialog chi tiết nhân viên'
)
ON CONFLICT (key) DO NOTHING;
