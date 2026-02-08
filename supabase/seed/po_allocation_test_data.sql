-- =============================================
-- PO & ALLOCATION TEST DATA SEED
-- Task: Tạo dữ liệu mẫu cho PO, Styles, SKUs
--       để test tính năng "Tạo Phiếu Phân Bổ"
-- Date: 2026-02-08
-- Dependencies: comprehensive_test_data.sql (suppliers, colors, thread_types)
-- =============================================

-- =============================================
-- 1. STYLES (3 mã hàng)
-- =============================================

INSERT INTO styles (style_code, style_name, description, fabric_type) VALUES
  ('STY-POLO-01', 'Áo Polo Nam Basic', 'Áo polo nam cổ bẻ, chất liệu cotton pha', 'Cotton Pique'),
  ('STY-SHIRT-01', 'Áo Sơ Mi Nam Dài Tay', 'Áo sơ mi nam tay dài, chất liệu oxford', 'Oxford Cotton'),
  ('STY-PANT-01', 'Quần Tây Nam Slim Fit', 'Quần tây nam dáng ôm, chất liệu kaki', 'Kaki Blend')
ON CONFLICT (style_code) DO UPDATE SET
  style_name = EXCLUDED.style_name,
  description = EXCLUDED.description,
  fabric_type = EXCLUDED.fabric_type;

-- =============================================
-- 2. STYLE_THREAD_SPECS (Định mức chỉ cho mỗi style)
-- Mỗi style có 3 công đoạn: May thân, May tay áo/túi, Vắt sổ
-- =============================================

-- --- STY-POLO-01: Áo Polo ---
-- Công đoạn 1: May thân - TEX40 Trắng, NCC-003 (Coats)
INSERT INTO style_thread_specs (style_id, supplier_id, process_name, tex_id, meters_per_unit, notes)
VALUES (
  (SELECT id FROM styles WHERE style_code = 'STY-POLO-01'),
  (SELECT id FROM suppliers WHERE code = 'NCC-003'),
  'May thân',
  (SELECT id FROM thread_types WHERE code = 'CHI-40-TRA'),
  120.00,
  'Chỉ may thân áo polo - TEX40 polyester trắng'
) ON CONFLICT DO NOTHING;

-- Công đoạn 2: May tay áo - TEX40 Trắng, NCC-003
INSERT INTO style_thread_specs (style_id, supplier_id, process_name, tex_id, meters_per_unit, notes)
VALUES (
  (SELECT id FROM styles WHERE style_code = 'STY-POLO-01'),
  (SELECT id FROM suppliers WHERE code = 'NCC-003'),
  'May tay áo',
  (SELECT id FROM thread_types WHERE code = 'CHI-40-TRA'),
  80.00,
  'Chỉ may tay áo polo - TEX40 polyester trắng'
) ON CONFLICT DO NOTHING;

-- Công đoạn 3: Vắt sổ - TEX60 Trắng, NCC-003
INSERT INTO style_thread_specs (style_id, supplier_id, process_name, tex_id, meters_per_unit, notes)
VALUES (
  (SELECT id FROM styles WHERE style_code = 'STY-POLO-01'),
  (SELECT id FROM suppliers WHERE code = 'NCC-003'),
  'Vắt sổ',
  (SELECT id FROM thread_types WHERE code = 'CHI-60-TRA'),
  200.00,
  'Chỉ vắt sổ áo polo - TEX60 polyester trắng'
) ON CONFLICT DO NOTHING;

-- --- STY-SHIRT-01: Áo Sơ Mi ---
-- Công đoạn 1: May thân - TEX40 Trắng, NCC-001 (Việt Tiến)
INSERT INTO style_thread_specs (style_id, supplier_id, process_name, tex_id, meters_per_unit, notes)
VALUES (
  (SELECT id FROM styles WHERE style_code = 'STY-SHIRT-01'),
  (SELECT id FROM suppliers WHERE code = 'NCC-001'),
  'May thân',
  (SELECT id FROM thread_types WHERE code = 'CHI-40-TRA'),
  150.00,
  'Chỉ may thân sơ mi - TEX40 polyester trắng'
) ON CONFLICT DO NOTHING;

