-- Them thread_color_id vao thread_issue_lines
-- Fix bug: khi 1 mau hang (style_color) dung nhieu mau chi (thread_color) cua cung loai chi,
-- backend chon sai mau chi vi lookupThreadColorId dung LIMIT 1.
-- Luu thread_color_id tren dong xuat de confirm handler khong can lookup lai.

ALTER TABLE thread_issue_lines
  ADD COLUMN IF NOT EXISTS thread_color_id INTEGER REFERENCES colors(id);

CREATE INDEX IF NOT EXISTS idx_thread_issue_lines_thread_color_id
  ON thread_issue_lines(thread_color_id);
