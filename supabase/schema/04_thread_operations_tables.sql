-- Thread Operations Tables: inventory, allocations, movements, recovery, conflicts
-- PostgreSQL database dump
-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;
SET default_tablespace = '';
SET default_table_access_method = heap;
-- Name: batch_transactions; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.batch_transactions (
    id integer NOT NULL,
    operation_type public.batch_operation_type NOT NULL,
    lot_id integer,
    from_warehouse_id integer,
    to_warehouse_id integer,
    cone_ids integer[] NOT NULL,
    cone_count integer NOT NULL,
    reference_number character varying(50),
    recipient character varying(200),
    notes text,
    performed_by character varying(100),
    performed_at timestamp with time zone DEFAULT now() NOT NULL
);
-- Name: TABLE batch_transactions; Type: COMMENT; Schema: public; Owner: -
COMMENT ON TABLE public.batch_transactions IS 'Bảng lưu lịch sử các thao tác hàng loạt (nhập/xuất/chuyển kho)';
-- Name: COLUMN batch_transactions.id; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.batch_transactions.id IS 'Khóa chính tự tăng';
-- Name: COLUMN batch_transactions.operation_type; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.batch_transactions.operation_type IS 'Loại thao tác: RECEIVE=nhập kho, TRANSFER=chuyển kho, ISSUE=xuất kho, RETURN=trả lại';
-- Name: COLUMN batch_transactions.lot_id; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.batch_transactions.lot_id IS 'Lô hàng liên quan (nếu có)';
-- Name: COLUMN batch_transactions.from_warehouse_id; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.batch_transactions.from_warehouse_id IS 'Kho nguồn (cho chuyển/xuất kho)';
-- Name: COLUMN batch_transactions.to_warehouse_id; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.batch_transactions.to_warehouse_id IS 'Kho đích (cho nhập/chuyển kho)';
-- Name: COLUMN batch_transactions.cone_ids; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.batch_transactions.cone_ids IS 'Mảng ID các cuộn trong thao tác này';
-- Name: COLUMN batch_transactions.cone_count; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.batch_transactions.cone_count IS 'Số lượng cuộn (để truy vấn nhanh)';
-- Name: COLUMN batch_transactions.reference_number; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.batch_transactions.reference_number IS 'Số tham chiếu bên ngoài (số PO, phiếu xuất kho, v.v.)';
-- Name: COLUMN batch_transactions.recipient; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.batch_transactions.recipient IS 'Người nhận hàng (cho thao tác xuất kho)';
-- Name: COLUMN batch_transactions.notes; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.batch_transactions.notes IS 'Ghi chú thêm về thao tác';
-- Name: COLUMN batch_transactions.performed_by; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.batch_transactions.performed_by IS 'Người thực hiện thao tác';
-- Name: COLUMN batch_transactions.performed_at; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.batch_transactions.performed_at IS 'Thời điểm thực hiện thao tác';
-- Name: batch_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.batch_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: batch_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.batch_transactions_id_seq OWNED BY public.batch_transactions.id;
-- Name: thread_allocation_cones; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.thread_allocation_cones (
    id integer NOT NULL,
    allocation_id integer NOT NULL,
    cone_id integer NOT NULL,
    allocated_meters numeric(12,4) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT chk_allocation_cones_meters_positive CHECK ((allocated_meters > (0)::numeric))
);
-- Name: TABLE thread_allocation_cones; Type: COMMENT; Schema: public; Owner: -
COMMENT ON TABLE public.thread_allocation_cones IS 'Junction table linking allocations to inventory cones - Bang lien ket phan bo va cuon chi';
-- Name: COLUMN thread_allocation_cones.allocation_id; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_allocation_cones.allocation_id IS 'Reference to allocation request - Tham chieu yeu cau phan bo';
-- Name: COLUMN thread_allocation_cones.cone_id; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_allocation_cones.cone_id IS 'Reference to inventory cone - Tham chieu cuon chi trong kho';
-- Name: COLUMN thread_allocation_cones.allocated_meters; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_allocation_cones.allocated_meters IS 'Meters allocated from this cone - So met phan bo tu cuon nay';
-- Name: thread_allocation_cones_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.thread_allocation_cones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: thread_allocation_cones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.thread_allocation_cones_id_seq OWNED BY public.thread_allocation_cones.id;
-- Name: thread_allocations; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.thread_allocations (
    id integer NOT NULL,
    order_id character varying(50) NOT NULL,
    order_reference character varying(200),
    thread_type_id integer NOT NULL,
    requested_meters numeric(12,4) NOT NULL,
    allocated_meters numeric(12,4) DEFAULT 0,
    status public.allocation_status DEFAULT 'PENDING'::public.allocation_status,
    priority public.allocation_priority DEFAULT 'NORMAL'::public.allocation_priority,
    priority_score integer DEFAULT 0,
    requested_date timestamp with time zone DEFAULT now(),
    due_date date,
    notes text,
    created_by character varying(100),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    split_from_id integer,
    CONSTRAINT chk_allocations_allocated_valid CHECK (((allocated_meters >= (0)::numeric) AND (allocated_meters <= requested_meters))),
    CONSTRAINT chk_allocations_requested_positive CHECK ((requested_meters > (0)::numeric))
);
-- Name: TABLE thread_allocations; Type: COMMENT; Schema: public; Owner: -
COMMENT ON TABLE public.thread_allocations IS 'Realtime enabled for allocation tracking';
-- Name: COLUMN thread_allocations.order_id; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_allocations.order_id IS 'Production order ID - Ma lenh san xuat';
-- Name: COLUMN thread_allocations.order_reference; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_allocations.order_reference IS 'Order description or reference - Mo ta don hang';
-- Name: COLUMN thread_allocations.thread_type_id; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_allocations.thread_type_id IS 'Reference to thread type - Tham chieu loai chi';
-- Name: COLUMN thread_allocations.requested_meters; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_allocations.requested_meters IS 'Total meters requested - Tong so met yeu cau';
-- Name: COLUMN thread_allocations.allocated_meters; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_allocations.allocated_meters IS 'Meters successfully allocated - So met da phan bo';
-- Name: COLUMN thread_allocations.status; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_allocations.status IS 'Current allocation status - Trang thai phan bo hien tai';
-- Name: COLUMN thread_allocations.priority; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_allocations.priority IS 'Allocation priority level - Muc do uu tien';
-- Name: COLUMN thread_allocations.priority_score; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_allocations.priority_score IS 'Calculated priority score (priority_level * 10 + age_days) - Diem uu tien tinh toan';
-- Name: COLUMN thread_allocations.requested_date; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_allocations.requested_date IS 'Date allocation was requested - Ngay yeu cau phan bo';
-- Name: COLUMN thread_allocations.due_date; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_allocations.due_date IS 'Due date for production - Ngay can cho san xuat';
-- Name: COLUMN thread_allocations.notes; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_allocations.notes IS 'Additional notes - Ghi chu them';
-- Name: COLUMN thread_allocations.created_by; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_allocations.created_by IS 'User who created the allocation - Nguoi tao phan bo';
-- Name: COLUMN thread_allocations.split_from_id; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_allocations.split_from_id IS 'Reference to original allocation if this was created from a split - Tham chieu phan bo goc neu la ket qua chia nho';
-- Name: thread_allocations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.thread_allocations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: thread_allocations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.thread_allocations_id_seq OWNED BY public.thread_allocations.id;
-- Name: thread_audit_log; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.thread_audit_log (
    id integer NOT NULL,
    table_name character varying(50) NOT NULL,
    record_id integer NOT NULL,
    action character varying(10) NOT NULL,
    old_values jsonb,
    new_values jsonb,
    changed_fields text[],
    performed_by character varying(100),
    ip_address character varying(45),
    user_agent text,
    created_at timestamp with time zone DEFAULT now()
);
-- Name: TABLE thread_audit_log; Type: COMMENT; Schema: public; Owner: -
COMMENT ON TABLE public.thread_audit_log IS 'Audit log for thread management tables - Nhat ky kiem toan cho cac bang quan ly chi';
-- Name: COLUMN thread_audit_log.table_name; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_audit_log.table_name IS 'Name of the table that was changed - Ten bang bi thay doi';
-- Name: COLUMN thread_audit_log.record_id; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_audit_log.record_id IS 'ID of the record that was changed - ID ban ghi bi thay doi';
-- Name: COLUMN thread_audit_log.action; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_audit_log.action IS 'Type of action: INSERT, UPDATE, DELETE - Loai thao tac';
-- Name: COLUMN thread_audit_log.old_values; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_audit_log.old_values IS 'Previous state as JSONB - Trang thai truoc dang JSONB';
-- Name: COLUMN thread_audit_log.new_values; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_audit_log.new_values IS 'New state as JSONB - Trang thai moi dang JSONB';
-- Name: COLUMN thread_audit_log.changed_fields; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_audit_log.changed_fields IS 'Array of column names that changed - Mang ten cot da thay doi';
-- Name: COLUMN thread_audit_log.performed_by; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_audit_log.performed_by IS 'User who performed the action - Nguoi thuc hien thao tac';
-- Name: COLUMN thread_audit_log.ip_address; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_audit_log.ip_address IS 'IP address of the actor (IPv4 or IPv6) - Dia chi IP';
-- Name: COLUMN thread_audit_log.user_agent; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_audit_log.user_agent IS 'Browser or application user agent - Trinh duyet/ung dung';
-- Name: thread_audit_log_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.thread_audit_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: thread_audit_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.thread_audit_log_id_seq OWNED BY public.thread_audit_log.id;
-- Name: thread_conflict_allocations; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.thread_conflict_allocations (
    id integer NOT NULL,
    conflict_id integer NOT NULL,
    allocation_id integer NOT NULL,
    original_priority_score integer,
    adjusted_priority_score integer,
    created_at timestamp with time zone DEFAULT now()
);
-- Name: TABLE thread_conflict_allocations; Type: COMMENT; Schema: public; Owner: -
COMMENT ON TABLE public.thread_conflict_allocations IS 'Junction table linking conflicts to allocations - Bang lien ket xung dot va phan bo';
-- Name: COLUMN thread_conflict_allocations.conflict_id; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_conflict_allocations.conflict_id IS 'Reference to the conflict - Tham chieu xung dot';
-- Name: COLUMN thread_conflict_allocations.allocation_id; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_conflict_allocations.allocation_id IS 'Reference to affected allocation - Tham chieu phan bo bi anh huong';
-- Name: COLUMN thread_conflict_allocations.original_priority_score; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_conflict_allocations.original_priority_score IS 'Priority score at conflict detection - Diem uu tien ban dau';
-- Name: COLUMN thread_conflict_allocations.adjusted_priority_score; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_conflict_allocations.adjusted_priority_score IS 'Priority score after resolution - Diem uu tien sau dieu chinh';
-- Name: thread_conflict_allocations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.thread_conflict_allocations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: thread_conflict_allocations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.thread_conflict_allocations_id_seq OWNED BY public.thread_conflict_allocations.id;
-- Name: thread_conflicts; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.thread_conflicts (
    id integer NOT NULL,
    thread_type_id integer NOT NULL,
    total_requested_meters numeric(12,4) NOT NULL,
    total_available_meters numeric(12,4) NOT NULL,
    shortage_meters numeric(12,4) NOT NULL,
    status character varying(20) DEFAULT 'PENDING'::character varying,
    resolution_notes text,
    resolved_by character varying(100),
    resolved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT chk_conflicts_available_non_negative CHECK ((total_available_meters >= (0)::numeric)),
    CONSTRAINT chk_conflicts_requested_positive CHECK ((total_requested_meters > (0)::numeric)),
    CONSTRAINT chk_conflicts_shortage_positive CHECK ((shortage_meters > (0)::numeric)),
    CONSTRAINT chk_conflicts_status_valid CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'RESOLVED'::character varying, 'ESCALATED'::character varying])::text[])))
);
-- Name: TABLE thread_conflicts; Type: COMMENT; Schema: public; Owner: -
COMMENT ON TABLE public.thread_conflicts IS 'Allocation conflicts when demand exceeds supply - Xung dot phan bo khi nhu cau vuot nguon cung';
-- Name: COLUMN thread_conflicts.thread_type_id; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_conflicts.thread_type_id IS 'Thread type with insufficient stock - Loai chi thieu ton';
-- Name: COLUMN thread_conflicts.total_requested_meters; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_conflicts.total_requested_meters IS 'Total meters requested - Tong so met yeu cau';
-- Name: COLUMN thread_conflicts.total_available_meters; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_conflicts.total_available_meters IS 'Total meters available - Tong so met co san';
-- Name: COLUMN thread_conflicts.shortage_meters; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_conflicts.shortage_meters IS 'Shortage amount (requested - available) - So met thieu';
-- Name: COLUMN thread_conflicts.status; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_conflicts.status IS 'Resolution status (PENDING/RESOLVED/ESCALATED) - Trang thai xu ly';
-- Name: COLUMN thread_conflicts.resolution_notes; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_conflicts.resolution_notes IS 'Notes on how conflict was resolved - Ghi chu giai quyet';
-- Name: COLUMN thread_conflicts.resolved_by; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_conflicts.resolved_by IS 'User who resolved the conflict - Nguoi giai quyet';
-- Name: COLUMN thread_conflicts.resolved_at; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_conflicts.resolved_at IS 'When conflict was resolved - Thoi gian giai quyet';
-- Name: thread_conflicts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.thread_conflicts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: thread_conflicts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.thread_conflicts_id_seq OWNED BY public.thread_conflicts.id;
-- Name: thread_inventory; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.thread_inventory (
    id integer NOT NULL,
    cone_id character varying(50) NOT NULL,
    thread_type_id integer NOT NULL,
    warehouse_id integer NOT NULL,
    quantity_cones integer DEFAULT 1 NOT NULL,
    quantity_meters numeric(12,4) NOT NULL,
    weight_grams numeric(10,2),
    is_partial boolean DEFAULT false,
    status public.cone_status DEFAULT 'RECEIVED'::public.cone_status,
    lot_number character varying(50),
    expiry_date date,
    received_date date DEFAULT CURRENT_DATE,
    location character varying(100),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    lot_id integer,
    CONSTRAINT chk_thread_inventory_quantity_positive CHECK ((quantity_meters >= (0)::numeric)),
    CONSTRAINT chk_thread_inventory_weight_positive CHECK (((weight_grams IS NULL) OR (weight_grams >= (0)::numeric)))
);
-- Name: TABLE thread_inventory; Type: COMMENT; Schema: public; Owner: -
COMMENT ON TABLE public.thread_inventory IS 'Realtime enabled for live stock updates';
-- Name: COLUMN thread_inventory.cone_id; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_inventory.cone_id IS 'Barcode ID for cone (auto-generated or scanned) - Ma vach cuon chi';
-- Name: COLUMN thread_inventory.thread_type_id; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_inventory.thread_type_id IS 'Reference to thread type - Tham chieu loai chi';
-- Name: COLUMN thread_inventory.warehouse_id; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_inventory.warehouse_id IS 'Reference to warehouse location - Tham chieu kho';
-- Name: COLUMN thread_inventory.quantity_cones; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_inventory.quantity_cones IS 'Number of cones (always 1 for individual tracking) - So cuon';
-- Name: COLUMN thread_inventory.quantity_meters; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_inventory.quantity_meters IS 'Remaining meters on cone (high precision) - So met con lai';
-- Name: COLUMN thread_inventory.weight_grams; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_inventory.weight_grams IS 'Current weight in grams (for partial cone calculations) - Khoi luong hien tai';
-- Name: COLUMN thread_inventory.is_partial; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_inventory.is_partial IS 'Flag indicating partial cone (previously used) - Co danh dau cuon le';
-- Name: COLUMN thread_inventory.status; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_inventory.status IS 'Current lifecycle status - Trang thai hien tai';
-- Name: COLUMN thread_inventory.lot_number; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_inventory.lot_number IS 'Supplier batch/lot number - So lo nha cung cap';
-- Name: COLUMN thread_inventory.expiry_date; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_inventory.expiry_date IS 'Expiry date for FEFO allocation - Ngay het han';
-- Name: COLUMN thread_inventory.received_date; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_inventory.received_date IS 'Date received into warehouse - Ngay nhap kho';
-- Name: COLUMN thread_inventory.location; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_inventory.location IS 'Physical location in warehouse (e.g., A-1-2) - Vi tri kho';
-- Name: COLUMN thread_inventory.lot_id; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_inventory.lot_id IS 'Tham chiếu đến lô hàng trong bảng lots (nullable để hỗ trợ dữ liệu cũ)';
-- Name: thread_inventory_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.thread_inventory_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: thread_inventory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.thread_inventory_id_seq OWNED BY public.thread_inventory.id;
-- Name: thread_movements; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.thread_movements (
    id integer NOT NULL,
    cone_id integer NOT NULL,
    allocation_id integer,
    movement_type public.movement_type NOT NULL,
    quantity_meters numeric(12,4) NOT NULL,
    from_status character varying(50),
    to_status character varying(50),
    reference_id character varying(50),
    reference_type character varying(50),
    performed_by character varying(100),
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT chk_thread_movements_quantity_not_zero CHECK ((quantity_meters <> (0)::numeric))
);
-- Name: TABLE thread_movements; Type: COMMENT; Schema: public; Owner: -
COMMENT ON TABLE public.thread_movements IS 'Transaction log for inventory movements - Nhat ky giao dich di chuyen ton kho';
-- Name: COLUMN thread_movements.cone_id; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_movements.cone_id IS 'Reference to the affected cone - Cuon chi bi anh huong';
-- Name: COLUMN thread_movements.allocation_id; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_movements.allocation_id IS 'Reference to allocation (for ISSUE/RETURN) - Lien ket phan bo';
-- Name: COLUMN thread_movements.movement_type; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_movements.movement_type IS 'Type of movement - Loai di chuyen';
-- Name: COLUMN thread_movements.quantity_meters; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_movements.quantity_meters IS 'Meters involved in movement - So met di chuyen';
-- Name: COLUMN thread_movements.from_status; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_movements.from_status IS 'Cone status before movement - Trang thai truoc';
-- Name: COLUMN thread_movements.to_status; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_movements.to_status IS 'Cone status after movement - Trang thai sau';
-- Name: COLUMN thread_movements.reference_id; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_movements.reference_id IS 'External document reference ID - Ma tham chieu ben ngoai';
-- Name: COLUMN thread_movements.reference_type; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_movements.reference_type IS 'Type of external reference - Loai tham chieu';
-- Name: COLUMN thread_movements.performed_by; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_movements.performed_by IS 'User who performed the movement - Nguoi thuc hien';
-- Name: COLUMN thread_movements.notes; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_movements.notes IS 'Additional notes - Ghi chu';
-- Name: thread_movements_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.thread_movements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: thread_movements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.thread_movements_id_seq OWNED BY public.thread_movements.id;
-- Name: thread_recovery; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.thread_recovery (
    id integer NOT NULL,
    cone_id integer NOT NULL,
    original_meters numeric(12,4) NOT NULL,
    returned_weight_grams numeric(10,2),
    calculated_meters numeric(12,4),
    tare_weight_grams numeric(10,2) DEFAULT 10,
    consumption_meters numeric(12,4),
    status public.recovery_status DEFAULT 'INITIATED'::public.recovery_status,
    initiated_by character varying(100),
    weighed_by character varying(100),
    confirmed_by character varying(100),
    notes text,
    photo_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT chk_thread_recovery_original_meters_positive CHECK ((original_meters > (0)::numeric)),
    CONSTRAINT chk_thread_recovery_tare_non_negative CHECK ((tare_weight_grams >= (0)::numeric)),
    CONSTRAINT chk_thread_recovery_weight_non_negative CHECK (((returned_weight_grams IS NULL) OR (returned_weight_grams >= (0)::numeric)))
);
-- Name: TABLE thread_recovery; Type: COMMENT; Schema: public; Owner: -
COMMENT ON TABLE public.thread_recovery IS 'Realtime enabled for recovery workflow';
-- Name: COLUMN thread_recovery.cone_id; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_recovery.cone_id IS 'Reference to recovered cone - Cuon chi duoc thu hoi';
-- Name: COLUMN thread_recovery.original_meters; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_recovery.original_meters IS 'Meters on cone when issued to production - So met khi xuat san xuat';
-- Name: COLUMN thread_recovery.returned_weight_grams; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_recovery.returned_weight_grams IS 'Actual weight when returned (measured) - Khoi luong thuc te khi tra';
-- Name: COLUMN thread_recovery.calculated_meters; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_recovery.calculated_meters IS 'Meters calculated from weight using density factor - So met tinh tu khoi luong';
-- Name: COLUMN thread_recovery.tare_weight_grams; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_recovery.tare_weight_grams IS 'Empty cone weight (default 10g) - Khoi luong vo cuon';
-- Name: COLUMN thread_recovery.consumption_meters; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_recovery.consumption_meters IS 'Meters consumed (original - calculated) - So met da su dung';
-- Name: COLUMN thread_recovery.status; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_recovery.status IS 'Current recovery status - Trang thai thu hoi';
-- Name: COLUMN thread_recovery.initiated_by; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_recovery.initiated_by IS 'Production worker who initiated return - Cong nhan khoi tao tra';
-- Name: COLUMN thread_recovery.weighed_by; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_recovery.weighed_by IS 'Warehouse keeper who weighed - Nguoi can';
-- Name: COLUMN thread_recovery.confirmed_by; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_recovery.confirmed_by IS 'Supervisor who confirmed - Nguoi xac nhan';
-- Name: COLUMN thread_recovery.notes; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_recovery.notes IS 'Additional notes or write-off reason - Ghi chu';
-- Name: COLUMN thread_recovery.photo_url; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_recovery.photo_url IS 'Verification photo URL - Anh xac nhan';
-- Name: thread_recovery_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.thread_recovery_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: thread_recovery_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.thread_recovery_id_seq OWNED BY public.thread_recovery.id;
-- Name: batch_transactions id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.batch_transactions ALTER COLUMN id SET DEFAULT nextval('public.batch_transactions_id_seq'::regclass);
-- Name: thread_allocation_cones id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.thread_allocation_cones ALTER COLUMN id SET DEFAULT nextval('public.thread_allocation_cones_id_seq'::regclass);
-- Name: thread_allocations id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.thread_allocations ALTER COLUMN id SET DEFAULT nextval('public.thread_allocations_id_seq'::regclass);
-- Name: thread_audit_log id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.thread_audit_log ALTER COLUMN id SET DEFAULT nextval('public.thread_audit_log_id_seq'::regclass);
-- Name: thread_conflict_allocations id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.thread_conflict_allocations ALTER COLUMN id SET DEFAULT nextval('public.thread_conflict_allocations_id_seq'::regclass);
-- Name: thread_conflicts id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.thread_conflicts ALTER COLUMN id SET DEFAULT nextval('public.thread_conflicts_id_seq'::regclass);
-- Name: thread_inventory id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.thread_inventory ALTER COLUMN id SET DEFAULT nextval('public.thread_inventory_id_seq'::regclass);
-- Name: thread_movements id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.thread_movements ALTER COLUMN id SET DEFAULT nextval('public.thread_movements_id_seq'::regclass);
-- Name: thread_recovery id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.thread_recovery ALTER COLUMN id SET DEFAULT nextval('public.thread_recovery_id_seq'::regclass);
-- Name: batch_transactions batch_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.batch_transactions
    ADD CONSTRAINT batch_transactions_pkey PRIMARY KEY (id);
