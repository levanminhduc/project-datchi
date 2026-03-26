-- 1. Check thread_order_weeks status
SELECT id, week_name, status, start_date, end_date 
FROM thread_order_weeks 
ORDER BY created_at DESC 
LIMIT 5;

-- 2. Check thread_order_items with po_id
SELECT 
  toi.id,
  toi.week_id,
  tow.week_name,
  tow.status,
  toi.po_id,
  po.po_number,
  toi.style_id,
  toi.color_id
FROM thread_order_items toi
JOIN thread_order_weeks tow ON tow.id = toi.week_id
LEFT JOIN purchase_orders po ON po.id = toi.po_id
ORDER BY toi.created_at DESC
LIMIT 10;

-- 3. Count items by status and po_id presence
SELECT 
  tow.status,
  COUNT(*) as total_items,
  COUNT(toi.po_id) as items_with_po,
  COUNT(*) - COUNT(toi.po_id) as items_without_po
FROM thread_order_items toi
JOIN thread_order_weeks tow ON tow.id = toi.week_id
GROUP BY tow.status;
