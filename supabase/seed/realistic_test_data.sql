-- ============================================================================
-- REALISTIC TEST DATA - Thread Inventory System
-- Date: 2026-03-03
-- Flow: Master Data -> Thread Types -> Styles -> Specs -> PO -> Inventory
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. WAREHOUSES (Địa điểm + Kho lưu trữ)
-- ============================================================================

DELETE FROM warehouses WHERE code LIKE 'LOC-%' OR code LIKE 'WH-%';

-- Địa điểm (LOCATION - parent)
INSERT INTO warehouses (code, name, location, type, sort_order, is_active) VALUES
  ('LOC-HCM', 'Cơ sở Hồ Chí Minh', 'Quận Tân Bình, TP.HCM', 'LOCATION', 1, true),
  ('LOC-BD', 'Cơ sở Bình Dương', 'KCN Sóng Thần, Bình Dương', 'LOCATION', 2, true),
  ('LOC-DN', 'Cơ sở Đà Nẵng', 'KCN Hòa Khánh, Đà Nẵng', 'LOCATION', 3, true);

-- Kho lưu trữ (STORAGE - child of LOCATION)
INSERT INTO warehouses (code, name, location, type, parent_id, sort_order, is_active) VALUES
  ('WH-HCM-01', 'Kho Chỉ Chính HCM', 'Tầng 1, Nhà A', 'STORAGE', (SELECT id FROM warehouses WHERE code = 'LOC-HCM'), 1, true),
  ('WH-HCM-02', 'Kho Chỉ Phụ HCM', 'Tầng 2, Nhà A', 'STORAGE', (SELECT id FROM warehouses WHERE code = 'LOC-HCM'), 2, true),
  ('WH-BD-01', 'Kho Chỉ Bình Dương', 'Nhà kho số 3', 'STORAGE', (SELECT id FROM warehouses WHERE code = 'LOC-BD'), 1, true),
  ('WH-DN-01', 'Kho Chỉ Đà Nẵng', 'Khu A', 'STORAGE', (SELECT id FROM warehouses WHERE code = 'LOC-DN'), 1, true);

-- ============================================================================
-- 2. SUPPLIERS (Nhà cung cấp)
-- ============================================================================

DELETE FROM suppliers WHERE code LIKE 'NCC-%';

INSERT INTO suppliers (code, name, contact_name, phone, email, address, lead_time_days, is_active) VALUES
  ('NCC-COATS', 'Công ty TNHH Coats Việt Nam', 'Nguyễn Văn An', '0283456789', 'an.nguyen@coats.com', 'Lô A1, KCN Việt Nam Singapore, Bình Dương', 5, true),
  ('NCC-AMANN', 'Amann Việt Nam', 'Trần Thị Bích', '0287654321', 'bich.tran@amann.com', 'Lô B2, KCN Long Thành, Đồng Nai', 7, true),
  ('NCC-GTEX', 'Công ty Chỉ May Gia Định', 'Lê Văn Cường', '0281234567', 'cuong.le@gtex.vn', '123 Trường Chinh, Quận Tân Bình, TP.HCM', 3, true),
  ('NCC-VTTEX', 'Công ty Chỉ Việt Tiến', 'Phạm Thị Dung', '0289876543', 'dung.pham@viettien.vn', '456 Lý Thường Kiệt, Quận 10, TP.HCM', 4, true),
  ('NCC-SUNFIL', 'Sunfil Thread Co., Ltd', 'Hoàng Minh Đức', '0282468135', 'duc.hoang@sunfil.com', 'Lô C3, KCN Tân Tạo, Bình Tân, TP.HCM', 6, true);

-- ============================================================================
-- 3. COLORS (Bảng màu chuẩn)
-- ============================================================================

DELETE FROM colors WHERE name IN (
  'Trắng', 'Đen', 'Đỏ', 'Xanh Dương', 'Xanh Navy', 'Xanh Lá', 'Vàng', 'Cam',
  'Tím', 'Hồng', 'Nâu', 'Xám', 'Be', 'Kem', 'Bạc', 'Xanh Ngọc', 'Bordeaux', 'Olive'
);

INSERT INTO colors (name, hex_code, pantone_code, is_active) VALUES
  ('Trắng', '#FFFFFF', '11-0601 TCX', true),
  ('Đen', '#000000', '19-0303 TCX', true),
  ('Đỏ', '#DC2626', '18-1663 TCX', true),
  ('Xanh Dương', '#2563EB', '18-4252 TCX', true),
  ('Xanh Navy', '#1E3A5F', '19-4024 TCX', true),
  ('Xanh Lá', '#16A34A', '17-6153 TCX', true),
  ('Vàng', '#EAB308', '13-0858 TCX', true),
  ('Cam', '#EA580C', '16-1359 TCX', true),
  ('Tím', '#7C3AED', '18-3838 TCX', true),
  ('Hồng', '#EC4899', '17-2127 TCX', true),
  ('Nâu', '#78350F', '19-1121 TCX', true),
  ('Xám', '#6B7280', '17-5102 TCX', true),
  ('Be', '#D4B896', '14-1118 TCX', true),
  ('Kem', '#FEF3C7', '11-0607 TCX', true),
  ('Bạc', '#9CA3AF', '14-4102 TCX', true),
  ('Xanh Ngọc', '#14B8A6', '15-5519 TCX', true),
  ('Bordeaux', '#7F1D1D', '19-1629 TCX', true),
  ('Olive', '#4D7C0F', '18-0629 TCX', true);

