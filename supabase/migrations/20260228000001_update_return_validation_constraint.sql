-- Migration: Update return validation constraint for cross-type returns
-- Allows returning partial cones converted from full cones
-- New validation: returned_full <= issued_full AND (returned_full + returned_partial) <= (issued_full + issued_partial)

-- Drop old constraint
ALTER TABLE thread_issue_lines
DROP CONSTRAINT IF EXISTS chk_issue_lines_returned_not_exceed_issued;

-- Add new constraint with total-based validation
ALTER TABLE thread_issue_lines
ADD CONSTRAINT chk_issue_lines_returned_not_exceed_issued
CHECK (
    returned_full <= issued_full
    AND (returned_full + returned_partial) <= (issued_full + issued_partial)
);
