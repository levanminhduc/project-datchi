-- ============================================================================
-- Migration: 20260211_issue_process_v2.sql
-- Description: Quy trinh xuat kho v2 - Quan ly theo cuon nguyen/cuon le
--              (Issue Process v2 - Full cone / Partial cone tracking)
-- Dependencies: thread_types, warehouses, thread_inventory, purchase_orders,
--               styles, colors, thread_order_items
-- ============================================================================

-- ============================================================================
-- SECTION 1.1: TABLE system_settings
-- Cau hinh he thong - Luu cac gia tri cau hinh chung
-- ============================================================================

CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,           -- Khoa cau hinh (duy nhat)
    value JSONB NOT NULL,                       -- Gia tri (JSONB cho linh hoat)
    description TEXT,                           -- Mo ta cau hinh
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comment cho bang system_settings
COMMENT ON TABLE system_settings IS 'Bang cau hinh he thong - System configuration settings';
COMMENT ON COLUMN system_settings.id IS 'Khoa chinh tu tang';
COMMENT ON COLUMN system_settings.key IS 'Khoa cau hinh - duy nhat (vd: partial_cone_ratio)';
COMMENT ON COLUMN system_settings.value IS 'Gia tri cau hinh dang JSONB';
COMMENT ON COLUMN system_settings.description IS 'Mo ta y nghia cau hinh';
COMMENT ON COLUMN system_settings.updated_at IS 'Thoi diem cap nhat gan nhat';

-- Trigger cap nhat updated_at
CREATE OR REPLACE FUNCTION fn_update_system_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_system_settings_updated_at
    BEFORE UPDATE ON system_settings
    FOR EACH ROW
    EXECUTE FUNCTION fn_update_system_settings_timestamp();

-- Seed data: partial_cone_ratio = 0.3
-- Ty le quy doi cuon le: 1 cuon le = 0.3 cuon nguyen
INSERT INTO system_settings (key, value, description)
VALUES (
    'partial_cone_ratio',
    '0.3'::jsonb,
    'Ty le quy doi cuon le so voi cuon nguyen (vd: 0.3 = 1 cuon le = 0.3 cuon nguyen)'
)
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    description = EXCLUDED.description,
    updated_at = NOW();

-- ============================================================================
-- SECTION 1.2: TABLE thread_stock
-- Ton kho chi theo so luong cuon nguyen/cuon le
-- Thay the cach tinh ton kho cu (theo tung cuon rieng le)
-- ============================================================================

CREATE TABLE IF NOT EXISTS thread_stock (
    id SERIAL PRIMARY KEY,

    -- Lien ket loai chi va kho
    thread_type_id INTEGER NOT NULL REFERENCES thread_types(id) ON DELETE RESTRICT,
    warehouse_id INTEGER NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,

    -- Thong tin lo hang (tuy chon)
    lot_number VARCHAR(50),

    -- So luong cuon
    qty_full_cones INTEGER NOT NULL DEFAULT 0,      -- So cuon nguyen (nguyen ven)
    qty_partial_cones INTEGER NOT NULL DEFAULT 0,   -- So cuon le (da mo/su dung mot phan)

    -- Thong tin ngay thang
    received_date DATE DEFAULT CURRENT_DATE,        -- Ngay nhap kho
    expiry_date DATE,                               -- Ngay het han (tuy chon)

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ràng buộc: mỗi loại chỉ + kho + lô hàng chỉ có 1 bản ghi
    CONSTRAINT uq_thread_stock_type_warehouse_lot
        UNIQUE (thread_type_id, warehouse_id, lot_number),

    -- So luong khong am
    CONSTRAINT chk_thread_stock_qty_full_positive
        CHECK (qty_full_cones >= 0),
    CONSTRAINT chk_thread_stock_qty_partial_positive
        CHECK (qty_partial_cones >= 0)
);