-- Công đoạn 2: May cổ & manchette - TEX30 Trắng, NCC-010 (Gütermann)
INSERT INTO style_thread_specs (style_id, supplier_id, process_name, tex_id, meters_per_unit, notes)
VALUES (
  (SELECT id FROM styles WHERE style_code = 'STY-SHIRT-01'),
  (SELECT id FROM suppliers WHERE code = 'NCC-010'),
  'May cổ & manchette',
  (SELECT id FROM thread_types WHERE code = 'CHI-30-TRA'),
  60.00,
  'Chỉ may cổ áo và manchette - TEX30 polyester trắng'
) ON CONFLICT DO NOTHING;

-- Công đoạn 3: Vắt sổ - TEX60 Trắng, NCC-001
INSERT INTO style_thread_specs (style_id, supplier_id, process_name, tex_id, meters_per_unit, notes)
VALUES (
  (SELECT id FROM styles WHERE style_code = 'STY-SHIRT-01'),
  (SELECT id FROM suppliers WHERE code = 'NCC-001'),
  'Vắt sổ',
  (SELECT id FROM thread_types WHERE code = 'CHI-60-TRA'),
  180.00,
  'Chỉ vắt sổ sơ mi - TEX60 polyester trắng'
) ON CONFLICT DO NOTHING;

-- --- STY-PANT-01: Quần Tây ---
-- Công đoạn 1: May thân - TEX40 Đen, NCC-003 (Coats)
INSERT INTO style_thread_specs (style_id, supplier_id, process_name, tex_id, meters_per_unit, notes)
VALUES (
  (SELECT id FROM styles WHERE style_code = 'STY-PANT-01'),
  (SELECT id FROM suppliers WHERE code = 'NCC-003'),
  'May thân',
  (SELECT id FROM thread_types WHERE code = 'CHI-40-DEN'),
  180.00,
  'Chỉ may thân quần tây - TEX40 polyester đen'
) ON CONFLICT DO NOTHING;

-- Công đoạn 2: May túi & cạp - TEX40 Đen, NCC-003
INSERT INTO style_thread_specs (style_id, supplier_id, process_name, tex_id, meters_per_unit, notes)
VALUES (
  (SELECT id FROM styles WHERE style_code = 'STY-PANT-01'),
  (SELECT id FROM suppliers WHERE code = 'NCC-003'),
  'May túi & cạp',
  (SELECT id FROM thread_types WHERE code = 'CHI-40-DEN'),
  100.00,
  'Chỉ may túi và cạp quần - TEX40 polyester đen'
) ON CONFLICT DO NOTHING;

-- Công đoạn 3: Vắt sổ - TEX60 Đen, NCC-003
INSERT INTO style_thread_specs (style_id, supplier_id, process_name, tex_id, meters_per_unit, notes)
VALUES (
  (SELECT id FROM styles WHERE style_code = 'STY-PANT-01'),
  (SELECT id FROM suppliers WHERE code = 'NCC-003'),
  'Vắt sổ',
  (SELECT id FROM thread_types WHERE code = 'CHI-60-DEN'),
  220.00,
  'Chỉ vắt sổ quần tây - TEX60 polyester đen'
) ON CONFLICT DO NOTHING;

-- =============================================
-- 3. PURCHASE ORDERS (2 đơn hàng)
-- =============================================

INSERT INTO purchase_orders (po_number, customer_name, order_date, delivery_date, status, priority, notes) VALUES
  ('PO-2026-001', 'Công ty May Mặc ABC', '2026-02-01'::timestamptz, '2026-03-15'::timestamptz, 'pending', 'high', 'Đơn hàng áo polo + sơ mi xuất Nhật'),
  ('PO-2026-002', 'Công ty Thời Trang XYZ', '2026-02-05'::timestamptz, '2026-04-01'::timestamptz, 'pending', 'normal', 'Đơn hàng quần tây nội địa')
ON CONFLICT (po_number) DO UPDATE SET
  customer_name = EXCLUDED.customer_name,
  order_date = EXCLUDED.order_date,
  delivery_date = EXCLUDED.delivery_date,
  status = EXCLUDED.status,
  priority = EXCLUDED.priority,
  notes = EXCLUDED.notes;

