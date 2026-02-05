# Supabase Database Layer

PostgreSQL database với Supabase. 28 migrations + seed data.

## STRUCTURE

```
supabase/
├── migrations/           # 28 SQL migrations (timestamp-prefixed)
│   ├── 20240100000000_employees.sql           # Base employees table
│   ├── 20240101000001_thread_types.sql        # Thread type master data
│   ├── 20240101000002_warehouses.sql          # Warehouse locations
│   ├── 20240101000003_thread_inventory.sql    # Individual cone tracking
│   ├── 20240101000004_thread_allocations.sql  # Allocation records
│   ├── 20240101000005_thread_movements.sql    # Inventory movements
│   ├── 20240101000006_thread_recovery.sql     # Partial cone recovery
│   ├── 20240101000007_thread_conflicts.sql    # Allocation conflicts
│   ├── 20240101000008_thread_audit.sql        # Audit trail
│   ├── 20240101000009_rpc_allocate.sql        # RPC: Allocate threads
│   ├── 20240101000010_rpc_issue.sql           # RPC: Issue threads
│   ├── 20240101000011_rpc_recover.sql         # RPC: Recover partial cones
│   ├── 20240101000012_realtime_enable.sql     # Realtime subscriptions
│   ├── 20240101000013_rpc_split.sql           # RPC: Split cones
│   ├── 20240101000014_warehouse_hierarchy.sql # Warehouse hierarchy
│   ├── 20240101000015a_..._enums.sql          # Request workflow enums
│   ├── 20240101000015b_..._columns.sql        # Request workflow columns
│   ├── 20240101000016_lots.sql                # Lot tracking table
│   ├── 20240101000017_batch_transactions.sql  # Batch transaction logs
│   ├── 20240101000018_inventory_lot_id.sql    # Lot ID in inventory
│   ├── 20240101000019_migrate_lot_data.sql    # Lot data migration
│   ├── 20240101000020_colors.sql              # Color master data
│   ├── 20240101000021_suppliers.sql           # Supplier master data
│   ├── 20240101000022_color_supplier.sql      # Color-Supplier junction
│   ├── 20240101000023_thread_types_fks.sql    # Thread types FKs
│   ├── 20240101000024_populate_normalized.sql # Data normalization
│   ├── 20240101000025_auth_permissions.sql    # Auth & RBAC system
│   └── create_positions_table.sql             # Employee positions
├── seed/                 # Seed data for development
│   ├── thread_seed.sql           # Sample thread types & inventory
│   └── warehouse_hierarchy_seed.sql  # Warehouse structure
└── snippets/             # Utility SQL snippets
```

## CORE TABLES

### Thread Domain
| Table | Purpose |
|-------|---------|
| `thread_types` | Master data: thread specifications |
| `thread_inventory` | Individual cone tracking (dual UoM) |
| `thread_allocations` | Production order allocations |
| `thread_movements` | Receive/issue/transfer logs |
| `thread_recovery` | Partial cone recovery records |
| `thread_conflicts` | Allocation conflict resolution |
| `thread_audit` | Complete audit trail |

### Master Data
| Table | Purpose |
|-------|---------|
| `colors` | Color definitions (code, name, hex) |
| `suppliers` | Supplier master data |
| `warehouses` | Warehouse locations + hierarchy |
| `lots` | Lot/batch tracking |

### Auth & HR
| Table | Purpose |
|-------|---------|
| `employees` | Employee + auth data |
| `positions` | Job positions |
| `roles` | Permission roles |
| `permissions` | Available permissions |
| `role_permissions` | Role-Permission mapping |
| `employee_roles` | Employee-Role mapping |

## KEY ENUMS

```sql
-- Cone lifecycle states
CREATE TYPE cone_status AS ENUM (
  'RECEIVED',        -- Mới nhập kho
  'INSPECTED',       -- Đã kiểm tra
  'AVAILABLE',       -- Sẵn sàng phân bổ
  'SOFT_ALLOCATED',  -- Đã phân bổ mềm
  'HARD_ALLOCATED',  -- Đã phân bổ cứng
  'IN_PRODUCTION',   -- Đang sử dụng
  'PARTIAL_RETURN',  -- Đang trả về
  'PENDING_WEIGH',   -- Chờ cân
  'CONSUMED',        -- Đã sử dụng hết
  'WRITTEN_OFF',     -- Đã xóa sổ
  'QUARANTINE'       -- Cách ly
);

-- Permission actions
CREATE TYPE permission_action AS ENUM (
  'view', 'create', 'edit', 'delete', 'manage'
);
```

## STORED PROCEDURES (RPC)

| Function | Purpose | File |
|----------|---------|------|
| `allocate_thread()` | FEFO allocation with conflict detection | `rpc_allocate.sql` |
| `issue_thread()` | Issue allocated thread to production | `rpc_issue.sql` |
| `recover_thread()` | Recover partial cone with weight | `rpc_recover.sql` |
| `split_cone()` | Split cone into multiple parts | `rpc_split.sql` |

## CONVENTIONS

### Migration Naming
```
YYYYMMDDHHMMSS_descriptive_name.sql
Example: 20240101000003_thread_inventory.sql
```

### Migration Structure
```sql
-- ============================================================================
-- Migration: XXX_description.sql
-- Description: What this migration does
-- Dependencies: List of required migrations
-- ============================================================================

-- Create tables/types
CREATE TABLE IF NOT EXISTS ...

-- Add comments (Vietnamese + English)
COMMENT ON TABLE table_name IS 'Description - Mô tả';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_table_column ON table(column);

-- RLS policies (if applicable)
ALTER TABLE table ENABLE ROW LEVEL SECURITY;
```

### Dual Client Usage (Backend)
```typescript
// server/db/supabase.ts
supabase      // anon key - respects RLS
supabaseAdmin // service_role - bypasses RLS (admin operations)
```

## ANTI-PATTERNS

| Forbidden | Correct |
|-----------|---------|
| `DROP TABLE` without backup | Always backup first |
| `TRUNCATE` in migration | Use DELETE with WHERE if needed |
| Direct client access | Go through Hono API |
| `supabase db reset` | NEVER without explicit consent |

## SAFETY RULES

### CRITICAL - Before Running Migrations
1. **Backup database** before any migration with DROP/TRUNCATE
2. **Review migration content** - check for destructive operations
3. **Test in development** before production

### What to Check
```sql
-- Destructive operations to flag:
DROP TABLE
DROP COLUMN
TRUNCATE
DELETE without WHERE
ALTER TABLE ... DROP
```

## WHERE TO ADD

| Task | Location | Notes |
|------|----------|-------|
| New table | `migrations/YYYYMMDDHHMMSS_tablename.sql` | Include indexes, comments |
| New stored procedure | `migrations/YYYYMMDDHHMMSS_rpc_name.sql` | Use SECURITY DEFINER carefully |
| Seed data | `seed/*.sql` | Development data only |
| Table changes | New migration file | Never modify existing migrations |

## REALTIME

Enabled tables (via `20240101000012_realtime_enable.sql`):
- `thread_inventory`
- `thread_allocations`
- `thread_movements`

Frontend subscription:
```typescript
const realtime = useRealtime()
realtime.subscribe({ table: 'thread_inventory', event: '*' }, callback)
```

## RELATED FILES

| File | Purpose |
|------|---------|
| `server/db/supabase.ts` | Supabase client initialization |
| `server/routes/*.ts` | API routes using supabaseAdmin |
| `src/services/*Service.ts` | Frontend API clients |
