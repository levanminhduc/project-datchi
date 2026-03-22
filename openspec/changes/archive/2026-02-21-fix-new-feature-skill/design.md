## Context

The `/new-feature` skill (`.claude/skills/new-feature/SKILL.md`, ~1578 lines) is a comprehensive template guide for creating full-stack features in the Dat Chi project. A joint review by Claude (codebase analysis) and Codex/GPT (independent code review) found ~25 issues across 3 categories: internal inconsistencies, security gaps, and missing patterns.

The skill is the primary guide used by AI agents when building new features, so inaccuracies propagate into every new feature created.

`CLAUDE.md` also has 1 response format inconsistency that contradicts the actual codebase.

## Goals / Non-Goals

**Goals:**
- Fix all internal contradictions between skill rules and skill templates
- Fix security vulnerabilities in template code (auth, mass-assignment, info leak)
- Add missing patterns that exist in the real codebase (SearchInput, DeleteDialog, auth middleware, migration wrapping)
- Fix CLAUDE.md response format to match reality
- Keep skill structure and organization intact (edit in place, don't rewrite)

**Non-Goals:**
- Rewriting the entire skill from scratch
- Adding test templates (project has no test infrastructure)
- Adding patterns for edge cases (UUID PKs, advanced logging, migration rollback)
- Changing application code to match the skill

## Decisions

### D1: Edit in place, not rewrite
**Decision**: Modify specific sections of existing SKILL.md rather than rewriting entirely.
**Rationale**: The overall structure (10 steps, checklist, rules) is solid. Only content within sections needs fixing. Rewriting risks losing working patterns.

### D2: Align to codebase reality, not theoretical best practices
**Decision**: When Codex suggested patterns that don't match this project's reality (UUID PKs, structured logging, test templates), we skip them.
**Rationale**: Skill must match what agents will encounter in the actual codebase. Theoretical improvements that conflict with existing patterns cause more confusion.

### D3: Frontend service pattern — import from @/types
**Decision**: Change service template from local `ApiResponse` declaration to importing from `@/types`.
**Rationale**: 3-4 newer services already use this pattern. The codebase is migrating in this direction. New features should follow the newer pattern.

### D4: Use FormDialog in page template
**Decision**: Replace inline `q-dialog` + `q-card` in list page template with `FormDialog` component.
**Rationale**: Skill's own rule table says to use `FormDialog`. The template contradicts the rule.

### D5: Add SearchInput to list page template
**Decision**: Replace `AppInput` + manual debounce with `SearchInput` component.
**Rationale**: `SearchInput` exists, has built-in debounce (300ms) and clearable, and is used in newer pages (employees.vue).

### D6: Response format fix scope
**Decision**: Fix both SKILL.md response format AND CLAUDE.md response format.
**Rationale**: Both documents must agree. The actual codebase uses `{ data, error, message? }` — neither document is currently correct.

## Risks / Trade-offs

- [Risk] Edits to SKILL.md could accidentally break working template code → Mitigation: Each edit is small and targeted; verify templates still form valid code after editing
- [Risk] Changing ApiResponse import pattern in service template diverges from majority of existing services → Mitigation: This is the direction the codebase is heading; older services will be migrated over time
- [Risk] CLAUDE.md response format change could surprise other agents/tools that read it → Mitigation: The change makes CLAUDE.md match reality, so any agent reading it will now get correct information
