-- ============================================
-- EMPLOYEES TABLE
-- Must run BEFORE auth_permissions migration
-- ============================================

CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  employee_id VARCHAR(50) UNIQUE NOT NULL,  -- Mã Nhân Viên
  full_name VARCHAR(255) NOT NULL,          -- Tên Nhân Viên
  department VARCHAR(100),                   -- Phòng Ban
  chuc_vu VARCHAR(50) DEFAULT 'nhan_vien',  -- Chức Vụ
  is_active BOOLEAN DEFAULT true,           -- Trạng thái
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_employees_employee_id ON employees(employee_id);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);
CREATE INDEX IF NOT EXISTS idx_employees_is_active ON employees(is_active);

-- Trigger to update updated_at on row update
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_employees_updated_at ON employees;
CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert test employee for development
INSERT INTO employees (employee_id, full_name, department, chuc_vu, is_active) VALUES
  ('ROOT001', 'System Administrator', 'IT', 'admin', true),
  ('NV001', 'Nguyễn Văn A', 'Kho', 'nhan_vien', true),
  ('NV002', 'Trần Thị B', 'Kế hoạch', 'nhan_vien', true)
ON CONFLICT (employee_id) DO NOTHING;
