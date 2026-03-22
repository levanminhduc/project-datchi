-- =============================================
-- MIGRATION 013: Enable Realtime for Thread Management
-- Description: Enable Supabase Realtime on key tables
-- =============================================

-- Enable realtime on thread_inventory for live stock updates
ALTER PUBLICATION supabase_realtime ADD TABLE thread_inventory;

-- Enable realtime on thread_allocations for allocation status changes
ALTER PUBLICATION supabase_realtime ADD TABLE thread_allocations;

-- Enable realtime on thread_recovery for recovery workflow updates
ALTER PUBLICATION supabase_realtime ADD TABLE thread_recovery;

-- Enable realtime on thread_conflicts for conflict notifications
ALTER PUBLICATION supabase_realtime ADD TABLE thread_conflicts;

-- Enable realtime on thread_movements for activity feed
ALTER PUBLICATION supabase_realtime ADD TABLE thread_movements;

-- =============================================
-- NOTES:
-- 1. Realtime is enabled at table level
-- 2. RLS policies still apply to realtime subscriptions
-- 3. Use broadcast for app-wide notifications if needed
-- 4. Consider channel-based subscriptions for mobile sync
-- =============================================

COMMENT ON TABLE thread_inventory IS 'Realtime enabled for live stock updates';
COMMENT ON TABLE thread_allocations IS 'Realtime enabled for allocation tracking';
COMMENT ON TABLE thread_recovery IS 'Realtime enabled for recovery workflow';
