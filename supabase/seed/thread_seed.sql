-- =============================================
-- THREAD MANAGEMENT SEED DATA
-- Task: P1-015 - Create seed data for testing
-- Description: Test data for thread management system
-- =============================================

-- Clear existing data (for development only)
-- TRUNCATE thread_recovery, thread_movements, thread_conflict_allocations, 
--          thread_conflicts, thread_allocation_cones, thread_allocations, 
--          thread_inventory, thread_types, warehouses CASCADE;

-- =============================================
-- 1. WAREHOUSES (3 locations)
-- =============================================
INSERT INTO warehouses (code, name, location) VALUES
  ('WH-01', 'Kho Chinh', 'Tang 1, Nha may A'),
  ('WH-02', 'Kho Phu', 'Tang 2, Nha may A'),
  ('WH-03', 'Kho Thanh Pham', 'Nha may B')
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- 2. THREAD TYPES (5 types)
-- Different colors, materials, densities
-- =============================================
INSERT INTO thread_types (
  code, name, color, color_code, material, tex_number,
  density_grams_per_meter, meters_per_cone, supplier, 
  reorder_level_meters, lead_time_days
) VALUES
  ('T-RED-40', 'Chi Do 40', 'Do', '#DC2626', 'polyester', 40.00, 
   0.040000, 5000.00, 'Cong ty Chi May ABC', 10000.00, 7),
  ('T-BLUE-60', 'Chi Xanh Duong 60', 'Xanh Duong', '#2563EB', 'polyester', 60.00,
   0.060000, 3500.00, 'Cong ty Chi May ABC', 8000.00, 7),
  ('T-WHITE-30', 'Chi Trang 30', 'Trang', '#FFFFFF', 'cotton', 30.00,
   0.030000, 6000.00, 'Nha may Chi XYZ', 15000.00, 10),
  ('T-BLACK-50', 'Chi Den 50', 'Den', '#171717', 'nylon', 50.00,
   0.050000, 4000.00, 'Nha may Chi XYZ', 12000.00, 10),
  ('T-YELLOW-45', 'Chi Vang 45', 'Vang', '#EAB308', 'silk', 45.00,
   0.045000, 4500.00, 'Cong ty To Lua VN', 5000.00, 14)
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- 3. THREAD INVENTORY (20 cones)
-- Mix of full cones, partial cones, various statuses
-- =============================================

-- Get thread type and warehouse IDs for reference
-- Note: Using subqueries to get IDs dynamically

-- Full cones - Available (Cones 001-010)
INSERT INTO thread_inventory (
  cone_id, thread_type_id, warehouse_id, quantity_cones, quantity_meters,
  weight_grams, is_partial, status, lot_number, expiry_date, location
) VALUES
  ('CONE-001', 
   (SELECT id FROM thread_types WHERE code = 'T-RED-40'), 
   (SELECT id FROM warehouses WHERE code = 'WH-01'), 
   1, 5000.0000, 200.00, false, 'AVAILABLE', 'LOT-2024-001', '2025-06-30', 'A1-01'),
  ('CONE-002', 
   (SELECT id FROM thread_types WHERE code = 'T-RED-40'), 
   (SELECT id FROM warehouses WHERE code = 'WH-01'), 
   1, 5000.0000, 200.00, false, 'AVAILABLE', 'LOT-2024-001', '2025-06-30', 'A1-02'),
  ('CONE-003', 
   (SELECT id FROM thread_types WHERE code = 'T-BLUE-60'), 
   (SELECT id FROM warehouses WHERE code = 'WH-01'), 
   1, 3500.0000, 210.00, false, 'AVAILABLE', 'LOT-2024-002', '2025-08-15', 'A2-01'),
  ('CONE-004', 
   (SELECT id FROM thread_types WHERE code = 'T-BLUE-60'), 
   (SELECT id FROM warehouses WHERE code = 'WH-01'), 
   1, 3500.0000, 210.00, false, 'AVAILABLE', 'LOT-2024-002', '2025-08-15', 'A2-02'),
  ('CONE-005', 
   (SELECT id FROM thread_types WHERE code = 'T-WHITE-30'), 
   (SELECT id FROM warehouses WHERE code = 'WH-01'), 
   1, 6000.0000, 180.00, false, 'AVAILABLE', 'LOT-2024-003', NULL, 'B1-01'),
  ('CONE-006', 
   (SELECT id FROM thread_types WHERE code = 'T-WHITE-30'), 
   (SELECT id FROM warehouses WHERE code = 'WH-02'), 
   1, 6000.0000, 180.00, false, 'AVAILABLE', 'LOT-2024-003', NULL, 'B1-02'),
  ('CONE-007', 
   (SELECT id FROM thread_types WHERE code = 'T-BLACK-50'), 
   (SELECT id FROM warehouses WHERE code = 'WH-02'), 
   1, 4000.0000, 200.00, false, 'AVAILABLE', 'LOT-2024-004', '2025-12-31', 'C1-01'),
  ('CONE-008', 
   (SELECT id FROM thread_types WHERE code = 'T-BLACK-50'), 
   (SELECT id FROM warehouses WHERE code = 'WH-02'), 
   1, 4000.0000, 200.00, false, 'AVAILABLE', 'LOT-2024-004', '2025-12-31', 'C1-02'),
  ('CONE-009', 
   (SELECT id FROM thread_types WHERE code = 'T-YELLOW-45'), 
   (SELECT id FROM warehouses WHERE code = 'WH-03'), 
   1, 4500.0000, 202.50, false, 'AVAILABLE', 'LOT-2024-005', NULL, 'D1-01'),
  ('CONE-010', 
   (SELECT id FROM thread_types WHERE code = 'T-YELLOW-45'), 
   (SELECT id FROM warehouses WHERE code = 'WH-03'), 
   1, 4500.0000, 202.50, false, 'AVAILABLE', 'LOT-2024-005', NULL, 'D1-02')
