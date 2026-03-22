BEGIN;

ALTER TABLE thread_inventory
ADD COLUMN IF NOT EXISTS issued_line_id INTEGER;

ALTER TABLE thread_inventory
ADD COLUMN IF NOT EXISTS is_legacy_unmapped BOOLEAN DEFAULT FALSE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_thread_inventory_issued_line_id'
  ) THEN
    ALTER TABLE thread_inventory
    ADD CONSTRAINT fk_thread_inventory_issued_line_id
    FOREIGN KEY (issued_line_id) REFERENCES thread_issue_lines(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_legacy_unmapped_null_line'
  ) THEN
    ALTER TABLE thread_inventory
    ADD CONSTRAINT chk_legacy_unmapped_null_line
    CHECK ((is_legacy_unmapped = FALSE) OR (issued_line_id IS NULL));
  END IF;
END $$;

UPDATE lots l
SET
  available_cones = (
    SELECT COUNT(*)
    FROM thread_inventory ti
    WHERE ti.lot_id = l.id
      AND ti.status IN ('AVAILABLE', 'RECEIVED', 'INSPECTED')
  ),
  updated_at = NOW();

UPDATE lots l
SET
  status = CASE
    WHEN l.available_cones = 0 AND l.status NOT IN ('QUARANTINE', 'EXPIRED') THEN 'DEPLETED'::lot_status
    WHEN l.available_cones > 0 AND l.status = 'DEPLETED' THEN 'ACTIVE'::lot_status
    ELSE l.status
  END,
  updated_at = NOW()
WHERE l.status NOT IN ('QUARANTINE', 'EXPIRED')
   OR (l.available_cones > 0 AND l.status = 'DEPLETED');

WITH best_movements AS (
  SELECT DISTINCT ON (tm.cone_id)
    tm.cone_id,
    tm.reference_id::INTEGER AS line_id
  FROM thread_movements tm
  WHERE tm.movement_type = 'ISSUE'
    AND tm.reference_type = 'ISSUE_LINE'
    AND tm.reference_id ~ '^[0-9]+$'
  ORDER BY tm.cone_id, tm.created_at DESC
)
UPDATE thread_inventory ti
SET issued_line_id = bm.line_id
FROM best_movements bm
WHERE ti.id = bm.cone_id
  AND ti.status = 'HARD_ALLOCATED'
  AND ti.issued_line_id IS NULL;

UPDATE thread_inventory ti
SET is_legacy_unmapped = TRUE
WHERE ti.status = 'HARD_ALLOCATED'
  AND ti.issued_line_id IS NULL
  AND ti.is_legacy_unmapped = FALSE;

NOTIFY pgrst, 'reload schema';

COMMIT;
