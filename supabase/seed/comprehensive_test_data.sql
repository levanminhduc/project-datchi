-- =============================================
-- COMPREHENSIVE TEST DATA SEED
-- Task: Tạo dữ liệu test với 50 loại chỉ, nhiều NCC, tex khác nhau
-- Date: 2026-02-05
-- Description: Full test data for thread inventory system
-- =============================================

-- =============================================
-- 1. WAREHOUSES (Locations + Storages)
-- =============================================

-- LOCATION: Địa điểm chính
INSERT INTO warehouses (code, name, location, type, parent_id, sort_order, is_active) VALUES
  ('DB', 'Điện Bàn', 'Điện Bàn, Quảng Nam', 'LOCATION', NULL, 1, true),
  ('PT', 'Phú Tường', 'Phú Tường, Đà Nẵng', 'LOCATION', NULL, 2, true)
ON CONFLICT (code) DO UPDATE SET
  type = EXCLUDED.type,
  name = EXCLUDED.name,
  location = EXCLUDED.location,
  is_active = true;

-- STORAGE: Kho lưu trữ dưới Điện Bàn
INSERT INTO warehouses (code, name, location, type, parent_id, sort_order, is_active) VALUES
  ('DB-DK', 'Kho Dệt Kim', 'Xưởng Dệt Kim, Điện Bàn', 'STORAGE', 
   (SELECT id FROM warehouses WHERE code = 'DB'), 1, true),
  ('DB-XN', 'Kho Xưởng Nhật', 'Xưởng Nhật, Điện Bàn', 'STORAGE',
   (SELECT id FROM warehouses WHERE code = 'DB'), 2, true),
  ('DB-XT', 'Kho Xưởng Trước', 'Xưởng Trước, Điện Bàn', 'STORAGE',
   (SELECT id FROM warehouses WHERE code = 'DB'), 3, true)
ON CONFLICT (code) DO UPDATE SET
  type = 'STORAGE',
  name = EXCLUDED.name,
  location = EXCLUDED.location,
  parent_id = (SELECT id FROM warehouses WHERE code = 'DB'),
  is_active = true;

-- STORAGE: Kho lưu trữ dưới Phú Tường
INSERT INTO warehouses (code, name, location, type, parent_id, sort_order, is_active) VALUES
  ('PT-01', 'Kho Phú Tường', 'Kho thuê, Phú Tường', 'STORAGE',
   (SELECT id FROM warehouses WHERE code = 'PT'), 1, true)
ON CONFLICT (code) DO UPDATE SET
  type = 'STORAGE',
  name = EXCLUDED.name,
  location = EXCLUDED.location,
  parent_id = (SELECT id FROM warehouses WHERE code = 'PT'),
  is_active = true;

-- =============================================
-- 2. SUPPLIERS (12 nhà cung cấp)
-- =============================================

INSERT INTO suppliers (code, name, contact_name, phone, email, address, lead_time_days, is_active) VALUES
  ('NCC-001', 'Công ty TNHH Chỉ May Việt Tiến', 'Nguyễn Văn An', '0903123456', 'sales@viettien.vn', 'Số 15, Đường Lê Lợi, Quận 1, TP.HCM', 7, true),
  ('NCC-002', 'Công ty CP Sợi Chỉ Phú Thọ', 'Trần Thị Bích', '0912345678', 'order@phutho-thread.com', 'KCN Phú Thọ, Phú Thọ', 10, true),
  ('NCC-003', 'Công ty TNHH Coats Việt Nam', 'David Lee', '0909888777', 'vietnam@coats.com', 'KCN Tân Bình, TP.HCM', 5, true),
  ('NCC-004', 'Nhà máy Chỉ Kim Ngọc', 'Lê Thị Kim', '0905555666', 'kimngoc@gmail.com', 'Đường 30/4, TP. Đà Nẵng', 7, true),
  ('NCC-005', 'Công ty TNHH American Thread', 'John Smith', '0908123456', 'sales@amthread.vn', 'KCN Long Bình, Biên Hòa', 14, true),
  ('NCC-006', 'Xưởng Chỉ Thái Bình', 'Phạm Văn Hùng', '0911222333', 'thaibinh.thread@yahoo.com', 'TP. Thái Bình', 8, true),
  ('NCC-007', 'Công ty CP Dệt May Hà Nội', 'Hoàng Minh Tuấn', '0904567890', 'sales@detmayhn.vn', 'KCN Sài Đồng, Hà Nội', 12, true),
  ('NCC-008', 'Công ty TNHH Onuki Việt Nam', 'Tanaka Yuki', '0907999888', 'vietnam@onuki.jp', 'KCN VSIP, Bình Dương', 6, true),
  ('NCC-009', 'Xí nghiệp Chỉ May Bình Định', 'Võ Thanh Hải', '0902333444', 'binhdinh.chi@gmail.com', 'TP. Quy Nhơn, Bình Định', 9, true),
  ('NCC-010', 'Công ty TNHH Gütermann Việt Nam', 'Hans Mueller', '0906777666', 'sales@gutermann.vn', 'KCN Nhơn Trạch, Đồng Nai', 7, true),
  ('NCC-011', 'Nhà máy Sợi Đồng Nai', 'Nguyễn Thị Hoa', '0913456789', 'dongnai.soi@outlook.com', 'KCN Biên Hòa 2, Đồng Nai', 5, true),
  ('NCC-012', 'Công ty TNHH A&E Gütermann', 'Michael Chen', '0901888999', 'michael@aegutermann.com', 'KCN Tân Thuận, Quận 7, TP.HCM', 10, true)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  contact_name = EXCLUDED.contact_name,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  address = EXCLUDED.address,
  lead_time_days = EXCLUDED.lead_time_days,
  is_active = true;

