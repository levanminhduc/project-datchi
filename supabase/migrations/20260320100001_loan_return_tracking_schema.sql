BEGIN;

-- Task 1.1: Add returned_cones column to thread_order_loans
ALTER TABLE thread_order_loans
  ADD COLUMN IF NOT EXISTS returned_cones INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN thread_order_loans.returned_cones IS 'Cumulative cones returned so far (partial return tracking)';

-- Task 1.2: Backfill existing data
UPDATE thread_order_loans SET returned_cones = quantity_cones WHERE status = 'SETTLED';
UPDATE thread_order_loans SET returned_cones = 0 WHERE status = 'ACTIVE';

-- Task 1.3: Create thread_loan_return_logs table
CREATE TABLE IF NOT EXISTS thread_loan_return_logs (
  id SERIAL PRIMARY KEY,
  loan_id INTEGER NOT NULL REFERENCES thread_order_loans(id) ON DELETE CASCADE,
  cones_returned INTEGER NOT NULL,
  return_type VARCHAR(10) NOT NULL,
  returned_by VARCHAR(100) NOT NULL,
  notes TEXT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chk_return_type CHECK (return_type IN ('AUTO', 'MANUAL')),
  CONSTRAINT chk_cones_returned_positive CHECK (cones_returned > 0)
);

CREATE INDEX IF NOT EXISTS idx_loan_return_logs_loan_id ON thread_loan_return_logs(loan_id);
CREATE INDEX IF NOT EXISTS idx_loan_return_logs_created_at ON thread_loan_return_logs(created_at DESC);

COMMENT ON TABLE thread_loan_return_logs IS 'Per-event return audit trail for thread order loans';
COMMENT ON COLUMN thread_loan_return_logs.return_type IS 'AUTO = triggered by delivery receipt, MANUAL = triggered by user';

NOTIFY pgrst, 'reload schema';

COMMIT;
