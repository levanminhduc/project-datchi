-- ============================================================================
-- Thread Management System - Thread Request Workflow (Part 2: Columns & Indexes)
-- Migration: 20240101000015b_thread_request_workflow_columns.sql
-- Description: Add workflow columns and indexes to thread_allocations
-- NOTE: Run this AFTER Part 1 has been committed
-- ============================================================================

-- ============================================================================
-- ADD WORKFLOW COLUMNS TO thread_allocations
-- ============================================================================

-- Requesting warehouse: The workshop requesting thread
ALTER TABLE thread_allocations
ADD COLUMN IF NOT EXISTS requesting_warehouse_id INTEGER REFERENCES warehouses(id);

COMMENT ON COLUMN thread_allocations.requesting_warehouse_id IS 
'Workshop requesting thread (STORAGE type warehouse) - Xưởng yêu cầu chỉ';

-- Source warehouse: The warehouse that will issue thread
ALTER TABLE thread_allocations
ADD COLUMN IF NOT EXISTS source_warehouse_id INTEGER REFERENCES warehouses(id);

COMMENT ON COLUMN thread_allocations.source_warehouse_id IS 
'Source warehouse for thread issue (STORAGE type) - Kho xuất chỉ';

-- Requested by: Person who created the request
ALTER TABLE thread_allocations
ADD COLUMN IF NOT EXISTS requested_by VARCHAR(100);

COMMENT ON COLUMN thread_allocations.requested_by IS 
'Person who created the request - Người tạo yêu cầu';

-- Approved by: Person who approved/rejected the request
ALTER TABLE thread_allocations
ADD COLUMN IF NOT EXISTS approved_by VARCHAR(100);

COMMENT ON COLUMN thread_allocations.approved_by IS 
'Person who approved/rejected the request - Người duyệt/từ chối yêu cầu';

-- Approved at: Timestamp when request was approved/rejected
ALTER TABLE thread_allocations
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

COMMENT ON COLUMN thread_allocations.approved_at IS 
'Timestamp of approval/rejection - Thời điểm duyệt/từ chối';

-- Rejection reason: Reason for rejecting the request
ALTER TABLE thread_allocations
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

COMMENT ON COLUMN thread_allocations.rejection_reason IS 
'Reason for request rejection - Lý do từ chối yêu cầu';

-- Received by: Person who confirmed receipt at workshop
ALTER TABLE thread_allocations
ADD COLUMN IF NOT EXISTS received_by VARCHAR(100);

COMMENT ON COLUMN thread_allocations.received_by IS 
'Person who confirmed receipt at workshop - Người xác nhận nhận hàng';

-- Received at: Timestamp when receipt was confirmed
ALTER TABLE thread_allocations
ADD COLUMN IF NOT EXISTS received_at TIMESTAMPTZ;

COMMENT ON COLUMN thread_allocations.received_at IS 
'Timestamp when receipt was confirmed - Thời điểm xác nhận nhận hàng';

-- ============================================================================
-- INDEXES FOR WORKFLOW QUERIES
-- ============================================================================

-- Filter by requesting warehouse (workshop views)
CREATE INDEX IF NOT EXISTS idx_allocations_requesting_warehouse 
ON thread_allocations(requesting_warehouse_id) 
WHERE requesting_warehouse_id IS NOT NULL;

-- Filter by source warehouse (warehouse staff views)
CREATE INDEX IF NOT EXISTS idx_allocations_source_warehouse 
ON thread_allocations(source_warehouse_id) 
WHERE source_warehouse_id IS NOT NULL;

-- Filter pending approvals (warehouse approval queue)
CREATE INDEX IF NOT EXISTS idx_allocations_pending_approval
ON thread_allocations(status, requesting_warehouse_id) 
WHERE status = 'PENDING' AND requesting_warehouse_id IS NOT NULL;

-- Filter ready for pickup (workshop pickup queue)
CREATE INDEX IF NOT EXISTS idx_allocations_ready_pickup
ON thread_allocations(status, requesting_warehouse_id) 
WHERE status = 'READY_FOR_PICKUP';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
