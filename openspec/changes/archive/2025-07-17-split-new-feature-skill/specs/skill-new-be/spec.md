## ADDED Requirements

### Requirement: Backend layer skill file exists
The system SHALL have a skill file at `.claude/skills/new-be/SKILL.md` that contains all backend-related templates and conventions.

#### Scenario: Skill file created
- **WHEN** the implementation is complete
- **THEN** `.claude/skills/new-be/SKILL.md` exists and is a valid skill file

### Requirement: Backend types template
The skill SHALL contain the backend types template (Row interface, CreateDTO, UpdateDTO, Filters interface) and reference to shared ApiResponse/PaginatedResponse types.

#### Scenario: Types template present
- **WHEN** a user invokes `/new-be`
- **THEN** the skill provides the backend types template with file location `server/types/ten-tinh-nang.ts` and shared type import pattern

### Requirement: Zod validation template
The skill SHALL contain Zod schema templates with .safeParse() pattern, validation helper, and advanced patterns (coerce, refine, transform).

#### Scenario: Validation templates present
- **WHEN** a user creates a new backend feature
- **THEN** the skill provides Create/Update/Filters schemas, safeParse usage, and the handleValidation helper

### Requirement: Hono route templates for all complexity levels
The skill SHALL contain route templates for Level 1 (Simple CRUD), Level 2 (Workflow with status transitions), and Level 3 (Batch operations), plus RPC calls and cascading select options.

#### Scenario: All route levels covered
- **WHEN** a user needs to create routes
- **THEN** the skill provides: GET list (with pagination, filters), POST create (with duplicate check), GET/:id, PUT/:id (with exists check), DELETE/:id (soft delete), POST/:id/action (workflow), RPC call pattern, and /options endpoint

### Requirement: Route registration and ordering rules
The skill SHALL document route registration in `server/index.ts` and the critical route ordering rule (static before dynamic, /:id last).

#### Scenario: Route ordering documented
- **WHEN** a user reads the skill
- **THEN** the route order is clearly specified: static helpers → GET/ → POST/ → nested static → GET/:id → PUT/:id → DELETE/:id → POST/:id/action

### Requirement: Auth and permissions pattern
The skill SHALL document the global auth middleware (via except() in server/index.ts), requirePermission() per-route pattern, and that fetchApi() auto-attaches tokens.

#### Scenario: Auth pattern documented
- **WHEN** a user adds auth to routes
- **THEN** the skill specifies: no need for app.use('*', authMiddleware), use requirePermission() per endpoint, ROOT role bypasses all checks

### Requirement: Response format and notification integration
The skill SHALL document the response format `{data, error, message?}` and notification integration pattern.

#### Scenario: Response and notification patterns present
- **WHEN** a user creates API endpoints
- **THEN** the skill provides response format rules (NOT {success, data, error}) and createNotification/broadcastNotification usage

### Requirement: Backend checklist included
The skill SHALL include the backend section of the completion checklist.

#### Scenario: Checklist covers all BE items
- **WHEN** a user finishes a BE task
- **THEN** the checklist covers: route order, response format, safeParse, duplicate/exists checks, PGRST116, route registration, requirePermission, shared ApiResponse, soft delete pattern
