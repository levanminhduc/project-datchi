-- ============================================================================
-- Weekly Order Reserve Inventory - Schema Changes
-- Migration: 20260302000003_weekly_order_reserve_inventory.sql
-- Description: Add RESERVED_FOR_ORDER status, loan tracking, and reservation columns
-- ============================================================================

-- Task 1.1: Add RESERVED_FOR_ORDER to cone_status enum
ALTER TYPE cone_status ADD VALUE IF NOT EXISTS 'RESERVED_FOR_ORDER' AFTER 'AVAILABLE';

-- Task 1.2: Add reserved_week_id and original_week_id columns to thread_inventory
ALTER TABLE thread_inventory
  ADD COLUMN IF NOT EXISTS reserved_week_id INTEGER REFERENCES thread_order_weeks(id),
  ADD COLUMN IF NOT EXISTS original_week_id INTEGER REFERENCES thread_order_weeks(id);

COMMENT ON COLUMN thread_inventory.reserved_week_id IS 'WO week that currently owns this reservation';
COMMENT ON COLUMN thread_inventory.original_week_id IS 'Original WO week when cone was borrowed (for loan detection)';

-- Task 1.3: Create thread_order_loans table
CREATE TABLE IF NOT EXISTS thread_order_loans (
  id SERIAL PRIMARY KEY,
  from_week_id INTEGER NOT NULL REFERENCES thread_order_weeks(id),
  to_week_id INTEGER NOT NULL REFERENCES thread_order_weeks(id),
  thread_type_id INTEGER NOT NULL REFERENCES thread_types(id),
  quantity_cones INTEGER NOT NULL,
  quantity_meters NUMERIC(12,4),
  reason TEXT,
  created_by VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE thread_order_loans IS 'Audit trail for thread borrowing between WO weeks';

-- Task 1.4: Add trigger for updated_at
CREATE TRIGGER update_thread_order_loans_updated_at
  BEFORE UPDATE ON thread_order_loans
  FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at_column();

-- Task 1.5: Add DB constraints for loan integrity (D13)
ALTER TABLE thread_order_loans
  ADD CONSTRAINT chk_loan_self_borrow CHECK (from_week_id <> to_week_id),
  ADD CONSTRAINT chk_loan_qty_positive CHECK (quantity_cones > 0),
  ADD CONSTRAINT chk_loan_meters_nonneg CHECK (quantity_meters >= 0 OR quantity_meters IS NULL);

-- Task 1.6: Create indexes
CREATE INDEX IF NOT EXISTS idx_inventory_reserved_week ON thread_inventory(reserved_week_id)
  WHERE reserved_week_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_inventory_original_week ON thread_inventory(original_week_id)
  WHERE original_week_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_loans_from_week ON thread_order_loans(from_week_id);
CREATE INDEX IF NOT EXISTS idx_loans_to_week ON thread_order_loans(to_week_id);
CREATE INDEX IF NOT EXISTS idx_loans_thread_type ON thread_order_loans(thread_type_id);
CREATE INDEX IF NOT EXISTS idx_loans_deleted_at ON thread_order_loans(deleted_at)
  WHERE deleted_at IS NULL;

-- Task 5.1: Add week_id column to thread_allocations table (D6)
ALTER TABLE thread_allocations
  ADD COLUMN IF NOT EXISTS week_id INTEGER REFERENCES thread_order_weeks(id);

CREATE INDEX IF NOT EXISTS idx_allocations_week ON thread_allocations(week_id)
  WHERE week_id IS NOT NULL;

COMMENT ON COLUMN thread_allocations.week_id IS 'WO week_id for allocations originating from Weekly Orders';
