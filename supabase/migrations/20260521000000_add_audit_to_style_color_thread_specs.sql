-- Migration: Add audit columns to style_color_thread_specs
-- Reason: Track which employee last edited each color spec row, matching the
--         pattern already present on style_thread_specs.

ALTER TABLE style_color_thread_specs
  ADD COLUMN created_by VARCHAR(100),
  ADD COLUMN updated_by VARCHAR(100);

COMMENT ON COLUMN style_color_thread_specs.created_by IS 'Full name of the employee who created this row (snapshot of employees.full_name at creation time)';
COMMENT ON COLUMN style_color_thread_specs.updated_by IS 'Full name of the employee who last edited this row (snapshot of employees.full_name)';
