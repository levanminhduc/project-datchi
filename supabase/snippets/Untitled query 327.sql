create table public.employees (
  id serial not null,
  employee_id character varying(50) not null,
  full_name character varying(255) not null,
  cccd_hash character varying(255) not null,
  department character varying(100) not null,
  chuc_vu character varying(50) not null default 'nhan_vien'::character varying,
  phone_number character varying(15) null,
  is_active boolean null default true,
  created_at timestamp without time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp without time zone null default CURRENT_TIMESTAMP,
  must_change_password boolean null default false,
  password_changed_at timestamp without time zone null,
  failed_login_attempts integer null default 0,
  locked_until timestamp without time zone null,
  password_hash text null,
  password_version integer not null default 0,
  last_password_change_at timestamp with time zone null,
  recovery_fail_count integer not null default 0,
  recovery_locked_until timestamp with time zone null,
  constraint employees_pkey primary key (id),
  constraint employees_employee_id_key unique (employee_id),
  constraint employees_chuc_vu_check check (
    (
      (chuc_vu)::text = any (
        (
          array[
            'admin'::character varying,
            'giam_doc'::character varying,
            'ke_toan'::character varying,
            'nguoi_lap_bieu'::character varying,
            'truong_phong'::character varying,
            'to_truong'::character varying,
            'nhan_vien'::character varying,
            'van_phong'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_employees_active on public.employees using btree (is_active, employee_id) TABLESPACE pg_default;

create index IF not exists idx_employees_dept_role on public.employees using btree (department, chuc_vu) TABLESPACE pg_default;

create index IF not exists idx_employees_employee_id on public.employees using btree (employee_id) TABLESPACE pg_default;

create index IF not exists idx_employees_password_version on public.employees using btree (employee_id, password_version) TABLESPACE pg_default
where
  (password_hash is not null);

create index IF not exists idx_employees_recovery_locked on public.employees using btree (recovery_locked_until) TABLESPACE pg_default
where
  (recovery_locked_until is not null);