-- ============================================================================
-- 4. COLOR_SUPPLIER (Liên kết NCC - Màu với giá)
-- ============================================================================

DELETE FROM color_supplier;

-- Coats cung cấp tất cả màu cơ bản
INSERT INTO color_supplier (color_id, supplier_id, price_per_kg, min_order_qty, is_active)
SELECT c.id, s.id,
  CASE
    WHEN c.name IN ('Trắng', 'Đen') THEN 85000
    WHEN c.name IN ('Đỏ', 'Xanh Dương', 'Xanh Navy') THEN 95000
    ELSE 90000
  END,
  10, true
FROM colors c, suppliers s
WHERE s.code = 'NCC-COATS' AND c.name IN ('Trắng', 'Đen', 'Đỏ', 'Xanh Dương', 'Xanh Navy', 'Xanh Lá', 'Vàng');

-- Amann cung cấp màu premium
INSERT INTO color_supplier (color_id, supplier_id, price_per_kg, min_order_qty, is_active)
SELECT c.id, s.id,
  CASE
    WHEN c.name IN ('Trắng', 'Đen') THEN 90000
    ELSE 100000
  END,
  15, true
FROM colors c, suppliers s
WHERE s.code = 'NCC-AMANN' AND c.name IN ('Trắng', 'Đen', 'Tím', 'Hồng', 'Bordeaux', 'Xanh Ngọc');

-- Gia Định cung cấp màu phổ biến, giá rẻ hơn
INSERT INTO color_supplier (color_id, supplier_id, price_per_kg, min_order_qty, is_active)
SELECT c.id, s.id, 75000, 5, true
FROM colors c, suppliers s
WHERE s.code = 'NCC-GTEX' AND c.name IN ('Trắng', 'Đen', 'Xám', 'Be', 'Kem');

-- Việt Tiến - đa dạng màu
INSERT INTO color_supplier (color_id, supplier_id, price_per_kg, min_order_qty, is_active)
SELECT c.id, s.id, 80000, 8, true
FROM colors c, suppliers s
WHERE s.code = 'NCC-VTTEX' AND c.name IN ('Trắng', 'Đen', 'Nâu', 'Olive', 'Xanh Navy', 'Cam');

-- Sunfil - chỉ dày
INSERT INTO color_supplier (color_id, supplier_id, price_per_kg, min_order_qty, is_active)
SELECT c.id, s.id, 82000, 10, true
FROM colors c, suppliers s
WHERE s.code = 'NCC-SUNFIL' AND c.name IN ('Trắng', 'Đen', 'Nâu', 'Xanh Navy');

-- ============================================================================
-- 5. THREAD_TYPES (Loại chỉ = TEX + Màu + NCC)
-- Schema mới: dùng color_id, supplier_id, không còn color/color_code/supplier
-- Công thức: density_grams_per_meter = tex_number / 1000
-- meters_per_cone phụ thuộc TEX: TEX cao -> ít mét hơn
-- ============================================================================

DELETE FROM thread_types WHERE code LIKE 'CHI-%';

-- TEX 20 (chỉ mảnh - cho may chi tiết) - 6000m/cuộn
INSERT INTO thread_types (code, name, material, tex_number, density_grams_per_meter, meters_per_cone, supplier_id, color_id, reorder_level_meters, lead_time_days, is_active)
SELECT
  'CHI-20-' ||
  CASE c.name
    WHEN 'Trắng' THEN 'TRA'
    WHEN 'Đen' THEN 'DEN'
    WHEN 'Đỏ' THEN 'DO'
    WHEN 'Xanh Dương' THEN 'XDG'
    WHEN 'Xanh Navy' THEN 'XNA'
    WHEN 'Xanh Lá' THEN 'XLA'
    WHEN 'Vàng' THEN 'VAN'
    WHEN 'Cam' THEN 'CAM'
    WHEN 'Tím' THEN 'TIM'
    WHEN 'Hồng' THEN 'HON'
    WHEN 'Nâu' THEN 'NAU'
    WHEN 'Xám' THEN 'XAM'
    WHEN 'Be' THEN 'BE'
    ELSE UPPER(SUBSTRING(c.name, 1, 3))
  END || '-' || SUBSTRING(s.code, 5),
  'Chỉ Polyester TEX20 ' || c.name || ' - ' || s.name,
  'POLYESTER', 20.00, 0.020000, 6000.00,
  s.id, c.id, 15000.00, s.lead_time_days, true
FROM colors c
CROSS JOIN suppliers s
WHERE c.name IN ('Trắng', 'Đen') AND s.code IN ('NCC-COATS', 'NCC-GTEX', 'NCC-VTTEX');