-- Comments cho bang thread_stock
COMMENT ON TABLE thread_stock IS 'Ton kho chi - Thread stock by full/partial cones';
COMMENT ON COLUMN thread_stock.id IS 'Khoa chinh tu tang';
COMMENT ON COLUMN thread_stock.thread_type_id IS 'FK den thread_types - Loai chi';
COMMENT ON COLUMN thread_stock.warehouse_id IS 'FK den warehouses - Kho chua';
COMMENT ON COLUMN thread_stock.lot_number IS 'So lo hang (tuy chon)';
COMMENT ON COLUMN thread_stock.qty_full_cones IS 'So luong cuon nguyen (chua mo/su dung)';
COMMENT ON COLUMN thread_stock.qty_partial_cones IS 'So luong cuon le (da mo/su dung mot phan)';
COMMENT ON COLUMN thread_stock.received_date IS 'Ngay nhap kho';
COMMENT ON COLUMN thread_stock.expiry_date IS 'Ngay het han (neu co)';
COMMENT ON COLUMN thread_stock.created_at IS 'Thoi diem tao ban ghi';
COMMENT ON COLUMN thread_stock.updated_at IS 'Thoi diem cap nhat gan nhat';

-- Indexes cho thread_stock
CREATE INDEX IF NOT EXISTS idx_thread_stock_thread_type_id
    ON thread_stock(thread_type_id);
CREATE INDEX IF NOT EXISTS idx_thread_stock_warehouse_id
    ON thread_stock(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_thread_stock_lot_number
    ON thread_stock(lot_number);
CREATE INDEX IF NOT EXISTS idx_thread_stock_expiry_date
    ON thread_stock(expiry_date);

-- Trigger cap nhat updated_at
CREATE TRIGGER trigger_thread_stock_updated_at
    BEFORE UPDATE ON thread_stock
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SECTION 1.3: VIEW v_stock_summary
-- View tong hop ton kho theo loai chi va kho
-- ============================================================================

CREATE OR REPLACE VIEW v_stock_summary AS
SELECT
    ts.thread_type_id,
    tt.code AS thread_code,
    tt.name AS thread_name,
    tt.color AS thread_color,

    ts.warehouse_id,
    w.code AS warehouse_code,
    w.name AS warehouse_name,

    -- Tong hop so luong
    SUM(ts.qty_full_cones) AS total_full_cones,
    SUM(ts.qty_partial_cones) AS total_partial_cones,

    -- Quy doi thanh so cuon tuong duong (su dung partial_cone_ratio)
    SUM(ts.qty_full_cones) +
        SUM(ts.qty_partial_cones) * COALESCE(
            (SELECT (value)::numeric FROM system_settings WHERE key = 'partial_cone_ratio'),
            0.3
        ) AS total_equivalent_cones

FROM thread_stock ts
JOIN thread_types tt ON ts.thread_type_id = tt.id
JOIN warehouses w ON ts.warehouse_id = w.id
GROUP BY
    ts.thread_type_id,
    tt.code,
    tt.name,
    tt.color,
    ts.warehouse_id,
    w.code,
    w.name;

COMMENT ON VIEW v_stock_summary IS 'View tong hop ton kho - Stock summary by thread type and warehouse';

-- ============================================================================
-- SECTION 1.4: ENUM issue_status
-- Trang thai phieu xuat kho v2
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'issue_status') THEN
        CREATE TYPE issue_status AS ENUM (
            'DRAFT',        -- Nhap (chua xac nhan)
            'CONFIRMED',    -- Da xac nhan
            'RETURNED'      -- Da tra lai (hoan tat)
        );
    END IF;
END
$$;

COMMENT ON TYPE issue_status IS 'Trang thai phieu xuat kho v2 - Issue status for v2 process';

-- ============================================================================
-- SECTION 1.4: TABLE thread_issues
-- Bang phieu xuat kho (header) - Chi co thong tin chung
-- ============================================================================

