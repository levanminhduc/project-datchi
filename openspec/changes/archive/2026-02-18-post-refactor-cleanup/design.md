## Context

After the `db-cleanup` refactor (migration `20260218100000`), two zombie functions remain in the database and one enum (`thread_material`) is still lowercase while all others are UPPERCASE. Additionally, project documentation (README.md, CLAUDE.md, agent files) is outdated.

**Zombie functions**: The cleanup migration used `DROP FUNCTION IF EXISTS fn_calculate_quota()` (no params), but the actual signatures are `fn_calculate_quota(integer, integer, integer, integer)`. PostgreSQL treats functions with different signatures as different overloads, so the DROP was a no-op.

**Enum inconsistency**: `thread_material` has values `polyester, cotton, nylon, silk, rayon, mixed` while all other enums use UPPERCASE (`PENDING, ACTIVE, RECEIVED`, etc.).

## Goals / Non-Goals

**Goals:**
- Drop zombie functions with correct signatures
- UPPERCASE `thread_material` enum values in DB, backend types, frontend types, seed data, and UI
- Update README.md, CLAUDE.md, agent files with current counts and conventions

**Non-Goals:**
- Refactoring thread management code beyond enum values
- Adding new features or changing business logic
- Modifying `permission_action` enum (already fixed in cleanup migration)

## Decisions

### 1. Use `ALTER TYPE RENAME VALUE` for enum migration
**Rationale**: This is the safest approach — it renames in-place without needing to recreate the type, drop/recreate columns, or update existing data. PostgreSQL 10+ supports `ALTER TYPE ... RENAME VALUE`. All existing rows automatically use the new value name.

**Alternative considered**: Recreate enum type — too risky, requires dropping and recreating all columns that use it.

### 2. Drop functions with full parameter signatures
**Rationale**: PostgreSQL overload resolution requires exact signature match for `DROP FUNCTION`. We must use `DROP FUNCTION IF EXISTS fn_calculate_quota(integer, integer, integer, integer)`.

### 3. Single migration file for all DB changes
**Rationale**: Both changes are small, independent, and non-destructive. No need for separate migrations.

### 4. Update code in-place (no deprecation period)
**Rationale**: The system is not yet in production multi-tenant mode. No external consumers depend on lowercase enum values.

## Risks / Trade-offs

- **[Risk] Existing data uses lowercase enum values** → `ALTER TYPE RENAME VALUE` handles this automatically; existing rows adopt the new name.
- **[Risk] Seed data mismatch after migration** → Migration handles DB, separate code changes handle seed data to match.
- **[Risk] Frontend hardcoded strings** → `src/pages/thread/index.vue` line 667-673 has hardcoded lowercase values. Must update to use `ThreadMaterial.*` enum constants.