-- =============================================
-- 3. COLORS (25 màu sắc)
-- =============================================

INSERT INTO colors (name, hex_code, pantone_code, ral_code, is_active) VALUES
  ('Trắng', '#FFFFFF', '11-0601 TCX', 'RAL 9003', true),
  ('Đen', '#000000', '19-4005 TCX', 'RAL 9005', true),
  ('Đỏ', '#DC2626', '18-1664 TCX', 'RAL 3020', true),
  ('Đỏ Đậm', '#991B1B', '19-1557 TCX', 'RAL 3003', true),
  ('Xanh Dương', '#2563EB', '18-4051 TCX', 'RAL 5015', true),
  ('Xanh Navy', '#1E3A8A', '19-3939 TCX', 'RAL 5013', true),
  ('Xanh Lá', '#16A34A', '17-6153 TCX', 'RAL 6024', true),
  ('Xanh Lá Đậm', '#166534', '19-5420 TCX', 'RAL 6016', true),
  ('Vàng', '#EAB308', '13-0859 TCX', 'RAL 1018', true),
  ('Vàng Nhạt', '#FDE047', '12-0736 TCX', 'RAL 1016', true),
  ('Cam', '#EA580C', '16-1364 TCX', 'RAL 2004', true),
  ('Hồng', '#DB2777', '17-2034 TCX', 'RAL 4003', true),
  ('Hồng Nhạt', '#F472B6', '15-2214 TCX', 'RAL 3015', true),
  ('Tím', '#9333EA', '18-3838 TCX', 'RAL 4005', true),
  ('Tím Đậm', '#6B21A8', '19-3640 TCX', 'RAL 4007', true),
  ('Nâu', '#92400E', '18-1140 TCX', 'RAL 8024', true),
  ('Be', '#D4B896', '14-1116 TCX', 'RAL 1001', true),
  ('Xám', '#6B7280', '17-4402 TCX', 'RAL 7037', true),
  ('Xám Nhạt', '#9CA3AF', '15-4306 TCX', 'RAL 7035', true),
  ('Xám Đậm', '#374151', '19-4007 TCX', 'RAL 7024', true),
  ('Xanh Ngọc', '#0D9488', '17-5024 TCX', 'RAL 6033', true),
  ('Xanh Cyan', '#06B6D4', '15-4825 TCX', 'RAL 5018', true),
  ('Bạc', '#C0C0C0', '14-4102 TCX', 'RAL 9006', true),
  ('Vàng Gold', '#D4AF37', '16-0946 TCX', 'RAL 1024', true),
  ('Kem', '#FFFDD0', '11-0107 TCX', 'RAL 1015', true)
ON CONFLICT (name) DO UPDATE SET
  hex_code = EXCLUDED.hex_code,
  pantone_code = EXCLUDED.pantone_code,
  ral_code = EXCLUDED.ral_code,
  is_active = true;

-- =============================================
-- 4. THREAD TYPES (50 loại chỉ)
-- Với các tex: 20, 25, 30, 35, 40, 45, 50, 60, 70, 80
-- Các chất liệu: polyester, cotton, nylon, silk, rayon, mixed
-- =============================================

