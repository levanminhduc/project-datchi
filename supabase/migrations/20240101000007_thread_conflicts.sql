-- ============================================================================
-- Thread Management System - Thread Conflicts Table
-- Migration: 006_thread_conflicts.sql
-- Description: Allocation conflict tracking when demand exceeds supply
-- Dependencies: 001_thread_types.sql, 003_thread_allocations.sql
-- ============================================================================

-- ============================================================================
-- TABLE: thread_conflicts
-- Tracks allocation conflicts when multiple orders compete for limited stock
-- ============================================================================

CREATE TABLE IF NOT EXISTS thread_conflicts (
    -- Primary key
    id SERIAL PRIMARY KEY,
    
    -- Foreign key to thread type with shortage
    thread_type_id INTEGER NOT NULL REFERENCES thread_types(id),
    
    -- =========================================================================
    -- Conflict Metrics
    -- =========================================================================
    
    -- Total meters requested across all conflicting allocations
    total_requested_meters DECIMAL(12,4) NOT NULL,
    
    -- Total meters currently available for this thread type
    total_available_meters DECIMAL(12,4) NOT NULL,
    
    -- Shortage = requested - available (always positive for a conflict)
    shortage_meters DECIMAL(12,4) NOT NULL,
    
    -- =========================================================================
    -- Status Tracking
    -- =========================================================================
    
    -- Conflict resolution status
    -- PENDING: Conflict detected, needs resolution
    -- RESOLVED: Conflict resolved (priorities adjusted, stock received, etc.)
    -- ESCALATED: Conflict escalated to management
    status VARCHAR(20) DEFAULT 'PENDING',
    
    -- =========================================================================
    -- Resolution Information
    -- =========================================================================
    
    -- Notes about how the conflict was resolved
    resolution_notes TEXT,
    
    -- User who resolved the conflict
    resolved_by VARCHAR(100),
    
    -- When the conflict was resolved
    resolved_at TIMESTAMPTZ,
    
    -- =========================================================================
    -- Timestamps
    -- =========================================================================
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add table comment
COMMENT ON TABLE thread_conflicts IS 'Allocation conflicts when demand exceeds supply - Xung dot phan bo khi nhu cau vuot nguon cung';

-- Add column comments
COMMENT ON COLUMN thread_conflicts.thread_type_id IS 'Thread type with insufficient stock - Loai chi thieu ton';
COMMENT ON COLUMN thread_conflicts.total_requested_meters IS 'Total meters requested - Tong so met yeu cau';
COMMENT ON COLUMN thread_conflicts.total_available_meters IS 'Total meters available - Tong so met co san';
COMMENT ON COLUMN thread_conflicts.shortage_meters IS 'Shortage amount (requested - available) - So met thieu';
COMMENT ON COLUMN thread_conflicts.status IS 'Resolution status (PENDING/RESOLVED/ESCALATED) - Trang thai xu ly';
COMMENT ON COLUMN thread_conflicts.resolution_notes IS 'Notes on how conflict was resolved - Ghi chu giai quyet';
COMMENT ON COLUMN thread_conflicts.resolved_by IS 'User who resolved the conflict - Nguoi giai quyet';
COMMENT ON COLUMN thread_conflicts.resolved_at IS 'When conflict was resolved - Thoi gian giai quyet';

-- ============================================================================
-- TABLE: thread_conflict_allocations
-- Junction table linking conflicts to the affected allocations
-- Tracks original and adjusted priority scores
-- ============================================================================

CREATE TABLE IF NOT EXISTS thread_conflict_allocations (
    -- Primary key
    id SERIAL PRIMARY KEY,
    
    -- Foreign keys
    conflict_id INTEGER NOT NULL REFERENCES thread_conflicts(id) ON DELETE CASCADE,
    allocation_id INTEGER NOT NULL REFERENCES thread_allocations(id),
    
    -- =========================================================================
    -- Priority Tracking
    -- Records priority before and after conflict resolution
    -- =========================================================================
    
    -- Priority score at time of conflict detection
    original_priority_score INTEGER,
    
    -- Priority score after adjustment during resolution
    adjusted_priority_score INTEGER,
    
    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure unique conflict-allocation pair
    UNIQUE(conflict_id, allocation_id)
);

-- Add table comment
COMMENT ON TABLE thread_conflict_allocations IS 'Junction table linking conflicts to allocations - Bang lien ket xung dot va phan bo';

-- Add column comments
COMMENT ON COLUMN thread_conflict_allocations.conflict_id IS 'Reference to the conflict - Tham chieu xung dot';
COMMENT ON COLUMN thread_conflict_allocations.allocation_id IS 'Reference to affected allocation - Tham chieu phan bo bi anh huong';
COMMENT ON COLUMN thread_conflict_allocations.original_priority_score IS 'Priority score at conflict detection - Diem uu tien ban dau';
COMMENT ON COLUMN thread_conflict_allocations.adjusted_priority_score IS 'Priority score after resolution - Diem uu tien sau dieu chinh';

-- ============================================================================
-- TRIGGER: Auto-update updated_at on row modification
-- Uses existing function from 001_thread_types.sql
-- ============================================================================

CREATE TRIGGER update_thread_conflicts_updated_at
    BEFORE UPDATE ON thread_conflicts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INDEXES: thread_conflicts - Optimize common query patterns
-- ============================================================================

-- Filter by thread type (find conflicts for a specific thread)
CREATE INDEX idx_conflicts_thread_type ON thread_conflicts(thread_type_id);

-- Filter by status (for status-based dashboards)
CREATE INDEX idx_conflicts_status ON thread_conflicts(status);

-- Partial index for pending conflicts (most common dashboard query)
CREATE INDEX idx_conflicts_pending ON thread_conflicts(status) WHERE status = 'PENDING';

-- Sort by created_at descending (most recent conflicts first)
CREATE INDEX idx_conflicts_created ON thread_conflicts(created_at DESC);

-- ============================================================================
-- INDEXES: thread_conflict_allocations - Optimize junction table queries
-- ============================================================================

-- Lookup allocations for a given conflict
CREATE INDEX idx_conflict_allocations_conflict ON thread_conflict_allocations(conflict_id);

-- Lookup conflicts for a given allocation
CREATE INDEX idx_conflict_allocations_allocation ON thread_conflict_allocations(allocation_id);

-- ============================================================================
-- CONSTRAINTS: Data validation
-- ============================================================================

-- Ensure total_requested_meters is positive
ALTER TABLE thread_conflicts
ADD CONSTRAINT chk_conflicts_requested_positive 
CHECK (total_requested_meters > 0);

-- Ensure total_available_meters is non-negative
ALTER TABLE thread_conflicts
ADD CONSTRAINT chk_conflicts_available_non_negative 
CHECK (total_available_meters >= 0);

-- Ensure shortage_meters is positive (no conflict if no shortage)
ALTER TABLE thread_conflicts
ADD CONSTRAINT chk_conflicts_shortage_positive 
CHECK (shortage_meters > 0);

-- Ensure status is one of the valid values
ALTER TABLE thread_conflicts
ADD CONSTRAINT chk_conflicts_status_valid 
CHECK (status IN ('PENDING', 'RESOLVED', 'ESCALATED'));

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
