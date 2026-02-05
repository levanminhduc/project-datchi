# Database Schema - Thread Inventory System

**Generated:** 2025-02-05  
**Source:** Local Supabase PostgreSQL 17.6

## Files Overview

| File | Description | Lines |
|------|-------------|-------|
| `00_full_schema.sql` | Complete schema dump (backup/reference) | 4848 |
| `01_enums.sql` | 9 ENUM types | 71 |
| `02_auth_tables.sql` | Auth domain: employees, roles, permissions | 279 |
| `03_master_data_tables.sql` | Master data: warehouses, suppliers, colors, thread_types, lots | 450 |
| `04_thread_operations_tables.sql` | Operations: inventory, allocations, movements, recovery, conflicts | 658 |
| `05_functions.sql` | 15 database functions | 1056 |
| `06_triggers.sql` | Trigger definitions | 16 |
| `07_indexes.sql` | Custom indexes (excluding PK/unique) | 87 |

## ENUM Types (01_enums.sql)

| Type | Values | Description |
|------|--------|-------------|
| `allocation_priority` | LOW, NORMAL, HIGH, URGENT | Mức độ ưu tiên phân bổ |
| `allocation_status` | PENDING, SOFT, HARD, ISSUED, CANCELLED, WAITLISTED | Trạng thái phân bổ |
| `batch_operation_type` | RECEIVE, TRANSFER, ISSUE, RETURN | Loại thao tác hàng loạt |
| `cone_status` | RECEIVED → CONSUMED/WRITTEN_OFF | Trạng thái cuộn chỉ |
| `lot_status` | ACTIVE, DEPLETED, EXPIRED, QUARANTINE | Trạng thái lô hàng |
| `movement_type` | RECEIVE, ISSUE, RETURN, TRANSFER, ADJUSTMENT, WRITE_OFF | Loại di chuyển |
| `permission_action` | view, create, edit, delete, manage | Hành động quyền |
| `recovery_status` | INITIATED → CONFIRMED/REJECTED | Trạng thái thu hồi |
| `thread_material` | polyester, cotton, nylon, silk, rayon, mixed | Chất liệu chỉ |

## Tables (22 total)

### Auth Domain (02_auth_tables.sql)
- `employees` - Nhân viên
- `roles` - Vai trò (ROOT, ADMIN, MANAGER, STAFF)
- `permissions` - Quyền hạn
- `employee_roles` - Gán vai trò cho nhân viên
- `role_permissions` - Gán quyền cho vai trò
- `employee_permissions` - Gán quyền trực tiếp cho nhân viên
- `employee_refresh_tokens` - JWT refresh tokens

### Master Data (03_master_data_tables.sql)
- `warehouses` - Kho (LOCATION vs STORAGE)
- `suppliers` - Nhà cung cấp
- `colors` - Màu sắc (với hex code)
- `color_supplier` - Mapping màu theo NCC
- `thread_types` - Loại chỉ (tex, material)
- `lots` - Lô hàng

### Thread Operations (04_thread_operations_tables.sql)
- `thread_inventory` - Tồn kho cuộn chỉ (core table)
- `thread_allocations` - Yêu cầu phân bổ
- `thread_allocation_cones` - Mapping allocation → cones
- `thread_movements` - Lịch sử di chuyển
- `thread_recovery` - Thu hồi cuộn lẻ
- `thread_conflicts` - Xung đột thiếu hàng
- `thread_conflict_allocations` - Mapping conflict → allocations
- `thread_audit_log` - Audit trail
- `batch_transactions` - Giao dịch hàng loạt

## Key Functions (05_functions.sql)

| Function | Description |
|----------|-------------|
| `allocate_thread()` | FEFO allocation với conflict detection |
| `issue_cone()` | Xuất kho cuộn chỉ |
| `recover_cone()` | Thu hồi cuộn lẻ |
| `split_allocation()` | Tách phân bổ |
| `has_permission()` | Kiểm tra quyền |
| `is_admin()` / `is_root()` | Kiểm tra vai trò |
| `get_employee_permissions()` | Lấy danh sách quyền |
| `can_manage_employee()` | Kiểm tra quyền quản lý nhân viên |
| `cleanup_expired_refresh_tokens()` | Dọn dẹp token hết hạn |

## Triggers (06_triggers.sql)

- `update_updated_at_column` - Auto-update `updated_at` timestamp
- `thread_audit_trigger_func` - Audit log for inventory changes
- `update_lots_updated_at` - Auto-update lots timestamp

## Regenerating Schema

```bash
# Full dump
docker exec supabase_db_project-datchi pg_dump -U postgres -d postgres \
  --schema=public --schema-only --no-owner --no-acl > supabase/schema/00_full_schema.sql

# Or use supabase CLI
supabase db dump --schema-only > supabase/schema/00_full_schema.sql
```

## Notes

- Schema files are for **reference only** - do NOT run them directly
- Use migrations (`supabase/migrations/`) for schema changes
- 29 migration files consolidate into this clean schema view
- All comments/descriptions in Vietnamese