INSERT INTO thread_types (
  code, name, color, color_code, material, tex_number,
  density_grams_per_meter, meters_per_cone, supplier, 
  reorder_level_meters, lead_time_days, is_active
) VALUES
  -- TEX 20 (chỉ mảnh nhất - 5 loại)
  ('CHI-20-TRA', 'Chỉ Polyester Trắng TEX20', 'Trắng', '#FFFFFF', 'polyester', 20.00, 0.020000, 6000.00, 'Công ty TNHH Coats Việt Nam', 15000.00, 5, true),
  ('CHI-20-DEN', 'Chỉ Polyester Đen TEX20', 'Đen', '#000000', 'polyester', 20.00, 0.020000, 6000.00, 'Công ty TNHH Coats Việt Nam', 15000.00, 5, true),
  ('CHI-20-DO', 'Chỉ Polyester Đỏ TEX20', 'Đỏ', '#DC2626', 'polyester', 20.00, 0.020000, 6000.00, 'Công ty TNHH Chỉ May Việt Tiến', 12000.00, 7, true),
  ('CHI-20-XDG', 'Chỉ Polyester Xanh Dương TEX20', 'Xanh Dương', '#2563EB', 'polyester', 20.00, 0.020000, 6000.00, 'Công ty TNHH Chỉ May Việt Tiến', 12000.00, 7, true),
  ('CHI-20-VAG', 'Chỉ Polyester Vàng TEX20', 'Vàng', '#EAB308', 'polyester', 20.00, 0.020000, 6000.00, 'Công ty TNHH Chỉ May Việt Tiến', 10000.00, 7, true),
  
  -- TEX 25 (5 loại)
  ('CHI-25-TRA', 'Chỉ Cotton Trắng TEX25', 'Trắng', '#FFFFFF', 'cotton', 25.00, 0.025000, 5500.00, 'Công ty CP Sợi Chỉ Phú Thọ', 12000.00, 10, true),
  ('CHI-25-DEN', 'Chỉ Cotton Đen TEX25', 'Đen', '#000000', 'cotton', 25.00, 0.025000, 5500.00, 'Công ty CP Sợi Chỉ Phú Thọ', 12000.00, 10, true),
  ('CHI-25-NAU', 'Chỉ Cotton Nâu TEX25', 'Nâu', '#92400E', 'cotton', 25.00, 0.025000, 5500.00, 'Công ty CP Sợi Chỉ Phú Thọ', 8000.00, 10, true),
  ('CHI-25-BEE', 'Chỉ Cotton Be TEX25', 'Be', '#D4B896', 'cotton', 25.00, 0.025000, 5500.00, 'Xưởng Chỉ Thái Bình', 8000.00, 8, true),
  ('CHI-25-XAM', 'Chỉ Cotton Xám TEX25', 'Xám', '#6B7280', 'cotton', 25.00, 0.025000, 5500.00, 'Xưởng Chỉ Thái Bình', 8000.00, 8, true),
  
  -- TEX 30 (5 loại)
  ('CHI-30-TRA', 'Chỉ Polyester Trắng TEX30', 'Trắng', '#FFFFFF', 'polyester', 30.00, 0.030000, 5000.00, 'Công ty TNHH Gütermann Việt Nam', 15000.00, 7, true),
  ('CHI-30-DEN', 'Chỉ Polyester Đen TEX30', 'Đen', '#000000', 'polyester', 30.00, 0.030000, 5000.00, 'Công ty TNHH Gütermann Việt Nam', 15000.00, 7, true),
  ('CHI-30-XLA', 'Chỉ Polyester Xanh Lá TEX30', 'Xanh Lá', '#16A34A', 'polyester', 30.00, 0.030000, 5000.00, 'Nhà máy Chỉ Kim Ngọc', 10000.00, 7, true),
  ('CHI-30-HOG', 'Chỉ Polyester Hồng TEX30', 'Hồng', '#DB2777', 'polyester', 30.00, 0.030000, 5000.00, 'Nhà máy Chỉ Kim Ngọc', 8000.00, 7, true),
  ('CHI-30-TIM', 'Chỉ Polyester Tím TEX30', 'Tím', '#9333EA', 'polyester', 30.00, 0.030000, 5000.00, 'Nhà máy Chỉ Kim Ngọc', 8000.00, 7, true),
  
  -- TEX 35 (5 loại)
  ('CHI-35-TRA', 'Chỉ Nylon Trắng TEX35', 'Trắng', '#FFFFFF', 'nylon', 35.00, 0.035000, 4800.00, 'Công ty TNHH American Thread', 12000.00, 14, true),
  ('CHI-35-DEN', 'Chỉ Nylon Đen TEX35', 'Đen', '#000000', 'nylon', 35.00, 0.035000, 4800.00, 'Công ty TNHH American Thread', 12000.00, 14, true),
  ('CHI-35-NAV', 'Chỉ Nylon Navy TEX35', 'Xanh Navy', '#1E3A8A', 'nylon', 35.00, 0.035000, 4800.00, 'Công ty TNHH American Thread', 10000.00, 14, true),
  ('CHI-35-XAD', 'Chỉ Nylon Xám Đậm TEX35', 'Xám Đậm', '#374151', 'nylon', 35.00, 0.035000, 4800.00, 'Công ty TNHH Onuki Việt Nam', 8000.00, 6, true),
  ('CHI-35-CAM', 'Chỉ Nylon Cam TEX35', 'Cam', '#EA580C', 'nylon', 35.00, 0.035000, 4800.00, 'Công ty TNHH Onuki Việt Nam', 6000.00, 6, true),
  
  -- TEX 40 (chỉ phổ biến nhất - 8 loại)
  ('CHI-40-TRA', 'Chỉ Polyester Trắng TEX40', 'Trắng', '#FFFFFF', 'polyester', 40.00, 0.040000, 5000.00, 'Công ty TNHH Coats Việt Nam', 20000.00, 5, true),
  ('CHI-40-DEN', 'Chỉ Polyester Đen TEX40', 'Đen', '#000000', 'polyester', 40.00, 0.040000, 5000.00, 'Công ty TNHH Coats Việt Nam', 20000.00, 5, true),
  ('CHI-40-DO', 'Chỉ Polyester Đỏ TEX40', 'Đỏ', '#DC2626', 'polyester', 40.00, 0.040000, 5000.00, 'Công ty TNHH Chỉ May Việt Tiến', 15000.00, 7, true),
  ('CHI-40-XDG', 'Chỉ Polyester Xanh Dương TEX40', 'Xanh Dương', '#2563EB', 'polyester', 40.00, 0.040000, 5000.00, 'Công ty TNHH Chỉ May Việt Tiến', 15000.00, 7, true),
  ('CHI-40-XLA', 'Chỉ Polyester Xanh Lá TEX40', 'Xanh Lá', '#16A34A', 'polyester', 40.00, 0.040000, 5000.00, 'Công ty CP Dệt May Hà Nội', 12000.00, 12, true),
  ('CHI-40-VAG', 'Chỉ Polyester Vàng TEX40', 'Vàng', '#EAB308', 'polyester', 40.00, 0.040000, 5000.00, 'Công ty CP Dệt May Hà Nội', 10000.00, 12, true),
  ('CHI-40-HOG', 'Chỉ Polyester Hồng TEX40', 'Hồng', '#DB2777', 'polyester', 40.00, 0.040000, 5000.00, 'Nhà máy Chỉ Kim Ngọc', 8000.00, 7, true),
  ('CHI-40-KEM', 'Chỉ Polyester Kem TEX40', 'Kem', '#FFFDD0', 'polyester', 40.00, 0.040000, 5000.00, 'Nhà máy Chỉ Kim Ngọc', 8000.00, 7, true),
  
  -- TEX 45 (5 loại)
  ('CHI-45-TRA', 'Chỉ Silk Trắng TEX45', 'Trắng', '#FFFFFF', 'silk', 45.00, 0.045000, 4500.00, 'Công ty TNHH Gütermann Việt Nam', 10000.00, 7, true),
  ('CHI-45-DEN', 'Chỉ Silk Đen TEX45', 'Đen', '#000000', 'silk', 45.00, 0.045000, 4500.00, 'Công ty TNHH Gütermann Việt Nam', 10000.00, 7, true),
  ('CHI-45-GOD', 'Chỉ Silk Vàng Gold TEX45', 'Vàng Gold', '#D4AF37', 'silk', 45.00, 0.045000, 4500.00, 'Công ty TNHH A&E Gütermann', 6000.00, 10, true),
  ('CHI-45-BAC', 'Chỉ Silk Bạc TEX45', 'Bạc', '#C0C0C0', 'silk', 45.00, 0.045000, 4500.00, 'Công ty TNHH A&E Gütermann', 6000.00, 10, true),
  ('CHI-45-TIM', 'Chỉ Silk Tím TEX45', 'Tím', '#9333EA', 'silk', 45.00, 0.045000, 4500.00, 'Công ty TNHH A&E Gütermann', 5000.00, 10, true),
  
  -- TEX 50 (5 loại)
  ('CHI-50-TRA', 'Chỉ Mixed Trắng TEX50', 'Trắng', '#FFFFFF', 'mixed', 50.00, 0.050000, 4000.00, 'Xí nghiệp Chỉ May Bình Định', 12000.00, 9, true),
  ('CHI-50-DEN', 'Chỉ Mixed Đen TEX50', 'Đen', '#000000', 'mixed', 50.00, 0.050000, 4000.00, 'Xí nghiệp Chỉ May Bình Định', 12000.00, 9, true),
  ('CHI-50-XNG', 'Chỉ Mixed Xanh Ngọc TEX50', 'Xanh Ngọc', '#0D9488', 'mixed', 50.00, 0.050000, 4000.00, 'Xí nghiệp Chỉ May Bình Định', 8000.00, 9, true),
  ('CHI-50-CYA', 'Chỉ Mixed Xanh Cyan TEX50', 'Xanh Cyan', '#06B6D4', 'mixed', 50.00, 0.050000, 4000.00, 'Nhà máy Sợi Đồng Nai', 8000.00, 5, true),
  ('CHI-50-XAN', 'Chỉ Mixed Xám Nhạt TEX50', 'Xám Nhạt', '#9CA3AF', 'mixed', 50.00, 0.050000, 4000.00, 'Nhà máy Sợi Đồng Nai', 8000.00, 5, true),
  
  -- TEX 60 (6 loại)
  ('CHI-60-TRA', 'Chỉ Polyester Trắng TEX60', 'Trắng', '#FFFFFF', 'polyester', 60.00, 0.060000, 3500.00, 'Công ty TNHH Coats Việt Nam', 12000.00, 5, true),
  ('CHI-60-DEN', 'Chỉ Polyester Đen TEX60', 'Đen', '#000000', 'polyester', 60.00, 0.060000, 3500.00, 'Công ty TNHH Coats Việt Nam', 12000.00, 5, true),
  ('CHI-60-XDG', 'Chỉ Polyester Xanh Dương TEX60', 'Xanh Dương', '#2563EB', 'polyester', 60.00, 0.060000, 3500.00, 'Công ty CP Sợi Chỉ Phú Thọ', 10000.00, 10, true),
  ('CHI-60-NAV', 'Chỉ Polyester Navy TEX60', 'Xanh Navy', '#1E3A8A', 'polyester', 60.00, 0.060000, 3500.00, 'Công ty CP Sợi Chỉ Phú Thọ', 10000.00, 10, true),
  ('CHI-60-DOD', 'Chỉ Polyester Đỏ Đậm TEX60', 'Đỏ Đậm', '#991B1B', 'polyester', 60.00, 0.060000, 3500.00, 'Xưởng Chỉ Thái Bình', 8000.00, 8, true),
  ('CHI-60-XLD', 'Chỉ Polyester Xanh Lá Đậm TEX60', 'Xanh Lá Đậm', '#166534', 'polyester', 60.00, 0.060000, 3500.00, 'Xưởng Chỉ Thái Bình', 8000.00, 8, true),
  
  -- TEX 70 (3 loại)
  ('CHI-70-TRA', 'Chỉ Rayon Trắng TEX70', 'Trắng', '#FFFFFF', 'rayon', 70.00, 0.070000, 3000.00, 'Công ty TNHH Onuki Việt Nam', 8000.00, 6, true),
  ('CHI-70-DEN', 'Chỉ Rayon Đen TEX70', 'Đen', '#000000', 'rayon', 70.00, 0.070000, 3000.00, 'Công ty TNHH Onuki Việt Nam', 8000.00, 6, true),
  ('CHI-70-TDD', 'Chỉ Rayon Tím Đậm TEX70', 'Tím Đậm', '#6B21A8', 'rayon', 70.00, 0.070000, 3000.00, 'Công ty TNHH Onuki Việt Nam', 5000.00, 6, true),
  
  -- TEX 80 (chỉ dày nhất - 3 loại)
  ('CHI-80-TRA', 'Chỉ Nylon Trắng TEX80', 'Trắng', '#FFFFFF', 'nylon', 80.00, 0.080000, 2500.00, 'Công ty TNHH American Thread', 6000.00, 14, true),
  ('CHI-80-DEN', 'Chỉ Nylon Đen TEX80', 'Đen', '#000000', 'nylon', 80.00, 0.080000, 2500.00, 'Công ty TNHH American Thread', 6000.00, 14, true),
  ('CHI-80-HON', 'Chỉ Nylon Hồng Nhạt TEX80', 'Hồng Nhạt', '#F472B6', 'nylon', 80.00, 0.080000, 2500.00, 'Công ty TNHH American Thread', 4000.00, 14, true)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  color = EXCLUDED.color,
  color_code = EXCLUDED.color_code,
  material = EXCLUDED.material,
  tex_number = EXCLUDED.tex_number,
  density_grams_per_meter = EXCLUDED.density_grams_per_meter,
  meters_per_cone = EXCLUDED.meters_per_cone,
  supplier = EXCLUDED.supplier,
  reorder_level_meters = EXCLUDED.reorder_level_meters,
  lead_time_days = EXCLUDED.lead_time_days,
  is_active = true;