ON CONFLICT (cone_id) DO NOTHING;

-- Partial cones - Available (recovered from production) (Cones 011-013)
INSERT INTO thread_inventory (
  cone_id, thread_type_id, warehouse_id, quantity_cones, quantity_meters,
  weight_grams, is_partial, status, lot_number, location
) VALUES
  ('CONE-011', 
   (SELECT id FROM thread_types WHERE code = 'T-RED-40'), 
   (SELECT id FROM warehouses WHERE code = 'WH-01'), 
   1, 2500.0000, 100.00, true, 'AVAILABLE', 'LOT-2024-001', 'A1-03'),
  ('CONE-012', 
   (SELECT id FROM thread_types WHERE code = 'T-BLUE-60'), 
   (SELECT id FROM warehouses WHERE code = 'WH-01'), 
   1, 1800.0000, 108.00, true, 'AVAILABLE', 'LOT-2024-002', 'A2-03'),
  ('CONE-013', 
   (SELECT id FROM thread_types WHERE code = 'T-WHITE-30'), 
   (SELECT id FROM warehouses WHERE code = 'WH-02'), 
   1, 3200.0000, 96.00, true, 'AVAILABLE', 'LOT-2024-003', 'B1-03')
ON CONFLICT (cone_id) DO NOTHING;

-- Cones in production (Cones 014-016)
INSERT INTO thread_inventory (
  cone_id, thread_type_id, warehouse_id, quantity_cones, quantity_meters,
  weight_grams, is_partial, status, lot_number, location
) VALUES
  ('CONE-014', 
   (SELECT id FROM thread_types WHERE code = 'T-RED-40'), 
   (SELECT id FROM warehouses WHERE code = 'WH-01'), 
   1, 5000.0000, 200.00, false, 'IN_PRODUCTION', 'LOT-2024-001', NULL),
  ('CONE-015', 
   (SELECT id FROM thread_types WHERE code = 'T-BLUE-60'), 
   (SELECT id FROM warehouses WHERE code = 'WH-01'), 
   1, 3500.0000, 210.00, false, 'IN_PRODUCTION', 'LOT-2024-002', NULL),
  ('CONE-016', 
   (SELECT id FROM thread_types WHERE code = 'T-BLACK-50'), 
   (SELECT id FROM warehouses WHERE code = 'WH-02'), 
   1, 4000.0000, 200.00, false, 'IN_PRODUCTION', 'LOT-2024-004', NULL)
ON CONFLICT (cone_id) DO NOTHING;

