-- RPC: Aggregate summary for transfer history (COUNT, SUM, GROUP BY)
-- Returns: total_transfers, total_cones, top_source_id, top_source_name, top_source_count,
--          top_dest_id, top_dest_name, top_dest_count

CREATE OR REPLACE FUNCTION fn_transfer_history_summary(
  p_from_warehouse_id INTEGER DEFAULT NULL,
  p_to_warehouse_id INTEGER DEFAULT NULL,
  p_from_date TIMESTAMPTZ DEFAULT NULL,
  p_to_date TIMESTAMPTZ DEFAULT NULL,
  p_search TEXT DEFAULT NULL
)
RETURNS TABLE (
  total_transfers BIGINT,
  total_cones BIGINT,
  top_source_id INTEGER,
  top_source_name TEXT,
  top_source_count BIGINT,
  top_dest_id INTEGER,
  top_dest_name TEXT,
  top_dest_count BIGINT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_total_transfers BIGINT;
  v_total_cones BIGINT;
  v_top_src_id INTEGER;
  v_top_src_name TEXT;
  v_top_src_count BIGINT;
  v_top_dst_id INTEGER;
  v_top_dst_name TEXT;
  v_top_dst_count BIGINT;
BEGIN
  -- Base filtered set
  SELECT COUNT(*), COALESCE(SUM(bt.cone_count), 0)
  INTO v_total_transfers, v_total_cones
  FROM batch_transactions bt
  WHERE bt.operation_type = 'TRANSFER'
    AND (p_from_warehouse_id IS NULL OR bt.from_warehouse_id = p_from_warehouse_id)
    AND (p_to_warehouse_id IS NULL OR bt.to_warehouse_id = p_to_warehouse_id)
    AND (p_from_date IS NULL OR bt.performed_at >= p_from_date)
    AND (p_to_date IS NULL OR bt.performed_at <= p_to_date)
    AND (p_search IS NULL OR (
      bt.notes ILIKE '%' || p_search || '%'
      OR bt.reference_number ILIKE '%' || p_search || '%'
      OR bt.performed_by ILIKE '%' || p_search || '%'
    ));

  -- Top source warehouse
  SELECT bt.from_warehouse_id, w.name, COUNT(*)
  INTO v_top_src_id, v_top_src_name, v_top_src_count
  FROM batch_transactions bt
  JOIN warehouses w ON w.id = bt.from_warehouse_id
  WHERE bt.operation_type = 'TRANSFER'
    AND bt.from_warehouse_id IS NOT NULL
    AND (p_from_warehouse_id IS NULL OR bt.from_warehouse_id = p_from_warehouse_id)
    AND (p_to_warehouse_id IS NULL OR bt.to_warehouse_id = p_to_warehouse_id)
    AND (p_from_date IS NULL OR bt.performed_at >= p_from_date)
    AND (p_to_date IS NULL OR bt.performed_at <= p_to_date)
    AND (p_search IS NULL OR (
      bt.notes ILIKE '%' || p_search || '%'
      OR bt.reference_number ILIKE '%' || p_search || '%'
      OR bt.performed_by ILIKE '%' || p_search || '%'
    ))
  GROUP BY bt.from_warehouse_id, w.name
  ORDER BY COUNT(*) DESC
  LIMIT 1;

  -- Top destination warehouse
  SELECT bt.to_warehouse_id, w.name, COUNT(*)
  INTO v_top_dst_id, v_top_dst_name, v_top_dst_count
  FROM batch_transactions bt
  JOIN warehouses w ON w.id = bt.to_warehouse_id
  WHERE bt.operation_type = 'TRANSFER'
    AND bt.to_warehouse_id IS NOT NULL
    AND (p_from_warehouse_id IS NULL OR bt.from_warehouse_id = p_from_warehouse_id)
    AND (p_to_warehouse_id IS NULL OR bt.to_warehouse_id = p_to_warehouse_id)
    AND (p_from_date IS NULL OR bt.performed_at >= p_from_date)
    AND (p_to_date IS NULL OR bt.performed_at <= p_to_date)
    AND (p_search IS NULL OR (
      bt.notes ILIKE '%' || p_search || '%'
      OR bt.reference_number ILIKE '%' || p_search || '%'
      OR bt.performed_by ILIKE '%' || p_search || '%'
    ))
  GROUP BY bt.to_warehouse_id, w.name
  ORDER BY COUNT(*) DESC
  LIMIT 1;

  RETURN QUERY SELECT
    v_total_transfers,
    v_total_cones,
    v_top_src_id,
    v_top_src_name,
    v_top_src_count,
    v_top_dst_id,
    v_top_dst_name,
    v_top_dst_count;
END;
$$;

COMMENT ON FUNCTION fn_transfer_history_summary IS 'Aggregate summary cho transfer history: COUNT, SUM, top source/dest warehouse';

NOTIFY pgrst, 'reload schema';
