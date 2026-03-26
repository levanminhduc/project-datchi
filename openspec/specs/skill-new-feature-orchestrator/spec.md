## ADDED Requirements

### Requirement: Orchestrator skill file exists
The system SHALL rewrite `.claude/skills/new-feature/SKILL.md` as a lightweight orchestrator (~200 lines) that delegates to layer-specific skills.

#### Scenario: Skill file rewritten
- **WHEN** the implementation is complete
- **THEN** `.claude/skills/new-feature/SKILL.md` is rewritten as an orchestrator and no longer contains layer-specific templates

### Requirement: Requirement analysis step
The skill SHALL contain Step 0 (requirement analysis): interpret the request in Vietnamese, determine scope (DB/BE/FE/All), determine complexity level (Level 1-3), and ask user for confirmation before proceeding.

#### Scenario: Analysis step present
- **WHEN** a user invokes `/new-feature`
- **THEN** the skill guides through requirement interpretation, scope detection, and complexity assessment

### Requirement: Scope-based decision tree
The skill SHALL contain a decision tree that selects the execution strategy based on scope:
- DB only → single agent with `/new-db` rules
- BE only → single agent with `/new-be` rules
- FE only → single/multi agent with `/new-fe` rules
- DB+BE → TeamCreate with db-agent and be-agent
- Full-stack → TeamCreate with db-agent, be-agent, fe-agent(s)

#### Scenario: Decision tree for single-layer
- **WHEN** scope is single-layer (e.g., FE only)
- **THEN** the skill instructs to read the corresponding layer skill file and proceed without team creation

#### Scenario: Decision tree for multi-layer
- **WHEN** scope is multi-layer (e.g., DB+BE+FE)
- **THEN** the skill instructs to create a team, spawn layer agents with dependencies, and each agent reads its layer skill file

### Requirement: Team orchestration guide
The skill SHALL contain the team orchestration flow: TeamCreate → TaskCreate with dependencies → spawn agents with prompt template → coordinate → verify → shutdown → cleanup.

#### Scenario: Agent prompt template provided
- **WHEN** the team lead spawns a layer agent
- **THEN** the skill provides a prompt template that includes: "Read `.claude/skills/new-X/SKILL.md`", pre-code rules from MEMORY.md, specific task list, and "Mark tasks completed when done"

#### Scenario: Dependency ordering documented
- **WHEN** full-stack team is created
- **THEN** the skill specifies: db-agent runs first, be-agent blocked by db-agent, fe-agent blocked by be-agent

### Requirement: Execution order reference
The skill SHALL contain the 10-step execution order (Migration → Types → Validation → Routes → Service → Composable → Pages → Detail → Realtime → Excel) with mapping to which layer skill handles each step.

#### Scenario: Step-to-skill mapping present
- **WHEN** a user reads the skill
- **THEN** each of the 10 steps is mapped to its layer skill: Step 1 → /new-db, Steps 2-4 → /new-be, Steps 5-10 → /new-fe

### Requirement: Cross-layer rules
The skill SHALL contain rules that span multiple layers: API flow (Frontend → fetchApi → Hono → supabaseAdmin → PostgreSQL), Vietnamese messages, no comments in code, DD/MM/YYYY date format, vi-VN number format.

#### Scenario: Cross-layer rules present
- **WHEN** a user reads the skill
- **THEN** all cross-cutting conventions are documented in one place

### Requirement: Skill sync note
The skill SHALL include a note reminding maintainers to update layer skills in sync when conventions change.

#### Scenario: Sync note present
- **WHEN** a maintainer updates a convention
- **THEN** the skill reminds them to update all affected layer skills
