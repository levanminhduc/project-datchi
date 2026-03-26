-- ============================================================================
-- ISSUE TEST DATA SEED
-- Task: Tạo dữ liệu test cho Xuất Kho Sản Xuất
-- Date: 2026-02-11
-- Description: Test data for PO, Styles, PO Items, Style Thread Specs, Weekly Orders
-- Dependencies: comprehensive_test_data.sql (phải chạy trước)
-- ============================================================================

-- ============================================================================
-- 1. STYLES (Mã hàng - 10 mã hàng sản phẩm)
-- ============================================================================

INSERT INTO styles (style_code, style_name, description, fabric_type) VALUES
  ('AO-001', 'Áo Sơ Mi Nam Cổ Đứng', 'Áo sơ mi nam dài tay, cổ đứng, vải cotton', 'Cotton 100%'),
  ('AO-002', 'Áo Sơ Mi Nữ Cổ Tim', 'Áo sơ mi nữ ngắn tay, cổ tim, vải polyester', 'Polyester blend'),
  ('QU-001', 'Quần Âu Nam Slimfit', 'Quần âu nam ống côn, slimfit, có vắt sổ', 'Wool blend'),
  ('QU-002', 'Quần Kaki Nữ', 'Quần kaki nữ công sở, ống suông', 'Cotton twill'),
  ('VA-001', 'Váy Liền A-Line', 'Váy liền thân dáng chữ A, có túi hông', 'Chiffon'),
  ('AO-003', 'Áo Polo Nam', 'Áo polo nam ngắn tay, có cổ bẻ', 'Cotton Pique'),
  ('AO-004', 'Áo Thun Cổ Tròn', 'Áo thun unisex cổ tròn', 'Cotton Jersey'),
  ('JK-001', 'Jacket Nam Bomber', 'Jacket bomber nam, có lót, khóa kéo', 'Nylon'),
  ('QU-003', 'Quần Short Thể Thao', 'Quần short nam thể thao, thun eo', 'Polyester mesh'),
  ('AO-005', 'Áo Hoodie Unisex', 'Áo hoodie có mũ, túi kangaroo', 'French Terry')
ON CONFLICT (style_code) DO UPDATE SET
  style_name = EXCLUDED.style_name,
  description = EXCLUDED.description,
  fabric_type = EXCLUDED.fabric_type;

-- ============================================================================
-- 2. PURCHASE ORDERS (10 đơn hàng từ các khách hàng)
-- ============================================================================

INSERT INTO purchase_orders (po_number, customer_name, order_date, delivery_date, status, priority, notes) VALUES
  ('PO-2026-0001', 'UNIQLO Vietnam', '2026-01-15', '2026-02-28', 'in_production', 'high', 'Đơn hàng gấp, ưu tiên xuất chỉ'),
  ('PO-2026-0002', 'Zara International', '2026-01-20', '2026-03-15', 'pending', 'normal', 'Màu sắc theo mẫu đính kèm'),
  ('PO-2026-0003', 'H&M Supply', '2026-01-25', '2026-03-01', 'in_production', 'high', 'Kiểm tra kỹ định mức chỉ'),
  ('PO-2026-0004', 'Công ty TNHH May Việt Tiến', '2026-02-01', '2026-03-20', 'pending', 'normal', NULL),
  ('PO-2026-0005', 'Target Corporation', '2026-02-05', '2026-04-01', 'pending', 'low', 'Đơn hàng lớn, chia nhiều đợt'),
  ('PO-2026-0006', 'Decathlon Sports', '2026-02-08', '2026-03-25', 'in_production', 'high', 'Chỉ thể thao chuyên dụng'),
  ('PO-2026-0007', 'Levi Strauss & Co', '2026-02-10', '2026-04-15', 'pending', 'normal', NULL),
  ('PO-2026-0008', 'Nike Vietnam', '2026-02-10', '2026-03-30', 'in_production', 'high', 'Chỉ polyester cao cấp'),
  ('PO-2026-0009', 'Adidas Sourcing', '2026-02-11', '2026-04-10', 'pending', 'normal', 'Xác nhận màu trước khi xuất'),
  ('PO-2026-0010', 'GAP Inc', '2026-02-11', '2026-04-20', 'pending', 'low', 'Đơn hàng mẫu thử')
ON CONFLICT (po_number) DO UPDATE SET
  customer_name = EXCLUDED.customer_name,
  order_date = EXCLUDED.order_date,
  delivery_date = EXCLUDED.delivery_date,
  status = EXCLUDED.status,
  priority = EXCLUDED.priority,
  notes = EXCLUDED.notes;

