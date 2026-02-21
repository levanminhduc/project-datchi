## ADDED Requirements

### Requirement: Response format matches codebase reality
The skill template response format SHALL be `{ data: T|null, error: string|null, message?: string }` in all route templates and documentation sections.

#### Scenario: Route template returns success
- **WHEN** a route handler returns a successful response
- **THEN** the response SHALL include `data` with the result, `error: null`, and optional `message`

#### Scenario: Route template returns error
- **WHEN** a route handler returns an error response
- **THEN** the response SHALL include `data: null`, `error` with the error message, and no `success` field

### Requirement: ApiResponse import path is correct
The skill SHALL reference `ApiResponse` import from `../types/employee` for backend routes, not from non-existent `../types/api`.

#### Scenario: Backend route imports ApiResponse
- **WHEN** a route template shows ApiResponse import
- **THEN** the import path SHALL be `import type { ApiResponse } from '../types/employee'`

### Requirement: Frontend service uses import pattern for ApiResponse
The service template SHALL import `ApiResponse` from `@/types` instead of declaring it locally.

#### Scenario: Service file defines API types
- **WHEN** a frontend service file is generated from the skill template
- **THEN** it SHALL contain `import type { ApiResponse } from '@/types'` and NOT a local `interface ApiResponse<T>` declaration

### Requirement: List page template uses FormDialog
The list page template SHALL use `FormDialog` component for create/edit dialogs instead of raw `q-dialog` + `q-card`.

#### Scenario: List page shows form dialog
- **WHEN** the list page template includes a create/edit dialog
- **THEN** it SHALL use `<FormDialog>` component imported from `@/components/ui/dialogs/FormDialog.vue`

### Requirement: List page template uses SearchInput
The list page template SHALL use `SearchInput` component for search functionality instead of `AppInput` with manual debounce.

#### Scenario: List page has search field
- **WHEN** the list page template includes a search input
- **THEN** it SHALL use `<SearchInput>` component with built-in debounce, replacing `AppInput` + `useDebounceFn`

### Requirement: Soft delete accounts for schema variation
The soft delete template SHALL note that `is_active: false` is only set when the table has an `is_active` column.

#### Scenario: Table with is_active column
- **WHEN** deleting from a table that has `is_active` column
- **THEN** the template SHALL set both `deleted_at` and `is_active: false`

#### Scenario: Table without is_active column
- **WHEN** deleting from a table that does NOT have `is_active` column
- **THEN** the template SHALL only set `deleted_at`

### Requirement: Backend query applies from/to date filters
The backend list route template SHALL apply `from` and `to` date range filters when present in the validated query.

#### Scenario: Date range filter applied
- **WHEN** filters include `from` and/or `to` values
- **THEN** the query builder SHALL add `.gte('created_at', from)` and/or `.lte('created_at', to)` conditions

### Requirement: Detail page has complete declarations
The detail page template SHALL include all variable declarations used in the template section (`statusColors`, `statusLabels`) and SHALL NOT import unused modules.

#### Scenario: Detail page renders status badge
- **WHEN** the detail page template references `statusColors` and `statusLabels`
- **THEN** both SHALL be declared in the script section

#### Scenario: No unused imports
- **WHEN** the detail page template is generated
- **THEN** it SHALL NOT import `useRouter` if it is not used

### Requirement: Single route pattern for list pages
The skill SHALL document only one file-based routing pattern per route level and SHALL NOT show conflicting patterns.

#### Scenario: List page routing
- **WHEN** documenting list page file location
- **THEN** the skill SHALL show only `src/pages/[module]/ten-tinh-nang/index.vue` pattern (not also `ten-tinh-nang.vue`)

### Requirement: Migration CREATE TYPE is idempotent
The basic migration template SHALL use the idempotent `DO $$ BEGIN...EXCEPTION` pattern for CREATE TYPE, not bare CREATE TYPE.

#### Scenario: Migration creates enum type
- **WHEN** a migration template creates a new ENUM type
- **THEN** it SHALL use the idempotent wrapper that handles `duplicate_object` exception

### Requirement: Zod validation order is correct
Zod string validation SHALL use `.trim()` before `.min(1)` to prevent whitespace-only strings from passing validation.

#### Scenario: Required string field
- **WHEN** a Zod schema defines a required string field
- **THEN** the chain SHALL be `z.string().trim().min(1, 'message')`

### Requirement: CLAUDE.md response format matches codebase
The `CLAUDE.md` file SHALL describe the API response format as `{ data: T|null, error: string|null, message?: string }`.

#### Scenario: Developer reads CLAUDE.md conventions
- **WHEN** a developer or AI agent reads the response format convention in CLAUDE.md
- **THEN** it SHALL show `{ data, error, message? }` without a `success` field
