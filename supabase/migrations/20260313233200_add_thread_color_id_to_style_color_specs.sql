ALTER TABLE style_color_thread_specs
  ADD COLUMN thread_color_id INTEGER REFERENCES colors(id) ON DELETE RESTRICT;

ALTER TABLE style_color_thread_specs
  ALTER COLUMN thread_type_id DROP NOT NULL;

CREATE INDEX idx_style_color_thread_specs_thread_color_id
  ON style_color_thread_specs(thread_color_id);