-- ============================================================================
-- 3. PO_ITEMS (Liên kết PO - Style - số lượng)
-- ============================================================================

-- PO-2026-0001: UNIQLO (3 mã hàng)
INSERT INTO po_items (po_id, style_id, quantity, notes)
SELECT
  po.id,
  s.id,
  v.qty,
  v.item_notes
FROM (
  VALUES
    ('PO-2026-0001', 'AO-001', 5000, 'Màu trắng và xanh đậm'),
    ('PO-2026-0001', 'AO-002', 3000, 'Màu hồng nhạt'),
    ('PO-2026-0001', 'QU-001', 4000, 'Màu đen và xám')
) AS v(po_num, style_code, qty, item_notes)
JOIN purchase_orders po ON po.po_number = v.po_num
JOIN styles s ON s.style_code = v.style_code
ON CONFLICT DO NOTHING;

-- PO-2026-0002: Zara (2 mã hàng)
INSERT INTO po_items (po_id, style_id, quantity, notes)
SELECT po.id, s.id, v.qty, v.item_notes
FROM (
  VALUES
    ('PO-2026-0002', 'VA-001', 2500, 'Màu đỏ burgundy'),
    ('PO-2026-0002', 'AO-003', 3500, 'Màu xanh navy')
) AS v(po_num, style_code, qty, item_notes)
JOIN purchase_orders po ON po.po_number = v.po_num
JOIN styles s ON s.style_code = v.style_code
ON CONFLICT DO NOTHING;

-- PO-2026-0003: H&M (3 mã hàng)
INSERT INTO po_items (po_id, style_id, quantity, notes)
SELECT po.id, s.id, v.qty, v.item_notes
FROM (
  VALUES
    ('PO-2026-0003', 'AO-004', 10000, 'Nhiều size'),
    ('PO-2026-0003', 'QU-002', 6000, 'Màu be'),
    ('PO-2026-0003', 'AO-005', 4000, 'Màu xám melange')
) AS v(po_num, style_code, qty, item_notes)
JOIN purchase_orders po ON po.po_number = v.po_num
JOIN styles s ON s.style_code = v.style_code
ON CONFLICT DO NOTHING;

-- PO-2026-0004: Việt Tiến (2 mã hàng)
INSERT INTO po_items (po_id, style_id, quantity, notes)
SELECT po.id, s.id, v.qty, v.item_notes
FROM (
  VALUES
    ('PO-2026-0004', 'AO-001', 8000, 'Đơn nội địa'),
    ('PO-2026-0004', 'QU-001', 5000, NULL)
) AS v(po_num, style_code, qty, item_notes)
JOIN purchase_orders po ON po.po_number = v.po_num
JOIN styles s ON s.style_code = v.style_code
ON CONFLICT DO NOTHING;

-- PO-2026-0005: Target (4 mã hàng)
INSERT INTO po_items (po_id, style_id, quantity, notes)
SELECT po.id, s.id, v.qty, v.item_notes
FROM (
  VALUES
    ('PO-2026-0005', 'AO-003', 15000, 'Đợt 1'),
    ('PO-2026-0005', 'AO-004', 20000, 'Đợt 1 + 2'),
    ('PO-2026-0005', 'QU-003', 12000, 'Đợt 2'),
    ('PO-2026-0005', 'JK-001', 5000, 'Đợt 3')
) AS v(po_num, style_code, qty, item_notes)
JOIN purchase_orders po ON po.po_number = v.po_num
JOIN styles s ON s.style_code = v.style_code
ON CONFLICT DO NOTHING;

-- PO-2026-0006: Decathlon (2 mã hàng thể thao)
INSERT INTO po_items (po_id, style_id, quantity, notes)
SELECT po.id, s.id, v.qty, v.item_notes
FROM (
  VALUES
    ('PO-2026-0006', 'QU-003', 8000, 'Chỉ polyester đặc biệt'),
    ('PO-2026-0006', 'AO-003', 6000, 'Polo thể thao')
) AS v(po_num, style_code, qty, item_notes)
JOIN purchase_orders po ON po.po_number = v.po_num
JOIN styles s ON s.style_code = v.style_code
ON CONFLICT DO NOTHING;

-- PO-2026-0007: Levis (2 mã hàng)
INSERT INTO po_items (po_id, style_id, quantity, notes)
SELECT po.id, s.id, v.qty, v.item_notes
FROM (
  VALUES
    ('PO-2026-0007', 'QU-001', 7000, 'Chỉ denim chuyên dụng'),
    ('PO-2026-0007', 'JK-001', 3000, NULL)
) AS v(po_num, style_code, qty, item_notes)
JOIN purchase_orders po ON po.po_number = v.po_num
JOIN styles s ON s.style_code = v.style_code
ON CONFLICT DO NOTHING;