-- =============================================
-- 5. THREAD INVENTORY (200+ cuộn phân bổ trên 5 kho)
-- =============================================

-- Xóa dữ liệu inventory cũ để tránh conflict
DELETE FROM thread_inventory WHERE cone_id LIKE 'TST-%';

-- Kho Dệt Kim (DB-DK) - 50 cuộn
INSERT INTO thread_inventory (
  cone_id, thread_type_id, warehouse_id, quantity_cones, quantity_meters,
  weight_grams, is_partial, status, lot_number, expiry_date, received_date, location
)
SELECT 
  'TST-DK-' || LPAD(n::text, 3, '0'),
  tt.id,
  (SELECT id FROM warehouses WHERE code = 'DB-DK'),
  1,
  tt.meters_per_cone,
  tt.meters_per_cone * tt.density_grams_per_meter,
  false,
  'AVAILABLE'::cone_status,
  'LOT-2025-' || LPAD((n % 20 + 1)::text, 3, '0'),
  CASE WHEN n % 3 = 0 THEN '2026-12-31'::date ELSE NULL END,
  '2025-01-15'::date,
  'A' || ((n-1) / 10 + 1) || '-' || LPAD(((n-1) % 10 + 1)::text, 2, '0')
FROM 
  generate_series(1, 50) n,
  (SELECT id, meters_per_cone, density_grams_per_meter FROM thread_types WHERE code LIKE 'CHI-%' ORDER BY RANDOM() LIMIT 50) tt