-- =============================================
-- 4. PO_ITEMS (Liên kết PO với Style)
-- PO-2026-001: 2 items (Áo Polo 500 cái + Áo Sơ Mi 300 cái)
-- PO-2026-002: 1 item (Quần Tây 400 cái)
-- =============================================

-- PO-2026-001 → Áo Polo 500 cái
INSERT INTO po_items (po_id, style_id, quantity, notes)
VALUES (
  (SELECT id FROM purchase_orders WHERE po_number = 'PO-2026-001'),
  (SELECT id FROM styles WHERE style_code = 'STY-POLO-01'),
  500,
  'Áo polo nam - 500 cái, 3 màu'
) ON CONFLICT DO NOTHING;

-- PO-2026-001 → Áo Sơ Mi 300 cái
INSERT INTO po_items (po_id, style_id, quantity, notes)
VALUES (
  (SELECT id FROM purchase_orders WHERE po_number = 'PO-2026-001'),
  (SELECT id FROM styles WHERE style_code = 'STY-SHIRT-01'),
  300,
  'Áo sơ mi nam - 300 cái, 2 màu'
) ON CONFLICT DO NOTHING;

-- PO-2026-002 → Quần Tây 400 cái
INSERT INTO po_items (po_id, style_id, quantity, notes)
VALUES (
  (SELECT id FROM purchase_orders WHERE po_number = 'PO-2026-002'),
  (SELECT id FROM styles WHERE style_code = 'STY-PANT-01'),
  400,
  'Quần tây nam - 400 cái, 2 màu'
) ON CONFLICT DO NOTHING;

-- =============================================
-- 5. SKUs (Chi tiết Style + Màu + Size)
-- ĐÂY LÀ PHẦN QUAN TRỌNG NHẤT:
-- Backend dùng skus.color_id để tạo color_breakdown
-- → hasColorBreakdown = true → nút "Tạo Phiếu Phân Bổ" được enable
-- =============================================

-- --- PO-2026-001 / Áo Polo (500 cái = 200 Trắng + 150 Đen + 150 Xanh Navy) ---

-- Áo Polo - Trắng - các size
INSERT INTO skus (po_item_id, color_id, size, quantity) VALUES
  ((SELECT pi.id FROM po_items pi JOIN purchase_orders po ON pi.po_id = po.id JOIN styles s ON pi.style_id = s.id WHERE po.po_number = 'PO-2026-001' AND s.style_code = 'STY-POLO-01'),
   (SELECT id FROM colors WHERE name = 'Trắng'), 'S', 40),
  ((SELECT pi.id FROM po_items pi JOIN purchase_orders po ON pi.po_id = po.id JOIN styles s ON pi.style_id = s.id WHERE po.po_number = 'PO-2026-001' AND s.style_code = 'STY-POLO-01'),
   (SELECT id FROM colors WHERE name = 'Trắng'), 'M', 60),
  ((SELECT pi.id FROM po_items pi JOIN purchase_orders po ON pi.po_id = po.id JOIN styles s ON pi.style_id = s.id WHERE po.po_number = 'PO-2026-001' AND s.style_code = 'STY-POLO-01'),
   (SELECT id FROM colors WHERE name = 'Trắng'), 'L', 60),
  ((SELECT pi.id FROM po_items pi JOIN purchase_orders po ON pi.po_id = po.id JOIN styles s ON pi.style_id = s.id WHERE po.po_number = 'PO-2026-001' AND s.style_code = 'STY-POLO-01'),
   (SELECT id FROM colors WHERE name = 'Trắng'), 'XL', 40)
ON CONFLICT DO NOTHING;