-- Name: thread_allocation_cones thread_allocation_cones_allocation_id_cone_id_key; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.thread_allocation_cones
    ADD CONSTRAINT thread_allocation_cones_allocation_id_cone_id_key UNIQUE (allocation_id, cone_id);
-- Name: thread_allocation_cones thread_allocation_cones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.thread_allocation_cones
    ADD CONSTRAINT thread_allocation_cones_pkey PRIMARY KEY (id);
-- Name: thread_allocations thread_allocations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.thread_allocations
    ADD CONSTRAINT thread_allocations_pkey PRIMARY KEY (id);
-- Name: thread_audit_log thread_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.thread_audit_log
    ADD CONSTRAINT thread_audit_log_pkey PRIMARY KEY (id);
-- Name: thread_conflict_allocations thread_conflict_allocations_conflict_id_allocation_id_key; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.thread_conflict_allocations
    ADD CONSTRAINT thread_conflict_allocations_conflict_id_allocation_id_key UNIQUE (conflict_id, allocation_id);
-- Name: thread_conflict_allocations thread_conflict_allocations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.thread_conflict_allocations
    ADD CONSTRAINT thread_conflict_allocations_pkey PRIMARY KEY (id);
-- Name: thread_conflicts thread_conflicts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.thread_conflicts
    ADD CONSTRAINT thread_conflicts_pkey PRIMARY KEY (id);
