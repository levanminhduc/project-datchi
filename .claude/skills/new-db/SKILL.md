# Skill: /new-db

Tao database migration cho du an Dat Chi - Thread Inventory Management System.

Khi user goi `/new-db [mo ta]`, tuan thu TOAN BO huong dan ben duoi.

---

## File location

```
supabase/migrations/YYYYMMDD_ten_tinh_nang.sql
```

---

## Quy tac naming

| Doi tuong | Quy tac | Vi du |
|-----------|---------|-------|
| Table | `snake_case` | `thread_colors`, `inventory_logs` |
| View | prefix `v_` | `v_inventory_summary` |
| Function | prefix `fn_` | `fn_calculate_stock` |
| Trigger (updated_at) | `trigger_[table]_updated_at` | `trigger_thread_colors_updated_at` |
| Trigger (audit) | `trigger_[table]_audit` | `trigger_thread_colors_audit` |
| ENUM type | lowercase name, UPPERCASE values | `CREATE TYPE ten_status AS ENUM ('DRAFT', 'CONFIRMED')` |
| Index | `idx_[table]_[column]` | `idx_thread_colors_code` |
| PK | `SERIAL` (KHONG phai UUID) | `id SERIAL PRIMARY KEY` |
| FK | inline `REFERENCES` | `REFERENCES table(id) ON DELETE ...` |
| Params (RPC) | prefix `p_` | `p_param1 INTEGER` |
| Variables (RPC) | prefix `v_` | `v_result RECORD` |
| Comment | `COMMENT ON` bang tieng Viet | `COMMENT ON TABLE ten_bang IS 'Mo ta';` |

---

## Quy tac chung

- LUON co `created_at TIMESTAMPTZ DEFAULT NOW()`, `updated_at TIMESTAMPTZ DEFAULT NOW()`
- Soft delete: `deleted_at TIMESTAMPTZ DEFAULT NULL`
- Cuoi migration: `NOTIFY pgrst, 'reload schema';`
- Wrap migration trong `BEGIN;` / `COMMIT;`
- `ALTER PUBLICATION supabase_realtime ADD TABLE ten_bang;` (neu can realtime)

---

## Template - Basic Table

```sql
BEGIN;

DO $$ BEGIN
    CREATE TYPE ten_status AS ENUM ('DRAFT', 'CONFIRMED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS ten_bang (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    status ten_status NOT NULL DEFAULT 'DRAFT',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL
);

COMMENT ON TABLE ten_bang IS 'Mo ta bang bang tieng Viet';

CREATE TRIGGER trigger_ten_bang_updated_at
    BEFORE UPDATE ON ten_bang
    FOR EACH ROW
    EXECUTE FUNCTION fn_update_updated_at_column();

CREATE INDEX idx_ten_bang_status ON ten_bang(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_ten_bang_code ON ten_bang(code);

ALTER PUBLICATION supabase_realtime ADD TABLE ten_bang;

NOTIFY pgrst, 'reload schema';

COMMIT;
```

---

## Template - ENUM

```sql
DO $$ BEGIN
    CREATE TYPE ten_status AS ENUM ('DRAFT', 'CONFIRMED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
```

Them value sau:
```sql
ALTER TYPE ten_status ADD VALUE IF NOT EXISTS 'NEW_VALUE';
```

---

## Template - RPC Function

```sql
CREATE OR REPLACE FUNCTION fn_verb_noun(
    p_param1 INTEGER,
    p_param2 TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result RECORD;
    v_count INTEGER;
BEGIN
    SELECT * INTO v_result
    FROM ten_bang
    WHERE id = p_param1
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'message', 'Khong tim thay');
    END IF;

    UPDATE ten_bang SET status = 'CONFIRMED' WHERE id = p_param1;

    RETURN json_build_object('success', true, 'data', row_to_json(v_result), 'message', 'Thanh cong');

EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'fn_verb_noun error: %', SQLERRM;
    RETURN json_build_object('success', false, 'message', 'Loi xu ly yeu cau');
END;
$$;
```

---

## Template - View

```sql
CREATE OR REPLACE VIEW v_ten_summary AS
WITH base AS (
    SELECT t.*, tt.name AS type_name
    FROM ten_bang t
    LEFT JOIN thread_types tt ON t.thread_type_id = tt.id
    WHERE t.deleted_at IS NULL
)
SELECT * FROM base;

COMMENT ON VIEW v_ten_summary IS 'View tong hop';
```

---

## Template - Audit Trigger

```sql
CREATE TRIGGER trigger_ten_bang_audit
    AFTER INSERT OR UPDATE OR DELETE ON ten_bang
    FOR EACH ROW
    EXECUTE FUNCTION fn_thread_audit_trigger_func();
```

---

## CHECKLIST TRUOC KHI HOAN THANH

- [ ] Migration wrapped trong `BEGIN;`/`COMMIT;` block
- [ ] Co `created_at`, `updated_at`, trigger `fn_update_updated_at_column()`
- [ ] ENUM dung `CREATE TYPE` voi values UPPERCASE
- [ ] Soft delete co `deleted_at TIMESTAMPTZ`
- [ ] Index cho cac cot filter thuong dung
- [ ] `NOTIFY pgrst, 'reload schema'` cuoi migration
- [ ] `ALTER PUBLICATION supabase_realtime ADD TABLE` (neu can realtime)
- [ ] RPC functions co prefix `fn_`, params prefix `p_`, vars prefix `v_`
- [ ] COMMENT ON TABLE/COLUMN bang tieng Viet
