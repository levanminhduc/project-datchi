## ADDED Requirements

### Requirement: Backfill thread_types.color_id from legacy text
The system SHALL populate `thread_types.color_id` by matching `thread_types.color` (legacy text) against `colors.name` using case-insensitive, whitespace-trimmed comparison.

#### Scenario: Exact match found
- **WHEN** `thread_types.color` matches a `colors.name` (case-insensitive, trimmed)
- **THEN** `thread_types.color_id` SHALL be set to the matching `colors.id`

#### Scenario: No match found
- **WHEN** `thread_types.color` does not match any `colors.name`
- **THEN** the row SHALL be logged as unmatched and `color_id` SHALL remain NULL until manual resolution

#### Scenario: color is NULL
- **WHEN** `thread_types.color` is NULL
- **THEN** `thread_types.color_id` SHALL remain NULL (acceptable — some thread types may not have a color)

### Requirement: Backfill thread_types.supplier_id from legacy text
The system SHALL populate `thread_types.supplier_id` by matching `thread_types.supplier` (legacy text) against `suppliers.name` using case-insensitive, whitespace-trimmed comparison.

#### Scenario: Exact match found
- **WHEN** `thread_types.supplier` matches a `suppliers.name` (case-insensitive, trimmed)
- **THEN** `thread_types.supplier_id` SHALL be set to the matching `suppliers.id`

#### Scenario: No match found
- **WHEN** `thread_types.supplier` does not match any `suppliers.name`
- **THEN** the row SHALL be logged as unmatched and `supplier_id` SHALL remain NULL until manual resolution

### Requirement: Drop legacy text columns after backfill
After successful backfill and verification, the system SHALL drop the legacy text columns from `thread_types`: `color` (varchar), `color_code` (varchar), and `supplier` (varchar).

#### Scenario: All FK columns populated
- **WHEN** all non-NULL legacy text values have been matched to FK IDs
- **THEN** the migration SHALL drop columns `color`, `color_code`, `supplier` from `thread_types`

#### Scenario: Backend dual-write removal
- **WHEN** legacy columns are dropped
- **THEN** `server/routes/threads.ts` SHALL remove all dual-write logic (`lookupColorName`, `lookupSupplierName` functions and their usage)

### Requirement: Update backend to use FK only
The backend SHALL use `color_id` and `supplier_id` exclusively when creating/updating thread types. Legacy text fields SHALL be removed from TypeScript types, Zod schemas, and API responses.

#### Scenario: Create thread type
- **WHEN** a new thread type is created via POST /api/threads
- **THEN** the request SHALL accept `color_id` (number) and `supplier_id` (number) but NOT `color` or `supplier` text fields

#### Scenario: Update thread type
- **WHEN** a thread type is updated via PUT /api/threads/:id
- **THEN** the request SHALL accept `color_id` and `supplier_id` but NOT legacy text fields

#### Scenario: Thread type response
- **WHEN** thread type data is returned from the API
- **THEN** the response SHALL include `color_id`, `supplier_id` with nested `colors(*)` and `suppliers(*)` data, but NOT legacy `color`, `color_code`, `supplier` text fields