-- Name: thread_inventory thread_inventory_cone_id_key; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.thread_inventory
    ADD CONSTRAINT thread_inventory_cone_id_key UNIQUE (cone_id);
-- Name: thread_inventory thread_inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.thread_inventory
    ADD CONSTRAINT thread_inventory_pkey PRIMARY KEY (id);
-- Name: thread_movements thread_movements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.thread_movements
    ADD CONSTRAINT thread_movements_pkey PRIMARY KEY (id);
-- Name: thread_recovery thread_recovery_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.thread_recovery
    ADD CONSTRAINT thread_recovery_pkey PRIMARY KEY (id);
-- Name: idx_allocation_cones_allocation; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_allocation_cones_allocation ON public.thread_allocation_cones USING btree (allocation_id);
-- Name: idx_allocation_cones_cone; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_allocation_cones_cone ON public.thread_allocation_cones USING btree (cone_id);
-- Name: idx_allocations_due_date; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_allocations_due_date ON public.thread_allocations USING btree (due_date);
-- Name: idx_allocations_order_id; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_allocations_order_id ON public.thread_allocations USING btree (order_id);
-- Name: idx_allocations_pending; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_allocations_pending ON public.thread_allocations USING btree (status) WHERE (status = ANY (ARRAY['PENDING'::public.allocation_status, 'SOFT'::public.allocation_status]));
-- Name: idx_allocations_priority; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_allocations_priority ON public.thread_allocations USING btree (priority);
-- Name: idx_allocations_priority_score; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_allocations_priority_score ON public.thread_allocations USING btree (priority_score DESC);
-- Name: idx_allocations_split_from; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_allocations_split_from ON public.thread_allocations USING btree (split_from_id) WHERE (split_from_id IS NOT NULL);
-- Name: idx_allocations_status; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_allocations_status ON public.thread_allocations USING btree (status);
-- Name: idx_allocations_thread_type; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_allocations_thread_type ON public.thread_allocations USING btree (thread_type_id);
-- Name: idx_audit_action; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_audit_action ON public.thread_audit_log USING btree (action);
-- Name: INDEX idx_audit_action; Type: COMMENT; Schema: public; Owner: -
COMMENT ON INDEX public.idx_audit_action IS 'Filter audit logs by action type - Loc theo loai thao tac';
-- Name: idx_audit_created; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_audit_created ON public.thread_audit_log USING btree (created_at DESC);
-- Name: INDEX idx_audit_created; Type: COMMENT; Schema: public; Owner: -
COMMENT ON INDEX public.idx_audit_created IS 'Sort audit logs by creation time - Sap xep theo thoi gian';
-- Name: idx_audit_record; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_audit_record ON public.thread_audit_log USING btree (table_name, record_id);
-- Name: INDEX idx_audit_record; Type: COMMENT; Schema: public; Owner: -
COMMENT ON INDEX public.idx_audit_record IS 'Filter audit logs by table + record ID - Loc theo bang va ID';
-- Name: idx_audit_table; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_audit_table ON public.thread_audit_log USING btree (table_name);
-- Name: INDEX idx_audit_table; Type: COMMENT; Schema: public; Owner: -
COMMENT ON INDEX public.idx_audit_table IS 'Filter audit logs by table name - Loc theo ten bang';
-- Name: idx_batch_transactions_from_warehouse; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_batch_transactions_from_warehouse ON public.batch_transactions USING btree (from_warehouse_id);
-- Name: idx_batch_transactions_lot_id; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_batch_transactions_lot_id ON public.batch_transactions USING btree (lot_id);
-- Name: idx_batch_transactions_operation_type; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_batch_transactions_operation_type ON public.batch_transactions USING btree (operation_type);
-- Name: idx_batch_transactions_performed_at; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_batch_transactions_performed_at ON public.batch_transactions USING btree (performed_at DESC);
-- Name: idx_batch_transactions_reference; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_batch_transactions_reference ON public.batch_transactions USING btree (reference_number) WHERE (reference_number IS NOT NULL);
-- Name: idx_batch_transactions_to_warehouse; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_batch_transactions_to_warehouse ON public.batch_transactions USING btree (to_warehouse_id);
-- Name: idx_conflict_allocations_allocation; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_conflict_allocations_allocation ON public.thread_conflict_allocations USING btree (allocation_id);
-- Name: idx_conflict_allocations_conflict; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_conflict_allocations_conflict ON public.thread_conflict_allocations USING btree (conflict_id);
-- Name: idx_conflicts_created; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_conflicts_created ON public.thread_conflicts USING btree (created_at DESC);
-- Name: idx_conflicts_pending; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_conflicts_pending ON public.thread_conflicts USING btree (status) WHERE ((status)::text = 'PENDING'::text);
-- Name: idx_conflicts_status; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_conflicts_status ON public.thread_conflicts USING btree (status);
-- Name: idx_conflicts_thread_type; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_conflicts_thread_type ON public.thread_conflicts USING btree (thread_type_id);
-- Name: idx_movements_allocation; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_movements_allocation ON public.thread_movements USING btree (allocation_id);
-- Name: idx_movements_cone; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_movements_cone ON public.thread_movements USING btree (cone_id);
-- Name: idx_movements_created; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_movements_created ON public.thread_movements USING btree (created_at DESC);
-- Name: idx_movements_reference; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_movements_reference ON public.thread_movements USING btree (reference_type, reference_id);
-- Name: idx_movements_type; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_movements_type ON public.thread_movements USING btree (movement_type);
-- Name: idx_recovery_cone; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_recovery_cone ON public.thread_recovery USING btree (cone_id);
-- Name: idx_recovery_created; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_recovery_created ON public.thread_recovery USING btree (created_at DESC);
-- Name: idx_recovery_pending; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_recovery_pending ON public.thread_recovery USING btree (status) WHERE (status = ANY (ARRAY['INITIATED'::public.recovery_status, 'PENDING_WEIGH'::public.recovery_status, 'WEIGHED'::public.recovery_status]));
-- Name: idx_recovery_status; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_recovery_status ON public.thread_recovery USING btree (status);
-- Name: idx_thread_inventory_available; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_thread_inventory_available ON public.thread_inventory USING btree (status) WHERE (status = 'AVAILABLE'::public.cone_status);
-- Name: idx_thread_inventory_cone_id; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_thread_inventory_cone_id ON public.thread_inventory USING btree (cone_id);
-- Name: idx_thread_inventory_expiry; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_thread_inventory_expiry ON public.thread_inventory USING btree (expiry_date) WHERE (expiry_date IS NOT NULL);
-- Name: idx_thread_inventory_fefo; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_thread_inventory_fefo ON public.thread_inventory USING btree (is_partial DESC, expiry_date, received_date) WHERE (status = 'AVAILABLE'::public.cone_status);
-- Name: INDEX idx_thread_inventory_fefo; Type: COMMENT; Schema: public; Owner: -
COMMENT ON INDEX public.idx_thread_inventory_fefo IS 'FEFO composite index for allocation - partial cones first, then by expiry, then by received date';
-- Name: idx_thread_inventory_is_partial; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_thread_inventory_is_partial ON public.thread_inventory USING btree (is_partial) WHERE (is_partial = true);
-- Name: idx_thread_inventory_lot_id; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_thread_inventory_lot_id ON public.thread_inventory USING btree (lot_id) WHERE (lot_id IS NOT NULL);
-- Name: idx_thread_inventory_status; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_thread_inventory_status ON public.thread_inventory USING btree (status);
-- Name: idx_thread_inventory_thread_type; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_thread_inventory_thread_type ON public.thread_inventory USING btree (thread_type_id);
-- Name: idx_thread_inventory_warehouse; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_thread_inventory_warehouse ON public.thread_inventory USING btree (warehouse_id);
-- Name: thread_allocations audit_thread_allocations; Type: TRIGGER; Schema: public; Owner: -
CREATE TRIGGER audit_thread_allocations AFTER INSERT OR DELETE OR UPDATE ON public.thread_allocations FOR EACH ROW EXECUTE FUNCTION public.thread_audit_trigger_func();
-- Name: TRIGGER audit_thread_allocations ON thread_allocations; Type: COMMENT; Schema: public; Owner: -
COMMENT ON TRIGGER audit_thread_allocations ON public.thread_allocations IS 'Audit trigger for allocations - Trigger kiem toan phan bo';
-- Name: thread_inventory audit_thread_inventory; Type: TRIGGER; Schema: public; Owner: -
CREATE TRIGGER audit_thread_inventory AFTER INSERT OR DELETE OR UPDATE ON public.thread_inventory FOR EACH ROW EXECUTE FUNCTION public.thread_audit_trigger_func();
-- Name: TRIGGER audit_thread_inventory ON thread_inventory; Type: COMMENT; Schema: public; Owner: -
COMMENT ON TRIGGER audit_thread_inventory ON public.thread_inventory IS 'Audit trigger for inventory - Trigger kiem toan ton kho';
-- Name: thread_recovery audit_thread_recovery; Type: TRIGGER; Schema: public; Owner: -
CREATE TRIGGER audit_thread_recovery AFTER INSERT OR DELETE OR UPDATE ON public.thread_recovery FOR EACH ROW EXECUTE FUNCTION public.thread_audit_trigger_func();
-- Name: TRIGGER audit_thread_recovery ON thread_recovery; Type: COMMENT; Schema: public; Owner: -
COMMENT ON TRIGGER audit_thread_recovery ON public.thread_recovery IS 'Audit trigger for recovery - Trigger kiem toan thu hoi';
-- Name: thread_allocations update_thread_allocations_updated_at; Type: TRIGGER; Schema: public; Owner: -
CREATE TRIGGER update_thread_allocations_updated_at BEFORE UPDATE ON public.thread_allocations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- Name: thread_conflicts update_thread_conflicts_updated_at; Type: TRIGGER; Schema: public; Owner: -
CREATE TRIGGER update_thread_conflicts_updated_at BEFORE UPDATE ON public.thread_conflicts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- Name: thread_inventory update_thread_inventory_updated_at; Type: TRIGGER; Schema: public; Owner: -
CREATE TRIGGER update_thread_inventory_updated_at BEFORE UPDATE ON public.thread_inventory FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- Name: thread_recovery update_thread_recovery_updated_at; Type: TRIGGER; Schema: public; Owner: -
CREATE TRIGGER update_thread_recovery_updated_at BEFORE UPDATE ON public.thread_recovery FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- Name: batch_transactions batch_transactions_from_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.batch_transactions
    ADD CONSTRAINT batch_transactions_from_warehouse_id_fkey FOREIGN KEY (from_warehouse_id) REFERENCES public.warehouses(id);
