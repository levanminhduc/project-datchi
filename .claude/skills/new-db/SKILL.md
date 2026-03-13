---
name: new-db
description: Create database migrations (tables, enums, triggers, indexes, RPC functions, views) for the Dat Chi Thread Inventory System. Use when adding or modifying database schema.
---

# Skill: /new-db

Tao database migration cho du an Dat Chi - Thread Inventory Management System.

Khi user goi `/new-db [mo ta]`, tuan thu TOAN BO huong dan ben duoi.

---

## File location

```
supabase/migrations/YYYYMMDDHHMMSS_action_table.sql
```

> **Naming format:** `YYYYMMDDHHMMSS_action_table.sql`
> - `YYYYMMDDHHMMSS` = timestamp khi tạo (VD: `20260313093000`)
> - `action` = `create`, `alter`, `add`, `drop` (mô tả hành động)
> - `table` = tên bảng chính bị ảnh hưởng
> - VD: `20260313093000_create_sub_arts.sql`, `20260314100000_alter_threads_add_color.sql`

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

COMMENT ON TABLE ten_bang IS 'Mô tả bảng bằng tiếng Việt';

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

## Advanced Templates

> Load `references/01-advanced-templates.md` khi cần RPC, View, hoặc Audit trigger.

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
