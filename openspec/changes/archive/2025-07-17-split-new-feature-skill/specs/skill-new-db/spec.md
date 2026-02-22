## ADDED Requirements

### Requirement: Database layer skill file exists
The system SHALL have a skill file at `.claude/skills/new-db/SKILL.md` that contains all database-related templates and conventions.

#### Scenario: Skill file created
- **WHEN** the implementation is complete
- **THEN** `.claude/skills/new-db/SKILL.md` exists and is a valid skill file

### Requirement: Migration template coverage
The skill SHALL contain templates for: basic table creation, ENUM types, adding ENUM values, RPC functions, views, audit triggers, and indexes.

#### Scenario: All migration templates present
- **WHEN** a user invokes `/new-db`
- **THEN** the skill provides templates for CREATE TABLE (with created_at, updated_at, deleted_at, SERIAL PK), CREATE TYPE enum, ALTER TYPE add value, CREATE FUNCTION (fn_ prefix, p_ params, v_ vars), CREATE VIEW (v_ prefix), CREATE TRIGGER (updated_at + audit), and CREATE INDEX (idx_ prefix)

### Requirement: Database conventions documented
The skill SHALL document all database naming conventions: snake_case tables, v_ prefix views, fn_ prefix functions, UPPERCASE enum values, idx_ prefix indexes, COMMENT ON in Vietnamese.

#### Scenario: Convention reference complete
- **WHEN** a user reads the skill
- **THEN** all naming conventions from the original /new-feature Step 1 are present

### Requirement: Database checklist included
The skill SHALL include the database section of the completion checklist from the original skill.

#### Scenario: Checklist covers all DB items
- **WHEN** a user finishes a DB task using this skill
- **THEN** the checklist covers: BEGIN/COMMIT wrapping, created_at/updated_at/trigger, ENUM uppercase, soft delete, indexes, NOTIFY pgrst, ALTER PUBLICATION, RPC naming, COMMENT ON
