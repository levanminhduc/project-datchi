CREATE OR REPLACE FUNCTION fn_warehouse_breakdown(
  p_thread_type_id INTEGER,
  p_statuses cone_status[] DEFAULT ARRAY['RECEIVED','INSPECTED','AVAILABLE','SOFT_ALLOCATED','HARD_ALLOCATED']::cone_status[]
)
RETURNS TABLE (
  warehouse_id INTEGER,
  warehouse_code VARCHAR,
  warehouse_name VARCHAR,
  locations TEXT,
  full_cones BIGINT,
  partial_cones BIGINT,
  partial_meters NUMERIC
)
LANGUAGE sql STABLE
AS $$
  SELECT
    ti.warehouse_id,
    w.code AS warehouse_code,
    w.name AS warehouse_name,
    string_agg(DISTINCT ti.location, ', ' ORDER BY ti.location) AS locations,
    COUNT(*) FILTER (WHERE NOT ti.is_partial) AS full_cones,
    COUNT(*) FILTER (WHERE ti.is_partial) AS partial_cones,
    COALESCE(SUM(ti.quantity_meters) FILTER (WHERE ti.is_partial), 0) AS partial_meters
  FROM thread_inventory ti
  JOIN warehouses w ON w.id = ti.warehouse_id
  WHERE ti.thread_type_id = p_thread_type_id
    AND ti.status = ANY(p_statuses)
  GROUP BY ti.warehouse_id, w.code, w.name
  ORDER BY w.code;
$$;

COMMENT ON FUNCTION fn_warehouse_breakdown IS 'Phân tích tồn kho theo kho cho 1 loại chỉ';

CREATE OR REPLACE FUNCTION fn_supplier_breakdown(
  p_thread_type_id INTEGER,
  p_statuses cone_status[] DEFAULT ARRAY['RECEIVED','INSPECTED','AVAILABLE','SOFT_ALLOCATED','HARD_ALLOCATED']::cone_status[]
)
RETURNS TABLE (
  supplier_id INTEGER,
  supplier_code VARCHAR,
  supplier_name VARCHAR,
  full_cones BIGINT,
  partial_cones BIGINT,
  partial_meters NUMERIC
)
LANGUAGE sql STABLE
AS $$
  SELECT
    COALESCE(ls.id, ts.id) AS supplier_id,
    COALESCE(ls.code, ts.code) AS supplier_code,
    COALESCE(ls.name, ts.name, 'Không xác định') AS supplier_name,
    COUNT(*) FILTER (WHERE NOT ti.is_partial) AS full_cones,
    COUNT(*) FILTER (WHERE ti.is_partial) AS partial_cones,
    COALESCE(SUM(ti.quantity_meters) FILTER (WHERE ti.is_partial), 0) AS partial_meters
  FROM thread_inventory ti
  LEFT JOIN lots l ON l.id = ti.lot_id
  LEFT JOIN suppliers ls ON ls.id = l.supplier_id
  JOIN thread_types tt ON tt.id = ti.thread_type_id
  LEFT JOIN suppliers ts ON ts.id = tt.supplier_id
  WHERE ti.thread_type_id = p_thread_type_id
    AND ti.status = ANY(p_statuses)
  GROUP BY COALESCE(ls.id, ts.id), COALESCE(ls.code, ts.code), COALESCE(ls.name, ts.name, 'Không xác định')
  ORDER BY COALESCE(ls.name, ts.name, 'Không xác định');
$$;

COMMENT ON FUNCTION fn_supplier_breakdown IS 'Phân tích tồn kho theo NCC cho 1 loại chỉ (ưu tiên NCC từ lot)';

NOTIFY pgrst, 'reload schema';
