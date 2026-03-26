-- Migration: 20260305000001_update_warehouses_production.sql
-- Description: Update warehouse data from test (HCM/BD/DN) to production (Điện Bàn/Phú Tường)
-- Mapping:
--   LOC-HCM  → DB    (Điện Bàn - LOCATION)
--   LOC-BD   → PT    (Phú Tường - LOCATION)
--   LOC-DN   → deactivate
--   WH-HCM-01 → DB-DK  (Kho Dệt Kim, under Điện Bàn)
--   WH-HCM-02 → DB-XN  (Kho Xưởng Nhật, under Điện Bàn)
--   WH-BD-01   → DB-XT  (Kho Xưởng Trước, under Điện Bàn)
--   WH-DN-01   → PT-01  (Kho Phú Tường, under Phú Tường)

BEGIN;

-- =============================================
-- 1. RENAME LOCATION: LOC-HCM → DB (Điện Bàn)
-- =============================================
UPDATE warehouses SET
  code = 'DB',
  name = 'Điện Bàn',
  location = 'Điện Bàn, Quảng Nam',
  sort_order = 1,
  updated_at = NOW()
WHERE code = 'LOC-HCM';

-- =============================================
-- 2. RENAME LOCATION: LOC-BD → PT (Phú Tường)
-- =============================================
UPDATE warehouses SET
  code = 'PT',
  name = 'Phú Tường',
  location = 'Phú Tường, Đà Nẵng',
  sort_order = 2,
  updated_at = NOW()
WHERE code = 'LOC-BD';

-- =============================================
-- 3. DEACTIVATE LOC-DN (no data references)
-- =============================================
UPDATE warehouses SET
  is_active = FALSE,
  updated_at = NOW()
WHERE code = 'LOC-DN';

-- =============================================
-- 4. RENAME STORAGE: WH-HCM-01 → DB-DK (Kho Dệt Kim)
--    Keep same parent_id (was LOC-HCM, now DB)
-- =============================================
UPDATE warehouses SET
  code = 'DB-DK',
  name = 'Kho Dệt Kim',
  location = 'Xưởng Dệt Kim, Điện Bàn',
  sort_order = 1,
  updated_at = NOW()
WHERE code = 'WH-HCM-01';

-- =============================================
-- 5. RENAME STORAGE: WH-HCM-02 → DB-XN (Kho Xưởng Nhật)
--    Keep same parent_id (was LOC-HCM, now DB)
-- =============================================
UPDATE warehouses SET
  code = 'DB-XN',
  name = 'Kho Xưởng Nhật',
  location = 'Xưởng Nhật, Điện Bàn',
  sort_order = 2,
  updated_at = NOW()
WHERE code = 'WH-HCM-02';

-- =============================================
-- 6. RENAME STORAGE: WH-BD-01 → DB-XT (Kho Xưởng Trước)
--    Move parent from LOC-BD (now PT) → DB (Điện Bàn)
-- =============================================
UPDATE warehouses SET
  code = 'DB-XT',
  name = 'Kho Xưởng Trước',
  location = 'Xưởng Trước, Điện Bàn',
  parent_id = (SELECT id FROM warehouses WHERE code = 'DB'),
  sort_order = 3,
  updated_at = NOW()
WHERE code = 'WH-BD-01';

-- =============================================
-- 7. RENAME STORAGE: WH-DN-01 → PT-01 (Kho Phú Tường)
--    Move parent from LOC-DN → PT (Phú Tường)
-- =============================================
UPDATE warehouses SET
  code = 'PT-01',
  name = 'Kho Phú Tường',
  location = 'Kho thuê, Phú Tường',
  parent_id = (SELECT id FROM warehouses WHERE code = 'PT'),
  sort_order = 1,
  updated_at = NOW()
WHERE code = 'WH-DN-01';

-- =============================================
-- 8. DEACTIVATE WH-DN-01's old parent (LOC-DN) children orphan check
--    LOC-DN has no more active children → already deactivated in step 3
-- =============================================

COMMIT;
