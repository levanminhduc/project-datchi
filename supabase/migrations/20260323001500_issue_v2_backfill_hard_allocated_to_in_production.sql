BEGIN;

DO $$
DECLARE
  v_hard_allocated_before INTEGER := 0;
  v_candidate_cones INTEGER := 0;
  v_updated_cones INTEGER := 0;
  v_hard_allocated_without_line INTEGER := 0;
BEGIN
  SELECT COUNT(*) INTO v_hard_allocated_before
  FROM thread_inventory
  WHERE status = 'HARD_ALLOCATED';

  SELECT COUNT(*) INTO v_candidate_cones
  FROM thread_inventory ti
  JOIN thread_issue_lines il ON il.id = ti.issued_line_id
  JOIN thread_issues i ON i.id = il.issue_id
  WHERE ti.status = 'HARD_ALLOCATED'
    AND i.status = 'CONFIRMED'
    AND (
      COALESCE(il.issued_full, 0) + COALESCE(il.issued_partial, 0)
      > COALESCE(il.returned_full, 0) + COALESCE(il.returned_partial, 0)
    );

  UPDATE thread_inventory ti
  SET
    status = 'IN_PRODUCTION',
    updated_at = NOW()
  FROM thread_issue_lines il
  JOIN thread_issues i ON i.id = il.issue_id
  WHERE ti.status = 'HARD_ALLOCATED'
    AND ti.issued_line_id = il.id
    AND i.status = 'CONFIRMED'
    AND (
      COALESCE(il.issued_full, 0) + COALESCE(il.issued_partial, 0)
      > COALESCE(il.returned_full, 0) + COALESCE(il.returned_partial, 0)
    );

  GET DIAGNOSTICS v_updated_cones = ROW_COUNT;

  SELECT COUNT(*) INTO v_hard_allocated_without_line
  FROM thread_inventory ti
  WHERE ti.status = 'HARD_ALLOCATED'
    AND ti.issued_line_id IS NULL;

  RAISE NOTICE '[issue-v2-backfill] HARD_ALLOCATED before: %', v_hard_allocated_before;
  RAISE NOTICE '[issue-v2-backfill] Candidate cones: %', v_candidate_cones;
  RAISE NOTICE '[issue-v2-backfill] Updated to IN_PRODUCTION: %', v_updated_cones;
  RAISE NOTICE '[issue-v2-backfill] Remaining HARD_ALLOCATED without issued_line_id (manual reconcile): %', v_hard_allocated_without_line;
END;
$$;

NOTIFY pgrst, 'reload schema';

COMMIT;
