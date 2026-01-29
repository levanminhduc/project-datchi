-- Create positions table
CREATE TABLE IF NOT EXISTS positions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,           -- e.g., 'quan_ly', 'nhan_vien', 'truong_phong'
  display_name VARCHAR(100) NOT NULL,         -- e.g., 'Quản Lý', 'Nhân Viên', 'Trưởng Phòng'
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initial data
INSERT INTO positions (name, display_name) VALUES
  ('quan_ly', 'Quản Lý'),
  ('nhan_vien', 'Nhân Viên'),
  ('truong_phong', 'Trưởng Phòng'),
  ('nhan_vien_ky_thuat', 'Nhân Viên Kỹ Thuật'),
  ('giam_doc', 'Giám Đốc'),
  ('pho_giam_doc', 'Phó Giám Đốc')
ON CONFLICT (name) DO NOTHING;

-- Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_positions_updated_at BEFORE UPDATE
    ON positions FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