-- PO-2026-0008: Nike (2 mã hàng)
INSERT INTO po_items (po_id, style_id, quantity, notes)
SELECT po.id, s.id, v.qty, v.item_notes
FROM (
  VALUES
    ('PO-2026-0008', 'QU-003', 10000, 'Short chạy bộ'),
    ('PO-2026-0008', 'AO-004', 8000, 'Áo dri-fit')
) AS v(po_num, style_code, qty, item_notes)
JOIN purchase_orders po ON po.po_number = v.po_num
JOIN styles s ON s.style_code = v.style_code
ON CONFLICT DO NOTHING;

-- PO-2026-0009: Adidas (2 mã hàng)
INSERT INTO po_items (po_id, style_id, quantity, notes)
SELECT po.id, s.id, v.qty, v.item_notes
FROM (
  VALUES
    ('PO-2026-0009', 'AO-005', 7000, 'Hoodie training'),
    ('PO-2026-0009', 'QU-003', 9000, 'Short training')
) AS v(po_num, style_code, qty, item_notes)
JOIN purchase_orders po ON po.po_number = v.po_num
JOIN styles s ON s.style_code = v.style_code
ON CONFLICT DO NOTHING;

-- PO-2026-0010: GAP (1 mã hàng mẫu)
INSERT INTO po_items (po_id, style_id, quantity, notes)
SELECT po.id, s.id, v.qty, v.item_notes
FROM (
  VALUES
    ('PO-2026-0010', 'AO-001', 500, 'Đơn mẫu thử')
) AS v(po_num, style_code, qty, item_notes)
JOIN purchase_orders po ON po.po_number = v.po_num
JOIN styles s ON s.style_code = v.style_code
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 4. STYLE_THREAD_SPECS (Định mức chỉ cho mỗi mã hàng)
-- Mỗi mã hàng có 2-4 công đoạn may với định mức khác nhau
-- ============================================================================

-- Lấy supplier_id và thread_type_id
DO $$
DECLARE
  v_supplier_id INTEGER;
  v_tex_id_30 INTEGER;
  v_tex_id_40 INTEGER;
  v_tex_id_60 INTEGER;
  v_tex_id_80 INTEGER;
  v_style_id INTEGER;
