-- ============================================================================
-- Migration: 20260210120000_create_thread_issue_tables.sql
-- Description: Tao cac bang quan ly xuat kho san xuat (Issue Management)
-- Dependencies: purchase_orders, styles, colors, thread_types, thread_inventory, thread_allocations
-- ============================================================================

-- ============================================================================
-- ENUM: issue_request_status
-- Trang thai yeu cau xuat kho
-- ============================================================================

CREATE TYPE issue_request_status AS ENUM (
    'PENDING',      -- Cho xu ly - Waiting for processing
    'PARTIAL',      -- Xuat mot phan - Partially issued
    'COMPLETED',    -- Hoan tat - Fully issued
    'CANCELLED'     -- Da huy - Cancelled
);

COMMENT ON TYPE issue_request_status IS 'Trang thai yeu cau xuat kho - Issue request lifecycle states';

-- ============================================================================
-- TABLE: thread_issue_requests
-- Bang yeu cau xuat kho chi cho san xuat
-- ============================================================================

CREATE TABLE thread_issue_requests (
    -- Khoa chinh
    id SERIAL PRIMARY KEY,

    -- Ma phieu xuat (auto-format: XK-YYYYMMDD-NNN)
    issue_code VARCHAR(50) UNIQUE NOT NULL,

    -- Lien ket don hang va san pham
    po_id INTEGER REFERENCES purchase_orders(id),           -- Ma don hang
    style_id INTEGER REFERENCES styles(id),                 -- Ma hang
    color_id INTEGER REFERENCES colors(id),                 -- Ma mau
    thread_type_id INTEGER REFERENCES thread_types(id),     -- Ma loai chi

    -- Thong tin bo phan nhan chi
    department VARCHAR(100) NOT NULL,                       -- Bo phan nhan chi (tu employees.department)

    -- So luong (don vi: met)
    quota_meters DECIMAL(12,4) DEFAULT 0,                   -- Dinh muc tu BOM
    requested_meters DECIMAL(12,4) NOT NULL,                -- So met yeu cau xuat
    issued_meters DECIMAL(12,4) DEFAULT 0,                  -- So met da xuat (denormalized sum)

    -- Trang thai
    status issue_request_status DEFAULT 'PENDING',          -- Trang thai phieu xuat

    -- Ghi chu va thong tin them
    notes TEXT,                                             -- Ghi chu
    created_by VARCHAR(100),                                -- Nguoi tao phieu

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- COMMENTS: thread_issue_requests
-- ============================================================================

COMMENT ON TABLE thread_issue_requests IS 'Bang yeu cau xuat kho chi - Thread issue requests for production';

COMMENT ON COLUMN thread_issue_requests.id IS 'Khoa chinh tu tang';
COMMENT ON COLUMN thread_issue_requests.issue_code IS 'Ma phieu xuat (format: XK-YYYYMMDD-NNN)';
COMMENT ON COLUMN thread_issue_requests.po_id IS 'Ma don hang (FK -> purchase_orders)';
COMMENT ON COLUMN thread_issue_requests.style_id IS 'Ma hang san pham (FK -> styles)';
COMMENT ON COLUMN thread_issue_requests.color_id IS 'Ma mau san pham (FK -> colors)';
COMMENT ON COLUMN thread_issue_requests.thread_type_id IS 'Ma loai chi (FK -> thread_types)';
COMMENT ON COLUMN thread_issue_requests.department IS 'Bo phan nhan chi - tu employees.department';
COMMENT ON COLUMN thread_issue_requests.quota_meters IS 'Dinh muc met tu BOM - quota from Bill of Materials';
COMMENT ON COLUMN thread_issue_requests.requested_meters IS 'So met yeu cau xuat';
COMMENT ON COLUMN thread_issue_requests.issued_meters IS 'So met da xuat thuc te (denormalized)';
COMMENT ON COLUMN thread_issue_requests.status IS 'Trang thai phieu xuat: PENDING, PARTIAL, COMPLETED, CANCELLED';
COMMENT ON COLUMN thread_issue_requests.notes IS 'Ghi chu phieu xuat';
COMMENT ON COLUMN thread_issue_requests.created_by IS 'Nguoi tao phieu xuat';
COMMENT ON COLUMN thread_issue_requests.created_at IS 'Thoi diem tao phieu';
COMMENT ON COLUMN thread_issue_requests.updated_at IS 'Thoi diem cap nhat gan nhat';

-- ============================================================================
-- TRIGGER: thread_issue_requests - Auto update updated_at
-- ============================================================================

CREATE TRIGGER trigger_thread_issue_requests_updated_at
    BEFORE UPDATE ON thread_issue_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE: thread_issue_items
-- Bang chi tiet cac cuon chi da xuat
-- ============================================================================

CREATE TABLE thread_issue_items (
    -- Khoa chinh
    id SERIAL PRIMARY KEY,

    -- Lien ket yeu cau xuat
    issue_request_id INTEGER NOT NULL REFERENCES thread_issue_requests(id) ON DELETE CASCADE,

    -- Cuon chi duoc xuat
    cone_id INTEGER NOT NULL REFERENCES thread_inventory(id),

    -- Lien ket phan bo (tuy chon - neu xuat tu allocation)
    allocation_id INTEGER REFERENCES thread_allocations(id),

    -- So luong xuat
    quantity_meters DECIMAL(12,4) NOT NULL,                 -- So met xuat tu cuon nay

    -- Tracking xuat nhieu dot
    batch_number INTEGER DEFAULT 1,                         -- So dot xuat (cho multi-batch)

    -- Ghi chu vuot dinh muc
    over_limit_notes TEXT,                                  -- Ghi chu neu xuat vuot quota

    -- Thong tin nguoi xuat
    issued_by VARCHAR(100),                                 -- Nguoi thuc hien xuat
    issued_at TIMESTAMPTZ DEFAULT NOW()                     -- Thoi diem xuat
);

-- ============================================================================
-- COMMENTS: thread_issue_items
-- ============================================================================

COMMENT ON TABLE thread_issue_items IS 'Bang chi tiet cuon chi da xuat - Thread issue item details';

COMMENT ON COLUMN thread_issue_items.id IS 'Khoa chinh tu tang';
COMMENT ON COLUMN thread_issue_items.issue_request_id IS 'Ma yeu cau xuat (FK -> thread_issue_requests)';
COMMENT ON COLUMN thread_issue_items.cone_id IS 'Ma cuon chi (FK -> thread_inventory)';
COMMENT ON COLUMN thread_issue_items.allocation_id IS 'Ma phan bo (FK -> thread_allocations) - tuy chon';
COMMENT ON COLUMN thread_issue_items.quantity_meters IS 'So met xuat tu cuon chi nay';
COMMENT ON COLUMN thread_issue_items.batch_number IS 'So dot xuat - cho tracking xuat nhieu lan';
COMMENT ON COLUMN thread_issue_items.over_limit_notes IS 'Ghi chu bat buoc khi xuat vuot dinh muc quota';
COMMENT ON COLUMN thread_issue_items.issued_by IS 'Nguoi thuc hien viec xuat kho';
COMMENT ON COLUMN thread_issue_items.issued_at IS 'Thoi diem xuat kho';

-- ============================================================================
-- TABLE: thread_issue_returns
-- Bang tra lai chi chua su dung het
-- ============================================================================

CREATE TABLE thread_issue_returns (
    -- Khoa chinh
    id SERIAL PRIMARY KEY,

    -- Lien ket item da xuat
    issue_item_id INTEGER NOT NULL REFERENCES thread_issue_items(id) ON DELETE CASCADE,

    -- Cuon chi tra lai
    cone_id INTEGER NOT NULL REFERENCES thread_inventory(id),

    -- So met ban dau khi xuat
    original_meters DECIMAL(12,4) NOT NULL,                 -- So met ban dau khi xuat

    -- Phan tram con lai (10% - 100%)
    remaining_percentage INTEGER NOT NULL CHECK (remaining_percentage BETWEEN 10 AND 100),

    -- So met con lai tinh toan
    calculated_remaining_meters DECIMAL(12,4) NOT NULL,     -- = original_meters * remaining_percentage / 100

    -- Ghi chu
    notes TEXT,                                             -- Ghi chu khi tra

    -- Thong tin nguoi tra
    returned_by VARCHAR(100),                               -- Nguoi tra chi
    returned_at TIMESTAMPTZ DEFAULT NOW()                   -- Thoi diem tra
);

-- ============================================================================
-- COMMENTS: thread_issue_returns
-- ============================================================================

COMMENT ON TABLE thread_issue_returns IS 'Bang tra lai chi chua dung het - Thread return records';

COMMENT ON COLUMN thread_issue_returns.id IS 'Khoa chinh tu tang';
COMMENT ON COLUMN thread_issue_returns.issue_item_id IS 'Ma item da xuat (FK -> thread_issue_items)';
COMMENT ON COLUMN thread_issue_returns.cone_id IS 'Ma cuon chi tra lai (FK -> thread_inventory)';
COMMENT ON COLUMN thread_issue_returns.original_meters IS 'So met ban dau khi xuat cho cong nhan';
COMMENT ON COLUMN thread_issue_returns.remaining_percentage IS 'Phan tram con lai (10-100%)';
COMMENT ON COLUMN thread_issue_returns.calculated_remaining_meters IS 'So met con lai = original * percentage / 100';
COMMENT ON COLUMN thread_issue_returns.notes IS 'Ghi chu khi tra chi';
COMMENT ON COLUMN thread_issue_returns.returned_by IS 'Nguoi thuc hien tra chi';
COMMENT ON COLUMN thread_issue_returns.returned_at IS 'Thoi diem tra chi';

-- ============================================================================
-- INDEXES: Toi uu hoa truy van
-- ============================================================================

-- Index chinh cho thread_issue_requests: tim kiem theo PO, style, color, thread_type
CREATE INDEX idx_issue_requests_po_style_color_thread
    ON thread_issue_requests(po_id, style_id, color_id, thread_type_id);

-- Index cho thread_issue_items: tim theo request
CREATE INDEX idx_issue_items_request
    ON thread_issue_items(issue_request_id);

-- Index cho thread_issue_items: tim theo cuon chi
CREATE INDEX idx_issue_items_cone
    ON thread_issue_items(cone_id);

-- Index cho thread_issue_returns: tim theo item da xuat
CREATE INDEX idx_issue_returns_item
    ON thread_issue_returns(issue_item_id);

-- Additional indexes for common queries
CREATE INDEX idx_issue_requests_status ON thread_issue_requests(status);
CREATE INDEX idx_issue_requests_issue_code ON thread_issue_requests(issue_code);
CREATE INDEX idx_issue_requests_created_at ON thread_issue_requests(created_at);

-- ============================================================================
-- VIEW: v_issue_reconciliation
-- View doi soat xuat kho - so sanh dinh muc vs thuc xuat vs tra lai
-- ============================================================================

CREATE OR REPLACE VIEW v_issue_reconciliation AS
SELECT
    -- Thong tin don hang
    ir.po_id,
    po.po_number,

    -- Thong tin ma hang
    ir.style_id,
    s.style_code,

    -- Thong tin mau
    ir.color_id,
    c.name AS color_name,

    -- Thong tin loai chi
    ir.thread_type_id,
    tt.name AS thread_name,

    -- Dinh muc
    ir.quota_meters,

    -- Tong so met da xuat
    COALESCE(SUM(ii.quantity_meters), 0) AS total_issued_meters,

    -- Tong so met da tra lai
    COALESCE(SUM(ret.calculated_remaining_meters), 0) AS total_returned_meters,

    -- So met tieu thu thuc te = xuat - tra
    COALESCE(SUM(ii.quantity_meters), 0) - COALESCE(SUM(ret.calculated_remaining_meters), 0) AS consumed_meters,

    -- Ty le tieu thu so voi dinh muc (%)
    CASE
        WHEN ir.quota_meters > 0 THEN
            ROUND(
                ((COALESCE(SUM(ii.quantity_meters), 0) - COALESCE(SUM(ret.calculated_remaining_meters), 0)) / ir.quota_meters * 100)::numeric,
                2
            )
        ELSE 0
    END AS consumption_percentage,

    -- So lan xuat vuot dinh muc
    COUNT(CASE WHEN ii.over_limit_notes IS NOT NULL AND ii.over_limit_notes != '' THEN 1 END) AS over_limit_count

FROM thread_issue_requests ir

-- Join don hang
LEFT JOIN purchase_orders po ON ir.po_id = po.id

-- Join ma hang
LEFT JOIN styles s ON ir.style_id = s.id

-- Join mau
LEFT JOIN colors c ON ir.color_id = c.id

-- Join loai chi
LEFT JOIN thread_types tt ON ir.thread_type_id = tt.id

-- Join chi tiet xuat
LEFT JOIN thread_issue_items ii ON ir.id = ii.issue_request_id

-- Join tra lai
LEFT JOIN thread_issue_returns ret ON ii.id = ret.issue_item_id

GROUP BY
    ir.po_id,
    po.po_number,
    ir.style_id,
    s.style_code,
    ir.color_id,
    c.name,
    ir.thread_type_id,
    tt.name,
    ir.quota_meters;

-- ============================================================================
-- COMMENT: v_issue_reconciliation
-- ============================================================================

COMMENT ON VIEW v_issue_reconciliation IS 'View doi soat xuat kho - Issue reconciliation view comparing quota vs issued vs returned';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
