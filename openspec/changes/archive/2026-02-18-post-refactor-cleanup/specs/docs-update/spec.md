## ADDED Requirements

### Requirement: README.md reflects current project state
The `README.md` SHALL be updated with accurate counts for all project metrics: routes, services, composables, pages, migrations, UI components, and agents.

#### Scenario: Counts are accurate
- **WHEN** a developer reads README.md
- **THEN** the listed counts SHALL match actual file counts in the repository

### Requirement: CLAUDE.md includes enum convention
The `CLAUDE.md` SHALL document that all database enums MUST use UPPERCASE values as a project convention.

#### Scenario: Convention is documented
- **WHEN** a developer or AI agent reads CLAUDE.md
- **THEN** they SHALL find a clear rule stating enums use UPPERCASE values

### Requirement: Agent files include project context
The `.claude/agents/*.md` files SHALL include project-specific conventions and scope boundaries relevant to each agent's role.

#### Scenario: Agent follows project conventions
- **WHEN** an agent is spawned using a `.claude/agents/*.md` definition
- **THEN** the agent SHALL have sufficient context to follow project conventions without additional prompting
