-- ============================================================================
-- Thread Management System - Thread Allocations Table
-- Migration: 003_thread_allocations.sql
-- Description: Reservation requests and junction table for cone-to-allocation mapping
-- Dependencies: 001_thread_types.sql, 002_thread_inventory.sql
-- ============================================================================

-- ============================================================================
-- ENUM: allocation_status
-- Represents the lifecycle states of an allocation request
-- ============================================================================

CREATE TYPE allocation_status AS ENUM (
    'PENDING',      -- Cho xu ly - Request submitted, not yet processed
    'SOFT',         -- Phan bo mem - Cones reserved but not yet issued
    'HARD',         -- Phan bo cung - Cones confirmed for production
    'ISSUED',       -- Da xuat - Cones issued to production
    'CANCELLED',    -- Da huy - Allocation cancelled
    'WAITLISTED'    -- Cho danh sach - Insufficient stock, waiting for availability
);

-- Add enum comment
COMMENT ON TYPE allocation_status IS 'Lifecycle states for allocation requests - Trang thai vong doi yeu cau phan bo';

-- ============================================================================
-- ENUM: allocation_priority
-- Priority levels for allocation queue ordering
-- ============================================================================

CREATE TYPE allocation_priority AS ENUM (
    'LOW',      -- Thap - Low priority
    'NORMAL',   -- Binh thuong - Normal priority (default)
    'HIGH',     -- Cao - High priority
    'URGENT'    -- Khan cap - Urgent priority
);

-- Add enum comment
COMMENT ON TYPE allocation_priority IS 'Priority levels for allocation ordering - Muc do uu tien phan bo';

-- ============================================================================
-- TABLE: thread_allocations
-- Reservation requests linking production orders to thread requirements
-- ============================================================================

