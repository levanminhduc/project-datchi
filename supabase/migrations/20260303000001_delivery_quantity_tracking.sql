-- ============================================================================
-- Delivery Quantity Tracking
-- Migration: 20260303000001_delivery_quantity_tracking.sql
-- Description: Add quantity_cones to deliveries, allow nullable from_week_id in loans
-- ============================================================================

BEGIN;

-- Task 1.2: Add quantity_cones column to thread_order_deliveries
ALTER TABLE thread_order_deliveries
ADD COLUMN IF NOT EXISTS quantity_cones INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN thread_order_deliveries.quantity_cones IS 'Số cuộn đặt hàng cần giao (từ total_final của summary_data)';

-- Task 1.3: received_quantity already exists from migration 20260210_add_delivery_receiving_columns.sql

-- Task 1.4: Make thread_order_loans.from_week_id nullable
ALTER TABLE thread_order_loans
ALTER COLUMN from_week_id DROP NOT NULL;

-- Task 1.5: Update constraint chk_loan_self_borrow to allow from_week_id = NULL
ALTER TABLE thread_order_loans
DROP CONSTRAINT IF EXISTS chk_loan_self_borrow;

ALTER TABLE thread_order_loans
ADD CONSTRAINT chk_loan_self_borrow CHECK (
  from_week_id IS NULL OR from_week_id <> to_week_id
);

COMMENT ON COLUMN thread_order_loans.from_week_id IS 'Tuần nguồn (NULL = lấy từ tồn kho chung)';

NOTIFY pgrst, 'reload schema';

COMMIT;
