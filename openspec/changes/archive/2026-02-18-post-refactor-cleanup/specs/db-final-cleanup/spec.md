## ADDED Requirements

### Requirement: Drop fn_calculate_quota with correct signature
The migration SHALL drop `fn_calculate_quota(integer, integer, integer, integer)` using the full parameter signature.

#### Scenario: Function is removed after migration
- **WHEN** the migration runs successfully
- **THEN** `SELECT proname, pronargs FROM pg_proc WHERE proname = 'fn_calculate_quota'` SHALL return 0 rows

### Requirement: Drop fn_check_quota with correct signature
The migration SHALL drop `fn_check_quota(integer, integer, integer, integer)` using the full parameter signature.

#### Scenario: Function is removed after migration
- **WHEN** the migration runs successfully
- **THEN** `SELECT proname, pronargs FROM pg_proc WHERE proname = 'fn_check_quota'` SHALL return 0 rows

### Requirement: UPPERCASE thread_material enum values
The migration SHALL rename all `thread_material` enum values from lowercase to UPPERCASE using `ALTER TYPE thread_material RENAME VALUE`.

Values to rename:
- `polyester` → `POLYESTER`
- `cotton` → `COTTON`
- `nylon` → `NYLON`
- `silk` → `SILK`
- `rayon` → `RAYON`
- `mixed` → `MIXED`

#### Scenario: All enum values are UPPERCASE after migration
- **WHEN** the migration runs successfully
- **THEN** `SELECT unnest(enum_range(NULL::thread_material))` SHALL return only UPPERCASE values: `POLYESTER, COTTON, NYLON, SILK, RAYON, MIXED`

#### Scenario: Existing data is preserved
- **WHEN** the migration runs on a database with existing `thread_types` rows using lowercase material values
- **THEN** all existing rows SHALL have their material values automatically updated to UPPERCASE

### Requirement: Update schema reference file
The file `supabase/schema/01_enums.sql` SHALL be updated to reflect UPPERCASE `thread_material` values.

#### Scenario: Schema file matches database
- **WHEN** the schema reference file is read
- **THEN** the `thread_material` enum definition SHALL show UPPERCASE values
