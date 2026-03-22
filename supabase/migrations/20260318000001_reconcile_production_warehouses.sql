-- Migration: 20260318000001_reconcile_production_warehouses.sql
-- Description: Ensure production warehouse hierarchy matches Điện Bàn / Phú Tường structure

BEGIN;

-- Normalize legacy location codes before upserting current production nodes.
UPDATE warehouses
SET code = 'DB',
    updated_at = NOW()
WHERE code = 'LOC-HCM'
  AND NOT EXISTS (
    SELECT 1
    FROM warehouses
    WHERE code = 'DB'
  );

UPDATE warehouses
SET code = 'PT',
    updated_at = NOW()
WHERE code = 'LOC-BD'
  AND NOT EXISTS (
    SELECT 1
    FROM warehouses
    WHERE code = 'PT'
  );

UPDATE warehouses
SET is_active = FALSE,
    updated_at = NOW()
WHERE code = 'LOC-DN';

-- Ensure the two top-level production warehouse nodes exist.
INSERT INTO warehouses (code, name, location, type, parent_id, sort_order, is_active)
VALUES
  ('DB', 'Kho Điện Bàn', 'Điện Bàn, Quảng Nam', 'LOCATION', NULL, 1, TRUE),
  ('PT', 'Kho Phú Tường', 'Phú Tường, Đà Nẵng', 'LOCATION', NULL, 2, TRUE)
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    location = EXCLUDED.location,
    type = 'LOCATION',
    parent_id = NULL,
    sort_order = EXCLUDED.sort_order,
    is_active = TRUE,
    updated_at = NOW();

-- Normalize legacy storage codes before upserting current production nodes.
UPDATE warehouses
SET code = 'DB-DK',
    parent_id = (SELECT id FROM warehouses WHERE code = 'DB'),
    updated_at = NOW()
WHERE code = 'WH-HCM-01'
  AND NOT EXISTS (
    SELECT 1
    FROM warehouses
    WHERE code = 'DB-DK'
  );

UPDATE warehouses
SET code = 'DB-XN',
    parent_id = (SELECT id FROM warehouses WHERE code = 'DB'),
    updated_at = NOW()
WHERE code = 'WH-HCM-02'
  AND NOT EXISTS (
    SELECT 1
    FROM warehouses
    WHERE code = 'DB-XN'
  );

UPDATE warehouses
SET code = 'DB-XT',
    parent_id = (SELECT id FROM warehouses WHERE code = 'DB'),
    updated_at = NOW()
WHERE code = 'WH-BD-01'
  AND NOT EXISTS (
    SELECT 1
    FROM warehouses
    WHERE code = 'DB-XT'
  );

UPDATE warehouses
SET code = 'PT-01',
    parent_id = (SELECT id FROM warehouses WHERE code = 'PT'),
    updated_at = NOW()
WHERE code = 'WH-DN-01'
  AND NOT EXISTS (
    SELECT 1
    FROM warehouses
    WHERE code = 'PT-01'
  );

-- Ensure production storage warehouses exist under the correct top-level nodes.
INSERT INTO warehouses (code, name, location, type, parent_id, sort_order, is_active)
VALUES
  ('DB-DK', 'Kho Dệt Kim', 'Xưởng Dệt Kim, Điện Bàn', 'STORAGE', (SELECT id FROM warehouses WHERE code = 'DB'), 1, TRUE),
  ('DB-XT', 'Kho Xưởng Trước', 'Xưởng Trước, Điện Bàn', 'STORAGE', (SELECT id FROM warehouses WHERE code = 'DB'), 2, TRUE),
  ('DB-XN', 'Kho Xưởng Nhật', 'Xưởng Nhật, Điện Bàn', 'STORAGE', (SELECT id FROM warehouses WHERE code = 'DB'), 3, TRUE),
  ('PT-01', 'Kho Phú Tường', 'Kho thuê, Phú Tường', 'STORAGE', (SELECT id FROM warehouses WHERE code = 'PT'), 1, TRUE)
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    location = EXCLUDED.location,
    type = 'STORAGE',
    parent_id = EXCLUDED.parent_id,
    sort_order = EXCLUDED.sort_order,
    is_active = TRUE,
    updated_at = NOW();

COMMIT;