BEGIN
  -- Lấy supplier mặc định (Coats Vietnam)
  SELECT id INTO v_supplier_id FROM suppliers WHERE code = 'NCC-003' LIMIT 1;
  IF v_supplier_id IS NULL THEN
    SELECT id INTO v_supplier_id FROM suppliers WHERE is_active = true LIMIT 1;
  END IF;

  -- Lấy các tex_id phổ biến
  SELECT id INTO v_tex_id_30 FROM thread_types WHERE tex_number = 30 AND is_active = true LIMIT 1;
  SELECT id INTO v_tex_id_40 FROM thread_types WHERE tex_number = 40 AND is_active = true LIMIT 1;
  SELECT id INTO v_tex_id_60 FROM thread_types WHERE tex_number = 60 AND is_active = true LIMIT 1;
  SELECT id INTO v_tex_id_80 FROM thread_types WHERE tex_number = 80 AND is_active = true LIMIT 1;

  -- Fallback nếu không có tex cụ thể
  IF v_tex_id_30 IS NULL THEN SELECT id INTO v_tex_id_30 FROM thread_types WHERE is_active = true LIMIT 1; END IF;
  IF v_tex_id_40 IS NULL THEN v_tex_id_40 := v_tex_id_30; END IF;
  IF v_tex_id_60 IS NULL THEN v_tex_id_60 := v_tex_id_30; END IF;
  IF v_tex_id_80 IS NULL THEN v_tex_id_80 := v_tex_id_30; END IF;

  -- AO-001: Áo Sơ Mi Nam (4 công đoạn)
  SELECT id INTO v_style_id FROM styles WHERE style_code = 'AO-001';
  IF v_style_id IS NOT NULL THEN
    INSERT INTO style_thread_specs (style_id, supplier_id, process_name, tex_id, meters_per_unit, notes) VALUES
      (v_style_id, v_supplier_id, 'May thân áo', v_tex_id_40, 12.50, 'Chỉ may chính'),
      (v_style_id, v_supplier_id, 'May cổ áo', v_tex_id_60, 3.20, 'Chỉ mịn cho cổ'),
      (v_style_id, v_supplier_id, 'May tay áo', v_tex_id_40, 8.00, 'May tay + măng sét'),
      (v_style_id, v_supplier_id, 'Vắt sổ', v_tex_id_30, 15.00, 'Vắt sổ viền trong')
    ON CONFLICT DO NOTHING;
  END IF;

  -- AO-002: Áo Sơ Mi Nữ (3 công đoạn)
  SELECT id INTO v_style_id FROM styles WHERE style_code = 'AO-002';
  IF v_style_id IS NOT NULL THEN
    INSERT INTO style_thread_specs (style_id, supplier_id, process_name, tex_id, meters_per_unit, notes) VALUES
      (v_style_id, v_supplier_id, 'May thân áo', v_tex_id_60, 10.00, 'Chỉ mịn cho nữ'),
      (v_style_id, v_supplier_id, 'May cổ tim', v_tex_id_80, 2.50, 'Chỉ siêu mịn'),
      (v_style_id, v_supplier_id, 'Vắt sổ', v_tex_id_40, 12.00, NULL)
    ON CONFLICT DO NOTHING;
  END IF;

  -- QU-001: Quần Âu Nam (4 công đoạn)
  SELECT id INTO v_style_id FROM styles WHERE style_code = 'QU-001';
  IF v_style_id IS NOT NULL THEN
    INSERT INTO style_thread_specs (style_id, supplier_id, process_name, tex_id, meters_per_unit, notes) VALUES
      (v_style_id, v_supplier_id, 'May thân quần', v_tex_id_40, 18.00, 'Chỉ bền'),
      (v_style_id, v_supplier_id, 'May túi', v_tex_id_60, 6.00, 'Túi trước + sau'),
      (v_style_id, v_supplier_id, 'May dây kéo', v_tex_id_40, 2.00, 'Khóa YKK'),
      (v_style_id, v_supplier_id, 'Vắt sổ', v_tex_id_30, 20.00, NULL)
    ON CONFLICT DO NOTHING;
  END IF;

  -- QU-002: Quần Kaki Nữ (3 công đoạn)
  SELECT id INTO v_style_id FROM styles WHERE style_code = 'QU-002';
  IF v_style_id IS NOT NULL THEN
    INSERT INTO style_thread_specs (style_id, supplier_id, process_name, tex_id, meters_per_unit, notes) VALUES
      (v_style_id, v_supplier_id, 'May thân quần', v_tex_id_40, 15.00, NULL),
      (v_style_id, v_supplier_id, 'May túi + thắt lưng', v_tex_id_60, 5.50, NULL),
      (v_style_id, v_supplier_id, 'Vắt sổ', v_tex_id_30, 18.00, NULL)
    ON CONFLICT DO NOTHING;
  END IF;

  -- VA-001: Váy Liền (3 công đoạn)
  SELECT id INTO v_style_id FROM styles WHERE style_code = 'VA-001';
  IF v_style_id IS NOT NULL THEN
    INSERT INTO style_thread_specs (style_id, supplier_id, process_name, tex_id, meters_per_unit, notes) VALUES
      (v_style_id, v_supplier_id, 'May thân váy', v_tex_id_60, 22.00, 'Váy dài'),
      (v_style_id, v_supplier_id, 'May túi hông', v_tex_id_60, 4.00, NULL),
      (v_style_id, v_supplier_id, 'Viền gấu', v_tex_id_80, 8.00, 'Viền mịn')
    ON CONFLICT DO NOTHING;
  END IF;

  -- AO-003: Áo Polo (3 công đoạn)
  SELECT id INTO v_style_id FROM styles WHERE style_code = 'AO-003';
  IF v_style_id IS NOT NULL THEN
    INSERT INTO style_thread_specs (style_id, supplier_id, process_name, tex_id, meters_per_unit, notes) VALUES
      (v_style_id, v_supplier_id, 'May thân áo', v_tex_id_40, 14.00, NULL),
      (v_style_id, v_supplier_id, 'May cổ bẻ', v_tex_id_40, 4.50, 'Cổ pique'),
      (v_style_id, v_supplier_id, 'Vắt sổ', v_tex_id_30, 10.00, NULL)
    ON CONFLICT DO NOTHING;
  END IF;

  -- AO-004: Áo Thun Cổ Tròn (2 công đoạn - đơn giản)
  SELECT id INTO v_style_id FROM styles WHERE style_code = 'AO-004';
  IF v_style_id IS NOT NULL THEN
    INSERT INTO style_thread_specs (style_id, supplier_id, process_name, tex_id, meters_per_unit, notes) VALUES
      (v_style_id, v_supplier_id, 'May thân áo', v_tex_id_40, 10.00, 'May 4 kim'),
      (v_style_id, v_supplier_id, 'Viền cổ + gấu', v_tex_id_40, 6.00, 'Viền thun')
    ON CONFLICT DO NOTHING;
  END IF;

  -- JK-001: Jacket Bomber (4 công đoạn)
  SELECT id INTO v_style_id FROM styles WHERE style_code = 'JK-001';
  IF v_style_id IS NOT NULL THEN
    INSERT INTO style_thread_specs (style_id, supplier_id, process_name, tex_id, meters_per_unit, notes) VALUES
      (v_style_id, v_supplier_id, 'May thân jacket', v_tex_id_30, 25.00, 'Chỉ bền cho nylon'),
      (v_style_id, v_supplier_id, 'May lót trong', v_tex_id_40, 18.00, NULL),
      (v_style_id, v_supplier_id, 'May tay + bo', v_tex_id_30, 12.00, NULL),
      (v_style_id, v_supplier_id, 'Gắn khóa kéo', v_tex_id_30, 3.00, 'Khóa 2 chiều')
    ON CONFLICT DO NOTHING;
  END IF;

  -- QU-003: Quần Short Thể Thao (2 công đoạn)
  SELECT id INTO v_style_id FROM styles WHERE style_code = 'QU-003';
  IF v_style_id IS NOT NULL THEN
    INSERT INTO style_thread_specs (style_id, supplier_id, process_name, tex_id, meters_per_unit, notes) VALUES
      (v_style_id, v_supplier_id, 'May thân quần', v_tex_id_40, 8.00, 'Chỉ polyester'),
      (v_style_id, v_supplier_id, 'May thun eo', v_tex_id_40, 3.50, 'Thun co giãn')
    ON CONFLICT DO NOTHING;
  END IF;

  -- AO-005: Áo Hoodie (4 công đoạn)
  SELECT id INTO v_style_id FROM styles WHERE style_code = 'AO-005';
  IF v_style_id IS NOT NULL THEN
    INSERT INTO style_thread_specs (style_id, supplier_id, process_name, tex_id, meters_per_unit, notes) VALUES
      (v_style_id, v_supplier_id, 'May thân hoodie', v_tex_id_30, 20.00, 'Vải dày'),
      (v_style_id, v_supplier_id, 'May mũ', v_tex_id_40, 8.00, 'Mũ 2 lớp'),
      (v_style_id, v_supplier_id, 'May túi kangaroo', v_tex_id_40, 5.00, NULL),
      (v_style_id, v_supplier_id, 'Bo tay + gấu', v_tex_id_30, 6.00, NULL)
    ON CONFLICT DO NOTHING;
  END IF;