WHERE n <= 50
ON CONFLICT (cone_id) DO NOTHING;

-- Fix the above - do individual inserts for proper random assignment
-- Kho Dệt Kim (DB-DK) - 50 cuộn với các loại chỉ khác nhau
DO $$
DECLARE
  r RECORD;
  i INTEGER := 1;
  wh_id INTEGER;
  v_lot_num TEXT;
  v_expiry DATE;
  v_location TEXT;
BEGIN
  SELECT id INTO wh_id FROM warehouses WHERE code = 'DB-DK';
  
  FOR r IN SELECT id, meters_per_cone, density_grams_per_meter FROM thread_types WHERE code LIKE 'CHI-%' ORDER BY RANDOM() LIMIT 50 LOOP
    v_lot_num := 'LOT-2025-' || LPAD((i % 20 + 1)::text, 3, '0');
    v_expiry := CASE WHEN i % 3 = 0 THEN '2026-12-31'::date ELSE NULL END;
    v_location := 'A' || ((i-1) / 10 + 1) || '-' || LPAD(((i-1) % 10 + 1)::text, 2, '0');
    
    INSERT INTO thread_inventory (
      cone_id, thread_type_id, warehouse_id, quantity_cones, quantity_meters,
      weight_grams, is_partial, status, lot_number, expiry_date, received_date, location
    ) VALUES (
      'TST-DK-' || LPAD(i::text, 3, '0'),
      r.id,
      wh_id,
      1,
      r.meters_per_cone,
      r.meters_per_cone * r.density_grams_per_meter,
      false,
      'AVAILABLE',
      v_lot_num,
      v_expiry,
      '2025-01-15'::date,
      v_location
    ) ON CONFLICT (cone_id) DO UPDATE SET
      thread_type_id = r.id,
      warehouse_id = wh_id,
      quantity_meters = r.meters_per_cone,
      weight_grams = r.meters_per_cone * r.density_grams_per_meter,
      status = 'AVAILABLE';
    
    i := i + 1;
  END LOOP;
