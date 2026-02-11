 SELECT
    w.id,
    w.code AS warehouse_code,
    w.name AS warehouse_name,
    COUNT(ti.id) AS total_cones,
    COUNT(ti.id) FILTER (WHERE ti.status = 'AVAILABLE') AS available_cones,
    COUNT(ti.id) FILTER (WHERE ti.status = 'ALLOCATED') AS allocated_cones,
    COUNT(ti.id) FILTER (WHERE ti.is_partial = true) AS partial_cones
  FROM warehouses w
  LEFT JOIN thread_inventory ti ON ti.warehouse_id = w.id
  WHERE w.type = 'STORAGE'  -- Chỉ lấy kho lưu trữ, không lấy LOCATION
    AND w.is_active = true
  GROUP BY w.id, w.code, w.name
  ORDER BY w.name;