-- TEX 30 (chỉ trung bình mảnh) - 5000m/cuộn
INSERT INTO thread_types (code, name, material, tex_number, density_grams_per_meter, meters_per_cone, supplier_id, color_id, reorder_level_meters, lead_time_days, is_active)
SELECT
  'CHI-30-' ||
  CASE c.name
    WHEN 'Trắng' THEN 'TRA'
    WHEN 'Đen' THEN 'DEN'
    WHEN 'Xanh Navy' THEN 'XNA'
    WHEN 'Xám' THEN 'XAM'
    ELSE UPPER(SUBSTRING(c.name, 1, 3))
  END || '-' || SUBSTRING(s.code, 5),
  'Chỉ Polyester TEX30 ' || c.name || ' - ' || s.name,
  'POLYESTER', 30.00, 0.030000, 5000.00,
  s.id, c.id, 12000.00, s.lead_time_days, true
FROM colors c
CROSS JOIN suppliers s
WHERE c.name IN ('Trắng', 'Đen', 'Xanh Navy', 'Xám') AND s.code IN ('NCC-COATS', 'NCC-AMANN');

-- TEX 40 (chỉ trung bình - phổ biến nhất) - 4000m/cuộn
INSERT INTO thread_types (code, name, material, tex_number, density_grams_per_meter, meters_per_cone, supplier_id, color_id, reorder_level_meters, lead_time_days, is_active)
SELECT
  'CHI-40-' ||
  CASE c.name
    WHEN 'Trắng' THEN 'TRA'
    WHEN 'Đen' THEN 'DEN'
    WHEN 'Đỏ' THEN 'DO'
    WHEN 'Xanh Dương' THEN 'XDG'
    WHEN 'Xanh Navy' THEN 'XNA'
    WHEN 'Be' THEN 'BE'
    ELSE UPPER(SUBSTRING(c.name, 1, 3))
  END || '-' || SUBSTRING(s.code, 5),
  'Chỉ Polyester TEX40 ' || c.name || ' - ' || s.name,
  'POLYESTER', 40.00, 0.040000, 4000.00,
  s.id, c.id, 10000.00, s.lead_time_days, true
FROM colors c
CROSS JOIN suppliers s
WHERE c.name IN ('Trắng', 'Đen', 'Đỏ', 'Xanh Dương', 'Xanh Navy', 'Be') AND s.code IN ('NCC-COATS', 'NCC-VTTEX');

-- TEX 60 (chỉ dày - cho may bền) - 3000m/cuộn
INSERT INTO thread_types (code, name, material, tex_number, density_grams_per_meter, meters_per_cone, supplier_id, color_id, reorder_level_meters, lead_time_days, is_active)
SELECT
  'CHI-60-' ||
  CASE c.name
    WHEN 'Trắng' THEN 'TRA'
    WHEN 'Đen' THEN 'DEN'
    WHEN 'Nâu' THEN 'NAU'
    WHEN 'Xanh Navy' THEN 'XNA'
    ELSE UPPER(SUBSTRING(c.name, 1, 3))
  END || '-' || SUBSTRING(s.code, 5),
  'Chỉ Polyester TEX60 ' || c.name || ' - ' || s.name,
  'POLYESTER', 60.00, 0.060000, 3000.00,
  s.id, c.id, 8000.00, s.lead_time_days, true
FROM colors c
CROSS JOIN suppliers s
WHERE c.name IN ('Trắng', 'Đen', 'Nâu', 'Xanh Navy') AND s.code IN ('NCC-COATS', 'NCC-SUNFIL');

-- TEX 80 (chỉ rất dày - cho may da, vải dày) - 2500m/cuộn
INSERT INTO thread_types (code, name, material, tex_number, density_grams_per_meter, meters_per_cone, supplier_id, color_id, reorder_level_meters, lead_time_days, is_active)
SELECT
  'CHI-80-' ||
  CASE c.name
    WHEN 'Trắng' THEN 'TRA'
    WHEN 'Đen' THEN 'DEN'
    WHEN 'Nâu' THEN 'NAU'
    ELSE UPPER(SUBSTRING(c.name, 1, 3))
  END || '-' || SUBSTRING(s.code, 5),
  'Chỉ Polyester TEX80 ' || c.name || ' - ' || s.name,
  'POLYESTER', 80.00, 0.080000, 2500.00,
  s.id, c.id, 6000.00, s.lead_time_days, true
FROM colors c
CROSS JOIN suppliers s
WHERE c.name IN ('Trắng', 'Đen', 'Nâu') AND s.code IN ('NCC-SUNFIL');

-- ============================================================================
-- 6. STYLES (Mã hàng sản phẩm)
-- ============================================================================

DELETE FROM styles WHERE style_code LIKE 'ST-%';

