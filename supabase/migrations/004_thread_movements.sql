-- ============================================================================
-- Thread Management System - Thread Movements Table
-- Migration: 004_thread_movements.sql
-- Description: Transaction log for all thread movement events (receive, issue, return, etc.)
-- Dependencies: 002_thread_inventory.sql, 003_thread_allocations.sql
-- ============================================================================

-- ============================================================================
-- ENUM: movement_type
-- Represents the types of inventory movements
-- ============================================================================

CREATE TYPE movement_type AS ENUM (
    'RECEIVE',       -- Nhap kho - Stock receipt into warehouse
    'ISSUE',         -- Xuat kho - Issue to production
    'RETURN',        -- Tra ve - Return from production
    'TRANSFER',      -- Chuyen kho - Transfer between warehouses
    'ADJUSTMENT',    -- Dieu chinh - Manual adjustment (correction)
    'WRITE_OFF'      -- Xoa so - Write-off (damaged, lost, expired)
);

-- Add enum comment
COMMENT ON TYPE movement_type IS 'Types of inventory movements - Cac loai di chuyen ton kho';

-- ============================================================================
-- TABLE: thread_movements
-- Transaction log for all thread movement events
-- Provides full audit trail of inventory changes
-- ============================================================================

CREATE TABLE IF NOT EXISTS thread_movements (
    -- Primary key
    id SERIAL PRIMARY KEY,
    
    -- Foreign keys
    cone_id INTEGER NOT NULL REFERENCES thread_inventory(id),
    allocation_id INTEGER REFERENCES thread_allocations(id),
    
    -- =========================================================================
    -- Movement Information
    -- =========================================================================
    
    -- Type of movement
    movement_type movement_type NOT NULL,
    
    -- Quantity moved (positive = add, negative = remove depending on type)
    quantity_meters DECIMAL(12,4) NOT NULL,
    
    -- =========================================================================
    -- Status Transition
    -- Records the before/after status of the cone
    -- =========================================================================
    
    -- Previous status of the cone before this movement
    from_status VARCHAR(50),
    
    -- New status of the cone after this movement
    to_status VARCHAR(50),
    
    -- =========================================================================
    -- Reference Information
    -- Links to external documents (PO, production order, etc.)
    -- =========================================================================
    
    -- External reference ID (e.g., PO number, order ID)
    reference_id VARCHAR(50),
    
    -- Type of external reference (e.g., 'PURCHASE_ORDER', 'PRODUCTION_ORDER')
    reference_type VARCHAR(50),
    
    -- =========================================================================
    -- Tracking
    -- =========================================================================
    
    -- User who performed the movement
    performed_by VARCHAR(100),
    
    -- Additional notes
    notes TEXT,
    
    -- =========================================================================
    -- Timestamp (no updated_at - movements are immutable)
    -- =========================================================================
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add table comment
COMMENT ON TABLE thread_movements IS 'Transaction log for inventory movements - Nhat ky giao dich di chuyen ton kho';

-- Add column comments
COMMENT ON COLUMN thread_movements.cone_id IS 'Reference to the affected cone - Cuon chi bi anh huong';
COMMENT ON COLUMN thread_movements.allocation_id IS 'Reference to allocation (for ISSUE/RETURN) - Lien ket phan bo';
COMMENT ON COLUMN thread_movements.movement_type IS 'Type of movement - Loai di chuyen';
COMMENT ON COLUMN thread_movements.quantity_meters IS 'Meters involved in movement - So met di chuyen';
COMMENT ON COLUMN thread_movements.from_status IS 'Cone status before movement - Trang thai truoc';
COMMENT ON COLUMN thread_movements.to_status IS 'Cone status after movement - Trang thai sau';
COMMENT ON COLUMN thread_movements.reference_id IS 'External document reference ID - Ma tham chieu ben ngoai';
COMMENT ON COLUMN thread_movements.reference_type IS 'Type of external reference - Loai tham chieu';
COMMENT ON COLUMN thread_movements.performed_by IS 'User who performed the movement - Nguoi thuc hien';
COMMENT ON COLUMN thread_movements.notes IS 'Additional notes - Ghi chu';

-- ============================================================================
-- INDEXES: Optimize common query patterns
-- ============================================================================

-- Lookup by cone (find all movements for a specific cone)
CREATE INDEX idx_movements_cone ON thread_movements(cone_id);

-- Lookup by allocation (find all movements related to an allocation)
CREATE INDEX idx_movements_allocation ON thread_movements(allocation_id);

-- Filter by movement type (for type-specific reports)
CREATE INDEX idx_movements_type ON thread_movements(movement_type);

-- Sort by created_at descending (most recent first for audit trail)
CREATE INDEX idx_movements_created ON thread_movements(created_at DESC);

-- Lookup by reference (find movements for a specific external document)
CREATE INDEX idx_movements_reference ON thread_movements(reference_type, reference_id);

-- ============================================================================
-- CONSTRAINT: Ensure quantity_meters is valid
-- Can be positive or negative depending on movement type context
-- ============================================================================

ALTER TABLE thread_movements
ADD CONSTRAINT chk_thread_movements_quantity_not_zero 
CHECK (quantity_meters <> 0);

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