-- Áo Polo - Đen - các size
INSERT INTO skus (po_item_id, color_id, size, quantity) VALUES
  ((SELECT pi.id FROM po_items pi JOIN purchase_orders po ON pi.po_id = po.id JOIN styles s ON pi.style_id = s.id WHERE po.po_number = 'PO-2026-001' AND s.style_code = 'STY-POLO-01'),
   (SELECT id FROM colors WHERE name = 'Đen'), 'S', 30),
  ((SELECT pi.id FROM po_items pi JOIN purchase_orders po ON pi.po_id = po.id JOIN styles s ON pi.style_id = s.id WHERE po.po_number = 'PO-2026-001' AND s.style_code = 'STY-POLO-01'),
   (SELECT id FROM colors WHERE name = 'Đen'), 'M', 40),
  ((SELECT pi.id FROM po_items pi JOIN purchase_orders po ON pi.po_id = po.id JOIN styles s ON pi.style_id = s.id WHERE po.po_number = 'PO-2026-001' AND s.style_code = 'STY-POLO-01'),
   (SELECT id FROM colors WHERE name = 'Đen'), 'L', 50),
  ((SELECT pi.id FROM po_items pi JOIN purchase_orders po ON pi.po_id = po.id JOIN styles s ON pi.style_id = s.id WHERE po.po_number = 'PO-2026-001' AND s.style_code = 'STY-POLO-01'),
   (SELECT id FROM colors WHERE name = 'Đen'), 'XL', 30)
ON CONFLICT DO NOTHING;

-- Áo Polo - Xanh Navy - các size
INSERT INTO skus (po_item_id, color_id, size, quantity) VALUES
  ((SELECT pi.id FROM po_items pi JOIN purchase_orders po ON pi.po_id = po.id JOIN styles s ON pi.style_id = s.id WHERE po.po_number = 'PO-2026-001' AND s.style_code = 'STY-POLO-01'),
   (SELECT id FROM colors WHERE name = 'Xanh Navy'), 'S', 30),
  ((SELECT pi.id FROM po_items pi JOIN purchase_orders po ON pi.po_id = po.id JOIN styles s ON pi.style_id = s.id WHERE po.po_number = 'PO-2026-001' AND s.style_code = 'STY-POLO-01'),
   (SELECT id FROM colors WHERE name = 'Xanh Navy'), 'M', 40),
  ((SELECT pi.id FROM po_items pi JOIN purchase_orders po ON pi.po_id = po.id JOIN styles s ON pi.style_id = s.id WHERE po.po_number = 'PO-2026-001' AND s.style_code = 'STY-POLO-01'),
   (SELECT id FROM colors WHERE name = 'Xanh Navy'), 'L', 50),
  ((SELECT pi.id FROM po_items pi JOIN purchase_orders po ON pi.po_id = po.id JOIN styles s ON pi.style_id = s.id WHERE po.po_number = 'PO-2026-001' AND s.style_code = 'STY-POLO-01'),
   (SELECT id FROM colors WHERE name = 'Xanh Navy'), 'XL', 30)
ON CONFLICT DO NOTHING;

-- --- PO-2026-001 / Áo Sơ Mi (300 cái = 180 Trắng + 120 Xanh Dương) ---

-- Áo Sơ Mi - Trắng - các size
INSERT INTO skus (po_item_id, color_id, size, quantity) VALUES
  ((SELECT pi.id FROM po_items pi JOIN purchase_orders po ON pi.po_id = po.id JOIN styles s ON pi.style_id = s.id WHERE po.po_number = 'PO-2026-001' AND s.style_code = 'STY-SHIRT-01'),
   (SELECT id FROM colors WHERE name = 'Trắng'), 'S', 30),
  ((SELECT pi.id FROM po_items pi JOIN purchase_orders po ON pi.po_id = po.id JOIN styles s ON pi.style_id = s.id WHERE po.po_number = 'PO-2026-001' AND s.style_code = 'STY-SHIRT-01'),
   (SELECT id FROM colors WHERE name = 'Trắng'), 'M', 50),
  ((SELECT pi.id FROM po_items pi JOIN purchase_orders po ON pi.po_id = po.id JOIN styles s ON pi.style_id = s.id WHERE po.po_number = 'PO-2026-001' AND s.style_code = 'STY-SHIRT-01'),
   (SELECT id FROM colors WHERE name = 'Trắng'), 'L', 60),
  ((SELECT pi.id FROM po_items pi JOIN purchase_orders po ON pi.po_id = po.id JOIN styles s ON pi.style_id = s.id WHERE po.po_number = 'PO-2026-001' AND s.style_code = 'STY-SHIRT-01'),
   (SELECT id FROM colors WHERE name = 'Trắng'), 'XL', 40)
