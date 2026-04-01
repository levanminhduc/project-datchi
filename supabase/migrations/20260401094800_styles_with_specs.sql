-- Add audit columns to style_thread_specs (nullable for production safety)
ALTER TABLE style_thread_specs
  ADD COLUMN IF NOT EXISTS created_by VARCHAR(100),
  ADD COLUMN IF NOT EXISTS updated_by VARCHAR(100);

COMMENT ON COLUMN style_thread_specs.created_by IS 'Employee full_name who created this spec';
COMMENT ON COLUMN style_thread_specs.updated_by IS 'Employee full_name who last updated this spec';

-- Aggregated view: styles that have at least 1 thread spec
CREATE OR REPLACE VIEW v_styles_with_specs AS
SELECT
  s.id,
  s.style_code,
  s.style_name,
  s.description,
  s.fabric_type,
  agg.spec_count,
  agg.first_spec_created_at,
  agg.last_spec_updated_at,
  first_spec.created_by AS first_created_by,
  last_spec.updated_by  AS last_updated_by
FROM styles s
INNER JOIN (
  SELECT
    style_id,
    COUNT(*)          AS spec_count,
    MIN(created_at)   AS first_spec_created_at,
    MAX(updated_at)   AS last_spec_updated_at
  FROM style_thread_specs
  GROUP BY style_id
) agg ON agg.style_id = s.id
LEFT JOIN LATERAL (
  SELECT sts.created_by
  FROM style_thread_specs sts
  WHERE sts.style_id = s.id
  ORDER BY sts.created_at ASC
  LIMIT 1
) first_spec ON true
LEFT JOIN LATERAL (
  SELECT sts.updated_by
  FROM style_thread_specs sts
  WHERE sts.style_id = s.id
  ORDER BY sts.updated_at DESC
  LIMIT 1
) last_spec ON true
WHERE s.deleted_at IS NULL;