END $$;

-- Kho Xưởng Nhật (DB-XN) - 50 cuộn
DO $$
DECLARE
  r RECORD;
  i INTEGER := 1;
  wh_id INTEGER;
  v_lot_num TEXT;
  v_expiry DATE;
  v_location TEXT;
BEGIN
  SELECT id INTO wh_id FROM warehouses WHERE code = 'DB-XN';
  
  FOR r IN SELECT id, meters_per_cone, density_grams_per_meter FROM thread_types WHERE code LIKE 'CHI-%' ORDER BY RANDOM() LIMIT 50 LOOP
    v_lot_num := 'LOT-2025-' || LPAD((i % 20 + 21)::text, 3, '0');
    v_expiry := CASE WHEN i % 4 = 0 THEN '2027-06-30'::date ELSE NULL END;
    v_location := 'B' || ((i-1) / 10 + 1) || '-' || LPAD(((i-1) % 10 + 1)::text, 2, '0');
    
    INSERT INTO thread_inventory (
      cone_id, thread_type_id, warehouse_id, quantity_cones, quantity_meters,
      weight_grams, is_partial, status, lot_number, expiry_date, received_date, location
    ) VALUES (
      'TST-XN-' || LPAD(i::text, 3, '0'),
      r.id,
      wh_id,
      1,
      r.meters_per_cone,
      r.meters_per_cone * r.density_grams_per_meter,
      false,
      'AVAILABLE',
      v_lot_num,
      v_expiry,
      '2025-01-20'::date,
      v_location
    ) ON CONFLICT (cone_id) DO UPDATE SET
      thread_type_id = r.id,
      warehouse_id = wh_id,
      quantity_meters = r.meters_per_cone,
      weight_grams = r.meters_per_cone * r.density_grams_per_meter,
      status = 'AVAILABLE';
    
    i := i + 1;
  END LOOP;
END $$;

-- Kho Xưởng Trước (DB-XT) - 40 cuộn
DO $$
DECLARE
  r RECORD;
  i INTEGER := 1;
  wh_id INTEGER;
  v_lot_num TEXT;
  v_expiry DATE;
  v_location TEXT;
