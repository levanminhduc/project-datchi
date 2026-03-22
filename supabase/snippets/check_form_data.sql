-- Kiểm tra dữ liệu cho form-data endpoint

-- 1. Lấy thông tin tuần confirmed
SELECT id, week_name, status FROM thread_order_weeks WHERE status = 'confirmed';

-- 2. Lấy items trong tuần confirmed (với PO, Style, Color)
SELECT 
  toi.id,
  toi.po_id,
  po.po_number,
  toi.style_id,
  s.style_code,
  toi.color_id,
  c.name as color_name
FROM thread_order_items toi
JOIN thread_order_weeks tow ON tow.id = toi.week_id
LEFT JOIN purchase_orders po ON po.id = toi.po_id
LEFT JOIN styles s ON s.id = toi.style_id
LEFT JOIN colors c ON c.id = toi.color_id
WHERE tow.status = 'confirmed'
LIMIT 10;

-- 3. Kiểm tra style_color_thread_specs có dữ liệu không
-- Thay XX và YY bằng style_id và color_id từ query trên
SELECT 
  scts.id,
  scts.style_id,
  scts.color_id,
  scts.thread_type_id,
  scts.consumption_per_unit,
  tt.code as thread_code,
  tt.name as thread_name
FROM style_color_thread_specs scts
JOIN thread_types tt ON tt.id = scts.thread_type_id
LIMIT 20;

-- 4. Kiểm tra có thread_types nào không
SELECT COUNT(*) as thread_types_count FROM thread_types;

-- 5. Kiểm tra style_color_thread_specs tổng quan
SELECT COUNT(*) as specs_count FROM style_color_thread_specs;
