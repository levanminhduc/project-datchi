BEGIN;

CREATE OR REPLACE FUNCTION fn_issue_cones_with_movements(
  p_cone_ids INTEGER[],
  p_line_id INTEGER,
  p_performed_by VARCHAR
)
RETURNS JSONB AS $$
DECLARE
  v_line_thread_type_id INTEGER;
  v_cone_count INTEGER;
  v_affected INTEGER;
  v_cone RECORD;
  v_issuable_statuses cone_status[] := ARRAY['AVAILABLE', 'RECEIVED', 'INSPECTED', 'RESERVED_FOR_ORDER']::cone_status[];
BEGIN
  IF p_cone_ids IS NULL OR array_length(p_cone_ids, 1) IS NULL OR array_length(p_cone_ids, 1) = 0 THEN
    RAISE EXCEPTION 'p_cone_ids cannot be empty';
  END IF;

  IF p_line_id IS NULL THEN
    RAISE EXCEPTION 'p_line_id cannot be NULL';
  END IF;

  IF (SELECT COUNT(*) FROM (SELECT UNNEST(p_cone_ids)) t) != (SELECT COUNT(*) FROM (SELECT DISTINCT UNNEST(p_cone_ids)) t) THEN
    RAISE EXCEPTION 'p_cone_ids contains duplicates';
  END IF;

  SELECT thread_type_id INTO v_line_thread_type_id
  FROM thread_issue_lines
  WHERE id = p_line_id;

  IF v_line_thread_type_id IS NULL THEN
    RAISE EXCEPTION 'Issue line % not found', p_line_id;
  END IF;

  SELECT COUNT(*) INTO v_cone_count
  FROM thread_inventory
  WHERE id = ANY(p_cone_ids)
    AND thread_type_id != v_line_thread_type_id;

  IF v_cone_count > 0 THEN
    RAISE EXCEPTION 'Some cones do not match thread_type_id % of issue line', v_line_thread_type_id;
  END IF;

  PERFORM 1
  FROM thread_inventory
  WHERE id = ANY(p_cone_ids)
  FOR UPDATE;

  SELECT COUNT(*) INTO v_cone_count
  FROM thread_inventory
  WHERE id = ANY(p_cone_ids)
    AND status != ALL(v_issuable_statuses);

  IF v_cone_count > 0 THEN
    RAISE EXCEPTION 'Some cones are not in issuable status (% cones)', v_cone_count;
  END IF;

  FOR v_cone IN
    SELECT id, quantity_meters, status
    FROM thread_inventory
    WHERE id = ANY(p_cone_ids)
  LOOP
    INSERT INTO thread_movements (
      cone_id, movement_type, quantity_meters,
      from_status, to_status,
      reference_type, reference_id,
      performed_by, created_at
    ) VALUES (
      v_cone.id, 'ISSUE', v_cone.quantity_meters,
      v_cone.status, 'HARD_ALLOCATED',
      'ISSUE_LINE', p_line_id::VARCHAR,
      p_performed_by, NOW()
    );
  END LOOP;

  UPDATE thread_inventory
  SET
    status = 'HARD_ALLOCATED',
    issued_line_id = p_line_id,
    reserved_week_id = NULL,
    updated_at = NOW()
  WHERE id = ANY(p_cone_ids)
    AND status = ANY(v_issuable_statuses);

  GET DIAGNOSTICS v_affected = ROW_COUNT;

  IF v_affected != array_length(p_cone_ids, 1) THEN
    RAISE EXCEPTION 'Concurrent modification detected: expected %, affected %', array_length(p_cone_ids, 1), v_affected;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'affected_cones', v_affected,
    'line_id', p_line_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION fn_issue_cones_with_movements(INTEGER[], INTEGER, VARCHAR) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION fn_issue_cones_with_movements(INTEGER[], INTEGER, VARCHAR) TO service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
