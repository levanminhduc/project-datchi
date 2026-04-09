CREATE OR REPLACE FUNCTION fn_count_colored_cones(
  p_thread_type_ids int[],
  p_color_ids int[]
)
RETURNS TABLE(thread_type_id int, color_id int, is_partial boolean, cone_count bigint)
LANGUAGE sql STABLE
AS $$
  SELECT
    ti.thread_type_id,
    ti.color_id,
    ti.is_partial,
    COUNT(*) as cone_count
  FROM thread_inventory ti
  WHERE ti.status IN ('RECEIVED', 'INSPECTED', 'AVAILABLE', 'SOFT_ALLOCATED')
    AND ti.thread_type_id = ANY(p_thread_type_ids)
    AND ti.color_id = ANY(p_color_ids)
  GROUP BY ti.thread_type_id, ti.color_id, ti.is_partial;
$$;