END $$;

-- ============================================================================
-- 5. SKUS (Style + Color combinations cho từng PO Item)
-- ============================================================================

-- Thêm SKUs cho PO-2026-0001 (UNIQLO)
INSERT INTO skus (po_item_id, color_id, size, quantity)
SELECT
  pi.id,
  c.id,
  v.size,
  v.qty
FROM (
  VALUES
    -- AO-001 (Áo sơ mi nam) - Trắng và Xanh đậm
    ('PO-2026-0001', 'AO-001', 'Trắng', 'S', 800),
    ('PO-2026-0001', 'AO-001', 'Trắng', 'M', 1200),
    ('PO-2026-0001', 'AO-001', 'Trắng', 'L', 1000),
    ('PO-2026-0001', 'AO-001', 'Xanh Đậm', 'S', 600),
    ('PO-2026-0001', 'AO-001', 'Xanh Đậm', 'M', 900),
    ('PO-2026-0001', 'AO-001', 'Xanh Đậm', 'L', 500),
    -- QU-001 - Đen và Xám
    ('PO-2026-0001', 'QU-001', 'Đen', 'M', 1000),
    ('PO-2026-0001', 'QU-001', 'Đen', 'L', 1200),
    ('PO-2026-0001', 'QU-001', 'Xám', 'M', 900),
    ('PO-2026-0001', 'QU-001', 'Xám', 'L', 900)
) AS v(po_num, style_code, color_name, size, qty)
JOIN purchase_orders po ON po.po_number = v.po_num
JOIN styles s ON s.style_code = v.style_code
JOIN po_items pi ON pi.po_id = po.id AND pi.style_id = s.id
JOIN colors c ON c.name = v.color_name
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 6. CẬP NHẬT EMPLOYEES (đảm bảo có department cho test)
-- ============================================================================