-- Name: batch_transactions batch_transactions_lot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.batch_transactions
    ADD CONSTRAINT batch_transactions_lot_id_fkey FOREIGN KEY (lot_id) REFERENCES public.lots(id);
-- Name: batch_transactions batch_transactions_to_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.batch_transactions
    ADD CONSTRAINT batch_transactions_to_warehouse_id_fkey FOREIGN KEY (to_warehouse_id) REFERENCES public.warehouses(id);
-- Name: thread_allocation_cones thread_allocation_cones_allocation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.thread_allocation_cones
    ADD CONSTRAINT thread_allocation_cones_allocation_id_fkey FOREIGN KEY (allocation_id) REFERENCES public.thread_allocations(id) ON DELETE CASCADE;
-- Name: thread_allocation_cones thread_allocation_cones_cone_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.thread_allocation_cones
    ADD CONSTRAINT thread_allocation_cones_cone_id_fkey FOREIGN KEY (cone_id) REFERENCES public.thread_inventory(id);
-- Name: thread_allocations thread_allocations_split_from_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.thread_allocations
    ADD CONSTRAINT thread_allocations_split_from_id_fkey FOREIGN KEY (split_from_id) REFERENCES public.thread_allocations(id);
-- Name: thread_allocations thread_allocations_thread_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.thread_allocations
    ADD CONSTRAINT thread_allocations_thread_type_id_fkey FOREIGN KEY (thread_type_id) REFERENCES public.thread_types(id);
