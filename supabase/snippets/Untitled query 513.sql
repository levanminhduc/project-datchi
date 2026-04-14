ALTER TABLE thread_issue_lines
  ADD COLUMN IF NOT EXISTS thread_color_id INTEGER REFERENCES colors(id);

CREATE INDEX IF NOT EXISTS idx_thread_issue_lines_thread_color_id
  ON thread_issue_lines(thread_color_id);