UPDATE employees SET department = 'Xưởng Dệt Kim' WHERE department IS NULL OR department = '';

-- Thêm employees với các department khác nhau (nếu chưa có)
INSERT INTO employees (employee_id, full_name, department, chuc_vu, is_active) VALUES
  ('NV-DK-001', 'Nguyễn Văn Minh', 'Xưởng Dệt Kim', 'nhan_vien', true),
  ('NV-DK-002', 'Trần Thị Hoa', 'Xưởng Dệt Kim', 'nhan_vien', true),
  ('NV-XN-001', 'Lê Văn Hùng', 'Xưởng Nhật', 'nhan_vien', true),
  ('NV-XN-002', 'Phạm Thị Mai', 'Xưởng Nhật', 'nhan_vien', true),
  ('NV-XT-001', 'Hoàng Văn Nam', 'Xưởng Trước', 'nhan_vien', true),
  ('NV-KCS-001', 'Đỗ Thị Lan', 'KCS', 'nhan_vien_ky_thuat', true),
  ('QL-SX-001', 'Vũ Đức Anh', 'Quản Lý Sản Xuất', 'quan_ly', true)
ON CONFLICT (employee_id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  department = EXCLUDED.department,
  chuc_vu = EXCLUDED.chuc_vu,
  is_active = true;

-- ============================================================================
-- 7. THREAD ALLOCATIONS (Phân bổ chỉ cho các PO)
-- Sử dụng order_id (varchar) theo cấu trúc bảng thực tế
-- Status enum: PENDING, SOFT, HARD, ISSUED, CANCELLED, WAITLISTED
-- ============================================================================

-- Tạo allocations cho các PO
INSERT INTO thread_allocations (
  order_id, order_reference, thread_type_id, requested_meters,
  allocated_meters, status, priority, due_date, notes
)
SELECT
  v.order_id,
  v.order_ref,
  tt.id,
  v.requested_meters,
  v.allocated_meters,
  v.alloc_status::allocation_status,
  'NORMAL'::allocation_priority,
  v.due_date::date,
  v.notes
FROM (
  VALUES
    -- PO-2026-0001 (UNIQLO - urgent)
    ('PO-2026-0001', 'UNIQLO - Áo Sơ Mi Nam Trắng', 'CHI-40-TRA', 50000.00, 45000.00, 'HARD', '2026-02-28', 'Allocation for production'),
    ('PO-2026-0001', 'UNIQLO - Áo Sơ Mi Nam Cổ', 'CHI-60-TRA', 15000.00, 15000.00, 'HARD', '2026-02-28', 'Chỉ mịn cho cổ'),
    ('PO-2026-0001', 'UNIQLO - Áo Sơ Mi Nam Vắt sổ', 'CHI-30-TRA', 30000.00, 25000.00, 'SOFT', '2026-02-28', 'Vắt sổ - còn thiếu 5000m'),

    -- PO-2026-0003 (H&M - in production)
    ('PO-2026-0003', 'H&M - Áo Thun Cổ Tròn', 'CHI-40-DEN', 80000.00, 60000.00, 'SOFT', '2026-03-01', 'Đang xuất dần'),
    ('PO-2026-0003', 'H&M - Quần Kaki Nữ', 'CHI-30-DEN', 40000.00, 40000.00, 'HARD', '2026-03-01', NULL),

    -- PO-2026-0006 (Decathlon - sports)
    ('PO-2026-0006', 'Decathlon - Quần Short', 'CHI-40-XDG', 35000.00, 35000.00, 'HARD', '2026-03-25', 'Chỉ polyester'),
    ('PO-2026-0006', 'Decathlon - Áo Polo', 'CHI-40-XLA', 28000.00, 0.00, 'PENDING', '2026-03-25', 'Chờ nhập kho'),

    -- PO-2026-0008 (Nike - urgent)
    ('PO-2026-0008', 'Nike - Short chạy bộ', 'CHI-40-HOG', 45000.00, 40000.00, 'SOFT', '2026-03-30', NULL),
    ('PO-2026-0008', 'Nike - Áo dri-fit', 'CHI-40-VAG', 55000.00, 55000.00, 'ISSUED', '2026-03-30', 'Đã xuất đủ')
) AS v(order_id, order_ref, thread_code, requested_meters, allocated_meters, alloc_status, due_date, notes)
JOIN thread_types tt ON tt.code = v.thread_code
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 8. STYLE_COLOR_THREAD_SPECS (Định mức chỉ theo màu)
-- Liên kết mỗi định mức công đoạn với màu sắc và loại chỉ cụ thể
-- ============================================================================

DO $$
DECLARE
  v_white_id INTEGER;
  v_black_id INTEGER;
  v_red_id INTEGER;
  v_blue_id INTEGER;
  v_gray_id INTEGER;
  v_navy_id INTEGER;
  v_pink_id INTEGER;
  v_beige_id INTEGER;
  v_spec RECORD;
  v_thread_30_white INTEGER;
  v_thread_30_black INTEGER;
  v_thread_30_red INTEGER;
  v_thread_40_white INTEGER;
  v_thread_40_black INTEGER;
  v_thread_40_blue INTEGER;
  v_thread_40_navy INTEGER;
  v_thread_60_white INTEGER;
  v_thread_60_black INTEGER;
  v_thread_60_pink INTEGER;
  v_thread_80_white INTEGER;
  v_thread_80_pink INTEGER;
BEGIN
  -- Lấy color IDs
  SELECT id INTO v_white_id FROM colors WHERE name = 'Trắng' LIMIT 1;
  SELECT id INTO v_black_id FROM colors WHERE name = 'Đen' LIMIT 1;
  SELECT id INTO v_red_id FROM colors WHERE name = 'Đỏ' LIMIT 1;
  SELECT id INTO v_blue_id FROM colors WHERE name IN ('Xanh Dương', 'Xanh Đậm') LIMIT 1;
  SELECT id INTO v_gray_id FROM colors WHERE name = 'Xám' LIMIT 1;
  SELECT id INTO v_navy_id FROM colors WHERE name IN ('Navy', 'Xanh Navy', 'Xanh Đậm') LIMIT 1;
  SELECT id INTO v_pink_id FROM colors WHERE name = 'Hồng' LIMIT 1;
  SELECT id INTO v_beige_id FROM colors WHERE name = 'Be' LIMIT 1;

  -- Fallback nếu không tìm thấy màu
  IF v_navy_id IS NULL THEN v_navy_id := v_blue_id; END IF;
  IF v_beige_id IS NULL THEN SELECT id INTO v_beige_id FROM colors WHERE name ILIKE '%be%' LIMIT 1; END IF;

  -- Lấy thread_type IDs theo tex và màu
  SELECT id INTO v_thread_30_white FROM thread_types WHERE code = 'CHI-30-TRA' LIMIT 1;
  SELECT id INTO v_thread_30_black FROM thread_types WHERE code = 'CHI-30-DEN' LIMIT 1;
  SELECT id INTO v_thread_30_red FROM thread_types WHERE code LIKE 'CHI-30%' AND code LIKE '%DO%' LIMIT 1;
  SELECT id INTO v_thread_40_white FROM thread_types WHERE code = 'CHI-40-TRA' LIMIT 1;
  SELECT id INTO v_thread_40_black FROM thread_types WHERE code = 'CHI-40-DEN' LIMIT 1;
  SELECT id INTO v_thread_40_blue FROM thread_types WHERE code = 'CHI-40-XDG' LIMIT 1;
  SELECT id INTO v_thread_40_navy FROM thread_types WHERE code LIKE 'CHI-40-X%' LIMIT 1;
  SELECT id INTO v_thread_60_white FROM thread_types WHERE code = 'CHI-60-TRA' LIMIT 1;
  SELECT id INTO v_thread_60_black FROM thread_types WHERE code = 'CHI-60-DEN' LIMIT 1;
  SELECT id INTO v_thread_60_pink FROM thread_types WHERE code LIKE 'CHI-60%' AND code LIKE '%HOG%' LIMIT 1;
  SELECT id INTO v_thread_80_white FROM thread_types WHERE code = 'CHI-80-TRA' LIMIT 1;
  SELECT id INTO v_thread_80_pink FROM thread_types WHERE code LIKE 'CHI-80%' LIMIT 1;

  -- Fallbacks
  IF v_thread_30_red IS NULL THEN v_thread_30_red := v_thread_30_white; END IF;
  IF v_thread_60_pink IS NULL THEN v_thread_60_pink := v_thread_60_white; END IF;
  IF v_thread_80_pink IS NULL THEN v_thread_80_pink := v_thread_80_white; END IF;

  -- Duyệt qua từng style_thread_spec và tạo color specs
  FOR v_spec IN
    SELECT sts.id as spec_id, s.style_code, sts.process_name, tt.tex_number
    FROM style_thread_specs sts
    JOIN styles s ON sts.style_id = s.id
    LEFT JOIN thread_types tt ON sts.tex_id = tt.id
    ORDER BY s.style_code
  LOOP
    -- Tùy theo tex_number, chọn thread_type phù hợp cho mỗi màu
    IF v_spec.tex_number = 30 THEN
      INSERT INTO style_color_thread_specs (style_thread_spec_id, color_id, thread_type_id, notes)
      VALUES
        (v_spec.spec_id, v_white_id, v_thread_30_white, v_spec.process_name || ' - Trắng'),
        (v_spec.spec_id, v_black_id, v_thread_30_black, v_spec.process_name || ' - Đen')
      ON CONFLICT (style_thread_spec_id, color_id) DO NOTHING;

    ELSIF v_spec.tex_number = 40 THEN
      INSERT INTO style_color_thread_specs (style_thread_spec_id, color_id, thread_type_id, notes)
      VALUES
        (v_spec.spec_id, v_white_id, v_thread_40_white, v_spec.process_name || ' - Trắng'),
        (v_spec.spec_id, v_black_id, v_thread_40_black, v_spec.process_name || ' - Đen'),
        (v_spec.spec_id, v_blue_id, v_thread_40_blue, v_spec.process_name || ' - Xanh')
      ON CONFLICT (style_thread_spec_id, color_id) DO NOTHING;

    ELSIF v_spec.tex_number = 60 THEN
      INSERT INTO style_color_thread_specs (style_thread_spec_id, color_id, thread_type_id, notes)
      VALUES
        (v_spec.spec_id, v_white_id, v_thread_60_white, v_spec.process_name || ' - Trắng'),
        (v_spec.spec_id, v_black_id, v_thread_60_black, v_spec.process_name || ' - Đen'),
        (v_spec.spec_id, v_pink_id, v_thread_60_pink, v_spec.process_name || ' - Hồng')
      ON CONFLICT (style_thread_spec_id, color_id) DO NOTHING;

    ELSIF v_spec.tex_number = 80 THEN
      INSERT INTO style_color_thread_specs (style_thread_spec_id, color_id, thread_type_id, notes)
      VALUES
        (v_spec.spec_id, v_white_id, v_thread_80_white, v_spec.process_name || ' - Trắng'),
        (v_spec.spec_id, v_pink_id, v_thread_80_pink, v_spec.process_name || ' - Hồng')
      ON CONFLICT (style_thread_spec_id, color_id) DO NOTHING;

    ELSE
      INSERT INTO style_color_thread_specs (style_thread_spec_id, color_id, thread_type_id, notes)
      VALUES
        (v_spec.spec_id, v_white_id, COALESCE(v_thread_40_white, v_thread_30_white), v_spec.process_name || ' - Trắng'),
        (v_spec.spec_id, v_black_id, COALESCE(v_thread_40_black, v_thread_30_black), v_spec.process_name || ' - Đen')
      ON CONFLICT (style_thread_spec_id, color_id) DO NOTHING;
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- 9. VERIFICATION QUERIES
-- ============================================================================

-- Kiểm tra dữ liệu đã tạo
-- SELECT 'Styles' as table_name, COUNT(*) as count FROM styles;
-- SELECT 'Purchase Orders' as table_name, COUNT(*) as count FROM purchase_orders;
-- SELECT 'PO Items' as table_name, COUNT(*) as count FROM po_items;
-- SELECT 'Style Thread Specs' as table_name, COUNT(*) as count FROM style_thread_specs;
-- SELECT 'Style Color Thread Specs' as table_name, COUNT(*) as count FROM style_color_thread_specs;
-- SELECT 'Allocations' as table_name, COUNT(*) as count FROM thread_allocations;

-- Kiểm tra màu theo mã hàng (cho trang Đặt Hàng Tuần Chỉ)
-- SELECT s.style_code, s.style_name,
--        string_agg(DISTINCT c.name, ', ' ORDER BY c.name) as colors
-- FROM style_color_thread_specs scts
-- JOIN style_thread_specs sts ON scts.style_thread_spec_id = sts.id
-- JOIN styles s ON sts.style_id = s.id
-- JOIN colors c ON scts.color_id = c.id
-- GROUP BY s.id ORDER BY s.style_code;

-- ============================================================================
-- SUMMARY:
-- - 10 Styles (mã hàng sản phẩm)
-- - 10 Purchase Orders (đơn hàng)
-- - 23+ PO Items (chi tiết đơn hàng)
-- - 32 Style Thread Specs (định mức chỉ theo công đoạn)
-- - 85+ Style Color Thread Specs (định mức chỉ theo màu)
-- - 9+ Thread Allocations (phân bổ chỉ)
-- - 15+ SKUs (size/color variants)
-- - 7+ Employees với department
-- ============================================================================
