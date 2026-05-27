CREATE TABLE IF NOT EXISTS telegram_identities (
  id SERIAL PRIMARY KEY,
  telegram_user_id TEXT NOT NULL,
  chat_id TEXT NOT NULL,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_command TEXT NOT NULL,
  assigned_employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  assigned_channel_id INTEGER REFERENCES notification_channels(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_telegram_identities_user UNIQUE (telegram_user_id)
);

CREATE INDEX IF NOT EXISTS idx_telegram_identities_assigned_employee
  ON telegram_identities(assigned_employee_id)
  WHERE assigned_employee_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_telegram_identities_last_seen
  ON telegram_identities(last_seen_at DESC);

DROP TRIGGER IF EXISTS trigger_telegram_identities_updated_at ON telegram_identities;
CREATE TRIGGER trigger_telegram_identities_updated_at
  BEFORE UPDATE ON telegram_identities
  FOR EACH ROW
  EXECUTE FUNCTION fn_update_updated_at_column();
