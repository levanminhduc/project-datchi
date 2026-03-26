-- ============================================================================
-- Migration: 20260313000002_po_import_columns_revamp.sql
-- Description: Add week and finished_product_code for PO import revamp
-- Dependencies: purchase_orders, po_items, system_settings
-- ============================================================================

ALTER TABLE purchase_orders
ADD COLUMN IF NOT EXISTS week VARCHAR(50);

COMMENT ON COLUMN purchase_orders.week IS 'Tuan/ky giao hang tu file import PO - Week label from PO import';

ALTER TABLE po_items
ADD COLUMN IF NOT EXISTS finished_product_code VARCHAR(100);

COMMENT ON COLUMN po_items.finished_product_code IS 'Ma thanh pham ky thuat - Finished product code from PO import';

INSERT INTO system_settings (key, value, description)
VALUES (
  'import_po_items_mapping',
  '{
    "sheet_index": 0,
    "header_row": 1,
    "data_start_row": 2,
    "columns": {
      "customer_name": "A",
      "po_number": "B",
      "style_code": "C",
      "week": "D",
      "description": "E",
      "finished_product_code": "F",
      "quantity": "G"
    }
  }'::jsonb,
  'Cấu hình mapping cột Excel khi import PO items'
)
ON CONFLICT (key) DO UPDATE
SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = NOW();
