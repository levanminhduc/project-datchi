## ADDED Requirements

### Requirement: Backend ThreadMaterial type uses UPPERCASE values
The `server/types/thread.ts` `ThreadMaterial` type SHALL use UPPERCASE string literals: `'POLYESTER' | 'COTTON' | 'NYLON' | 'SILK' | 'RAYON' | 'MIXED'`.

#### Scenario: Type matches database enum
- **WHEN** the type file is compiled
- **THEN** `ThreadMaterial` SHALL accept only UPPERCASE values matching the database enum

### Requirement: Frontend ThreadMaterial enum uses UPPERCASE values
The `src/types/thread/enums.ts` `ThreadMaterial` enum SHALL map keys to UPPERCASE values: `POLYESTER = 'POLYESTER'`, etc.

#### Scenario: Enum values match database
- **WHEN** the enum is used in frontend code
- **THEN** `ThreadMaterial.POLYESTER` SHALL equal `'POLYESTER'` (not `'polyester'`)

### Requirement: Seed data uses UPPERCASE material values
The `server/scripts/seed-test-data.ts` SHALL use UPPERCASE values for the `material` field in all thread type seed records.

#### Scenario: Seed data inserts successfully
- **WHEN** the seed script runs against a database with UPPERCASE `thread_material` enum
- **THEN** all thread type inserts SHALL succeed without enum value errors

### Requirement: Frontend materialOptions use enum constants
The `src/pages/thread/index.vue` `materialOptions` array SHALL use `ThreadMaterial.*` enum constants for the `value` field instead of hardcoded lowercase strings.

#### Scenario: Material dropdown shows correct labels
- **WHEN** the thread type list page is loaded
- **THEN** the material filter dropdown SHALL display labels: Polyester, Cotton, Nylon, Silk/Lụa, Rayon, Hỗn hợp
- **THEN** the selected value SHALL be the UPPERCASE enum constant

### Requirement: ThreadTypeFormDialog materialOptions unchanged
The `src/components/thread/ThreadTypeFormDialog.vue` already uses `ThreadMaterial.*` enum constants. After the enum values change to UPPERCASE, no template changes are needed — only the underlying enum values change.

#### Scenario: Form dialog material select works correctly
- **WHEN** a user creates or edits a thread type
- **THEN** the material select SHALL display correct labels and send UPPERCASE values to the API
