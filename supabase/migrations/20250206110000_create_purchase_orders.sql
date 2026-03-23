-- ============================================================================
-- Migration: 20250206110000_create_purchase_orders.sql
-- Description: Bang don hang (Purchase Orders)
-- Dependencies: None
-- ============================================================================

-- ============================================================================
-- TABLE: purchase_orders
-- ============================================================================

CREATE TABLE purchase_orders (
    id SERIAL PRIMARY KEY,
    
    -- Order information
    po_number VARCHAR(50) NOT NULL UNIQUE,
    customer_name VARCHAR(255),
    
    -- Dates
    order_date TIMESTAMPTZ,
    delivery_date TIMESTAMPTZ,
    
    -- Status and priority
    status VARCHAR(20) DEFAULT 'pending',
    priority VARCHAR(10) DEFAULT 'normal',
    
    -- Additional info
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- COMMENTS (Vietnamese + English)
-- ============================================================================

COMMENT ON TABLE purchase_orders IS 'Bang don hang tu khach hang - Purchase Orders from customers';

COMMENT ON COLUMN purchase_orders.id IS 'Khoa chinh tu tang';
COMMENT ON COLUMN purchase_orders.po_number IS 'So hieu don hang - PO Number';
COMMENT ON COLUMN purchase_orders.customer_name IS 'Ten khach hang - Customer Name';
COMMENT ON COLUMN purchase_orders.order_date IS 'Ngay dat hang - Order Date';
COMMENT ON COLUMN purchase_orders.delivery_date IS 'Ngay giao hang du kien - Expected Delivery Date';
COMMENT ON COLUMN purchase_orders.status IS 'Trang thai don hang - Order Status';
COMMENT ON COLUMN purchase_orders.priority IS 'Muc do uu tien - Priority Level';
COMMENT ON COLUMN purchase_orders.notes IS 'Ghi chu - Notes';
COMMENT ON COLUMN purchase_orders.created_at IS 'Thoi diem tao ban ghi';
COMMENT ON COLUMN purchase_orders.updated_at IS 'Thoi diem cap nhat gan nhat';

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_purchase_orders_po_number ON purchase_orders(po_number);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX idx_purchase_orders_customer_name ON purchase_orders(customer_name);
CREATE INDEX idx_purchase_orders_order_date ON purchase_orders(order_date);

-- ============================================================================
-- TRIGGER: Update updated_at on modification
-- ============================================================================

CREATE TRIGGER trigger_purchase_orders_updated_at
    BEFORE UPDATE ON purchase_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
