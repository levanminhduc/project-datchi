-- Master Data Tables: warehouses, suppliers, colors, thread_types, lots
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
-- Name: color_supplier; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.color_supplier (
    id integer NOT NULL,
    color_id integer NOT NULL,
    supplier_id integer NOT NULL,
    price_per_kg numeric(10,2),
    min_order_qty integer,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
-- Name: TABLE color_supplier; Type: COMMENT; Schema: public; Owner: -
COMMENT ON TABLE public.color_supplier IS 'Bảng liên kết màu-nhà cung cấp với thông tin giá - Color-Supplier junction with pricing';
-- Name: COLUMN color_supplier.id; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.color_supplier.id IS 'Khóa chính tự tăng';
-- Name: COLUMN color_supplier.color_id; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.color_supplier.color_id IS 'FK đến bảng colors - mã màu';
-- Name: COLUMN color_supplier.supplier_id; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.color_supplier.supplier_id IS 'FK đến bảng suppliers - mã nhà cung cấp';
-- Name: COLUMN color_supplier.price_per_kg; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.color_supplier.price_per_kg IS 'Giá mỗi kg (VND)';
-- Name: COLUMN color_supplier.min_order_qty; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.color_supplier.min_order_qty IS 'Số lượng đặt tối thiểu (kg)';
-- Name: COLUMN color_supplier.is_active; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.color_supplier.is_active IS 'Trạng thái hoạt động - TRUE=đang cung cấp, FALSE=ngừng cung cấp';
-- Name: COLUMN color_supplier.created_at; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.color_supplier.created_at IS 'Thời điểm tạo bản ghi';
-- Name: COLUMN color_supplier.updated_at; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.color_supplier.updated_at IS 'Thời điểm cập nhật gần nhất';
-- Name: color_supplier_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.color_supplier_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: color_supplier_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.color_supplier_id_seq OWNED BY public.color_supplier.id;
-- Name: colors; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.colors (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    hex_code character varying(7) NOT NULL,
    pantone_code character varying(20),
    ral_code character varying(20),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
-- Name: TABLE colors; Type: COMMENT; Schema: public; Owner: -
COMMENT ON TABLE public.colors IS 'Bảng danh mục màu sắc chuẩn - Colors master data';
-- Name: COLUMN colors.id; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.colors.id IS 'Khóa chính tự tăng';
-- Name: COLUMN colors.name; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.colors.name IS 'Tên màu (unique) - VD: Đỏ, Xanh dương';
-- Name: COLUMN colors.hex_code; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.colors.hex_code IS 'Mã màu Hex (#RRGGBB) - VD: #FF0000';
-- Name: COLUMN colors.pantone_code; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.colors.pantone_code IS 'Mã màu Pantone (tùy chọn) - VD: 186C';
-- Name: COLUMN colors.ral_code; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.colors.ral_code IS 'Mã màu RAL (tùy chọn) - VD: RAL 3020';
-- Name: COLUMN colors.is_active; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.colors.is_active IS 'Trạng thái hoạt động - TRUE=đang dùng, FALSE=ngừng dùng';
-- Name: COLUMN colors.created_at; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.colors.created_at IS 'Thời điểm tạo bản ghi';
-- Name: COLUMN colors.updated_at; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.colors.updated_at IS 'Thời điểm cập nhật gần nhất';
-- Name: colors_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.colors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: colors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.colors_id_seq OWNED BY public.colors.id;
-- Name: lots; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.lots (
    id integer NOT NULL,
    lot_number character varying(50) NOT NULL,
    thread_type_id integer NOT NULL,
    warehouse_id integer NOT NULL,
    production_date date,
    expiry_date date,
    supplier character varying(200),
    total_cones integer DEFAULT 0 NOT NULL,
    available_cones integer DEFAULT 0 NOT NULL,
    status public.lot_status DEFAULT 'ACTIVE'::public.lot_status NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    supplier_id integer
);
-- Name: TABLE lots; Type: COMMENT; Schema: public; Owner: -
COMMENT ON TABLE public.lots IS 'Bảng quản lý lô hàng chỉ - theo dõi vòng đời từ nhập đến xuất kho';
-- Name: COLUMN lots.id; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.lots.id IS 'Khóa chính tự tăng';
-- Name: COLUMN lots.lot_number; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.lots.lot_number IS 'Mã lô duy nhất (VD: LOT-2026-001)';
-- Name: COLUMN lots.thread_type_id; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.lots.thread_type_id IS 'Tham chiếu đến loại chỉ trong bảng thread_types';
-- Name: COLUMN lots.warehouse_id; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.lots.warehouse_id IS 'Kho hiện tại đang chứa lô hàng';
-- Name: COLUMN lots.production_date; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.lots.production_date IS 'Ngày sản xuất của lô hàng';
-- Name: COLUMN lots.expiry_date; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.lots.expiry_date IS 'Ngày hết hạn sử dụng';
-- Name: COLUMN lots.supplier; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.lots.supplier IS 'Tên nhà cung cấp';
-- Name: COLUMN lots.total_cones; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.lots.total_cones IS 'Tổng số cuộn trong lô (denormalized để tăng hiệu suất)';
-- Name: COLUMN lots.available_cones; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.lots.available_cones IS 'Số cuộn còn sẵn sàng sử dụng (chưa xuất kho)';
-- Name: COLUMN lots.status; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.lots.status IS 'Trạng thái lô: ACTIVE=đang dùng, DEPLETED=đã hết, EXPIRED=hết hạn, QUARANTINE=cách ly';
-- Name: COLUMN lots.notes; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.lots.notes IS 'Ghi chú thêm về lô hàng';
-- Name: COLUMN lots.created_at; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.lots.created_at IS 'Thời điểm tạo bản ghi';
-- Name: COLUMN lots.updated_at; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.lots.updated_at IS 'Thời điểm cập nhật gần nhất';
-- Name: COLUMN lots.supplier_id; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.lots.supplier_id IS 'FK đến bảng suppliers (normalized) - nullable trong giai đoạn migration';
-- Name: lots_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.lots_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: lots_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.lots_id_seq OWNED BY public.lots.id;
-- Name: suppliers; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.suppliers (
    id integer NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(200) NOT NULL,
    contact_name character varying(100),
    phone character varying(20),
    email character varying(100),
    address text,
    lead_time_days integer DEFAULT 7,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
-- Name: TABLE suppliers; Type: COMMENT; Schema: public; Owner: -
COMMENT ON TABLE public.suppliers IS 'Bảng danh mục nhà cung cấp - Suppliers master data';
-- Name: COLUMN suppliers.id; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.suppliers.id IS 'Khóa chính tự tăng';
-- Name: COLUMN suppliers.code; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.suppliers.code IS 'Mã nhà cung cấp (unique) - VD: SUP-001, NCC-ABC';
-- Name: COLUMN suppliers.name; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.suppliers.name IS 'Tên đầy đủ nhà cung cấp';
-- Name: COLUMN suppliers.contact_name; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.suppliers.contact_name IS 'Tên người liên hệ';
-- Name: COLUMN suppliers.phone; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.suppliers.phone IS 'Số điện thoại liên hệ';
-- Name: COLUMN suppliers.email; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.suppliers.email IS 'Email liên hệ';
-- Name: COLUMN suppliers.address; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.suppliers.address IS 'Địa chỉ nhà cung cấp';
-- Name: COLUMN suppliers.lead_time_days; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.suppliers.lead_time_days IS 'Thời gian giao hàng tiêu chuẩn (ngày)';
-- Name: COLUMN suppliers.is_active; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.suppliers.is_active IS 'Trạng thái hoạt động - TRUE=đang hợp tác, FALSE=ngừng hợp tác';
-- Name: COLUMN suppliers.created_at; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.suppliers.created_at IS 'Thời điểm tạo bản ghi';
-- Name: COLUMN suppliers.updated_at; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.suppliers.updated_at IS 'Thời điểm cập nhật gần nhất';
-- Name: suppliers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.suppliers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: suppliers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.suppliers_id_seq OWNED BY public.suppliers.id;
-- Name: thread_types; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.thread_types (
    id integer NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(200) NOT NULL,
    color character varying(50),
    color_code character varying(7),
    material public.thread_material DEFAULT 'polyester'::public.thread_material,
    tex_number numeric(8,2),
    density_grams_per_meter numeric(10,6) NOT NULL,
    meters_per_cone numeric(12,2),
    supplier character varying(200),
    reorder_level_meters numeric(12,2) DEFAULT 1000,
    lead_time_days integer DEFAULT 7,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    color_id integer,
    supplier_id integer,
    color_supplier_id integer
);
-- Name: TABLE thread_types; Type: COMMENT; Schema: public; Owner: -
COMMENT ON TABLE public.thread_types IS 'Master data for thread specifications - Bảng dữ liệu chủ về thông số chỉ may';
-- Name: COLUMN thread_types.code; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_types.code IS 'Thread SKU code - Mã SKU chỉ (unique)';
-- Name: COLUMN thread_types.name; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_types.name IS 'Display name - Tên hiển thị';
-- Name: COLUMN thread_types.color; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_types.color IS 'Color name - Tên màu sắc';
-- Name: COLUMN thread_types.color_code; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_types.color_code IS 'Hex color code - Mã màu Hex (#RRGGBB)';
-- Name: COLUMN thread_types.material; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_types.material IS 'Thread material type - Loại chất liệu chỉ';
-- Name: COLUMN thread_types.tex_number; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_types.tex_number IS 'TEX number (thread thickness) - Độ mảnh TEX';
-- Name: COLUMN thread_types.density_grams_per_meter; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_types.density_grams_per_meter IS 'Weight-to-length conversion factor - Hệ số chuyển đổi khối lượng sang chiều dài';
-- Name: COLUMN thread_types.meters_per_cone; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_types.meters_per_cone IS 'Standard meters per full cone - Số mét tiêu chuẩn mỗi cuộn đầy';
-- Name: COLUMN thread_types.supplier; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_types.supplier IS 'Supplier name - Tên nhà cung cấp';
-- Name: COLUMN thread_types.reorder_level_meters; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_types.reorder_level_meters IS 'Reorder alert threshold in meters - Ngưỡng cảnh báo đặt hàng lại (mét)';
-- Name: COLUMN thread_types.lead_time_days; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_types.lead_time_days IS 'Supplier lead time in days - Thời gian giao hàng NCC (ngày)';
-- Name: COLUMN thread_types.is_active; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_types.is_active IS 'Active status - Trạng thái hoạt động';
-- Name: COLUMN thread_types.color_id; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_types.color_id IS 'FK đến bảng colors (normalized) - nullable trong giai đoạn migration';
-- Name: COLUMN thread_types.supplier_id; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_types.supplier_id IS 'FK đến bảng suppliers (normalized) - nullable trong giai đoạn migration';
-- Name: COLUMN thread_types.color_supplier_id; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.thread_types.color_supplier_id IS 'FK đến bảng color_supplier - tham chiếu giá màu-NCC (tùy chọn)';
-- Name: thread_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.thread_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: thread_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.thread_types_id_seq OWNED BY public.thread_types.id;
-- Name: warehouses; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.warehouses (
    id integer NOT NULL,
    code character varying(20) NOT NULL,
    name character varying(100) NOT NULL,
    location character varying(200),
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    parent_id integer,
    type character varying(20) DEFAULT 'STORAGE'::character varying,
    sort_order integer DEFAULT 0,
    CONSTRAINT chk_warehouses_no_self_parent CHECK (((parent_id IS NULL) OR (parent_id <> id))),
    CONSTRAINT chk_warehouses_type CHECK (((type)::text = ANY ((ARRAY['LOCATION'::character varying, 'STORAGE'::character varying])::text[])))
);
-- Name: TABLE warehouses; Type: COMMENT; Schema: public; Owner: -
COMMENT ON TABLE public.warehouses IS 'Storage locations for thread inventory management';
-- Name: COLUMN warehouses.code; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.warehouses.code IS 'Unique warehouse code (e.g., WH-01, WH-MAIN)';
-- Name: COLUMN warehouses.name; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.warehouses.name IS 'Display name for the warehouse';
-- Name: COLUMN warehouses.location; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.warehouses.location IS 'Physical address or location description';
-- Name: COLUMN warehouses.is_active; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.warehouses.is_active IS 'Whether the warehouse is currently active';
-- Name: COLUMN warehouses.parent_id; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.warehouses.parent_id IS 'Parent warehouse ID. NULL for LOCATION (top-level), references LOCATION for STORAGE';
-- Name: COLUMN warehouses.type; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.warehouses.type IS 'Warehouse type: LOCATION (site/địa điểm) or STORAGE (kho lưu trữ thực tế)';
-- Name: COLUMN warehouses.sort_order; Type: COMMENT; Schema: public; Owner: -
COMMENT ON COLUMN public.warehouses.sort_order IS 'Display order within same parent level (lower = first)';
-- Name: warehouses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.warehouses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: warehouses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.warehouses_id_seq OWNED BY public.warehouses.id;
-- Name: color_supplier id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.color_supplier ALTER COLUMN id SET DEFAULT nextval('public.color_supplier_id_seq'::regclass);
-- Name: colors id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.colors ALTER COLUMN id SET DEFAULT nextval('public.colors_id_seq'::regclass);
-- Name: lots id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.lots ALTER COLUMN id SET DEFAULT nextval('public.lots_id_seq'::regclass);
-- Name: suppliers id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.suppliers ALTER COLUMN id SET DEFAULT nextval('public.suppliers_id_seq'::regclass);
-- Name: thread_types id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.thread_types ALTER COLUMN id SET DEFAULT nextval('public.thread_types_id_seq'::regclass);
-- Name: warehouses id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.warehouses ALTER COLUMN id SET DEFAULT nextval('public.warehouses_id_seq'::regclass);
-- Name: color_supplier color_supplier_color_id_supplier_id_key; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.color_supplier
    ADD CONSTRAINT color_supplier_color_id_supplier_id_key UNIQUE (color_id, supplier_id);
-- Name: color_supplier color_supplier_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.color_supplier
    ADD CONSTRAINT color_supplier_pkey PRIMARY KEY (id);
-- Name: colors colors_name_key; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.colors
    ADD CONSTRAINT colors_name_key UNIQUE (name);
-- Name: colors colors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.colors
    ADD CONSTRAINT colors_pkey PRIMARY KEY (id);
-- Name: lots lots_lot_number_key; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.lots
    ADD CONSTRAINT lots_lot_number_key UNIQUE (lot_number);
-- Name: lots lots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.lots
    ADD CONSTRAINT lots_pkey PRIMARY KEY (id);
-- Name: suppliers suppliers_code_key; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_code_key UNIQUE (code);
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);
-- Name: thread_types thread_types_code_key; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.thread_types
    ADD CONSTRAINT thread_types_code_key UNIQUE (code);
-- Name: thread_types thread_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.thread_types
    ADD CONSTRAINT thread_types_pkey PRIMARY KEY (id);
-- Name: warehouses warehouses_code_key; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.warehouses
    ADD CONSTRAINT warehouses_code_key UNIQUE (code);
-- Name: warehouses warehouses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.warehouses
    ADD CONSTRAINT warehouses_pkey PRIMARY KEY (id);
-- Name: idx_color_supplier_color_id; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_color_supplier_color_id ON public.color_supplier USING btree (color_id);
-- Name: idx_color_supplier_is_active; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_color_supplier_is_active ON public.color_supplier USING btree (is_active) WHERE (is_active = true);
-- Name: idx_color_supplier_supplier_id; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_color_supplier_supplier_id ON public.color_supplier USING btree (supplier_id);
-- Name: idx_colors_is_active; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_colors_is_active ON public.colors USING btree (is_active) WHERE (is_active = true);
-- Name: idx_colors_name; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_colors_name ON public.colors USING btree (name);
-- Name: idx_lots_created_at; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_lots_created_at ON public.lots USING btree (created_at DESC);
-- Name: idx_lots_lot_number; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_lots_lot_number ON public.lots USING btree (lot_number);
-- Name: idx_lots_status; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_lots_status ON public.lots USING btree (status);
-- Name: idx_lots_supplier_id; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_lots_supplier_id ON public.lots USING btree (supplier_id);
-- Name: idx_lots_thread_type_id; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_lots_thread_type_id ON public.lots USING btree (thread_type_id);
-- Name: idx_lots_warehouse_id; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_lots_warehouse_id ON public.lots USING btree (warehouse_id);
-- Name: idx_suppliers_code; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_suppliers_code ON public.suppliers USING btree (code);
-- Name: idx_suppliers_is_active; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_suppliers_is_active ON public.suppliers USING btree (is_active) WHERE (is_active = true);
-- Name: idx_suppliers_name; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_suppliers_name ON public.suppliers USING btree (name);
-- Name: idx_thread_types_active; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_thread_types_active ON public.thread_types USING btree (is_active) WHERE (is_active = true);
-- Name: idx_thread_types_code; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_thread_types_code ON public.thread_types USING btree (code);
-- Name: idx_thread_types_color; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_thread_types_color ON public.thread_types USING btree (color);
-- Name: idx_thread_types_color_id; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_thread_types_color_id ON public.thread_types USING btree (color_id);
-- Name: idx_thread_types_color_supplier_id; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_thread_types_color_supplier_id ON public.thread_types USING btree (color_supplier_id);
-- Name: idx_thread_types_material; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_thread_types_material ON public.thread_types USING btree (material);
-- Name: idx_thread_types_supplier; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_thread_types_supplier ON public.thread_types USING btree (supplier);
-- Name: idx_thread_types_supplier_id; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_thread_types_supplier_id ON public.thread_types USING btree (supplier_id);
-- Name: idx_warehouses_active; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_warehouses_active ON public.warehouses USING btree (is_active);
-- Name: idx_warehouses_code; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_warehouses_code ON public.warehouses USING btree (code);
-- Name: idx_warehouses_parent; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_warehouses_parent ON public.warehouses USING btree (parent_id);
-- Name: idx_warehouses_sort; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_warehouses_sort ON public.warehouses USING btree (parent_id, sort_order);
-- Name: idx_warehouses_type; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_warehouses_type ON public.warehouses USING btree (type);
-- Name: thread_types audit_thread_types; Type: TRIGGER; Schema: public; Owner: -
CREATE TRIGGER audit_thread_types AFTER INSERT OR DELETE OR UPDATE ON public.thread_types FOR EACH ROW EXECUTE FUNCTION public.thread_audit_trigger_func();
-- Name: TRIGGER audit_thread_types ON thread_types; Type: COMMENT; Schema: public; Owner: -
COMMENT ON TRIGGER audit_thread_types ON public.thread_types IS 'Audit trigger for thread types - Trigger kiem toan loai chi';
-- Name: color_supplier trigger_color_supplier_updated_at; Type: TRIGGER; Schema: public; Owner: -
CREATE TRIGGER trigger_color_supplier_updated_at BEFORE UPDATE ON public.color_supplier FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- Name: colors trigger_colors_updated_at; Type: TRIGGER; Schema: public; Owner: -
CREATE TRIGGER trigger_colors_updated_at BEFORE UPDATE ON public.colors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- Name: lots trigger_lots_updated_at; Type: TRIGGER; Schema: public; Owner: -
CREATE TRIGGER trigger_lots_updated_at BEFORE UPDATE ON public.lots FOR EACH ROW EXECUTE FUNCTION public.update_lots_updated_at();
-- Name: suppliers trigger_suppliers_updated_at; Type: TRIGGER; Schema: public; Owner: -
CREATE TRIGGER trigger_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- Name: thread_types update_thread_types_updated_at; Type: TRIGGER; Schema: public; Owner: -
CREATE TRIGGER update_thread_types_updated_at BEFORE UPDATE ON public.thread_types FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- Name: warehouses update_warehouses_updated_at; Type: TRIGGER; Schema: public; Owner: -
CREATE TRIGGER update_warehouses_updated_at BEFORE UPDATE ON public.warehouses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- Name: color_supplier color_supplier_color_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.color_supplier
    ADD CONSTRAINT color_supplier_color_id_fkey FOREIGN KEY (color_id) REFERENCES public.colors(id) ON DELETE RESTRICT;
-- Name: color_supplier color_supplier_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.color_supplier
    ADD CONSTRAINT color_supplier_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE RESTRICT;
-- Name: warehouses fk_warehouses_parent; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.warehouses
    ADD CONSTRAINT fk_warehouses_parent FOREIGN KEY (parent_id) REFERENCES public.warehouses(id) ON DELETE SET NULL;
-- Name: lots lots_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.lots
    ADD CONSTRAINT lots_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE SET NULL;
-- Name: lots lots_thread_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.lots
    ADD CONSTRAINT lots_thread_type_id_fkey FOREIGN KEY (thread_type_id) REFERENCES public.thread_types(id);
-- Name: lots lots_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.lots
    ADD CONSTRAINT lots_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id);
-- Name: thread_types thread_types_color_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.thread_types
    ADD CONSTRAINT thread_types_color_id_fkey FOREIGN KEY (color_id) REFERENCES public.colors(id) ON DELETE SET NULL;
-- Name: thread_types thread_types_color_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.thread_types
    ADD CONSTRAINT thread_types_color_supplier_id_fkey FOREIGN KEY (color_supplier_id) REFERENCES public.color_supplier(id) ON DELETE SET NULL;
-- Name: thread_types thread_types_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.thread_types
    ADD CONSTRAINT thread_types_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE SET NULL;
-- PostgreSQL database dump complete
