-- Add inventory receiving columns to thread_order_deliveries
-- Tracks the process of receiving delivered items into inventory

-- Add new columns for tracking inventory receiving
ALTER TABLE thread_order_deliveries
ADD COLUMN received_quantity INTEGER NOT NULL DEFAULT 0,
ADD COLUMN inventory_status VARCHAR(20) NOT NULL DEFAULT 'pending',
ADD COLUMN warehouse_id INTEGER REFERENCES warehouses(id),
ADD COLUMN received_by VARCHAR(100),
ADD COLUMN received_at TIMESTAMPTZ;

-- Add check constraint for inventory_status values
ALTER TABLE thread_order_deliveries
ADD CONSTRAINT chk_inventory_status
CHECK (inventory_status IN ('pending', 'partial', 'received'));

-- Add index for filtering by inventory_status
CREATE INDEX idx_thread_order_deliveries_inventory_status
ON thread_order_deliveries(inventory_status);

COMMENT ON COLUMN thread_order_deliveries.received_quantity IS 'Số cuộn đã nhập kho';
COMMENT ON COLUMN thread_order_deliveries.inventory_status IS 'Trạng thái nhập kho: pending (chưa nhập), partial (nhập một phần), received (đã nhập đủ)';
COMMENT ON COLUMN thread_order_deliveries.warehouse_id IS 'Kho nhập cuối cùng';
COMMENT ON COLUMN thread_order_deliveries.received_by IS 'Người nhập kho cuối cùng';
COMMENT ON COLUMN thread_order_deliveries.received_at IS 'Thời điểm nhập kho cuối cùng';
