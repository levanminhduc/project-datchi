ALTER TABLE thread_issues ADD COLUMN IF NOT EXISTS confirming_at TIMESTAMPTZ;

DO $fix_drift$
DECLARE
  v_updated INTEGER;
BEGIN
  WITH cuon_thuc AS (
    SELECT
      inv.issued_line_id AS line_id,
      COUNT(*) FILTER (WHERE inv.is_partial = FALSE)::int AS cuon_nguyen,
      COUNT(*) FILTER (WHERE inv.is_partial = TRUE)::int AS cuon_le
    FROM thread_inventory inv
    WHERE inv.issued_line_id IS NOT NULL
      AND inv.status IN ('IN_PRODUCTION', 'HARD_ALLOCATED')
    GROUP BY inv.issued_line_id
  )
  UPDATE thread_issue_lines til
  SET issued_full = t.cuon_nguyen,
      issued_partial = t.cuon_le,
      updated_at = NOW()
  FROM cuon_thuc t
  WHERE til.id = t.line_id
    AND til.returned_full = 0
    AND til.returned_partial = 0
    AND (t.cuon_nguyen + t.cuon_le) > (til.issued_full + til.issued_partial)
    AND EXISTS (
      SELECT 1 FROM thread_issues ti
      WHERE ti.id = til.issue_id AND ti.status = 'CONFIRMED'
    );

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RAISE NOTICE 'Chot lai so cuon da xuat cho % dong phieu', v_updated;
END $fix_drift$;
