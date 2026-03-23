BEGIN;

CREATE TABLE IF NOT EXISTS issue_operations_log (
  id SERIAL PRIMARY KEY,
  idempotency_key VARCHAR(50) NOT NULL,
  operation_type VARCHAR(20) NOT NULL,
  request_hash VARCHAR(64) NOT NULL,
  request_payload JSONB,
  succeeded_line_ids INTEGER[],
  status VARCHAR(20) DEFAULT 'IN_PROGRESS',
  error_info TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  CONSTRAINT uq_operation_idempotency UNIQUE (operation_type, idempotency_key),
  CONSTRAINT chk_operation_type CHECK (operation_type IN ('CONFIRM', 'RETURN')),
  CONSTRAINT chk_status CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'FAILED'))
);

CREATE INDEX IF NOT EXISTS idx_issue_operations_log_status ON issue_operations_log(status);
CREATE INDEX IF NOT EXISTS idx_issue_operations_log_created ON issue_operations_log(created_at);

NOTIFY pgrst, 'reload schema';

COMMIT;
