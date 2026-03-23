-- Auth Domain Tables: employees, roles, permissions
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
-- Name: employee_permissions; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.employee_permissions (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    permission_id integer NOT NULL,
    granted boolean DEFAULT true,
    assigned_by integer,
    assigned_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone
);
-- Name: employee_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.employee_permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: employee_permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.employee_permissions_id_seq OWNED BY public.employee_permissions.id;
-- Name: employee_refresh_tokens; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.employee_refresh_tokens (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    token_hash text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);
-- Name: employee_refresh_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.employee_refresh_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: employee_refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.employee_refresh_tokens_id_seq OWNED BY public.employee_refresh_tokens.id;
-- Name: employee_roles; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.employee_roles (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    role_id integer NOT NULL,
    assigned_by integer,
    assigned_at timestamp with time zone DEFAULT now()
);
-- Name: employee_roles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.employee_roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: employee_roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.employee_roles_id_seq OWNED BY public.employee_roles.id;
-- Name: employees; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.employees (
    id integer NOT NULL,
    employee_id character varying(50) NOT NULL,
    full_name character varying(255) NOT NULL,
    department character varying(100),
    chuc_vu character varying(50) DEFAULT 'nhan_vien'::character varying,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    password_hash text,
    must_change_password boolean DEFAULT false,
    password_changed_at timestamp with time zone,
    failed_login_attempts integer DEFAULT 0,
    locked_until timestamp with time zone,
    last_login_at timestamp with time zone,
    refresh_token text,
    refresh_token_expires_at timestamp with time zone
);
-- Name: employees_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.employees_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: employees_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.employees_id_seq OWNED BY public.employees.id;
-- Name: permissions; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.permissions (
    id integer NOT NULL,
    code character varying(100) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    module character varying(50) NOT NULL,
    resource character varying(50) NOT NULL,
    action public.permission_action NOT NULL,
    route_path character varying(255),
    is_page_access boolean DEFAULT false,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
-- Name: permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.permissions_id_seq OWNED BY public.permissions.id;
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.role_permissions (
    id integer NOT NULL,
    role_id integer NOT NULL,
    permission_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);
-- Name: role_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.role_permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: role_permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.role_permissions_id_seq OWNED BY public.role_permissions.id;
-- Name: roles; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.roles (
    id integer NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    level integer DEFAULT 99,
    is_system boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;
-- Name: employee_permissions id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.employee_permissions ALTER COLUMN id SET DEFAULT nextval('public.employee_permissions_id_seq'::regclass);
-- Name: employee_refresh_tokens id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.employee_refresh_tokens ALTER COLUMN id SET DEFAULT nextval('public.employee_refresh_tokens_id_seq'::regclass);
-- Name: employee_roles id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.employee_roles ALTER COLUMN id SET DEFAULT nextval('public.employee_roles_id_seq'::regclass);
-- Name: employees id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.employees ALTER COLUMN id SET DEFAULT nextval('public.employees_id_seq'::regclass);
-- Name: permissions id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.permissions ALTER COLUMN id SET DEFAULT nextval('public.permissions_id_seq'::regclass);
-- Name: role_permissions id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.role_permissions ALTER COLUMN id SET DEFAULT nextval('public.role_permissions_id_seq'::regclass);
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);
-- Name: employee_permissions employee_permissions_employee_id_permission_id_key; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.employee_permissions
    ADD CONSTRAINT employee_permissions_employee_id_permission_id_key UNIQUE (employee_id, permission_id);
-- Name: employee_permissions employee_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.employee_permissions
    ADD CONSTRAINT employee_permissions_pkey PRIMARY KEY (id);
-- Name: employee_refresh_tokens employee_refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.employee_refresh_tokens
    ADD CONSTRAINT employee_refresh_tokens_pkey PRIMARY KEY (id);
-- Name: employee_roles employee_roles_employee_id_role_id_key; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.employee_roles
    ADD CONSTRAINT employee_roles_employee_id_role_id_key UNIQUE (employee_id, role_id);
-- Name: employee_roles employee_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.employee_roles
    ADD CONSTRAINT employee_roles_pkey PRIMARY KEY (id);
-- Name: employees employees_employee_id_key; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_employee_id_key UNIQUE (employee_id);
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);
-- Name: permissions permissions_code_key; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_code_key UNIQUE (code);
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);
-- Name: role_permissions role_permissions_role_id_permission_id_key; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_permission_id_key UNIQUE (role_id, permission_id);
-- Name: roles roles_code_key; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_code_key UNIQUE (code);
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);
-- Name: idx_employee_permissions_employee; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_employee_permissions_employee ON public.employee_permissions USING btree (employee_id);
-- Name: idx_employee_permissions_permission; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_employee_permissions_permission ON public.employee_permissions USING btree (permission_id);
-- Name: idx_employee_roles_employee; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_employee_roles_employee ON public.employee_roles USING btree (employee_id);
-- Name: idx_employee_roles_role; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_employee_roles_role ON public.employee_roles USING btree (role_id);
-- Name: idx_employees_department; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_employees_department ON public.employees USING btree (department);
-- Name: idx_employees_employee_id; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_employees_employee_id ON public.employees USING btree (employee_id);
-- Name: idx_employees_is_active; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_employees_is_active ON public.employees USING btree (is_active);
-- Name: idx_employees_refresh_token; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_employees_refresh_token ON public.employees USING btree (refresh_token);
-- Name: idx_permissions_code; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_permissions_code ON public.permissions USING btree (code);
-- Name: idx_permissions_module; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_permissions_module ON public.permissions USING btree (module);
-- Name: idx_permissions_route; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_permissions_route ON public.permissions USING btree (route_path);
-- Name: idx_refresh_tokens_employee; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_refresh_tokens_employee ON public.employee_refresh_tokens USING btree (employee_id);
-- Name: idx_refresh_tokens_expires; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_refresh_tokens_expires ON public.employee_refresh_tokens USING btree (expires_at);
-- Name: idx_role_permissions_permission; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_role_permissions_permission ON public.role_permissions USING btree (permission_id);
-- Name: idx_role_permissions_role; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_role_permissions_role ON public.role_permissions USING btree (role_id);
-- Name: employees update_employees_updated_at; Type: TRIGGER; Schema: public; Owner: -
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- Name: employee_permissions employee_permissions_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.employee_permissions
    ADD CONSTRAINT employee_permissions_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.employees(id);
-- Name: employee_permissions employee_permissions_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.employee_permissions
    ADD CONSTRAINT employee_permissions_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;
-- Name: employee_permissions employee_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.employee_permissions
    ADD CONSTRAINT employee_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;
-- Name: employee_refresh_tokens employee_refresh_tokens_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.employee_refresh_tokens
    ADD CONSTRAINT employee_refresh_tokens_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;
-- Name: employee_roles employee_roles_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.employee_roles
    ADD CONSTRAINT employee_roles_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.employees(id);
-- Name: employee_roles employee_roles_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.employee_roles
    ADD CONSTRAINT employee_roles_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;
-- Name: employee_roles employee_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.employee_roles
    ADD CONSTRAINT employee_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;
-- Name: role_permissions role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;
-- PostgreSQL database dump complete
