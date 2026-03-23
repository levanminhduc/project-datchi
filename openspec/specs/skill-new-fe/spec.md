## ADDED Requirements

### Requirement: Frontend layer skill file exists
The system SHALL have a skill file at `.claude/skills/new-fe/SKILL.md` that contains all frontend-related templates and conventions.

#### Scenario: Skill file created
- **WHEN** the implementation is complete
- **THEN** `.claude/skills/new-fe/SKILL.md` exists and is a valid skill file

### Requirement: Frontend types template
The skill SHALL contain the frontend types template (enum, interface, DTO, Filters, ListResponse) with file location and barrel export pattern.

#### Scenario: FE types template present
- **WHEN** a user invokes `/new-fe`
- **THEN** the skill provides FE type templates at `src/types/thread/tenTinhNang.ts` with enum (UPPERCASE values), interfaces, and export from index.ts

### Requirement: Service client template
The skill SHALL contain the fetchApi-based service template with buildQueryString helper, list/getById/create/update/delete/confirm/getOptions methods.

#### Scenario: Service template present
- **WHEN** a user creates a new service
- **THEN** the skill provides the complete service template at `src/services/tenTinhNangService.ts` using fetchApi (never raw fetch)

### Requirement: Composable template
The skill SHALL contain the composable template with instance-level and module-level patterns, using useLoading/useSnackbar/createErrorHandler.

#### Scenario: Composable template present
- **WHEN** a user creates a new composable
- **THEN** the skill provides both instance-level (default) and module-level (shared state) composable patterns with Vietnamese messages

### Requirement: List page template
The skill SHALL contain the complete list page template with PageHeader, SearchInput, filters, DataTable with server-side pagination, FormDialog, DeleteDialog, and permission checks.

#### Scenario: List page template present
- **WHEN** a user creates a new list page
- **THEN** the skill provides the full index.vue template with definePage meta, all UI components (AppInput, AppSelect, AppButton, DataTable, FormDialog, DeleteDialog, DatePicker, SearchInput), status badges, tab layout, and handleRequest for server-side pagination

### Requirement: Detail page template
The skill SHALL contain the detail page template with PageHeader (showBack), tab panels, and formatted display.

#### Scenario: Detail page template present
- **WHEN** a user creates a detail page
- **THEN** the skill provides the [id].vue template with route params, fetchById on mount, and responsive layout

### Requirement: Realtime and Excel export templates
The skill SHALL contain the useRealtime subscription pattern and ExcelJS export pattern.

#### Scenario: Optional feature templates present
- **WHEN** a user needs realtime or Excel export
- **THEN** the skill provides subscribe/unsubscribeAll pattern and dynamic import ExcelJS pattern with styled headers

### Requirement: UI component rules
The skill SHALL document all required UI components (AppInput, AppSelect, AppButton, DataTable, DatePicker, PageHeader, FormDialog, DeleteDialog, SearchInput, IconButton) with their key props and import paths.

#### Scenario: Component reference complete
- **WHEN** a user reads the skill
- **THEN** all component names, replacement targets (q-input → AppInput), import paths, and key props are documented

### Requirement: Frontend general rules
The skill SHALL document: Vietnamese messages, DD/MM/YYYY date format, vi-VN number formatting, file-based routing, permission checks with usePermission, error handling with getErrorMessage, and confirmation with useConfirm.

#### Scenario: General rules present
- **WHEN** a user reads the skill
- **THEN** all formatting and convention rules from the original QUY TẮC BẮT BUỘC section relevant to frontend are included

### Requirement: Multi-agent FE parallelization guide
The skill SHALL include guidance for splitting FE work across multiple agents: fe-core (Types + Service + Composable) runs first, then fe-page agent(s) (Pages, Realtime, Excel) run after fe-core completes.

#### Scenario: Multi-agent guide present
- **WHEN** a complex FE task requires multiple agents
- **THEN** the skill documents the fe-core/fe-page split with dependency ordering

### Requirement: Frontend checklist included
The skill SHALL include both state and UI sections of the completion checklist.

#### Scenario: Checklist covers all FE items
- **WHEN** a user finishes a FE task
- **THEN** the checklist covers: useLoading.withLoading, getErrorMessage, useConfirm, SearchInput, fetchApi with PUT, buildQueryString, definePage permissions, PageHeader, AppInput/Select/Button, tabs, action buttons, status badges, DataTable empty-action, server-side pagination, responsive grid, DatePicker popup, form validation rules, permission v-if, detail page back button