INSERT INTO styles (style_code, style_name, description, fabric_type) VALUES
  ('ST-SM001', 'Áo Sơ Mi Nam Basic', 'Áo sơ mi nam dài tay, form regular fit', 'Cotton 100%'),
  ('ST-SM002', 'Áo Sơ Mi Nam Slim', 'Áo sơ mi nam dài tay, form slim fit', 'Cotton Blend'),
  ('ST-SM003', 'Áo Sơ Mi Nữ', 'Áo sơ mi nữ dài tay, form regular', 'Cotton 100%'),
  ('ST-QT001', 'Quần Tây Nam', 'Quần tây nam công sở, form regular', 'Polyester Blend'),
  ('ST-QT002', 'Quần Tây Nữ', 'Quần tây nữ công sở, ống suông', 'Polyester Blend'),
  ('ST-JK001', 'Áo Khoác Blazer Nam', 'Áo blazer nam 2 nút, vai rộng', 'Wool Blend'),
  ('ST-JK002', 'Áo Khoác Blazer Nữ', 'Áo blazer nữ 1 nút, eo thon', 'Wool Blend'),
  ('ST-DR001', 'Váy Công Sở', 'Váy công sở nữ, dáng A', 'Polyester'),
  ('ST-PL001', 'Áo Polo Nam', 'Áo polo nam ngắn tay, cổ bẻ', 'Cotton Pique'),
  ('ST-TS001', 'Áo Thun Basic', 'Áo thun cổ tròn, unisex', 'Cotton Jersey');

-- ============================================================================
-- 7. STYLE_THREAD_SPECS (Định mức chỉ cho mã hàng)
-- Mỗi công đoạn may cần loại chỉ TEX khác nhau
-- ============================================================================

DELETE FROM style_thread_specs WHERE style_id IN (SELECT id FROM styles WHERE style_code LIKE 'ST-%');

-- Áo Sơ Mi Nam Basic (ST-SM001)
INSERT INTO style_thread_specs (style_id, supplier_id, process_name, thread_type_id, meters_per_unit, notes)
SELECT s.id, sup.id, 'May thân áo', tt.id, 85.00, 'Chỉ may chính'
FROM styles s, suppliers sup, thread_types tt
WHERE s.style_code = 'ST-SM001' AND sup.code = 'NCC-COATS' AND tt.code = 'CHI-40-TRA-COATS';

INSERT INTO style_thread_specs (style_id, supplier_id, process_name, thread_type_id, meters_per_unit, notes)
SELECT s.id, sup.id, 'May tay áo', tt.id, 45.00, NULL
FROM styles s, suppliers sup, thread_types tt
WHERE s.style_code = 'ST-SM001' AND sup.code = 'NCC-COATS' AND tt.code = 'CHI-40-TRA-COATS';

INSERT INTO style_thread_specs (style_id, supplier_id, process_name, thread_type_id, meters_per_unit, notes)
SELECT s.id, sup.id, 'May cổ áo', tt.id, 25.00, 'Chỉ mảnh cho chi tiết'
FROM styles s, suppliers sup, thread_types tt
WHERE s.style_code = 'ST-SM001' AND sup.code = 'NCC-COATS' AND tt.code = 'CHI-30-TRA-COATS';

INSERT INTO style_thread_specs (style_id, supplier_id, process_name, thread_type_id, meters_per_unit, notes)
SELECT s.id, sup.id, 'Đính nút', tt.id, 8.00, 'Chỉ dày cho bền'
FROM styles s, suppliers sup, thread_types tt
WHERE s.style_code = 'ST-SM001' AND sup.code = 'NCC-COATS' AND tt.code = 'CHI-60-TRA-COATS';

-- Quần Tây Nam (ST-QT001)
INSERT INTO style_thread_specs (style_id, supplier_id, process_name, thread_type_id, meters_per_unit, notes)
SELECT s.id, sup.id, 'May thân quần', tt.id, 120.00, 'Chỉ may chính'
FROM styles s, suppliers sup, thread_types tt
WHERE s.style_code = 'ST-QT001' AND sup.code = 'NCC-COATS' AND tt.code = 'CHI-40-TRA-COATS';

INSERT INTO style_thread_specs (style_id, supplier_id, process_name, thread_type_id, meters_per_unit, notes)
SELECT s.id, sup.id, 'May túi quần', tt.id, 35.00, NULL
FROM styles s, suppliers sup, thread_types tt
WHERE s.style_code = 'ST-QT001' AND sup.code = 'NCC-VTTEX' AND tt.code = 'CHI-40-TRA-VTTEX';

INSERT INTO style_thread_specs (style_id, supplier_id, process_name, thread_type_id, meters_per_unit, notes)
SELECT s.id, sup.id, 'May cạp quần', tt.id, 40.00, 'Chỉ dày cho bền'
FROM styles s, suppliers sup, thread_types tt
WHERE s.style_code = 'ST-QT001' AND sup.code = 'NCC-SUNFIL' AND tt.code = 'CHI-60-TRA-SUNFIL';