ON CONFLICT DO NOTHING;

-- Áo Sơ Mi - Xanh Dương - các size
INSERT INTO skus (po_item_id, color_id, size, quantity) VALUES
  ((SELECT pi.id FROM po_items pi JOIN purchase_orders po ON pi.po_id = po.id JOIN styles s ON pi.style_id = s.id WHERE po.po_number = 'PO-2026-001' AND s.style_code = 'STY-SHIRT-01'),
   (SELECT id FROM colors WHERE name = 'Xanh Dương'), 'S', 20),
  ((SELECT pi.id FROM po_items pi JOIN purchase_orders po ON pi.po_id = po.id JOIN styles s ON pi.style_id = s.id WHERE po.po_number = 'PO-2026-001' AND s.style_code = 'STY-SHIRT-01'),
   (SELECT id FROM colors WHERE name = 'Xanh Dương'), 'M', 30),
  ((SELECT pi.id FROM po_items pi JOIN purchase_orders po ON pi.po_id = po.id JOIN styles s ON pi.style_id = s.id WHERE po.po_number = 'PO-2026-001' AND s.style_code = 'STY-SHIRT-01'),
   (SELECT id FROM colors WHERE name = 'Xanh Dương'), 'L', 40),
  ((SELECT pi.id FROM po_items pi JOIN purchase_orders po ON pi.po_id = po.id JOIN styles s ON pi.style_id = s.id WHERE po.po_number = 'PO-2026-001' AND s.style_code = 'STY-SHIRT-01'),
   (SELECT id FROM colors WHERE name = 'Xanh Dương'), 'XL', 30)
ON CONFLICT DO NOTHING;

-- --- PO-2026-002 / Quần Tây (400 cái = 250 Đen + 150 Xám Đậm) ---

-- Quần Tây - Đen - các size
INSERT INTO skus (po_item_id, color_id, size, quantity) VALUES
  ((SELECT pi.id FROM po_items pi JOIN purchase_orders po ON pi.po_id = po.id JOIN styles s ON pi.style_id = s.id WHERE po.po_number = 'PO-2026-002' AND s.style_code = 'STY-PANT-01'),
   (SELECT id FROM colors WHERE name = 'Đen'), '29', 50),
  ((SELECT pi.id FROM po_items pi JOIN purchase_orders po ON pi.po_id = po.id JOIN styles s ON pi.style_id = s.id WHERE po.po_number = 'PO-2026-002' AND s.style_code = 'STY-PANT-01'),
   (SELECT id FROM colors WHERE name = 'Đen'), '30', 60),
  ((SELECT pi.id FROM po_items pi JOIN purchase_orders po ON pi.po_id = po.id JOIN styles s ON pi.style_id = s.id WHERE po.po_number = 'PO-2026-002' AND s.style_code = 'STY-PANT-01'),
   (SELECT id FROM colors WHERE name = 'Đen'), '31', 50),
  ((SELECT pi.id FROM po_items pi JOIN purchase_orders po ON pi.po_id = po.id JOIN styles s ON pi.style_id = s.id WHERE po.po_number = 'PO-2026-002' AND s.style_code = 'STY-PANT-01'),
   (SELECT id FROM colors WHERE name = 'Đen'), '32', 50),
  ((SELECT pi.id FROM po_items pi JOIN purchase_orders po ON pi.po_id = po.id JOIN styles s ON pi.style_id = s.id WHERE po.po_number = 'PO-2026-002' AND s.style_code = 'STY-PANT-01'),
   (SELECT id FROM colors WHERE name = 'Đen'), '34', 40)
ON CONFLICT DO NOTHING;

