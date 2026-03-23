-- Them style_color_id vao thread_issue_lines
-- Thay the color_id (FK -> colors) bang style_color_id (FK -> style_colors)

ALTER TABLE thread_issue_lines
  ADD COLUMN IF NOT EXISTS style_color_id INTEGER REFERENCES style_colors(id);

CREATE INDEX IF NOT EXISTS idx_thread_issue_lines_style_color_id
  ON thread_issue_lines(style_color_id);

-- Migrate data cu: map color_id -> style_color_id neu co
-- (Hien tai 0 records nen day la phong truoc)
UPDATE thread_issue_lines til
SET style_color_id = sc.id
FROM style_colors sc
WHERE til.color_id IS NOT NULL
  AND til.style_color_id IS NULL
  AND til.style_id = sc.style_id
  AND sc.id = til.color_id;
