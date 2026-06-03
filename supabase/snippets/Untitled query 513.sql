SELECT
  CASE WHEN i.lot_number LIKE 'WO-%' THEN 'Nhập mới qua delivery'
       ELSE 'Đặt trước từ tồn kho cũ' END                       AS "Nguồn",
  w.name                                                        AS "Kho",
  i.lot_number                                                  AS "Lô (lot)",
  to_char(i.received_date,'DD/MM/YYYY')                         AS "Ngày nhận",
  count(*)                                                      AS "Số cuộn",
  i.status::text
    || CASE WHEN i.status='AVAILABLE' THEN ' (chưa giữ chỗ)' ELSE '' END AS "Trạng thái"
FROM thread_inventory i
LEFT JOIN warehouses w ON w.id = i.warehouse_id
WHERE i.thread_type_id = 80
  AND i.color_id = 2068
  AND (i.reserved_week_id = 57 OR i.lot_number = 'WO-57')
GROUP BY 1, w.name, i.lot_number, i.received_date, i.status
ORDER BY i.received_date, w.name, i.status DESC;