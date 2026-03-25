BEGIN;

DROP FUNCTION IF EXISTS fn_cone_summary_filtered(
  cone_status[],
  INTEGER,
  INTEGER,
  thread_material,
  TEXT,
  BOOLEAN
);

CREATE OR REPLACE FUNCTION fn_cone_summary_filtered(
  p_statuses cone_status[],
  p_warehouse_ids INTEGER[] DEFAULT NULL,
  p_supplier_id INTEGER DEFAULT NULL,
  p_material thread_material DEFAULT NULL,
  p_search TEXT DEFAULT NULL,
  p_only_unreserved BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  thread_type_id INTEGER,
  thread_code VARCHAR,
  thread_name VARCHAR,
  color_id INTEGER,
  color_name VARCHAR,
  color_hex VARCHAR,
  material thread_material,
  tex_number VARCHAR,
  meters_per_cone NUMERIC,
  supplier_id INTEGER,
  full_cones BIGINT,
  partial_cones BIGINT,
  partial_meters NUMERIC,
  partial_weight_grams NUMERIC,
  total_full_cones BIGINT,
  total_partial_cones BIGINT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    ti.thread_type_id,
    tt.code AS thread_code,
    tt.name AS thread_name,
    ti.color_id,
    c.name AS color_name,
    c.hex_code AS color_hex,
    tt.material,
    tt.tex_number,
    tt.meters_per_cone,
    tt.supplier_id,
    COUNT(*) FILTER (
      WHERE
        NOT ti.is_partial
        AND ti.status <> 'RESERVED_FOR_ORDER'
        AND (NOT p_only_unreserved OR ti.reserved_week_id IS NULL)
    ) AS full_cones,
    COUNT(*) FILTER (
      WHERE
        ti.is_partial
        AND ti.status <> 'RESERVED_FOR_ORDER'
        AND (NOT p_only_unreserved OR ti.reserved_week_id IS NULL)
    ) AS partial_cones,
    COALESCE(SUM(ti.quantity_meters) FILTER (
      WHERE
        ti.is_partial
        AND ti.status <> 'RESERVED_FOR_ORDER'
        AND (NOT p_only_unreserved OR ti.reserved_week_id IS NULL)
    ), 0) AS partial_meters,
    COALESCE(SUM(ti.weight_grams) FILTER (
      WHERE
        ti.is_partial
        AND ti.status <> 'RESERVED_FOR_ORDER'
        AND (NOT p_only_unreserved OR ti.reserved_week_id IS NULL)
    ), 0) AS partial_weight_grams,
    COUNT(*) FILTER (WHERE NOT ti.is_partial) AS total_full_cones,
    COUNT(*) FILTER (WHERE ti.is_partial) AS total_partial_cones
  FROM thread_inventory ti
  JOIN thread_types tt ON tt.id = ti.thread_type_id
  LEFT JOIN colors c ON c.id = ti.color_id
  LEFT JOIN lots l ON l.id = ti.lot_id
  WHERE ti.status = ANY(p_statuses)
    AND (p_warehouse_ids IS NULL OR ti.warehouse_id = ANY(p_warehouse_ids))
    AND (p_supplier_id IS NULL OR COALESCE(l.supplier_id, tt.supplier_id) = p_supplier_id)
    AND (p_material IS NULL OR tt.material = p_material)
    AND (p_search IS NULL OR (
      tt.code ILIKE p_search OR tt.name ILIKE p_search OR c.name ILIKE p_search
    ))
  GROUP BY ti.thread_type_id, tt.code, tt.name, ti.color_id, c.name, c.hex_code,
           tt.material, tt.tex_number, tt.meters_per_cone, tt.supplier_id
  ORDER BY tt.code;
$$;

COMMENT ON FUNCTION fn_cone_summary_filtered IS 'Tổng hợp tồn kho cone có filter; p_warehouse_ids hỗ trợ array để lọc theo LOCATION (nhiều kho con)';

NOTIFY pgrst, 'reload schema';

COMMIT;