-- Soft allocated cones (Cones 017-018)
INSERT INTO thread_inventory (
  cone_id, thread_type_id, warehouse_id, quantity_cones, quantity_meters,
  weight_grams, is_partial, status, lot_number, expiry_date, location
) VALUES
  ('CONE-017', 
   (SELECT id FROM thread_types WHERE code = 'T-RED-40'), 
   (SELECT id FROM warehouses WHERE code = 'WH-01'), 
   1, 5000.0000, 200.00, false, 'SOFT_ALLOCATED', 'LOT-2024-001', '2025-06-30', 'A1-04'),
  ('CONE-018', 
   (SELECT id FROM thread_types WHERE code = 'T-WHITE-30'), 
   (SELECT id FROM warehouses WHERE code = 'WH-01'), 
   1, 6000.0000, 180.00, false, 'SOFT_ALLOCATED', 'LOT-2024-003', NULL, 'B1-04')
ON CONFLICT (cone_id) DO NOTHING;

-- Recently received (Cones 019-020)
INSERT INTO thread_inventory (
  cone_id, thread_type_id, warehouse_id, quantity_cones, quantity_meters,
  weight_grams, is_partial, status, lot_number, received_date, location
) VALUES
  ('CONE-019', 
   (SELECT id FROM thread_types WHERE code = 'T-YELLOW-45'), 
   (SELECT id FROM warehouses WHERE code = 'WH-03'), 
   1, 4500.0000, 202.50, false, 'RECEIVED', 'LOT-2024-006', CURRENT_DATE, 'D1-03'),
  ('CONE-020', 
   (SELECT id FROM thread_types WHERE code = 'T-YELLOW-45'), 
   (SELECT id FROM warehouses WHERE code = 'WH-03'), 
   1, 4500.0000, 202.50, false, 'RECEIVED', 'LOT-2024-006', CURRENT_DATE, 'D1-04')
ON CONFLICT (cone_id) DO NOTHING;

-- =============================================
-- 4. SAMPLE ALLOCATIONS
-- Soft and Pending allocations
-- =============================================

-- Soft allocation (order waiting for issue)
INSERT INTO thread_allocations (
  order_id, order_reference, thread_type_id, requested_meters,
  allocated_meters, status, priority, priority_score, due_date, notes
) VALUES
  ('ORD-2024-001', 'Don hang ao so mi XL', 
   (SELECT id FROM thread_types WHERE code = 'T-RED-40'), 
   8000.0000, 5000.0000, 'SOFT', 'NORMAL', 20, '2024-02-15', 'Gap - khach hang VIP'),
  ('ORD-2024-002', 'Don hang quan jean', 
   (SELECT id FROM thread_types WHERE code = 'T-WHITE-30'), 
   12000.0000, 6000.0000, 'SOFT', 'HIGH', 30, '2024-02-20', NULL)
ON CONFLICT DO NOTHING;

-- Link allocations to cones
INSERT INTO thread_allocation_cones (allocation_id, cone_id, allocated_meters)
SELECT 
  (SELECT id FROM thread_allocations WHERE order_id = 'ORD-2024-001' LIMIT 1),
  (SELECT id FROM thread_inventory WHERE cone_id = 'CONE-017' LIMIT 1),
  5000.0000
WHERE EXISTS (SELECT 1 FROM thread_allocations WHERE order_id = 'ORD-2024-001')
  AND EXISTS (SELECT 1 FROM thread_inventory WHERE cone_id = 'CONE-017')
ON CONFLICT (allocation_id, cone_id) DO NOTHING;

INSERT INTO thread_allocation_cones (allocation_id, cone_id, allocated_meters)
SELECT 
  (SELECT id FROM thread_allocations WHERE order_id = 'ORD-2024-002' LIMIT 1),
  (SELECT id FROM thread_inventory WHERE cone_id = 'CONE-018' LIMIT 1),
  6000.0000
WHERE EXISTS (SELECT 1 FROM thread_allocations WHERE order_id = 'ORD-2024-002')
  AND EXISTS (SELECT 1 FROM thread_inventory WHERE cone_id = 'CONE-018')
ON CONFLICT (allocation_id, cone_id) DO NOTHING;