-- Quần Tây - Xám Đậm - các size
INSERT INTO skus (po_item_id, color_id, size, quantity) VALUES
  ((SELECT pi.id FROM po_items pi JOIN purchase_orders po ON pi.po_id = po.id JOIN styles s ON pi.style_id = s.id WHERE po.po_number = 'PO-2026-002' AND s.style_code = 'STY-PANT-01'),
   (SELECT id FROM colors WHERE name = 'Xám Đậm'), '29', 25),
  ((SELECT pi.id FROM po_items pi JOIN purchase_orders po ON pi.po_id = po.id JOIN styles s ON pi.style_id = s.id WHERE po.po_number = 'PO-2026-002' AND s.style_code = 'STY-PANT-01'),
   (SELECT id FROM colors WHERE name = 'Xám Đậm'), '30', 35),
  ((SELECT pi.id FROM po_items pi JOIN purchase_orders po ON pi.po_id = po.id JOIN styles s ON pi.style_id = s.id WHERE po.po_number = 'PO-2026-002' AND s.style_code = 'STY-PANT-01'),
   (SELECT id FROM colors WHERE name = 'Xám Đậm'), '31', 30),
  ((SELECT pi.id FROM po_items pi JOIN purchase_orders po ON pi.po_id = po.id JOIN styles s ON pi.style_id = s.id WHERE po.po_number = 'PO-2026-002' AND s.style_code = 'STY-PANT-01'),
   (SELECT id FROM colors WHERE name = 'Xám Đậm'), '32', 35),
  ((SELECT pi.id FROM po_items pi JOIN purchase_orders po ON pi.po_id = po.id JOIN styles s ON pi.style_id = s.id WHERE po.po_number = 'PO-2026-002' AND s.style_code = 'STY-PANT-01'),
   (SELECT id FROM colors WHERE name = 'Xám Đậm'), '34', 25)
ON CONFLICT DO NOTHING;

-- =============================================
-- 6. STYLE_COLOR_THREAD_SPECS (Chỉ cụ thể theo màu)
-- Áo Polo: Màu Đen → dùng chỉ Đen thay vì chỉ Trắng mặc định
-- Áo Polo: Màu Xanh Navy → dùng chỉ Navy thay vì chỉ Trắng
-- =============================================

-- Polo / May thân / Đen → CHI-40-DEN
INSERT INTO style_color_thread_specs (style_thread_spec_id, color_id, thread_type_id, notes)
VALUES (
  (SELECT sts.id FROM style_thread_specs sts JOIN styles s ON sts.style_id = s.id 
   WHERE s.style_code = 'STY-POLO-01' AND sts.process_name = 'May thân'),
  (SELECT id FROM colors WHERE name = 'Đen'),
  (SELECT id FROM thread_types WHERE code = 'CHI-40-DEN'),
  'Áo polo đen: dùng chỉ đen thay chỉ trắng mặc định'
) ON CONFLICT (style_thread_spec_id, color_id) DO UPDATE SET
  thread_type_id = EXCLUDED.thread_type_id,
  notes = EXCLUDED.notes;

-- Polo / May tay áo / Đen → CHI-40-DEN
INSERT INTO style_color_thread_specs (style_thread_spec_id, color_id, thread_type_id, notes)
VALUES (
  (SELECT sts.id FROM style_thread_specs sts JOIN styles s ON sts.style_id = s.id 
   WHERE s.style_code = 'STY-POLO-01' AND sts.process_name = 'May tay áo'),
  (SELECT id FROM colors WHERE name = 'Đen'),
  (SELECT id FROM thread_types WHERE code = 'CHI-40-DEN'),
  'Áo polo đen: dùng chỉ đen cho tay áo'
) ON CONFLICT (style_thread_spec_id, color_id) DO UPDATE SET
  thread_type_id = EXCLUDED.thread_type_id,
  notes = EXCLUDED.notes;

-- Polo / May thân / Xanh Navy → CHI-35-NAV (Nylon Navy)
INSERT INTO style_color_thread_specs (style_thread_spec_id, color_id, thread_type_id, notes)
VALUES (
  (SELECT sts.id FROM style_thread_specs sts JOIN styles s ON sts.style_id = s.id 
   WHERE s.style_code = 'STY-POLO-01' AND sts.process_name = 'May thân'),
  (SELECT id FROM colors WHERE name = 'Xanh Navy'),
  (SELECT id FROM thread_types WHERE code = 'CHI-35-NAV'),
  'Áo polo navy: dùng chỉ navy thay chỉ trắng mặc định'
) ON CONFLICT (style_thread_spec_id, color_id) DO UPDATE SET
  thread_type_id = EXCLUDED.thread_type_id,
  notes = EXCLUDED.notes;

