## Why

The `/new-feature` skill is a single 1650-line SKILL.md that contains templates and rules for ALL layers (Database, Backend, Frontend). When a user only needs to work on one layer (e.g., add a Hono route), the entire 1650 lines are loaded into context — wasting ~70% of tokens and slowing responses. Splitting into layer-specific skills reduces context size and enables parallel team agent work where each agent loads only its relevant skill.

## What Changes

- Split `/new-feature` SKILL.md into 3 layer-specific skills: `/new-db`, `/new-be`, `/new-fe`
- Rewrite `/new-feature` as a lightweight team lead/orchestrator skill that references the layer skills
- Each layer skill is self-contained with templates, conventions, and checklist for that layer only
- `/new-feature` v2 contains: requirement analysis, scope detection, team orchestration guide, and cross-layer rules
- `/new-fe` includes guidance for multi-agent FE parallelization (splitting service/composable from pages)

## Capabilities

### New Capabilities
- `skill-new-db`: Database layer skill — migration templates, ENUM, views, RPC functions, triggers, indexes, DB checklist
- `skill-new-be`: Backend layer skill — BE types, Zod validation, Hono route templates (Level 1-3), route registration, auth/permissions, notification integration, BE checklist
- `skill-new-fe`: Frontend layer skill — FE types, service client, composable, list/detail pages, realtime, Excel export, UI component rules, multi-agent FE guide, FE checklist
- `skill-new-feature-orchestrator`: Rewritten `/new-feature` as team lead — requirement analysis, scope detection (DB/BE/FE/All), decision tree for single vs multi-agent, team orchestration flow, cross-layer rules

### Modified Capabilities

## Impact

- Files created: `.claude/skills/new-db/SKILL.md`, `.claude/skills/new-be/SKILL.md`, `.claude/skills/new-fe/SKILL.md`
- Files modified: `.claude/skills/new-feature/SKILL.md` (complete rewrite as orchestrator)
- No application code changes — skills only
- No dependency changes
- Backward compatible: `/new-feature` still works but now delegates to layer skills