-- Áo Khoác Blazer Nam (ST-JK001)
INSERT INTO style_thread_specs (style_id, supplier_id, process_name, thread_type_id, meters_per_unit, notes)
SELECT s.id, sup.id, 'May thân áo', tt.id, 180.00, 'Chỉ may chính'
FROM styles s, suppliers sup, thread_types tt
WHERE s.style_code = 'ST-JK001' AND sup.code = 'NCC-AMANN' AND tt.code = 'CHI-40-TRA-COATS';

INSERT INTO style_thread_specs (style_id, supplier_id, process_name, thread_type_id, meters_per_unit, notes)
SELECT s.id, sup.id, 'May tay áo', tt.id, 65.00, NULL
FROM styles s, suppliers sup, thread_types tt
WHERE s.style_code = 'ST-JK001' AND sup.code = 'NCC-AMANN' AND tt.code = 'CHI-40-TRA-COATS';

INSERT INTO style_thread_specs (style_id, supplier_id, process_name, thread_type_id, meters_per_unit, notes)
SELECT s.id, sup.id, 'May ve áo', tt.id, 45.00, 'Chi tiết quan trọng'
FROM styles s, suppliers sup, thread_types tt
WHERE s.style_code = 'ST-JK001' AND sup.code = 'NCC-AMANN' AND tt.code = 'CHI-30-TRA-AMANN';

INSERT INTO style_thread_specs (style_id, supplier_id, process_name, thread_type_id, meters_per_unit, notes)
SELECT s.id, sup.id, 'Đính nút', tt.id, 15.00, 'Chỉ rất dày'
FROM styles s, suppliers sup, thread_types tt
WHERE s.style_code = 'ST-JK001' AND sup.code = 'NCC-SUNFIL' AND tt.code = 'CHI-80-TRA-SUNFIL';

-- Áo Polo Nam (ST-PL001)
INSERT INTO style_thread_specs (style_id, supplier_id, process_name, thread_type_id, meters_per_unit, notes)
SELECT s.id, sup.id, 'May thân áo', tt.id, 55.00, NULL
FROM styles s, suppliers sup, thread_types tt
WHERE s.style_code = 'ST-PL001' AND sup.code = 'NCC-GTEX' AND tt.code = 'CHI-20-TRA-GTEX';

INSERT INTO style_thread_specs (style_id, supplier_id, process_name, thread_type_id, meters_per_unit, notes)
SELECT s.id, sup.id, 'May cổ áo', tt.id, 20.00, 'Cổ bẻ polo'
FROM styles s, suppliers sup, thread_types tt
WHERE s.style_code = 'ST-PL001' AND sup.code = 'NCC-COATS' AND tt.code = 'CHI-30-TRA-COATS';

-- Áo Thun Basic (ST-TS001)
INSERT INTO style_thread_specs (style_id, supplier_id, process_name, thread_type_id, meters_per_unit, notes)
SELECT s.id, sup.id, 'May thân áo', tt.id, 40.00, 'Overlock'
FROM styles s, suppliers sup, thread_types tt
WHERE s.style_code = 'ST-TS001' AND sup.code = 'NCC-GTEX' AND tt.code = 'CHI-20-TRA-GTEX';

INSERT INTO style_thread_specs (style_id, supplier_id, process_name, thread_type_id, meters_per_unit, notes)
SELECT s.id, sup.id, 'May viền cổ', tt.id, 12.00, NULL
FROM styles s, suppliers sup, thread_types tt
WHERE s.style_code = 'ST-TS001' AND sup.code = 'NCC-GTEX' AND tt.code = 'CHI-20-DEN-GTEX';

-- ============================================================================
-- 8. STYLE_COLOR_THREAD_SPECS (Định mức màu chỉ theo màu sản phẩm)
-- Khi sản phẩm màu Trắng -> dùng chỉ Trắng
-- Khi sản phẩm màu Đen -> dùng chỉ Đen
-- ============================================================================

DELETE FROM style_color_thread_specs WHERE style_thread_spec_id IN (
  SELECT sts.id FROM style_thread_specs sts
  JOIN styles s ON sts.style_id = s.id
  WHERE s.style_code LIKE 'ST-%'
);

-- Áo Sơ Mi Nam Basic - Màu Trắng (chỉ Trắng)
INSERT INTO style_color_thread_specs (style_thread_spec_id, color_id, thread_type_id, notes)
SELECT sts.id, c.id, tt.id, 'Chỉ trắng cho áo trắng'
FROM style_thread_specs sts
JOIN styles s ON sts.style_id = s.id
JOIN colors c ON c.name = 'Trắng'
JOIN thread_types tt ON tt.code = 'CHI-40-TRA-COATS'
WHERE s.style_code = 'ST-SM001' AND sts.process_name = 'May thân áo';

-- Áo Sơ Mi Nam Basic - Màu Xanh Navy (chỉ Xanh Navy)
INSERT INTO style_color_thread_specs (style_thread_spec_id, color_id, thread_type_id, notes)
SELECT sts.id, c.id, tt.id, 'Chỉ navy cho áo navy'
FROM style_thread_specs sts
JOIN styles s ON sts.style_id = s.id
JOIN colors c ON c.name = 'Xanh Navy'
JOIN thread_types tt ON tt.code = 'CHI-40-XNA-COATS'
WHERE s.style_code = 'ST-SM001' AND sts.process_name = 'May thân áo';

