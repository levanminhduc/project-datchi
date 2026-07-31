BEGIN;

ALTER TABLE issue_operations_log DROP CONSTRAINT IF EXISTS chk_operation_type;

ALTER TABLE issue_operations_log
  ADD CONSTRAINT chk_operation_type
  CHECK (operation_type IN ('CONFIRM', 'RETURN', 'RETURN_GROUPED'));

COMMIT;
