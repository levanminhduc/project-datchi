-- ============================================================================
-- Weekly Order Warehouse Filter
-- Migration: 20260415100000_weekly_order_warehouse_filter.sql
-- Description:
--   1. Junction table for per-week warehouse selection
--   2. fn_count_available_cones_v2 with optional warehouse filter
--   3. fn_count_colored_cones_v2 with optional warehouse filter
-- SAFE: Only creates NEW objects, does NOT modify or drop existing ones.
-- ============================================================================

BEGIN;

-- ============================================================================
-- SECTION 1: Junction table
-- ============================================================================

CREATE TABLE IF NOT EXISTS thread_order_week_warehouses (
  week_id INTEGER NOT NULL REFERENCES thread_order_weeks(id) ON DELETE CASCADE,
  warehouse_id INTEGER NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  PRIMARY KEY (week_id, warehouse_id)
);

COMMENT ON TABLE thread_order_week_warehouses
  IS 'Lưu danh sách kho được chọn cho mỗi tuần đặt hàng. Trống = tất cả kho.';

CREATE INDEX idx_week_warehouses_week_id ON thread_order_week_warehouses(week_id);

-- ============================================================================
-- SECTION 2: fn_count_available_cones_v2 (non-colored thread types)
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_count_available_cones_v2(
  p_thread_type_ids INTEGER[],
  p_warehouse_ids INTEGER[] DEFAULT NULL
)
RETURNS TABLE(thread_type_id INTEGER, is_partial BOOLEAN, cone_count BIGINT)
LANGUAGE sql STABLE
AS $$
  SELECT ti.thread_type_id, ti.is_partial, COUNT(*) AS cone_count
  FROM thread_inventory ti
  WHERE ti.status IN ('RECEIVED', 'INSPECTED', 'AVAILABLE', 'SOFT_ALLOCATED')
    AND ti.thread_type_id = ANY(p_thread_type_ids)
    AND (p_warehouse_ids IS NULL OR ti.warehouse_id = ANY(p_warehouse_ids))
  GROUP BY ti.thread_type_id, ti.is_partial;
$$;

-- ============================================================================
-- SECTION 3: fn_count_colored_cones_v2 (colored thread types)
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_count_colored_cones_v2(
  p_thread_type_ids INTEGER[],
  p_color_ids INTEGER[],
  p_warehouse_ids INTEGER[] DEFAULT NULL
)
RETURNS TABLE(thread_type_id INTEGER, color_id INTEGER, is_partial BOOLEAN, cone_count BIGINT)
LANGUAGE sql STABLE
AS $$
  SELECT
    ti.thread_type_id,
    ti.color_id,
    ti.is_partial,
    COUNT(*) AS cone_count
  FROM thread_inventory ti
  WHERE ti.status IN ('RECEIVED', 'INSPECTED', 'AVAILABLE', 'SOFT_ALLOCATED')
    AND ti.thread_type_id = ANY(p_thread_type_ids)
    AND ti.color_id = ANY(p_color_ids)
    AND (p_warehouse_ids IS NULL OR ti.warehouse_id = ANY(p_warehouse_ids))
  GROUP BY ti.thread_type_id, ti.color_id, ti.is_partial;
$$;

COMMIT;
