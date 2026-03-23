## Context

The project uses Claude Code skills (`.claude/skills/<name>/SKILL.md`) as reusable prompt templates. The current `/new-feature` skill is a monolithic 1650-line file covering all layers (DB → Backend → Frontend). When team agents are spawned for a specific layer, they load the entire file into context, wasting tokens on irrelevant sections.

Current state:
- `.claude/skills/new-feature/SKILL.md` — 1650 lines, all layers in one file
- No layer-specific skills exist
- MEMORY.md already defines team agent roles (db-agent, backend-agent, frontend-agent) but agents have no dedicated skill to load

## Goals / Non-Goals

**Goals:**
- Split into 3 layer-specific skills (`/new-db`, `/new-be`, `/new-fe`) that are self-contained
- Rewrite `/new-feature` as a lightweight orchestrator (~200 lines) that delegates to layer skills
- Each layer skill contains only its relevant templates, conventions, and checklist
- `/new-fe` supports multi-agent parallelization guidance (fe-core vs fe-page split)
- Agent prompts reference skill files: "Read `.claude/skills/new-be/SKILL.md` before starting"

**Non-Goals:**
- Changing any application code (routes, pages, services, etc.)
- Changing the actual conventions or templates — content stays the same, just reorganized
- Creating new skill invocation mechanisms — skills use existing `.claude/skills/` convention
- Modifying MEMORY.md or CLAUDE.md (those reference skills by name, which stays the same)

## Decisions

### D1: Content split boundaries

**Decision**: Split by architectural layer with clear ownership.

| Skill | Content from original | Lines (est.) |
|-------|----------------------|--------------|
| `/new-db` | Step 1 (Migration, ENUM, View, RPC, Trigger, Index) + DB checklist | ~180 |
| `/new-be` | Step 2 BE types + Step 3 Zod + Step 4 Hono routes (all levels) + BE checklist | ~530 |
| `/new-fe` | Step 2 FE types + Steps 5-9 (Service, Composable, Pages, Realtime, Excel) + UI rules + FE checklist | ~750 |
| `/new-feature` v2 | Step 0 (analysis) + orchestration + cross-layer rules + total checklist | ~200 |

**Why**: Maps directly to team agent roles already defined in MEMORY.md. Each agent loads exactly what it needs.

**Alternative considered**: Split by complexity level (Level 1/2/3) — rejected because agents are organized by layer, not complexity.

### D2: Types ownership

**Decision**: BE types go in `/new-be`, FE types go in `/new-fe`. Both skills contain their respective type templates.

**Why**: When working on BE-only tasks, you need BE types but not FE types (and vice versa). The type formats differ (BE uses `interface Row/DTO`, FE uses `enum` + different DTO shapes).

### D3: Cross-layer linking via convention (Option A)

**Decision**: Team lead describes requirements, each agent reads the codebase (migration files, type files, etc.) to understand context. No explicit artifact passing between agents.

**Why**: Already established in MEMORY.md pre-code rules: "PHẢI đọc file hiện tại trước khi sửa, kiểm tra schema DB trước khi viết query." Agents naturally read what exists before writing.

### D4: `/new-feature` v2 orchestration via decision tree

**Decision**: The rewritten `/new-feature` contains a decision tree:
- DB only → single agent with `/new-db`
- BE only → single agent with `/new-be`
- FE only → single/multi agent with `/new-fe`
- Multi-layer → TeamCreate + spawn layer agents, each reads their skill file

Agent prompt template: "Read `.claude/skills/new-X/SKILL.md` and follow its instructions. Tasks: [list]."

### D5: Multi-agent FE parallelization

**Decision**: `/new-fe` includes guidance for splitting work when the FE task is complex:
- `fe-core` agent: Types + Service + Composable (must complete first)
- `fe-page` agent(s): Pages, Realtime, Excel (depends on fe-core)

This is optional guidance, not mandatory — simple FE tasks use a single agent.

## Risks / Trade-offs

- **[Risk] Content duplication**: Some rules appear in multiple skills (e.g., "response format `{data, error}`" in both BE and FE service). → Mitigation: Accept minimal duplication for self-containment. Each skill should work independently without reading other skills.
- **[Risk] Skill drift**: Over time, updating one skill without the others causes inconsistency. → Mitigation: `/new-feature` v2 includes a note to update layer skills in sync.
- **[Risk] Agent doesn't read skill file**: If team lead forgets to include "Read SKILL.md" in prompt. → Mitigation: The orchestrator template makes this mandatory in the agent prompt template.
