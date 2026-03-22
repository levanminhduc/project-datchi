BEGIN;

CREATE OR REPLACE FUNCTION fn_return_cones_with_movements(
  p_cone_ids INTEGER[],
  p_line_id INTEGER,
  p_performed_by VARCHAR,
  p_partial_returns JSONB DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_line_thread_type_id INTEGER;
  v_issue_id INTEGER;
  v_cone_count INTEGER;
  v_affected INTEGER;
  v_cone RECORD;
  v_partial RECORD;
  v_partial_cone_ids INTEGER[];
  v_full_return_ids INTEGER[];
  v_new_cone_id VARCHAR(50);
  v_new_id INTEGER;
  v_original_meters NUMERIC(12,4);
  v_return_meters NUMERIC(12,4);
  v_seq BIGINT;
  v_candidate_count INTEGER;
BEGIN
  IF p_line_id IS NULL THEN
    RAISE EXCEPTION 'p_line_id cannot be NULL';
  END IF;

  SELECT thread_type_id, issue_id INTO v_line_thread_type_id, v_issue_id
  FROM thread_issue_lines
  WHERE id = p_line_id;

  IF v_line_thread_type_id IS NULL THEN
    RAISE EXCEPTION 'Issue line % not found', p_line_id;
  END IF;

  v_full_return_ids := COALESCE(p_cone_ids, ARRAY[]::INTEGER[]);

  IF p_partial_returns IS NOT NULL AND jsonb_array_length(p_partial_returns) > 0 THEN
    FOR v_partial IN
      SELECT
        (elem->>'original_cone_id')::INTEGER AS original_cone_id,
        (elem->>'return_quantity_meters')::NUMERIC(12,4) AS return_quantity_meters
      FROM jsonb_array_elements(p_partial_returns) AS elem
    LOOP
      IF v_partial.original_cone_id IS NULL THEN
        RAISE EXCEPTION 'Invalid partial return: original_cone_id is required';
      END IF;
      IF v_partial.return_quantity_meters IS NULL OR v_partial.return_quantity_meters <= 0 THEN
        RAISE EXCEPTION 'Invalid partial return: return_quantity_meters must be positive';
      END IF;

      v_partial_cone_ids := array_append(COALESCE(v_partial_cone_ids, ARRAY[]::INTEGER[]), v_partial.original_cone_id);
    END LOOP;

    IF (SELECT COUNT(*) FROM (SELECT UNNEST(v_partial_cone_ids)) t) !=
       (SELECT COUNT(*) FROM (SELECT DISTINCT UNNEST(v_partial_cone_ids)) t) THEN
      RAISE EXCEPTION 'Duplicate original_cone_id in partial returns';
    END IF;

    IF v_full_return_ids && v_partial_cone_ids THEN
      RAISE EXCEPTION 'Overlap between full-return and partial-return cone IDs';
    END IF;
  END IF;

  IF array_length(v_full_return_ids, 1) > 0 THEN
    IF (SELECT COUNT(*) FROM (SELECT UNNEST(v_full_return_ids)) t) !=
       (SELECT COUNT(*) FROM (SELECT DISTINCT UNNEST(v_full_return_ids)) t) THEN
      RAISE EXCEPTION 'p_cone_ids contains duplicates';
    END IF;

    PERFORM 1
    FROM thread_inventory
    WHERE id = ANY(v_full_return_ids)
    FOR UPDATE;

    SELECT COUNT(*) INTO v_cone_count
    FROM thread_inventory
    WHERE id = ANY(v_full_return_ids)
      AND status != 'HARD_ALLOCATED';

    IF v_cone_count > 0 THEN
      RAISE EXCEPTION 'Some cones are not HARD_ALLOCATED (% cones)', v_cone_count;
    END IF;

    SELECT COUNT(*) INTO v_cone_count
    FROM thread_inventory
    WHERE id = ANY(v_full_return_ids)
      AND (issued_line_id != p_line_id OR issued_line_id IS NULL)
      AND (is_legacy_unmapped IS NULL OR is_legacy_unmapped = FALSE);

    IF v_cone_count > 0 THEN
      RAISE EXCEPTION 'Some cones do not belong to issue line % (% cones)', p_line_id, v_cone_count;
    END IF;

    FOR v_cone IN
      SELECT id, quantity_meters, is_legacy_unmapped, thread_type_id
      FROM thread_inventory
      WHERE id = ANY(v_full_return_ids)
        AND is_legacy_unmapped = TRUE
        AND issued_line_id IS NULL
    LOOP
      SELECT COUNT(*) INTO v_candidate_count
      FROM thread_issue_lines
      WHERE issue_id = v_issue_id
        AND thread_type_id = v_cone.thread_type_id;

      IF v_candidate_count != 1 THEN
        RAISE EXCEPTION 'Legacy cone % requires manual reconciliation: % candidate lines found', v_cone.id, v_candidate_count;
      END IF;
    END LOOP;

    UPDATE thread_inventory
    SET
      status = 'AVAILABLE',
      issued_line_id = NULL,
      updated_at = NOW()
    WHERE id = ANY(v_full_return_ids)
      AND status = 'HARD_ALLOCATED';

    GET DIAGNOSTICS v_affected = ROW_COUNT;

    IF v_affected != array_length(v_full_return_ids, 1) THEN
      RAISE EXCEPTION 'Concurrent modification: expected %, affected %', array_length(v_full_return_ids, 1), v_affected;
    END IF;

    FOR v_cone IN
      SELECT id, quantity_meters
      FROM thread_inventory
      WHERE id = ANY(v_full_return_ids)
    LOOP
      INSERT INTO thread_movements (
        cone_id,
        movement_type,
        quantity_meters,
        from_status,
        to_status,
        reference_type,
        reference_id,
        performed_by,
        created_at
      ) VALUES (
        v_cone.id,
        'RETURN',
        v_cone.quantity_meters,
        'HARD_ALLOCATED',
        'AVAILABLE',
        'ISSUE_LINE',
        p_line_id::VARCHAR,
        p_performed_by,
        NOW()
      );
    END LOOP;
  END IF;

  IF v_partial_cone_ids IS NOT NULL AND array_length(v_partial_cone_ids, 1) > 0 THEN
    PERFORM 1
    FROM thread_inventory
    WHERE id = ANY(v_partial_cone_ids)
    FOR UPDATE;

    FOR v_partial IN
      SELECT
        (elem->>'original_cone_id')::INTEGER AS original_cone_id,
        (elem->>'return_quantity_meters')::NUMERIC(12,4) AS return_quantity_meters
      FROM jsonb_array_elements(p_partial_returns) AS elem
    LOOP
      SELECT quantity_meters, cone_id, thread_type_id, warehouse_id, lot_id, lot_number, expiry_date, received_date, location
      INTO v_cone
      FROM thread_inventory
      WHERE id = v_partial.original_cone_id
        AND status = 'HARD_ALLOCATED';

      IF v_cone IS NULL THEN
        RAISE EXCEPTION 'Partial return cone % not found or not HARD_ALLOCATED', v_partial.original_cone_id;
      END IF;

      v_original_meters := v_cone.quantity_meters;
      v_return_meters := v_partial.return_quantity_meters;

      IF v_return_meters > v_original_meters THEN
        RAISE EXCEPTION 'Return quantity % exceeds original % for cone %', v_return_meters, v_original_meters, v_partial.original_cone_id;
      END IF;

      v_seq := nextval('thread_inventory_partial_seq');

      IF LENGTH(v_cone.cone_id || '-P' || LPAD(v_seq::TEXT, 6, '0')) > 50 THEN
        v_new_cone_id := LEFT(v_cone.cone_id, 38) || '-P' || LPAD(v_seq::TEXT, 6, '0');
      ELSE
        v_new_cone_id := v_cone.cone_id || '-P' || LPAD(v_seq::TEXT, 6, '0');
      END IF;

      INSERT INTO thread_inventory (
        cone_id,
        thread_type_id,
        warehouse_id,
        quantity_cones,
        quantity_meters,
        is_partial,
        status,
        lot_id,
        lot_number,
        expiry_date,
        received_date,
        location,
        issued_line_id,
        created_at,
        updated_at
      ) VALUES (
        v_new_cone_id,
        v_cone.thread_type_id,
        v_cone.warehouse_id,
        1,
        v_return_meters,
        TRUE,
        'AVAILABLE',
        v_cone.lot_id,
        v_cone.lot_number,
        v_cone.expiry_date,
        v_cone.received_date,
        v_cone.location,
        NULL,
        NOW(),
        NOW()
      )
      RETURNING id INTO v_new_id;

      UPDATE thread_inventory
      SET
        quantity_meters = quantity_meters - v_return_meters,
        updated_at = NOW()
      WHERE id = v_partial.original_cone_id;

      INSERT INTO thread_movements (
        cone_id,
        movement_type,
        quantity_meters,
        from_status,
        to_status,
        reference_type,
        reference_id,
        performed_by,
        notes,
        created_at
      ) VALUES (
        v_new_id,
        'RETURN',
        v_return_meters,
        'HARD_ALLOCATED',
        'AVAILABLE',
        'ISSUE_LINE',
        p_line_id::VARCHAR,
        p_performed_by,
        'Partial return from cone ID ' || v_partial.original_cone_id,
        NOW()
      );
    END LOOP;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'full_returns', COALESCE(array_length(v_full_return_ids, 1), 0),
    'partial_returns', COALESCE(array_length(v_partial_cone_ids, 1), 0),
    'line_id', p_line_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION fn_return_cones_with_movements(INTEGER[], INTEGER, VARCHAR, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION fn_return_cones_with_movements(INTEGER[], INTEGER, VARCHAR, JSONB) TO service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