-- Áo Sơ Mi Nam Basic - Màu Đen (chỉ Đen)
INSERT INTO style_color_thread_specs (style_thread_spec_id, color_id, thread_type_id, notes)
SELECT sts.id, c.id, tt.id, 'Chỉ đen cho áo đen'
FROM style_thread_specs sts
JOIN styles s ON sts.style_id = s.id
JOIN colors c ON c.name = 'Đen'
JOIN thread_types tt ON tt.code = 'CHI-40-DEN-COATS'
WHERE s.style_code = 'ST-SM001' AND sts.process_name = 'May thân áo';

-- Quần Tây Nam - Màu Đen
INSERT INTO style_color_thread_specs (style_thread_spec_id, color_id, thread_type_id, notes)
SELECT sts.id, c.id, tt.id, NULL
FROM style_thread_specs sts
JOIN styles s ON sts.style_id = s.id
JOIN colors c ON c.name = 'Đen'
JOIN thread_types tt ON tt.code = 'CHI-40-DEN-COATS'
WHERE s.style_code = 'ST-QT001' AND sts.process_name = 'May thân quần';

-- Quần Tây Nam - Màu Xanh Navy
INSERT INTO style_color_thread_specs (style_thread_spec_id, color_id, thread_type_id, notes)
SELECT sts.id, c.id, tt.id, NULL
FROM style_thread_specs sts
JOIN styles s ON sts.style_id = s.id
JOIN colors c ON c.name = 'Xanh Navy'
JOIN thread_types tt ON tt.code = 'CHI-40-XNA-COATS'
WHERE s.style_code = 'ST-QT001' AND sts.process_name = 'May thân quần';

-- ============================================================================
-- 9. PURCHASE_ORDERS (Đơn hàng từ khách)
-- ============================================================================

DELETE FROM purchase_orders WHERE po_number LIKE 'PO-2026-%';

INSERT INTO purchase_orders (po_number, customer_name, order_date, delivery_date, status, priority, notes) VALUES
  ('PO-2026-001', 'Uniqlo Vietnam', '2026-02-15', '2026-03-15', 'IN_PRODUCTION', 'HIGH', 'Đơn hàng Q1/2026'),
  ('PO-2026-002', 'Zara Vietnam', '2026-02-20', '2026-03-25', 'CONFIRMED', 'NORMAL', NULL),
  ('PO-2026-003', 'H&M Vietnam', '2026-02-25', '2026-04-01', 'PENDING', 'NORMAL', 'Đợi confirm màu'),
  ('PO-2026-004', 'Local Boutique ABC', '2026-03-01', '2026-04-15', 'PENDING', 'LOW', 'Đơn nhỏ');

-- ============================================================================
-- 10. PO_ITEMS (Chi tiết đơn hàng)
-- ============================================================================

DELETE FROM po_items WHERE po_id IN (SELECT id FROM purchase_orders WHERE po_number LIKE 'PO-2026-%');

-- PO-2026-001: Uniqlo - Áo sơ mi + Quần tây
INSERT INTO po_items (po_id, style_id, quantity, notes)
SELECT po.id, s.id, 2000, 'Giao đợt 1: 1000 cái'
FROM purchase_orders po, styles s
WHERE po.po_number = 'PO-2026-001' AND s.style_code = 'ST-SM001';

INSERT INTO po_items (po_id, style_id, quantity, notes)
SELECT po.id, s.id, 1500, NULL
FROM purchase_orders po, styles s
WHERE po.po_number = 'PO-2026-001' AND s.style_code = 'ST-QT001';

-- PO-2026-002: Zara - Blazer + Váy
INSERT INTO po_items (po_id, style_id, quantity, notes)
SELECT po.id, s.id, 800, NULL
FROM purchase_orders po, styles s
WHERE po.po_number = 'PO-2026-002' AND s.style_code = 'ST-JK001';

INSERT INTO po_items (po_id, style_id, quantity, notes)
SELECT po.id, s.id, 600, NULL
FROM purchase_orders po, styles s
WHERE po.po_number = 'PO-2026-002' AND s.style_code = 'ST-DR001';

-- PO-2026-003: H&M - Áo thun + Polo
INSERT INTO po_items (po_id, style_id, quantity, notes)
SELECT po.id, s.id, 3000, 'Nhiều màu'
FROM purchase_orders po, styles s
WHERE po.po_number = 'PO-2026-003' AND s.style_code = 'ST-TS001';

INSERT INTO po_items (po_id, style_id, quantity, notes)
SELECT po.id, s.id, 1200, NULL
FROM purchase_orders po, styles s
WHERE po.po_number = 'PO-2026-003' AND s.style_code = 'ST-PL001';

-- ============================================================================
-- 11. SKUS (Chi tiết SKU - màu + size)
-- ============================================================================

DELETE FROM skus WHERE po_item_id IN (
  SELECT pi.id FROM po_items pi
  JOIN purchase_orders po ON pi.po_id = po.id
  WHERE po.po_number LIKE 'PO-2026-%'
);

