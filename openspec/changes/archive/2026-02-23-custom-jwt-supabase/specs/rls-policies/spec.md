## ADDED Requirements

### Requirement: RLS enabled on critical data tables
The system SHALL enable Row Level Security on the following tables: `thread_inventory`, `thread_movements`, `thread_allocations`, `lots`, `purchase_orders`, `weekly_orders`.

#### Scenario: RLS enabled
- **WHEN** the migration runs
- **THEN** `ALTER TABLE <table> ENABLE ROW LEVEL SECURITY` is applied to all listed tables
- **AND** `ALTER TABLE <table> FORCE ROW LEVEL SECURITY` is applied (ensures RLS applies to table owners too, except superuser)

### Requirement: Service role bypass policy
Each RLS-enabled table SHALL have a policy that allows `service_role` full access, preserving current backend behavior.

#### Scenario: Backend CRUD unchanged
- **WHEN** the backend uses `supabaseAdmin` (service_role key) to query a table
- **THEN** RLS is bypassed and all rows are accessible
- **AND** existing backend behavior is completely unchanged

### Requirement: Authenticated read policy
Each RLS-enabled table SHALL allow all `authenticated` users to SELECT data.

#### Scenario: Authenticated user reads data
- **WHEN** an authenticated user (via Supabase JWT) queries a table with SELECT
- **THEN** all rows are returned (no row-level filtering)
- **AND** this applies to all roles

### Requirement: Role-based write policy for inventory tables
The tables `thread_inventory` and `thread_movements` SHALL restrict INSERT/UPDATE/DELETE to users with warehouse-related roles or root/admin.

#### Scenario: Warehouse staff modifies inventory
- **WHEN** a user with role `warehouse_staff`, `warehouse_manager`, `admin`, or `is_root = true` performs INSERT/UPDATE/DELETE on `thread_inventory`
- **THEN** the operation is allowed

#### Scenario: Non-warehouse user blocked from modifying inventory
- **WHEN** a user with only `viewer` or `production` role attempts INSERT/UPDATE/DELETE on `thread_inventory`
- **THEN** the operation is denied with a permission error

### Requirement: Role-based write policy for allocation tables
The table `thread_allocations` SHALL restrict INSERT/UPDATE/DELETE to users with planning-related roles or root/admin.

#### Scenario: Planning staff modifies allocations
- **WHEN** a user with role `planning`, `admin`, or `is_root = true` performs INSERT/UPDATE/DELETE on `thread_allocations`
- **THEN** the operation is allowed

#### Scenario: Non-planning user blocked from modifying allocations
- **WHEN** a user with only `warehouse_staff` or `viewer` role attempts INSERT/UPDATE/DELETE on `thread_allocations`
- **THEN** the operation is denied

### Requirement: Open write policy for operational tables
The tables `lots`, `purchase_orders`, `weekly_orders` SHALL allow INSERT/UPDATE/DELETE for all authenticated users (role restriction handled by backend middleware).

#### Scenario: Any authenticated user writes
- **WHEN** an authenticated user performs INSERT/UPDATE/DELETE on `lots`, `purchase_orders`, or `weekly_orders`
- **THEN** the operation is allowed
- **AND** backend middleware enforces fine-grained permissions

### Requirement: Anon role blocked
All RLS-enabled tables SHALL deny all operations to the `anon` role.

#### Scenario: Unauthenticated request blocked
- **WHEN** a request is made with the anon key (no user session) to any RLS-enabled table
- **THEN** SELECT, INSERT, UPDATE, DELETE are all denied