BEGIN
  SELECT id INTO wh_id FROM warehouses WHERE code = 'DB-XT';
  
  FOR r IN SELECT id, meters_per_cone, density_grams_per_meter FROM thread_types WHERE code LIKE 'CHI-%' ORDER BY RANDOM() LIMIT 40 LOOP
    v_lot_num := 'LOT-2025-' || LPAD((i % 15 + 41)::text, 3, '0');
    v_expiry := CASE WHEN i % 5 = 0 THEN '2026-09-30'::date ELSE NULL END;
    v_location := 'C' || ((i-1) / 8 + 1) || '-' || LPAD(((i-1) % 8 + 1)::text, 2, '0');
    
    INSERT INTO thread_inventory (
      cone_id, thread_type_id, warehouse_id, quantity_cones, quantity_meters,
      weight_grams, is_partial, status, lot_number, expiry_date, received_date, location
    ) VALUES (
      'TST-XT-' || LPAD(i::text, 3, '0'),
      r.id,
      wh_id,
      1,
      r.meters_per_cone,
      r.meters_per_cone * r.density_grams_per_meter,
      false,
      'AVAILABLE',
      v_lot_num,
      v_expiry,
      '2025-01-25'::date,
      v_location
    ) ON CONFLICT (cone_id) DO UPDATE SET
      thread_type_id = r.id,
      warehouse_id = wh_id,
      quantity_meters = r.meters_per_cone,
      weight_grams = r.meters_per_cone * r.density_grams_per_meter,
      status = 'AVAILABLE';
    
    i := i + 1;
  END LOOP;
END $$;

-- Kho Phú Tường (PT-01) - 40 cuộn
DO $$
DECLARE
  r RECORD;
  i INTEGER := 1;
  wh_id INTEGER;
  v_lot_num TEXT;
  v_expiry DATE;
  v_location TEXT;
BEGIN
  SELECT id INTO wh_id FROM warehouses WHERE code = 'PT-01';
  
  FOR r IN SELECT id, meters_per_cone, density_grams_per_meter FROM thread_types WHERE code LIKE 'CHI-%' ORDER BY RANDOM() LIMIT 40 LOOP
    v_lot_num := 'LOT-2025-' || LPAD((i % 12 + 56)::text, 3, '0');
    v_expiry := CASE WHEN i % 4 = 0 THEN '2027-03-31'::date ELSE NULL END;
    v_location := 'P' || ((i-1) / 8 + 1) || '-' || LPAD(((i-1) % 8 + 1)::text, 2, '0');
    
    INSERT INTO thread_inventory (
      cone_id, thread_type_id, warehouse_id, quantity_cones, quantity_meters,
      weight_grams, is_partial, status, lot_number, expiry_date, received_date, location
    ) VALUES (
      'TST-PT-' || LPAD(i::text, 3, '0'),
      r.id,
      wh_id,
      1,
      r.meters_per_cone,
      r.meters_per_cone * r.density_grams_per_meter,
      false,
      'AVAILABLE',
      v_lot_num,
      v_expiry,
      '2025-02-01'::date,
      v_location
    ) ON CONFLICT (cone_id) DO UPDATE SET
      thread_type_id = r.id,
      warehouse_id = wh_id,
      quantity_meters = r.meters_per_cone,
      weight_grams = r.meters_per_cone * r.density_grams_per_meter,
      status = 'AVAILABLE';
    
    i := i + 1;
  END LOOP;
END $$;

-- Thêm cuộn lẻ (partial cones) - 20 cuộn
DO $$
DECLARE
  r RECORD;
  i INTEGER := 1;
  wh_ids INTEGER[];
  wh_id INTEGER;
  partial_meters DECIMAL;
  partial_weight DECIMAL;
BEGIN
  wh_ids := ARRAY(
    SELECT id FROM warehouses WHERE code IN ('DB-DK', 'DB-XN', 'DB-XT', 'PT-01') ORDER BY RANDOM()
  );
  
  FOR r IN SELECT id, meters_per_cone, density_grams_per_meter FROM thread_types WHERE code LIKE 'CHI-%' ORDER BY RANDOM() LIMIT 20 LOOP
    wh_id := wh_ids[(i % 4) + 1];
    partial_meters := r.meters_per_cone * (0.2 + random() * 0.5); -- 20-70% remaining
    partial_weight := partial_meters * r.density_grams_per_meter;
    
    INSERT INTO thread_inventory (
      cone_id, thread_type_id, warehouse_id, quantity_cones, quantity_meters,
      weight_grams, is_partial, status, lot_number, received_date, location
    ) VALUES (
      'TST-PAR-' || LPAD(i::text, 3, '0'),
      r.id,
      wh_id,
      1,
      ROUND(partial_meters::numeric, 2),
      ROUND(partial_weight::numeric, 2),
      true,
      'AVAILABLE',
      'LOT-2024-PAR-' || LPAD(i::text, 3, '0'),
      '2024-12-15'::date,
      'REC-' || LPAD(i::text, 2, '0')
    ) ON CONFLICT (cone_id) DO UPDATE SET
      thread_type_id = r.id,
      warehouse_id = wh_id,
      quantity_meters = ROUND(partial_meters::numeric, 2),
      weight_grams = ROUND(partial_weight::numeric, 2),
      is_partial = true,
      status = 'AVAILABLE';
    
    i := i + 1;
  END LOOP;
