SELECT dpa.id,
       po.po_number,
       s.style_code,
       sc.color_name,
       dpa.department,
       dpa.product_quantity
FROM dept_product_allocations dpa
JOIN purchase_orders po ON po.id = dpa.po_id
JOIN styles s           ON s.id  = dpa.style_id
JOIN style_colors sc    ON sc.id = dpa.style_color_id
WHERE po.po_number = 'OSB255079'
  AND s.style_code = '1114520'
  AND sc.color_name = 'DKNV'
  AND dpa.department = 'DK01'
  AND dpa.deleted_at IS NULL;