-- =============================================
-- WAREHOUSE HIERARCHY SEED DATA
-- Part of: warehouse-hierarchy change
-- Description: Seed LOCATION and STORAGE warehouses with hierarchy
-- =============================================

-- =============================================
-- 1. INSERT LOCATION RECORDS (Parent locations)
-- =============================================

-- Điện Bàn - Main owned facility
INSERT INTO warehouses (code, name, location, type, parent_id, sort_order, is_active) VALUES
  ('DB', 'Điện Bàn', 'Điện Bàn, Quảng Nam', 'LOCATION', NULL, 1, true)
ON CONFLICT (code) DO UPDATE SET
  type = 'LOCATION',
  parent_id = NULL,
  sort_order = 1;

-- Phú Tường - Rented facility  
INSERT INTO warehouses (code, name, location, type, parent_id, sort_order, is_active) VALUES
  ('PT', 'Phú Tường', 'Phú Tường, Đà Nẵng', 'LOCATION', NULL, 2, true)
ON CONFLICT (code) DO UPDATE SET
  type = 'LOCATION',
  parent_id = NULL,
  sort_order = 2;

-- =============================================
-- 2. INSERT STORAGE RECORDS (Under Điện Bàn)
-- =============================================

-- Kho Dệt Kim - Under Điện Bàn
INSERT INTO warehouses (code, name, location, type, parent_id, sort_order, is_active) VALUES
  ('DB-DK', 'Kho Dệt Kim', 'Xưởng Dệt Kim, Điện Bàn', 'STORAGE', 
   (SELECT id FROM warehouses WHERE code = 'DB'), 1, true)
ON CONFLICT (code) DO UPDATE SET
  type = 'STORAGE',
  parent_id = (SELECT id FROM warehouses WHERE code = 'DB'),
  sort_order = 1;

-- Kho Xưởng Nhật - Under Điện Bàn
INSERT INTO warehouses (code, name, location, type, parent_id, sort_order, is_active) VALUES
  ('DB-XN', 'Kho Xưởng Nhật', 'Xưởng Nhật, Điện Bàn', 'STORAGE',
   (SELECT id FROM warehouses WHERE code = 'DB'), 2, true)
ON CONFLICT (code) DO UPDATE SET
  type = 'STORAGE',
  parent_id = (SELECT id FROM warehouses WHERE code = 'DB'),
  sort_order = 2;

-- Kho Xưởng Trước - Under Điện Bàn
INSERT INTO warehouses (code, name, location, type, parent_id, sort_order, is_active) VALUES
  ('DB-XT', 'Kho Xưởng Trước', 'Xưởng Trước, Điện Bàn', 'STORAGE',
   (SELECT id FROM warehouses WHERE code = 'DB'), 3, true)
ON CONFLICT (code) DO UPDATE SET
  type = 'STORAGE',
  parent_id = (SELECT id FROM warehouses WHERE code = 'DB'),
  sort_order = 3;

-- =============================================
-- 3. INSERT STORAGE RECORDS (Under Phú Tường)
-- =============================================

-- Kho Phú Tường - Under Phú Tường (single storage)
INSERT INTO warehouses (code, name, location, type, parent_id, sort_order, is_active) VALUES
  ('PT-01', 'Kho Phú Tường', 'Kho thuê, Phú Tường', 'STORAGE',
   (SELECT id FROM warehouses WHERE code = 'PT'), 1, true)
ON CONFLICT (code) DO UPDATE SET
  type = 'STORAGE',
  parent_id = (SELECT id FROM warehouses WHERE code = 'PT'),
  sort_order = 1;

-- =============================================
-- 4. UPDATE EXISTING WAREHOUSES TO STORAGE
-- Assign existing test warehouses to Điện Bàn
-- =============================================

-- Update WH-01, WH-02, WH-03 from original seed to be STORAGE under Điện Bàn
UPDATE warehouses 
SET type = 'STORAGE',
    parent_id = (SELECT id FROM warehouses WHERE code = 'DB'),
    sort_order = sort_order + 10
WHERE code IN ('WH-01', 'WH-02', 'WH-03')
  AND type IS NULL OR type = 'STORAGE';

-- =============================================
-- VERIFICATION QUERY
-- =============================================
-- SELECT 
--   w.id, w.code, w.name, w.type, w.parent_id, w.sort_order,
--   p.code as parent_code, p.name as parent_name
-- FROM warehouses w
-- LEFT JOIN warehouses p ON w.parent_id = p.id
-- ORDER BY COALESCE(w.parent_id, w.id), w.sort_order;
