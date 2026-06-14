## ADDED Requirements

### Requirement: Direct PostgreSQL connection via pg query layer
The backend SHALL connect to PostgreSQL through a single shared `pg` connection pool configured from a `DATABASE_URL` environment variable, exposed via a thin query layer, with no dependency on `@supabase/supabase-js` for data access.

#### Scenario: Pool initialized from DATABASE_URL
- **WHEN** the backend starts with a valid `DATABASE_URL`
- **THEN** a shared `pg` Pool is created and reused for all queries
- **AND** no Supabase data client is instantiated for table reads/writes

#### Scenario: Missing DATABASE_URL fails fast
- **WHEN** the backend starts without `DATABASE_URL` set
- **THEN** startup fails with a clear error rather than silently falling back to Supabase

### Requirement: Parameterized table reads and writes
The system SHALL execute all table reads and writes as parameterized SQL through the query layer, preserving the result shape each caller already consumes.

#### Scenario: Single-row read
- **WHEN** code requests a single record by id (previously `.single()`/`.maybeSingle()`)
- **THEN** the query layer returns exactly one typed row, or null for the maybe-variant, matching prior semantics

#### Scenario: Filtered list read with ordering and pagination
- **WHEN** code requests a filtered, ordered, ranged list (previously `.eq/.ilike/.in/.or/.order/.range`)
- **THEN** the query layer returns the same rows in the same order and page window as the PostgREST query did

#### Scenario: Exact count
- **WHEN** code requests an exact count (previously `count: 'exact', head: true`)
- **THEN** the query layer returns the integer count

#### Scenario: Parameter binding prevents injection
- **WHEN** any query includes caller-provided values
- **THEN** values are passed as bound parameters, never string-interpolated into SQL

### Requirement: Nested relations preserve consumer shape
The system SHALL translate PostgREST nested embeds into SQL joins or JSON aggregation that return the identical nested object/array shape the consumer expects.

#### Scenario: Permission embed shape preserved
- **WHEN** the auth permission query (previously `roles!inner(role_permissions(permissions(code)))`) runs through the query layer
- **THEN** it returns the same nested structure of role/permission codes the caller already parses

### Requirement: SQL function invocation replaces PostgREST RPC
The system SHALL invoke the existing 28 `fn_*` PostgreSQL functions via direct SQL (`SELECT ... FROM fn(...)` or `SELECT fn(...)`), leaving the function definitions unchanged in the database and preserving each call's return shape and atomicity.

#### Scenario: Set-returning function
- **WHEN** code calls a set-returning function (previously `.rpc('fn_x', args)`)
- **THEN** the query layer executes `SELECT * FROM fn_x($1, ...)` and returns the same rows

#### Scenario: Scalar function
- **WHEN** code calls a scalar function
- **THEN** the query layer executes `SELECT fn_x($1, ...)` and returns the same scalar value

#### Scenario: Stock-changing function keeps audit trail
- **WHEN** a stock-changing function (e.g. `fn_issue_cones_with_movements`) is invoked through the query layer
- **THEN** the function still writes its movement/audit rows inside the same transaction, unchanged

### Requirement: Multi-statement atomicity via transactions
The system SHALL provide a transaction wrapper so multi-statement operations commit or roll back atomically on a single dedicated client.

#### Scenario: Transaction rolls back on error
- **WHEN** a multi-statement operation fails partway through the transaction wrapper
- **THEN** all statements in that transaction are rolled back and no partial write persists

### Requirement: Row Level Security removed
The system SHALL drop the Row Level Security policies and disable RLS via a forward migration, relying solely on the application-layer `requirePermission` authorization, without deleting any data.

#### Scenario: RLS dropped by migration
- **WHEN** the RLS-removal migration runs
- **THEN** policies from `20260226000004_enable_rls` and `20260226000005_rls_policies` are dropped and RLS is disabled on affected tables
- **AND** no table is dropped and no data row is deleted

#### Scenario: Authorization still enforced
- **WHEN** a request without sufficient permission hits any guarded route after RLS removal
- **THEN** `requirePermission` rejects it with the existing 403 behavior
