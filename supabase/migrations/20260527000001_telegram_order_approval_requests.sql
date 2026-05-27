CREATE TABLE IF NOT EXISTS telegram_approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id INTEGER NOT NULL REFERENCES thread_order_weeks(id) ON DELETE CASCADE,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  telegram_chat_id TEXT NOT NULL,
  telegram_message_id INTEGER,
  status TEXT NOT NULL DEFAULT 'PENDING',
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  handled_at TIMESTAMPTZ,
  handled_by INTEGER REFERENCES employees(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_telegram_approval_request_status CHECK (
    status IN ('PENDING', 'APPROVED', 'EXPIRED', 'SUPERSEDED', 'FAILED')
  )
);

CREATE INDEX IF NOT EXISTS idx_telegram_approval_requests_week
  ON telegram_approval_requests(week_id);

CREATE INDEX IF NOT EXISTS idx_telegram_approval_requests_employee
  ON telegram_approval_requests(employee_id);

CREATE INDEX IF NOT EXISTS idx_telegram_approval_requests_status
  ON telegram_approval_requests(status);

CREATE UNIQUE INDEX IF NOT EXISTS idx_telegram_approval_requests_pending_unique
  ON telegram_approval_requests(week_id, employee_id)
  WHERE status = 'PENDING';

DROP TRIGGER IF EXISTS trigger_telegram_approval_requests_updated_at ON telegram_approval_requests;
CREATE TRIGGER trigger_telegram_approval_requests_updated_at
  BEFORE UPDATE ON telegram_approval_requests
  FOR EACH ROW
  EXECUTE FUNCTION fn_update_updated_at_column();