CREATE TABLE IF NOT EXISTS thread_issues (
    id SERIAL PRIMARY KEY,

    -- Ma phieu xuat (format: XK2-YYYYMMDD-NNN)
    issue_code VARCHAR(50) UNIQUE NOT NULL,

    -- Thong tin bo phan nhan chi
    department VARCHAR(100) NOT NULL,           -- Bo phan nhan chi (tu employees.department)

    -- Trang thai
    status issue_status DEFAULT 'DRAFT',

    -- Nguoi tao va ghi chu
    created_by VARCHAR(100),                    -- Nguoi tao phieu
    notes TEXT,                                 -- Ghi chu chung

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments cho bang thread_issues
COMMENT ON TABLE thread_issues IS 'Phieu xuat kho v2 (header) - Thread issue header';
COMMENT ON COLUMN thread_issues.id IS 'Khoa chinh tu tang';
COMMENT ON COLUMN thread_issues.issue_code IS 'Ma phieu xuat (format: XK2-YYYYMMDD-NNN)';
COMMENT ON COLUMN thread_issues.department IS 'Bo phan nhan chi';
COMMENT ON COLUMN thread_issues.status IS 'Trang thai: DRAFT, CONFIRMED, RETURNED';
COMMENT ON COLUMN thread_issues.created_by IS 'Nguoi tao phieu';
COMMENT ON COLUMN thread_issues.notes IS 'Ghi chu chung';
COMMENT ON COLUMN thread_issues.created_at IS 'Thoi diem tao phieu';
COMMENT ON COLUMN thread_issues.updated_at IS 'Thoi diem cap nhat gan nhat';

-- Indexes cho thread_issues
CREATE INDEX IF NOT EXISTS idx_thread_issues_issue_code
    ON thread_issues(issue_code);
CREATE INDEX IF NOT EXISTS idx_thread_issues_department
    ON thread_issues(department);
CREATE INDEX IF NOT EXISTS idx_thread_issues_status
    ON thread_issues(status);
CREATE INDEX IF NOT EXISTS idx_thread_issues_created_at
    ON thread_issues(created_at);

-- Trigger cap nhat updated_at
CREATE TRIGGER trigger_thread_issues_updated_at
    BEFORE UPDATE ON thread_issues
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SECTION 1.5: TABLE thread_issue_lines
-- Chi tiet phieu xuat kho - Dong chi tiet cho tung loai chi
-- ============================================================================

CREATE TABLE IF NOT EXISTS thread_issue_lines (
    id SERIAL PRIMARY KEY,

    -- Lien ket phieu xuat
    issue_id INTEGER NOT NULL REFERENCES thread_issues(id) ON DELETE CASCADE,

    -- Lien ket don hang/ma hang/mau (tuy chon)
    po_id INTEGER REFERENCES purchase_orders(id),       -- Ma don hang (tuy chon)
    style_id INTEGER REFERENCES styles(id),             -- Ma hang (tuy chon)
    color_id INTEGER REFERENCES colors(id),             -- Mau (tuy chon)

    -- Loai chi can xuat
    thread_type_id INTEGER NOT NULL REFERENCES thread_types(id),

    -- Dinh muc (so cuon duoc phep xuat)
    quota_cones DECIMAL(8,2),                           -- Dinh muc cuon (NULL = khong gioi han)

    -- So luong xuat (cuon nguyen + cuon le)
    issued_full INTEGER NOT NULL DEFAULT 0,             -- So cuon nguyen da xuat
    issued_partial INTEGER NOT NULL DEFAULT 0,          -- So cuon le da xuat

    -- So luong tra lai (cuon nguyen + cuon le)
    returned_full INTEGER NOT NULL DEFAULT 0,           -- So cuon nguyen da tra
    returned_partial INTEGER NOT NULL DEFAULT 0,        -- So cuon le da tra

    -- Ghi chu vuot dinh muc
    over_quota_notes TEXT,                              -- Ly do xuat vuot dinh muc

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Rang buoc so luong khong am
    CONSTRAINT chk_issue_lines_issued_full_positive
        CHECK (issued_full >= 0),
    CONSTRAINT chk_issue_lines_issued_partial_positive
        CHECK (issued_partial >= 0),
    CONSTRAINT chk_issue_lines_returned_full_positive
        CHECK (returned_full >= 0),
    CONSTRAINT chk_issue_lines_returned_partial_positive
        CHECK (returned_partial >= 0),

    -- Rang buoc: so tra khong lon hon so xuat
    CONSTRAINT chk_issue_lines_returned_not_exceed_issued
        CHECK (returned_full <= issued_full AND returned_partial <= issued_partial)
);

-- Comments cho bang thread_issue_lines
COMMENT ON TABLE thread_issue_lines IS 'Chi tiet phieu xuat kho v2 - Thread issue line items';
COMMENT ON COLUMN thread_issue_lines.id IS 'Khoa chinh tu tang';
COMMENT ON COLUMN thread_issue_lines.issue_id IS 'FK den thread_issues - Phieu xuat';
COMMENT ON COLUMN thread_issue_lines.po_id IS 'FK den purchase_orders - Don hang (tuy chon)';
COMMENT ON COLUMN thread_issue_lines.style_id IS 'FK den styles - Ma hang (tuy chon)';
COMMENT ON COLUMN thread_issue_lines.color_id IS 'FK den colors - Mau (tuy chon)';
COMMENT ON COLUMN thread_issue_lines.thread_type_id IS 'FK den thread_types - Loai chi';
COMMENT ON COLUMN thread_issue_lines.quota_cones IS 'Dinh muc cuon (NULL = khong gioi han)';
COMMENT ON COLUMN thread_issue_lines.issued_full IS 'So cuon nguyen da xuat';
COMMENT ON COLUMN thread_issue_lines.issued_partial IS 'So cuon le da xuat';
COMMENT ON COLUMN thread_issue_lines.returned_full IS 'So cuon nguyen da tra lai';
COMMENT ON COLUMN thread_issue_lines.returned_partial IS 'So cuon le da tra lai';
COMMENT ON COLUMN thread_issue_lines.over_quota_notes IS 'Ghi chu ly do xuat vuot dinh muc';
COMMENT ON COLUMN thread_issue_lines.created_at IS 'Thoi diem tao dong';

-- Indexes cho thread_issue_lines
CREATE INDEX IF NOT EXISTS idx_thread_issue_lines_issue_id
    ON thread_issue_lines(issue_id);
CREATE INDEX IF NOT EXISTS idx_thread_issue_lines_po_id
    ON thread_issue_lines(po_id);
CREATE INDEX IF NOT EXISTS idx_thread_issue_lines_style_id
    ON thread_issue_lines(style_id);
CREATE INDEX IF NOT EXISTS idx_thread_issue_lines_color_id
    ON thread_issue_lines(color_id);
CREATE INDEX IF NOT EXISTS idx_thread_issue_lines_thread_type_id
    ON thread_issue_lines(thread_type_id);

-- ============================================================================
-- SECTION 1.6: ALTER thread_order_items
-- Them cot quota_cones de luu dinh muc cuon cho moi don dat hang
-- ============================================================================

ALTER TABLE thread_order_items
    ADD COLUMN IF NOT EXISTS quota_cones DECIMAL(8,2);

COMMENT ON COLUMN thread_order_items.quota_cones IS 'Dinh muc cuon cho don dat hang nay (tinh tu BOM)';

-- ============================================================================
-- SECTION 1.7: FUNCTION fn_migrate_inventory_to_stock
-- Migration data tu thread_inventory sang thread_stock
-- Gom nhom theo thread_type_id, warehouse_id, lot_number
-- Dem so cuon nguyen (is_partial = false) va cuon le (is_partial = true)
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_migrate_inventory_to_stock()
RETURNS TABLE (
    migrated_count INTEGER,
    skipped_count INTEGER,
    error_message TEXT
) AS $$
DECLARE
    v_migrated_count INTEGER := 0;
    v_skipped_count INTEGER := 0;
BEGIN
    -- Insert/Update thread_stock tu thread_inventory
    -- Chi lay cac cuon co status = 'RECEIVED' hoac 'ALLOCATED'
    INSERT INTO thread_stock (
        thread_type_id,
        warehouse_id,
        lot_number,
        qty_full_cones,
        qty_partial_cones,
        received_date,
        expiry_date,
        created_at,
        updated_at
    )
    SELECT
        ti.thread_type_id,
        ti.warehouse_id,
        ti.lot_number,
        -- Dem cuon nguyen (is_partial = false)
        COUNT(CASE WHEN ti.is_partial = false THEN 1 END)::INTEGER AS qty_full,
        -- Dem cuon le (is_partial = true)
        COUNT(CASE WHEN ti.is_partial = true THEN 1 END)::INTEGER AS qty_partial,
        -- Lay ngay nhap som nhat trong nhom
        MIN(ti.received_date) AS received_date,
        -- Lay ngay het han gan nhat (FEFO)
        MIN(ti.expiry_date) AS expiry_date,
        NOW() AS created_at,
        NOW() AS updated_at
    FROM thread_inventory ti
    WHERE ti.status IN ('RECEIVED', 'ALLOCATED')
      AND ti.quantity_cones > 0
    GROUP BY
        ti.thread_type_id,
        ti.warehouse_id,
        ti.lot_number
    ON CONFLICT (thread_type_id, warehouse_id, lot_number)
    DO UPDATE SET
        qty_full_cones = thread_stock.qty_full_cones + EXCLUDED.qty_full_cones,
        qty_partial_cones = thread_stock.qty_partial_cones + EXCLUDED.qty_partial_cones,
        -- Cap nhat expiry_date neu co gia tri moi som hon
        expiry_date = LEAST(thread_stock.expiry_date, EXCLUDED.expiry_date),
        updated_at = NOW();

    -- Dem so ban ghi da migrate
    GET DIAGNOSTICS v_migrated_count = ROW_COUNT;

    -- Tra ve ket qua
    RETURN QUERY SELECT
        v_migrated_count,
        v_skipped_count,
        NULL::TEXT;

EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT
        v_migrated_count,
        v_skipped_count,
        SQLERRM::TEXT;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_migrate_inventory_to_stock() IS 'Migrate du lieu tu thread_inventory sang thread_stock';

-- ============================================================================
-- SECTION 1.8: VIEW v_issue_reconciliation_v2
-- View doi soat xuat kho v2 - Tinh toan tieu thu theo cuon
-- consumed = (issued_full - returned_full) +
--            (issued_partial - returned_partial) * partial_cone_ratio
-- ============================================================================

CREATE OR REPLACE VIEW v_issue_reconciliation_v2 AS
WITH partial_ratio AS (
    -- Lay ty le quy doi cuon le tu system_settings
    SELECT COALESCE(
        (SELECT (value)::numeric FROM system_settings WHERE key = 'partial_cone_ratio'),
        0.3
    ) AS ratio
)
SELECT
    -- Thong tin phieu xuat
    ti.id AS issue_id,
    ti.issue_code,
    ti.department,
    ti.status AS issue_status,
    ti.created_by,
    ti.created_at AS issue_date,

    -- Thong tin dong chi tiet
    til.id AS line_id,

    -- Thong tin don hang
    til.po_id,
    po.po_number,

    -- Thong tin ma hang
    til.style_id,
    s.style_code,

    -- Thong tin mau
    til.color_id,
    c.name AS color_name,

    -- Thong tin loai chi
    til.thread_type_id,
    tt.code AS thread_code,
    tt.name AS thread_name,
    tt.color AS thread_color,

    -- Dinh muc
    til.quota_cones,

    -- So luong xuat
    til.issued_full,
    til.issued_partial,

    -- So luong tra
    til.returned_full,
    til.returned_partial,

    -- Tinh tieu thu thuc te (quy doi sang cuon tuong duong)
    -- consumed = (issued_full - returned_full) + (issued_partial - returned_partial) * ratio
    (til.issued_full - til.returned_full) +
        (til.issued_partial - til.returned_partial) * pr.ratio AS consumed_equivalent_cones,

    -- So cuon nguyen tieu thu
    (til.issued_full - til.returned_full) AS consumed_full_cones,

    -- So cuon le tieu thu
    (til.issued_partial - til.returned_partial) AS consumed_partial_cones,

    -- Ty le tieu thu so voi dinh muc (%)
    CASE
        WHEN til.quota_cones IS NOT NULL AND til.quota_cones > 0 THEN
            ROUND(
                (
                    (til.issued_full - til.returned_full) +
                    (til.issued_partial - til.returned_partial) * pr.ratio
                ) / til.quota_cones * 100,
                2
            )
        ELSE NULL
    END AS consumption_percentage,

    -- Co vuot dinh muc khong?
    CASE
        WHEN til.quota_cones IS NOT NULL AND til.quota_cones > 0 THEN
            (
                (til.issued_full - til.returned_full) +
                (til.issued_partial - til.returned_partial) * pr.ratio
            ) > til.quota_cones
        ELSE FALSE
    END AS is_over_quota,

    -- Ghi chu vuot dinh muc
    til.over_quota_notes,

    -- Ty le quy doi cuon le (de tham khao)
    pr.ratio AS partial_cone_ratio

FROM thread_issues ti
JOIN thread_issue_lines til ON ti.id = til.issue_id
CROSS JOIN partial_ratio pr

-- Join thong tin don hang (tuy chon)
LEFT JOIN purchase_orders po ON til.po_id = po.id

-- Join thong tin ma hang (tuy chon)
LEFT JOIN styles s ON til.style_id = s.id

-- Join thong tin mau (tuy chon)
LEFT JOIN colors c ON til.color_id = c.id

-- Join thong tin loai chi
LEFT JOIN thread_types tt ON til.thread_type_id = tt.id;

COMMENT ON VIEW v_issue_reconciliation_v2 IS 'View doi soat xuat kho v2 - Issue reconciliation with cone-based tracking';

-- ============================================================================
-- SECTION: HELPER FUNCTION fn_generate_issue_code
-- Tao ma phieu xuat tu dong theo format: XK2-YYYYMMDD-NNN
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_generate_issue_code()
RETURNS VARCHAR(50) AS $$
DECLARE
    v_date_part VARCHAR(8);
    v_sequence INTEGER;
    v_code VARCHAR(50);
BEGIN
    -- Lay ngay hien tai theo format YYYYMMDD
    v_date_part := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');

    -- Dem so phieu trong ngay hom nay
    SELECT COUNT(*) + 1 INTO v_sequence
    FROM thread_issues
    WHERE issue_code LIKE 'XK2-' || v_date_part || '-%';

    -- Tao ma phieu
    v_code := 'XK2-' || v_date_part || '-' || LPAD(v_sequence::TEXT, 3, '0');

    RETURN v_code;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_generate_issue_code() IS 'Tao ma phieu xuat tu dong (format: XK2-YYYYMMDD-NNN)';

-- ============================================================================
-- SECTION: FUNCTION fn_get_partial_cone_ratio
-- Lay ty le quy doi cuon le tu system_settings
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_get_partial_cone_ratio()
RETURNS NUMERIC AS $$
BEGIN
    RETURN COALESCE(
        (SELECT (value)::numeric FROM system_settings WHERE key = 'partial_cone_ratio'),
        0.3  -- Gia tri mac dinh
    );
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION fn_get_partial_cone_ratio() IS 'Lay ty le quy doi cuon le tu cau hinh he thong';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
