## ADDED Requirements

### Requirement: Route file decomposition preserves all endpoints
The system SHALL maintain all 28 existing weekly-order API endpoints with identical paths, methods, request validation, and response formats after the file is split into sub-modules.

#### Scenario: All endpoints remain reachable after refactor
- **WHEN** the application starts with the refactored `server/routes/weekly-order/` directory
- **THEN** all 28 routes previously served by `server/routes/weeklyOrder.ts` SHALL respond identically

#### Scenario: Route order is preserved across sub-routers
- **WHEN** sub-routers are mounted in index.ts
- **THEN** static paths (`/check-name`, `/assignment-summary`, `/deliveries/overview`, `/loans/summary`, `/loans/all`) SHALL be matched before parameterized `/:id` paths

### Requirement: DRY extraction of performer name lookup
The system SHALL provide a shared `getPerformerName()` helper that replaces the 4 duplicated auth-to-employee lookup patterns across route handlers.

#### Scenario: getPerformerName returns employee full name
- **WHEN** a route handler calls `getPerformerName(c)` with a valid authenticated context
- **THEN** it SHALL return the employee's `full_name` from the `employees` table

#### Scenario: getPerformerName falls back gracefully
- **WHEN** the employee record is not found or the lookup fails
- **THEN** it SHALL return the fallback string `'He thong'`

### Requirement: TypeScript and lint compliance
The refactored files SHALL pass `npm run type-check` and `npm run lint` without errors.

#### Scenario: Type check passes
- **WHEN** `npm run type-check` is run after the refactor
- **THEN** it SHALL complete with zero errors

#### Scenario: Lint passes
- **WHEN** `npm run lint` is run after the refactor
- **THEN** it SHALL complete with zero errors
