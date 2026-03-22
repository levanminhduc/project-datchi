ALTER TABLE thread_type_supplier
ADD COLUMN meters_per_cone DECIMAL(12,2);

COMMENT ON COLUMN thread_type_supplier.meters_per_cone IS 'So met chi tren moi cone - Meters of thread per cone';

INSERT INTO system_settings (key, value, description)
VALUES (
  'import_supplier_tex_mapping',
  '{"sheet_index": 0, "header_row": 1, "data_start_row": 2, "columns": {"supplier_name": "A", "tex_number": "B", "meters_per_cone": "C", "unit_price": "D", "supplier_item_code": "E"}}'::jsonb,
  'Cấu hình mapping cột Excel khi import danh mục NCC - Tex'
)
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_settings (key, value, description)
VALUES (
  'import_supplier_color_mapping',
  '{"sheet_index": 0, "header_row": 1, "data_start_row": 2, "columns": {"color_name": "A", "supplier_color_code": "B"}}'::jsonb,
  'Cấu hình mapping cột Excel khi import danh mục màu của NCC'
)
ON CONFLICT (key) DO NOTHING;
