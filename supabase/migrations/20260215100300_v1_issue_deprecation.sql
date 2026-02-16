BEGIN;

DO $$
DECLARE
  v_issue_id INTEGER;
  v_line_id INTEGER;
  v_issue_code TEXT;
  r RECORD;
BEGIN
  FOR r IN SELECT * FROM thread_issue_requests WHERE status != 'CANCELLED' LOOP
    v_issue_code := r.issue_code || '-V1';

    INSERT INTO thread_issues (issue_code, department, status, created_by, notes, created_at, updated_at)
    VALUES (
      v_issue_code,
      r.department,
      CASE r.status::TEXT
        WHEN 'PENDING' THEN 'DRAFT'::issue_status
        WHEN 'PARTIAL' THEN 'DRAFT'::issue_status
        WHEN 'COMPLETED' THEN 'CONFIRMED'::issue_status
        ELSE 'DRAFT'::issue_status
      END,
      r.created_by,
      COALESCE(r.notes, '') || ' [Migrated from v1 issue ' || r.issue_code || ']',
      r.created_at,
      r.updated_at
    )
    RETURNING id INTO v_issue_id;

    INSERT INTO thread_issue_lines (issue_id, po_id, style_id, color_id, thread_type_id, quota_cones, created_at)
    VALUES (
      v_issue_id,
      r.po_id,
      r.style_id,
      r.color_id,
      r.thread_type_id,
      NULL,
      r.created_at
    );
  END LOOP;
END $$;

DROP VIEW IF EXISTS v_issue_reconciliation;

DROP TRIGGER IF EXISTS trigger_update_issue_request_issued_meters ON thread_issue_items;
DROP TRIGGER IF EXISTS trigger_update_issue_request_status ON thread_issue_requests;
DROP TRIGGER IF EXISTS trigger_thread_issue_requests_updated_at ON thread_issue_requests;

DROP TABLE IF EXISTS thread_issue_returns CASCADE;
DROP TABLE IF EXISTS thread_issue_items CASCADE;
DROP TABLE IF EXISTS thread_issue_requests CASCADE;

DROP FUNCTION IF EXISTS fn_update_issue_request_issued_meters();
DROP FUNCTION IF EXISTS fn_update_issue_request_status();

DROP TYPE IF EXISTS issue_request_status;

NOTIFY pgrst, 'reload schema';

COMMIT;