-- Pending allocation (waiting for stock)
INSERT INTO thread_allocations (
  order_id, order_reference, thread_type_id, requested_meters,
  allocated_meters, status, priority, priority_score, due_date
) VALUES
  ('ORD-2024-003', 'Don hang vay', 
   (SELECT id FROM thread_types WHERE code = 'T-YELLOW-45'), 
   9000.0000, 0, 'PENDING', 'URGENT', 40, '2024-02-10')
ON CONFLICT DO NOTHING;

-- =============================================
-- 5. SAMPLE MOVEMENTS
-- Stock receipt movement record
-- =============================================
INSERT INTO thread_movements (
  cone_id, movement_type, quantity_meters, from_status, to_status, 
  reference_type, reference_id, performed_by, notes
)
SELECT 
  (SELECT id FROM thread_inventory WHERE cone_id = 'CONE-001' LIMIT 1),
  'RECEIVE',
  5000.0000,
  NULL,
  'AVAILABLE',
  'PO',
  'PO-2024-001',
  'Nguyen Van A',
  'Nhap kho lo moi'
WHERE EXISTS (SELECT 1 FROM thread_inventory WHERE cone_id = 'CONE-001');

-- Issue to production movement
INSERT INTO thread_movements (
  cone_id, movement_type, quantity_meters, from_status, to_status, 
  reference_type, reference_id, performed_by, notes
)
SELECT 
  (SELECT id FROM thread_inventory WHERE cone_id = 'CONE-014' LIMIT 1),
  'ISSUE',
  5000.0000,
  'AVAILABLE',
  'IN_PRODUCTION',
  'PRODUCTION_ORDER',
  'PROD-2024-001',
  'Tran Van B',
  'Xuat cho don hang ao so mi'
WHERE EXISTS (SELECT 1 FROM thread_inventory WHERE cone_id = 'CONE-014');

-- =============================================
-- 6. SAMPLE RECOVERY ENTRIES
-- Partial cone recovery in progress
-- =============================================
INSERT INTO thread_recovery (
  cone_id, original_meters, returned_weight_grams, calculated_meters,
  tare_weight_grams, consumption_meters, status, initiated_by, weighed_by, notes
)
SELECT 
  (SELECT id FROM thread_inventory WHERE cone_id = 'CONE-011' LIMIT 1),
  5000.0000,
  100.00,
  2500.0000,
  10.00,
  2500.0000,
  'CONFIRMED',
  'Le Van C',
  'Pham Thi D',
  'Cuon chi tra ve sau khi hoan thanh don hang'
WHERE EXISTS (SELECT 1 FROM thread_inventory WHERE cone_id = 'CONE-011');

-- Pending weigh recovery
INSERT INTO thread_recovery (
  cone_id, original_meters, status, initiated_by, notes
)
SELECT 
  (SELECT id FROM thread_inventory WHERE cone_id = 'CONE-012' LIMIT 1),
  3500.0000,
  'PENDING_WEIGH',
  'Hoang Van E',
  'Cho can - cuon chi tu may may so 5'
WHERE EXISTS (SELECT 1 FROM thread_inventory WHERE cone_id = 'CONE-012');

-- =============================================
-- 7. VERIFICATION QUERIES
-- Run these to verify seed data:
-- =============================================
-- SELECT COUNT(*) as warehouses FROM warehouses;
-- SELECT COUNT(*) as thread_types FROM thread_types;
-- SELECT COUNT(*) as cones FROM thread_inventory;
-- SELECT status, COUNT(*) FROM thread_inventory GROUP BY status;
-- SELECT COUNT(*) as allocations FROM thread_allocations;
-- SELECT COUNT(*) as movements FROM thread_movements;
-- SELECT COUNT(*) as recoveries FROM thread_recovery;

-- =============================================
-- SUMMARY OF SEEDED DATA:
-- - 3 warehouses: Kho Chinh, Kho Phu, Kho Thanh Pham
-- - 5 thread types: Red (polyester), Blue (polyester), White (cotton), Black (nylon), Yellow (silk)
-- - 20 cones with various statuses:
--   * 10 full cones (AVAILABLE)
--   * 3 partial cones (AVAILABLE) 
--   * 3 cones in production (IN_PRODUCTION)
--   * 2 soft allocated cones (SOFT_ALLOCATED)
--   * 2 recently received cones (RECEIVED)
-- - 3 allocations: 2 soft, 1 pending
-- - 2 movement records
-- - 2 recovery entries
-- =============================================