END $$;

-- Thêm cuộn đang sản xuất (IN_PRODUCTION) - 10 cuộn
DO $$
DECLARE
  r RECORD;
  i INTEGER := 1;
  wh_ids INTEGER[];
  wh_id INTEGER;
BEGIN
  wh_ids := ARRAY(
    SELECT id FROM warehouses WHERE code IN ('DB-DK', 'DB-XN') ORDER BY code
  );
  
  FOR r IN SELECT id, meters_per_cone, density_grams_per_meter FROM thread_types WHERE code LIKE 'CHI-40%' ORDER BY RANDOM() LIMIT 10 LOOP
    wh_id := wh_ids[(i % 2) + 1];
    
    INSERT INTO thread_inventory (
      cone_id, thread_type_id, warehouse_id, quantity_cones, quantity_meters,
      weight_grams, is_partial, status, lot_number, received_date, location
    ) VALUES (
      'TST-PRO-' || LPAD(i::text, 3, '0'),
      r.id,
      wh_id,
      1,
      r.meters_per_cone,
      r.meters_per_cone * r.density_grams_per_meter,
      false,
      'IN_PRODUCTION',
      'LOT-2025-PRO-' || LPAD(i::text, 3, '0'),
      '2025-01-10'::date,
      NULL
    ) ON CONFLICT (cone_id) DO UPDATE SET
      thread_type_id = r.id,
      warehouse_id = wh_id,
      quantity_meters = r.meters_per_cone,
      weight_grams = r.meters_per_cone * r.density_grams_per_meter,
      status = 'IN_PRODUCTION';
    
    i := i + 1;
  END LOOP;
END $$;

-- Thêm cuộn mới nhận (RECEIVED) - 10 cuộn
DO $$
DECLARE
  r RECORD;
  i INTEGER := 1;
  wh_id INTEGER;
BEGIN
  SELECT id INTO wh_id FROM warehouses WHERE code = 'DB-DK';
  
  FOR r IN SELECT id, meters_per_cone, density_grams_per_meter FROM thread_types WHERE code LIKE 'CHI-60%' ORDER BY RANDOM() LIMIT 10 LOOP
    INSERT INTO thread_inventory (
      cone_id, thread_type_id, warehouse_id, quantity_cones, quantity_meters,
      weight_grams, is_partial, status, lot_number, received_date, location
    ) VALUES (
      'TST-NEW-' || LPAD(i::text, 3, '0'),
      r.id,
      wh_id,
      1,
      r.meters_per_cone,
      r.meters_per_cone * r.density_grams_per_meter,
      false,
      'RECEIVED',
      'LOT-2025-NEW-' || LPAD(i::text, 3, '0'),
      CURRENT_DATE,
      'RECV-AREA'
    ) ON CONFLICT (cone_id) DO UPDATE SET
      thread_type_id = r.id,
      warehouse_id = wh_id,
      quantity_meters = r.meters_per_cone,
      weight_grams = r.meters_per_cone * r.density_grams_per_meter,
      status = 'RECEIVED',
      received_date = CURRENT_DATE;
    
    i := i + 1;
  END LOOP;
END $$;

-- =============================================
-- 6. VERIFICATION QUERIES
-- =============================================
-- SELECT 'Warehouses' as table_name, COUNT(*) as count FROM warehouses WHERE is_active = true;
-- SELECT 'Suppliers' as table_name, COUNT(*) as count FROM suppliers WHERE is_active = true;
-- SELECT 'Colors' as table_name, COUNT(*) as count FROM colors WHERE is_active = true;
-- SELECT 'Thread Types' as table_name, COUNT(*) as count FROM thread_types WHERE is_active = true;
-- SELECT 'Thread Inventory' as table_name, COUNT(*) as count FROM thread_inventory WHERE cone_id LIKE 'TST-%';

-- Inventory by warehouse
-- SELECT w.name, COUNT(ti.id) as cones 
-- FROM thread_inventory ti
-- JOIN warehouses w ON ti.warehouse_id = w.id
-- WHERE ti.cone_id LIKE 'TST-%'
-- GROUP BY w.name ORDER BY cones DESC;

-- Inventory by status
-- SELECT status, COUNT(*) FROM thread_inventory WHERE cone_id LIKE 'TST-%' GROUP BY status;

-- Thread types by tex
-- SELECT tex_number, COUNT(*) FROM thread_types WHERE code LIKE 'CHI-%' GROUP BY tex_number ORDER BY tex_number;

-- =============================================
-- SUMMARY:
-- - 2 LOCATION + 4 STORAGE = 6 warehouses
-- - 12 suppliers
-- - 25 colors
-- - 50 thread types (tex: 20, 25, 30, 35, 40, 45, 50, 60, 70, 80)
-- - 220+ inventory cones across all warehouses
-- =============================================
