INSERT INTO system_settings (key, value, description)
VALUES (
  'import_po_items_mapping',
  '{"sheet_index": 0, "header_row": 1, "data_start_row": 2, "columns": {"po_number": "A", "style_code": "B", "quantity": "C", "customer_name": "D", "order_date": "E", "notes": "F"}}'::jsonb,
  'Cấu hình mapping cột Excel khi import PO items'
)
ON CONFLICT (key) DO NOTHING;