-- Polo / May tay áo / Xanh Navy → CHI-35-NAV
INSERT INTO style_color_thread_specs (style_thread_spec_id, color_id, thread_type_id, notes)
VALUES (
  (SELECT sts.id FROM style_thread_specs sts JOIN styles s ON sts.style_id = s.id 
   WHERE s.style_code = 'STY-POLO-01' AND sts.process_name = 'May tay áo'),
  (SELECT id FROM colors WHERE name = 'Xanh Navy'),
  (SELECT id FROM thread_types WHERE code = 'CHI-35-NAV'),
  'Áo polo navy: dùng chỉ navy cho tay áo'
) ON CONFLICT (style_thread_spec_id, color_id) DO UPDATE SET
  thread_type_id = EXCLUDED.thread_type_id,
  notes = EXCLUDED.notes;

-- Sơ Mi / May thân / Xanh Dương → CHI-40-XDG
INSERT INTO style_color_thread_specs (style_thread_spec_id, color_id, thread_type_id, notes)
VALUES (
  (SELECT sts.id FROM style_thread_specs sts JOIN styles s ON sts.style_id = s.id 
   WHERE s.style_code = 'STY-SHIRT-01' AND sts.process_name = 'May thân'),
  (SELECT id FROM colors WHERE name = 'Xanh Dương'),
  (SELECT id FROM thread_types WHERE code = 'CHI-40-XDG'),
  'Sơ mi xanh dương: dùng chỉ xanh dương thay chỉ trắng'
) ON CONFLICT (style_thread_spec_id, color_id) DO UPDATE SET
  thread_type_id = EXCLUDED.thread_type_id,
  notes = EXCLUDED.notes;

-- Quần Tây / May thân / Xám Đậm → CHI-35-XAD (Nylon Xám Đậm)
INSERT INTO style_color_thread_specs (style_thread_spec_id, color_id, thread_type_id, notes)
VALUES (
  (SELECT sts.id FROM style_thread_specs sts JOIN styles s ON sts.style_id = s.id 
   WHERE s.style_code = 'STY-PANT-01' AND sts.process_name = 'May thân'),
  (SELECT id FROM colors WHERE name = 'Xám Đậm'),
  (SELECT id FROM thread_types WHERE code = 'CHI-35-XAD'),
  'Quần tây xám đậm: dùng chỉ xám đậm thay chỉ đen'
) ON CONFLICT (style_thread_spec_id, color_id) DO UPDATE SET
  thread_type_id = EXCLUDED.thread_type_id,
  notes = EXCLUDED.notes;

-- Quần Tây / May túi & cạp / Xám Đậm → CHI-35-XAD
INSERT INTO style_color_thread_specs (style_thread_spec_id, color_id, thread_type_id, notes)
VALUES (
  (SELECT sts.id FROM style_thread_specs sts JOIN styles s ON sts.style_id = s.id 
   WHERE s.style_code = 'STY-PANT-01' AND sts.process_name = 'May túi & cạp'),
  (SELECT id FROM colors WHERE name = 'Xám Đậm'),
  (SELECT id FROM thread_types WHERE code = 'CHI-35-XAD'),
  'Quần tây xám đậm: dùng chỉ xám đậm cho túi & cạp'
) ON CONFLICT (style_thread_spec_id, color_id) DO UPDATE SET
  thread_type_id = EXCLUDED.thread_type_id,
  notes = EXCLUDED.notes;

-- =============================================
-- SUMMARY:
-- - 3 styles (Polo, Sơ Mi, Quần Tây)
-- - 9 style_thread_specs (3 công đoạn × 3 styles)
-- - 7 style_color_thread_specs (chỉ theo màu cụ thể)
-- - 2 purchase_orders (PO-2026-001, PO-2026-002)
-- - 3 po_items (2 items cho PO-001, 1 item cho PO-002)
-- - 22 skus (12 cho Polo, 8 cho Sơ Mi, 10 cho Quần Tây) - TẤT CẢ CÓ color_id
--
-- KIỂM TRA:
-- Trên UI: /thread/calculation → chọn "Đơn hàng" → chọn PO-2026-001
-- → Tính toán → hasColorBreakdown = true → nút "Tạo Phiếu Phân Bổ" enable
-- =============================================