-- PO-2026-001, ST-SM001: Áo sơ mi - Trắng, Xanh Navy, Đen x S/M/L/XL
INSERT INTO skus (po_item_id, color_id, size, quantity)
SELECT pi.id, c.id, sz.size,
  CASE
    WHEN sz.size = 'M' THEN 200
    WHEN sz.size = 'L' THEN 180
    ELSE 120
  END
FROM po_items pi
JOIN purchase_orders po ON pi.po_id = po.id
JOIN styles s ON pi.style_id = s.id
CROSS JOIN colors c
CROSS JOIN (VALUES ('S'), ('M'), ('L'), ('XL')) AS sz(size)
WHERE po.po_number = 'PO-2026-001' AND s.style_code = 'ST-SM001'
  AND c.name IN ('Trắng', 'Xanh Navy', 'Đen');

-- ============================================================================
-- 12. LOTS (Lô nhập kho)
-- ============================================================================

DELETE FROM lots WHERE lot_number LIKE 'LOT-2026-%';

-- Lô nhập từ Coats
INSERT INTO lots (lot_number, thread_type_id, warehouse_id, production_date, expiry_date, supplier_id, total_cones, available_cones, status)
SELECT
  'LOT-2026-001', tt.id, w.id, '2026-01-15', '2027-01-15', s.id, 50, 45, 'ACTIVE'
FROM thread_types tt, warehouses w, suppliers s
WHERE tt.code = 'CHI-40-TRA-COATS' AND w.code = 'WH-HCM-01' AND s.code = 'NCC-COATS';

INSERT INTO lots (lot_number, thread_type_id, warehouse_id, production_date, expiry_date, supplier_id, total_cones, available_cones, status)
SELECT
  'LOT-2026-002', tt.id, w.id, '2026-01-20', '2027-01-20', s.id, 30, 28, 'ACTIVE'
FROM thread_types tt, warehouses w, suppliers s
WHERE tt.code = 'CHI-40-DEN-COATS' AND w.code = 'WH-HCM-01' AND s.code = 'NCC-COATS';

INSERT INTO lots (lot_number, thread_type_id, warehouse_id, production_date, expiry_date, supplier_id, total_cones, available_cones, status)
SELECT
  'LOT-2026-003', tt.id, w.id, '2026-02-01', '2027-02-01', s.id, 25, 25, 'ACTIVE'
FROM thread_types tt, warehouses w, suppliers s
WHERE tt.code = 'CHI-40-XNA-COATS' AND w.code = 'WH-HCM-01' AND s.code = 'NCC-COATS';

-- Lô nhập từ Gia Định (giá rẻ hơn)
INSERT INTO lots (lot_number, thread_type_id, warehouse_id, production_date, expiry_date, supplier_id, total_cones, available_cones, status)
SELECT
  'LOT-2026-004', tt.id, w.id, '2026-02-10', '2027-02-10', s.id, 40, 38, 'ACTIVE'
FROM thread_types tt, warehouses w, suppliers s
WHERE tt.code = 'CHI-20-TRA-GTEX' AND w.code = 'WH-HCM-02' AND s.code = 'NCC-GTEX';

INSERT INTO lots (lot_number, thread_type_id, warehouse_id, production_date, expiry_date, supplier_id, total_cones, available_cones, status)
SELECT
  'LOT-2026-005', tt.id, w.id, '2026-02-10', '2027-02-10', s.id, 35, 35, 'ACTIVE'
FROM thread_types tt, warehouses w, suppliers s
WHERE tt.code = 'CHI-20-DEN-GTEX' AND w.code = 'WH-HCM-02' AND s.code = 'NCC-GTEX';

-- Lô ở Bình Dương
INSERT INTO lots (lot_number, thread_type_id, warehouse_id, production_date, expiry_date, supplier_id, total_cones, available_cones, status)
SELECT
  'LOT-2026-006', tt.id, w.id, '2026-02-15', '2027-02-15', s.id, 60, 55, 'ACTIVE'
FROM thread_types tt, warehouses w, suppliers s
WHERE tt.code = 'CHI-40-TRA-VTTEX' AND w.code = 'WH-BD-01' AND s.code = 'NCC-VTTEX';

-- Lô chỉ dày (TEX 60, 80)
INSERT INTO lots (lot_number, thread_type_id, warehouse_id, production_date, expiry_date, supplier_id, total_cones, available_cones, status)
SELECT
  'LOT-2026-007', tt.id, w.id, '2026-02-20', '2027-02-20', s.id, 20, 20, 'ACTIVE'
FROM thread_types tt, warehouses w, suppliers s
WHERE tt.code = 'CHI-60-TRA-SUNFIL' AND w.code = 'WH-HCM-01' AND s.code = 'NCC-SUNFIL';

INSERT INTO lots (lot_number, thread_type_id, warehouse_id, production_date, expiry_date, supplier_id, total_cones, available_cones, status)
SELECT
  'LOT-2026-008', tt.id, w.id, '2026-02-20', '2027-02-20', s.id, 15, 15, 'ACTIVE'