-- Name: thread_conflict_allocations thread_conflict_allocations_allocation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.thread_conflict_allocations
    ADD CONSTRAINT thread_conflict_allocations_allocation_id_fkey FOREIGN KEY (allocation_id) REFERENCES public.thread_allocations(id);
-- Name: thread_conflict_allocations thread_conflict_allocations_conflict_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.thread_conflict_allocations
    ADD CONSTRAINT thread_conflict_allocations_conflict_id_fkey FOREIGN KEY (conflict_id) REFERENCES public.thread_conflicts(id) ON DELETE CASCADE;
-- Name: thread_conflicts thread_conflicts_thread_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.thread_conflicts
    ADD CONSTRAINT thread_conflicts_thread_type_id_fkey FOREIGN KEY (thread_type_id) REFERENCES public.thread_types(id);
-- Name: thread_inventory thread_inventory_lot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.thread_inventory
    ADD CONSTRAINT thread_inventory_lot_id_fkey FOREIGN KEY (lot_id) REFERENCES public.lots(id);
-- Name: thread_inventory thread_inventory_thread_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.thread_inventory
    ADD CONSTRAINT thread_inventory_thread_type_id_fkey FOREIGN KEY (thread_type_id) REFERENCES public.thread_types(id);
-- Name: thread_inventory thread_inventory_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.thread_inventory
    ADD CONSTRAINT thread_inventory_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id);
-- Name: thread_movements thread_movements_allocation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.thread_movements
    ADD CONSTRAINT thread_movements_allocation_id_fkey FOREIGN KEY (allocation_id) REFERENCES public.thread_allocations(id);
-- Name: thread_movements thread_movements_cone_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.thread_movements
    ADD CONSTRAINT thread_movements_cone_id_fkey FOREIGN KEY (cone_id) REFERENCES public.thread_inventory(id);
-- Name: thread_recovery thread_recovery_cone_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.thread_recovery
    ADD CONSTRAINT thread_recovery_cone_id_fkey FOREIGN KEY (cone_id) REFERENCES public.thread_inventory(id);
-- PostgreSQL database dump complete
