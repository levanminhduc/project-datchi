-- ============================================================================
-- Thread Management System - Thread Inventory Table
-- Migration: 002_thread_inventory.sql
-- Description: Individual cone tracking with dual Unit of Measure (cones + meters)
-- Dependencies: 001_thread_types.sql, 008_warehouses.sql
-- ============================================================================

-- ============================================================================
-- ENUM: cone_status
-- Represents the lifecycle states of a thread cone
-- ============================================================================

CREATE TYPE cone_status AS ENUM (
    'RECEIVED',           -- Moi nhap kho - Just received into warehouse
    'INSPECTED',          -- Da kiem tra - Quality check passed
    'AVAILABLE',          -- San sang phan bo - Ready for allocation
    'SOFT_ALLOCATED',     -- Da phan bo mem - Reserved but not yet issued
    'HARD_ALLOCATED',     -- Da phan bo cung - Issued to production order
    'IN_PRODUCTION',      -- Dang su dung - Currently being used in production
    'PARTIAL_RETURN',     -- Dang tra ve - Worker initiated return
    'PENDING_WEIGH',      -- Cho can - Waiting for warehouse to weigh
    'CONSUMED',           -- Da su dung het - Fully consumed
    'WRITTEN_OFF',        -- Da xoa so - Written off (damaged, lost, or too little remaining)
    'QUARANTINE'          -- Cach ly - Quarantined for quality issues
);

-- Add enum comment
COMMENT ON TYPE cone_status IS 'Lifecycle states for thread cones - Trang thai vong doi cua cuon chi';

-- ============================================================================
-- TABLE: thread_inventory
-- Individual cone tracking with dual UoM (cones + meters)
-- Supports FEFO allocation with partial cone priority
-- ============================================================================

