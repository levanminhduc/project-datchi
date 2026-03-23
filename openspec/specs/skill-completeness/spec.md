## ADDED Requirements

### Requirement: Migration template includes BEGIN/COMMIT wrapper
All migration templates SHALL wrap SQL statements in `BEGIN;`/`COMMIT;` blocks as used in all recent migrations.

#### Scenario: New migration from template
- **WHEN** a migration is generated from the skill template
- **THEN** it SHALL start with `BEGIN;` and end with `NOTIFY pgrst, 'reload schema';` followed by `COMMIT;`

### Requirement: Component reference includes SearchInput
The component reference table SHALL include `SearchInput` with its import path and usage guidance.

#### Scenario: Developer looks up search component
- **WHEN** reading the skill's component reference table
- **THEN** `SearchInput` SHALL be listed as replacement for manual search `AppInput` + debounce, imported from `@/components/ui/inputs/SearchInput.vue`

### Requirement: Component reference includes DeleteDialog
The component reference table SHALL include `DeleteDialog` with its import path and usage guidance.

#### Scenario: Developer needs delete confirmation
- **WHEN** reading the skill's component reference table
- **THEN** `DeleteDialog` SHALL be listed as an alternative to `useConfirm().confirmDelete()`, imported from `@/components/ui/dialogs/DeleteDialog.vue`

### Requirement: Component reference includes IconButton
The component reference table SHALL include `IconButton` for table action icons.

#### Scenario: Developer adds action buttons to table
- **WHEN** reading the skill's component reference table
- **THEN** `IconButton` SHALL be listed for table row action icons, imported from `@/components/ui/buttons/IconButton.vue`

### Requirement: Skill documents auth middleware pattern
The skill SHALL include a section documenting the available auth middleware functions and their usage pattern.

#### Scenario: Developer needs to protect routes
- **WHEN** reading the skill's backend section
- **THEN** the skill SHALL document `authMiddleware`, `requirePermission`, `requireAdmin`, `requireRoot` from `server/middleware/auth`

### Requirement: Skill documents createErrorHandler factory
The composable section SHALL document the `createErrorHandler` factory pattern alongside `getErrorMessage`.

#### Scenario: Developer creates domain-specific error handler
- **WHEN** a composable handles errors for a specific domain
- **THEN** the skill SHALL show the `createErrorHandler({ duplicate: '...', notFound: '...' })` pattern from `@/utils/errorMessages`
