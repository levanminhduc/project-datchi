-- ============================================================================
-- Thread Management System - Thread Request Workflow (Part 1: Enum Values)
-- Migration: 20240101000015a_thread_request_workflow_enums.sql
-- Description: Add new enum values to allocation_status
-- NOTE: Run this first, then run Part 2 in a separate transaction
-- ============================================================================

-- APPROVED: Đã duyệt - Request approved by warehouse, pending preparation
ALTER TYPE allocation_status ADD VALUE IF NOT EXISTS 'APPROVED';

-- READY_FOR_PICKUP: Sẵn sàng nhận - Thread prepared, waiting for workshop pickup
ALTER TYPE allocation_status ADD VALUE IF NOT EXISTS 'READY_FOR_PICKUP';

-- RECEIVED: Đã nhận - Workshop confirmed receipt of thread
ALTER TYPE allocation_status ADD VALUE IF NOT EXISTS 'RECEIVED';

-- REJECTED: Từ chối - Request rejected by warehouse
ALTER TYPE allocation_status ADD VALUE IF NOT EXISTS 'REJECTED';

-- ============================================================================
-- END OF PART 1 - COMMIT BEFORE RUNNING PART 2
-- ============================================================================