CREATE TABLE IF NOT EXISTS thread_inventory (
    -- Primary key
    id SERIAL PRIMARY KEY,
    
    -- Cone identification (barcode ID - auto-generated or scanned)
    cone_id VARCHAR(50) UNIQUE NOT NULL,
    
    -- Foreign keys
    thread_type_id INTEGER NOT NULL REFERENCES thread_types(id),
    warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
    
    -- =========================================================================
    -- Dual UoM Tracking
    -- Primary: meters (for allocation/consumption calculations)
    -- Secondary: cones (for physical counting)
    -- =========================================================================
    quantity_cones INTEGER NOT NULL DEFAULT 1,        -- So cuon (always 1 for individual tracking)
    quantity_meters DECIMAL(12,4) NOT NULL,           -- So met con lai - High precision for conversion calculations
    weight_grams DECIMAL(10,2),                       -- Khoi luong hien tai (g) - Actual weight (for partial cones)
    
    -- Partial cone indicator
    is_partial BOOLEAN DEFAULT FALSE,                 -- Cuon le - Indicates if cone has been partially used
    
    -- Status tracking
    status cone_status DEFAULT 'RECEIVED',
    
    -- =========================================================================
    -- Traceability Information
    -- =========================================================================
    lot_number VARCHAR(50),                           -- So lo - Supplier batch number
    expiry_date DATE,                                 -- Ngay het han - For FEFO allocation
    received_date DATE DEFAULT CURRENT_DATE,          -- Ngay nhap kho
    location VARCHAR(100),                            -- Vi tri trong kho - Physical location in warehouse (e.g., 'A-1-2')
    
    -- =========================================================================
    -- Timestamps
    -- =========================================================================
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add table comment
COMMENT ON TABLE thread_inventory IS 'Individual cone inventory tracking with dual UoM - Theo doi ton kho cuon chi voi 2 don vi do';

-- Add column comments
COMMENT ON COLUMN thread_inventory.cone_id IS 'Barcode ID for cone (auto-generated or scanned) - Ma vach cuon chi';
COMMENT ON COLUMN thread_inventory.thread_type_id IS 'Reference to thread type - Tham chieu loai chi';
COMMENT ON COLUMN thread_inventory.warehouse_id IS 'Reference to warehouse location - Tham chieu kho';
COMMENT ON COLUMN thread_inventory.quantity_cones IS 'Number of cones (always 1 for individual tracking) - So cuon';
COMMENT ON COLUMN thread_inventory.quantity_meters IS 'Remaining meters on cone (high precision) - So met con lai';
COMMENT ON COLUMN thread_inventory.weight_grams IS 'Current weight in grams (for partial cone calculations) - Khoi luong hien tai';
COMMENT ON COLUMN thread_inventory.is_partial IS 'Flag indicating partial cone (previously used) - Co danh dau cuon le';
COMMENT ON COLUMN thread_inventory.status IS 'Current lifecycle status - Trang thai hien tai';
COMMENT ON COLUMN thread_inventory.lot_number IS 'Supplier batch/lot number - So lo nha cung cap';
COMMENT ON COLUMN thread_inventory.expiry_date IS 'Expiry date for FEFO allocation - Ngay het han';
COMMENT ON COLUMN thread_inventory.received_date IS 'Date received into warehouse - Ngay nhap kho';
COMMENT ON COLUMN thread_inventory.location IS 'Physical location in warehouse (e.g., A-1-2) - Vi tri kho';

-- ============================================================================
-- TRIGGER: Auto-update updated_at on row modification
-- Uses existing function from 001_thread_types.sql
-- ============================================================================

CREATE TRIGGER update_thread_inventory_updated_at
    BEFORE UPDATE ON thread_inventory
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INDEXES: Optimize common query patterns
-- ============================================================================

-- Primary lookup by cone_id (barcode scan)
CREATE INDEX idx_thread_inventory_cone_id ON thread_inventory(cone_id);

-- Filter by thread type (for stock level calculations)
CREATE INDEX idx_thread_inventory_thread_type ON thread_inventory(thread_type_id);

-- Filter by warehouse (for warehouse-specific views)
CREATE INDEX idx_thread_inventory_warehouse ON thread_inventory(warehouse_id);

-- Filter by status (for status-based queries)
CREATE INDEX idx_thread_inventory_status ON thread_inventory(status);

-- Partial index for quick partial cone lookups (partial cones get allocation priority)
CREATE INDEX idx_thread_inventory_is_partial ON thread_inventory(is_partial) WHERE is_partial = TRUE;

-- Partial index for cones with expiry dates (for FEFO and expiry alerts)
CREATE INDEX idx_thread_inventory_expiry ON thread_inventory(expiry_date) WHERE expiry_date IS NOT NULL;

-- Partial index for available cones only (most common allocation query)
CREATE INDEX idx_thread_inventory_available ON thread_inventory(status) WHERE status = 'AVAILABLE';

-- ============================================================================
-- COMPOSITE INDEX: FEFO (First Expiry First Out) Allocation
-- Critical for allocation performance
-- Order: Partial cones first, then earliest expiry, then earliest received
-- ============================================================================

CREATE INDEX idx_thread_inventory_fefo ON thread_inventory(
    is_partial DESC,              -- Partial cones first (use up remnants before full cones)
    expiry_date ASC NULLS LAST,   -- Earliest expiry first (NULLS = no expiry, lowest priority)
    received_date ASC             -- Earliest received first (FIFO as tiebreaker)
) WHERE status = 'AVAILABLE';

-- Add index comment
COMMENT ON INDEX idx_thread_inventory_fefo IS 'FEFO composite index for allocation - partial cones first, then by expiry, then by received date';

-- ============================================================================
-- CONSTRAINT: Ensure quantity_meters is positive
-- ============================================================================

ALTER TABLE thread_inventory
ADD CONSTRAINT chk_thread_inventory_quantity_positive 
CHECK (quantity_meters >= 0);

-- ============================================================================
-- CONSTRAINT: Ensure weight_grams is positive when set
-- ============================================================================

ALTER TABLE thread_inventory
ADD CONSTRAINT chk_thread_inventory_weight_positive 
CHECK (weight_grams IS NULL OR weight_grams >= 0);

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