CREATE TABLE IF NOT EXISTS thread_allocations (
    -- Primary key
    id SERIAL PRIMARY KEY,
    
    -- Production order identification
    order_id VARCHAR(50) NOT NULL,             -- Ma lenh san xuat - Production order ID
    order_reference VARCHAR(200),              -- Mo ta don hang - Order description/reference
    
    -- Thread type requirement
    thread_type_id INTEGER NOT NULL REFERENCES thread_types(id),
    
    -- =========================================================================
    -- Quantity Tracking
    -- requested_meters: Total requirement from production order
    -- allocated_meters: Amount successfully allocated (may be less if insufficient stock)
    -- =========================================================================
    requested_meters DECIMAL(12,4) NOT NULL,   -- So met yeu cau
    allocated_meters DECIMAL(12,4) DEFAULT 0,  -- So met da phan bo
    
    -- =========================================================================
    -- Status and Priority
    -- =========================================================================
    status allocation_status DEFAULT 'PENDING',
    priority allocation_priority DEFAULT 'NORMAL',
    
    -- Calculated priority score: (priority_level * 10) + age_days
    -- Used for queue ordering when resolving conflicts
    -- Priority levels: LOW=1, NORMAL=2, HIGH=3, URGENT=4
    priority_score INTEGER DEFAULT 0,
    
    -- =========================================================================
    -- Dates and Tracking
    -- =========================================================================
    requested_date TIMESTAMPTZ DEFAULT NOW(),  -- Ngay yeu cau
    due_date DATE,                             -- Ngay can - Due date for production
    notes TEXT,                                -- Ghi chu
    created_by VARCHAR(100),                   -- Nguoi tao
    
    -- =========================================================================
    -- Timestamps
    -- =========================================================================
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add table comment
COMMENT ON TABLE thread_allocations IS 'Thread allocation requests for production orders - Yeu cau phan bo chi cho lenh san xuat';

-- Add column comments
COMMENT ON COLUMN thread_allocations.order_id IS 'Production order ID - Ma lenh san xuat';
COMMENT ON COLUMN thread_allocations.order_reference IS 'Order description or reference - Mo ta don hang';
COMMENT ON COLUMN thread_allocations.thread_type_id IS 'Reference to thread type - Tham chieu loai chi';
COMMENT ON COLUMN thread_allocations.requested_meters IS 'Total meters requested - Tong so met yeu cau';
COMMENT ON COLUMN thread_allocations.allocated_meters IS 'Meters successfully allocated - So met da phan bo';
COMMENT ON COLUMN thread_allocations.status IS 'Current allocation status - Trang thai phan bo hien tai';
COMMENT ON COLUMN thread_allocations.priority IS 'Allocation priority level - Muc do uu tien';
COMMENT ON COLUMN thread_allocations.priority_score IS 'Calculated priority score (priority_level * 10 + age_days) - Diem uu tien tinh toan';
COMMENT ON COLUMN thread_allocations.requested_date IS 'Date allocation was requested - Ngay yeu cau phan bo';
COMMENT ON COLUMN thread_allocations.due_date IS 'Due date for production - Ngay can cho san xuat';
COMMENT ON COLUMN thread_allocations.notes IS 'Additional notes - Ghi chu them';
COMMENT ON COLUMN thread_allocations.created_by IS 'User who created the allocation - Nguoi tao phan bo';

-- ============================================================================
-- TABLE: thread_allocation_cones
-- Junction table linking allocations to specific inventory cones
-- Supports partial allocation from a single cone to multiple orders
-- ============================================================================

CREATE TABLE IF NOT EXISTS thread_allocation_cones (
    -- Primary key
    id SERIAL PRIMARY KEY,
    
    -- Foreign keys
    allocation_id INTEGER NOT NULL REFERENCES thread_allocations(id) ON DELETE CASCADE,
    cone_id INTEGER NOT NULL REFERENCES thread_inventory(id),
    
    -- Allocation amount
    allocated_meters DECIMAL(12,4) NOT NULL,   -- So met phan bo tu cuon nay
    
    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure unique allocation-cone pair
    UNIQUE(allocation_id, cone_id)
);

-- Add table comment
COMMENT ON TABLE thread_allocation_cones IS 'Junction table linking allocations to inventory cones - Bang lien ket phan bo va cuon chi';

-- Add column comments
COMMENT ON COLUMN thread_allocation_cones.allocation_id IS 'Reference to allocation request - Tham chieu yeu cau phan bo';
COMMENT ON COLUMN thread_allocation_cones.cone_id IS 'Reference to inventory cone - Tham chieu cuon chi trong kho';
COMMENT ON COLUMN thread_allocation_cones.allocated_meters IS 'Meters allocated from this cone - So met phan bo tu cuon nay';

-- ============================================================================
-- TRIGGER: Auto-update updated_at on row modification
-- Uses existing function from 001_thread_types.sql
-- ============================================================================

CREATE TRIGGER update_thread_allocations_updated_at
    BEFORE UPDATE ON thread_allocations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INDEXES: thread_allocations - Optimize common query patterns
-- ============================================================================

-- Lookup by production order ID (find all allocations for an order)
CREATE INDEX idx_allocations_order_id ON thread_allocations(order_id);

-- Filter by thread type (for type-specific allocation views)
CREATE INDEX idx_allocations_thread_type ON thread_allocations(thread_type_id);

-- Filter by status (for status-based queries)
CREATE INDEX idx_allocations_status ON thread_allocations(status);

-- Filter by priority level
CREATE INDEX idx_allocations_priority ON thread_allocations(priority);

-- Order by priority score descending (highest priority first)
CREATE INDEX idx_allocations_priority_score ON thread_allocations(priority_score DESC);

-- Filter by due date (for deadline-based queries)
CREATE INDEX idx_allocations_due_date ON thread_allocations(due_date);

-- Partial index for pending allocations only (most common processing query)
-- Includes PENDING and SOFT statuses that need processing
CREATE INDEX idx_allocations_pending ON thread_allocations(status) 
    WHERE status IN ('PENDING', 'SOFT');

-- ============================================================================
-- INDEXES: thread_allocation_cones - Optimize junction table queries
-- ============================================================================

-- Lookup cones for a given allocation
CREATE INDEX idx_allocation_cones_allocation ON thread_allocation_cones(allocation_id);

-- Lookup allocations for a given cone (check if cone is allocated)
CREATE INDEX idx_allocation_cones_cone ON thread_allocation_cones(cone_id);

-- ============================================================================
-- CONSTRAINTS: Data validation
-- ============================================================================

-- Ensure requested_meters is positive
ALTER TABLE thread_allocations
ADD CONSTRAINT chk_allocations_requested_positive 
CHECK (requested_meters > 0);

-- Ensure allocated_meters is non-negative and doesn't exceed requested
ALTER TABLE thread_allocations
ADD CONSTRAINT chk_allocations_allocated_valid 
CHECK (allocated_meters >= 0 AND allocated_meters <= requested_meters);

-- Ensure allocation_cones allocated_meters is positive
ALTER TABLE thread_allocation_cones
ADD CONSTRAINT chk_allocation_cones_meters_positive 
CHECK (allocated_meters > 0);

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
