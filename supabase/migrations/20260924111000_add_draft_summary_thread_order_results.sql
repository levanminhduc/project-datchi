ALTER TABLE thread_order_results
  ADD COLUMN IF NOT EXISTS draft_summary_data JSONB,
  ADD COLUMN IF NOT EXISTS draft_saved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS draft_saved_by VARCHAR(50);
