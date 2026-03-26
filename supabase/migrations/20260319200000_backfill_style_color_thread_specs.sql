-- Backfill style_color_thread_specs: for every active style_thread_spec × style_color
-- combination belonging to the same style, insert a row using the parent spec's
-- thread_type_id as the default. Existing rows are skipped via ON CONFLICT DO NOTHING.

INSERT INTO style_color_thread_specs (
  style_thread_spec_id,
  style_color_id,
  thread_type_id
)
SELECT
  sts.id            AS style_thread_spec_id,
  sc.id             AS style_color_id,
  sts.thread_type_id
FROM style_thread_specs sts
JOIN styles s ON s.id = sts.style_id
  AND s.deleted_at IS NULL
JOIN style_colors sc ON sc.style_id = sts.style_id
ON CONFLICT (style_thread_spec_id, style_color_id) DO NOTHING;
