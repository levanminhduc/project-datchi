## ADDED Requirements

### Requirement: FK column rename tex_id to thread_type_id
The migration SHALL rename column `style_thread_specs.tex_id` to `thread_type_id` using `ALTER TABLE RENAME COLUMN`. The associated index SHALL be dropped and recreated with the new name. The FK constraint SHALL automatically follow the column rename.

#### Scenario: Column renamed successfully
- **WHEN** migration runs `ALTER TABLE style_thread_specs RENAME COLUMN tex_id TO thread_type_id`
- **THEN** the column is renamed instantly (metadata-only operation), existing data is preserved, and FK constraint still references `thread_types(id)`

#### Scenario: Index recreated with new name
- **WHEN** migration drops `idx_style_thread_specs_tex_id` and creates `idx_style_thread_specs_thread_type_id`
- **THEN** the new index covers `thread_type_id` column for query performance

### Requirement: Convert thread_conflicts status to enum
The migration SHALL create a `conflict_status` enum type with values `PENDING`, `RESOLVED`, `ESCALATED`. The migration SHALL drop any existing CHECK constraint on `thread_conflicts.status` and convert the column type to `conflict_status` enum.

#### Scenario: Enum type created and column converted
- **WHEN** migration creates `conflict_status` enum and alters `thread_conflicts.status` column type
- **THEN** the column only accepts `PENDING`, `RESOLVED`, or `ESCALATED` values, and the default remains `PENDING`

#### Scenario: Invalid value insertion rejected
- **WHEN** an INSERT attempts `status = 'invalid_value'` on `thread_conflicts`
- **THEN** PostgreSQL rejects the insert with a type error

### Requirement: Convert movement status columns to cone_status enum
The migration SHALL convert `thread_movements.from_status` and `thread_movements.to_status` from `VARCHAR(50)` to the existing `cone_status` enum type using `USING column::cone_status` cast.

#### Scenario: Columns converted with existing data preserved
- **WHEN** migration alters `from_status` and `to_status` to `cone_status` type
- **THEN** all existing data is cast to enum values, and columns only accept valid `cone_status` values going forward

#### Scenario: Pre-migration data verification
- **WHEN** before altering columns, a verification query checks for values not in `cone_status` enum
- **THEN** if any non-matching values exist, the migration SHALL fail with a clear error message rather than silently corrupting data

### Requirement: RPC functions updated for enum columns
The migration SHALL recreate `fn_issue_allocation` and `fn_recover_cone` to remove `::VARCHAR` casts when inserting into `from_status`/`to_status` columns, since these columns now accept `cone_status` enum directly.

#### Scenario: fn_issue_allocation inserts without VARCHAR cast
- **WHEN** `fn_issue_allocation` creates a movement record
- **THEN** `from_status` receives `v_cone.current_status` directly (no `::VARCHAR` cast) and `to_status` receives `'IN_PRODUCTION'::cone_status`

#### Scenario: fn_recover_cone inserts without VARCHAR cast
- **WHEN** `fn_recover_cone` creates a movement record
- **THEN** `from_status` receives `v_cone.status` directly and `to_status` receives the computed status as `cone_status` type

### Requirement: Composite index on thread_issue_lines
The migration SHALL create a composite index `idx_thread_issue_lines_issue_thread` on `thread_issue_lines(issue_id, thread_type_id)`.

#### Scenario: Index created for common query pattern
- **WHEN** migration creates the composite index
- **THEN** queries filtering by both `issue_id` AND `thread_type_id` use the composite index instead of merging two single-column indexes

### Requirement: FK index on thread_issue_return_logs line_id
The migration SHALL create an index `idx_return_logs_line_id` on `thread_issue_return_logs(line_id)`.

#### Scenario: Index supports CASCADE DELETE performance
- **WHEN** a `thread_issue_line` row is deleted (CASCADE)
- **THEN** PostgreSQL uses the index to quickly find related `thread_issue_return_logs` rows instead of a sequential scan

### Requirement: PostgREST schema cache reload
The migration SHALL end with `NOTIFY pgrst, 'reload schema'` to refresh PostgREST's cached FK relationships after the column rename.

#### Scenario: Schema cache refreshed after migration
- **WHEN** migration completes and sends NOTIFY
- **THEN** PostgREST reloads its schema cache and recognizes the new `thread_type_id` FK column for nested select queries
