CREATE OR REPLACE FUNCTION fn_count_available_cones(p_thread_type_ids integer[])
RETURNS TABLE(thread_type_id integer, is_partial boolean, cone_count bigint)
LANGUAGE sql STABLE
AS $$
  SELECT ti.thread_type_id, ti.is_partial, count(*) as cone_count
  FROM thread_inventory ti
  WHERE ti.status = 'AVAILABLE'
    AND ti.reserved_week_id IS NULL
    AND ti.thread_type_id = ANY(p_thread_type_ids)
  GROUP BY ti.thread_type_id, ti.is_partial;
$$;
