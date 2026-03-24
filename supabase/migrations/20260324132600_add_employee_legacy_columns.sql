-- Thêm các cột từ schema cũ vào bảng employees để hỗ trợ import data
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS cccd_hash        text,
  ADD COLUMN IF NOT EXISTS phone_number     varchar(20),
  ADD COLUMN IF NOT EXISTS password_hash    text,
  ADD COLUMN IF NOT EXISTS password_version integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_password_change_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS recovery_fail_count     integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS recovery_locked_until   timestamp with time zone;