FROM thread_types tt, warehouses w, suppliers s
WHERE tt.code = 'CHI-80-TRA-SUNFIL' AND w.code = 'WH-HCM-01' AND s.code = 'NCC-SUNFIL';

-- ============================================================================
-- 13. THREAD_INVENTORY (Cuộn chỉ trong kho)
-- Mỗi cuộn có cone_id unique, link tới lot
-- ============================================================================

DELETE FROM thread_inventory WHERE cone_id LIKE 'CONE-2026-%';

-- Tạo function tạo cuộn từ lô
DO $$
DECLARE
  lot_rec RECORD;
  i INTEGER;
  cone_counter INTEGER := 1;
BEGIN
  FOR lot_rec IN
    SELECT l.id, l.lot_number, l.thread_type_id, l.warehouse_id, l.expiry_date, l.total_cones,
           tt.meters_per_cone, tt.density_grams_per_meter
    FROM lots l
    JOIN thread_types tt ON l.thread_type_id = tt.id
    WHERE l.lot_number LIKE 'LOT-2026-%'
  LOOP
    FOR i IN 1..lot_rec.total_cones LOOP
      INSERT INTO thread_inventory (
        cone_id, thread_type_id, warehouse_id, quantity_cones, quantity_meters,
        weight_grams, is_partial, status, lot_number, lot_id, expiry_date,
        received_date, location
      ) VALUES (
        'CONE-2026-' || LPAD(cone_counter::TEXT, 4, '0'),
        lot_rec.thread_type_id,
        lot_rec.warehouse_id,
        1,
        lot_rec.meters_per_cone,
        lot_rec.meters_per_cone * lot_rec.density_grams_per_meter,
        false,
        CASE
          WHEN i <= lot_rec.total_cones * 0.7 THEN 'AVAILABLE'
          WHEN i <= lot_rec.total_cones * 0.85 THEN 'SOFT_ALLOCATED'
          WHEN i <= lot_rec.total_cones * 0.95 THEN 'IN_PRODUCTION'
          ELSE 'RECEIVED'
        END::cone_status,
        lot_rec.lot_number,
        lot_rec.id,
        lot_rec.expiry_date,
        CURRENT_DATE - (30 - i),
        'Kệ A' || ((i % 5) + 1) || '-' || ((i % 10) + 1)
      );
      cone_counter := cone_counter + 1;
    END LOOP;
  END LOOP;
END $$;

-- Tạo một số cuộn lẻ (partial)
UPDATE thread_inventory
SET
  is_partial = true,
  quantity_meters = quantity_meters * 0.35,
  weight_grams = weight_grams * 0.35,
  status = 'AVAILABLE'
WHERE cone_id IN ('CONE-2026-0005', 'CONE-2026-0015', 'CONE-2026-0025', 'CONE-2026-0050');

-- ============================================================================
-- 14. SUMMARY
-- ============================================================================

-- Hiển thị tổng kết
DO $$
DECLARE
  warehouse_count INTEGER;
  supplier_count INTEGER;
  color_count INTEGER;
  thread_type_count INTEGER;
  style_count INTEGER;
  spec_count INTEGER;
  po_count INTEGER;
  lot_count INTEGER;
  inventory_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO warehouse_count FROM warehouses WHERE code LIKE 'WH-%' OR code LIKE 'LOC-%';
  SELECT COUNT(*) INTO supplier_count FROM suppliers WHERE code LIKE 'NCC-%';
  SELECT COUNT(*) INTO color_count FROM colors;
  SELECT COUNT(*) INTO thread_type_count FROM thread_types WHERE code LIKE 'CHI-%';
  SELECT COUNT(*) INTO style_count FROM styles WHERE style_code LIKE 'ST-%';
  SELECT COUNT(*) INTO spec_count FROM style_thread_specs;
  SELECT COUNT(*) INTO po_count FROM purchase_orders WHERE po_number LIKE 'PO-2026-%';
  SELECT COUNT(*) INTO lot_count FROM lots WHERE lot_number LIKE 'LOT-2026-%';
  SELECT COUNT(*) INTO inventory_count FROM thread_inventory WHERE cone_id LIKE 'CONE-2026-%';

  RAISE NOTICE '============================================';
  RAISE NOTICE 'TEST DATA SUMMARY';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Warehouses: %', warehouse_count;
  RAISE NOTICE 'Suppliers: %', supplier_count;
  RAISE NOTICE 'Colors: %', color_count;
  RAISE NOTICE 'Thread Types: %', thread_type_count;
  RAISE NOTICE 'Styles: %', style_count;
  RAISE NOTICE 'Style Thread Specs: %', spec_count;
  RAISE NOTICE 'Purchase Orders: %', po_count;
  RAISE NOTICE 'Lots: %', lot_count;
  RAISE NOTICE 'Thread Inventory (cones): %', inventory_count;
  RAISE NOTICE '============================================';
END $$;

COMMIT;
