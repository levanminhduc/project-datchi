## Context

The application has 56 AppSelect instances across 24 files. Only 4 currently have autocomplete search enabled via `use-input`. The remaining 52 are plain dropdowns. Of those, ~35 have dynamic option sets that can grow large (thread types, POs, styles, colors, warehouses, suppliers, departments, materials). The AppSelect component already supports `use-input`, `fill-input`, and `hide-selected` props — no component changes needed.

## Goals / Non-Goals

**Goals:**
- Enable autocomplete search on all AppSelect instances that have dynamic/large option sets
- Consistent UX across the application — users can always type-to-search when options are many

**Non-Goals:**
- Modifying the AppSelect component itself
- Adding server-side search/filtering (options are already loaded client-side)
- Adding autocomplete to selects with few static options (status, priority, unit, reason)
- Changing any business logic or data flow

## Decisions

### Decision 1: Add three props uniformly
Add `use-input`, `fill-input`, and `hide-selected` to each qualifying AppSelect.

**Rationale**: This is the established pattern already used in 4 existing instances (employees.vue, IssueRequestForm.vue, issues/v2/index.vue). `fill-input` shows the selected text in the input field, `hide-selected` prevents the chip from overlapping with typed text. All three together create the standard autocomplete experience.

**Alternative considered**: Only add `use-input` without `fill-input`/`hide-selected` — rejected because it creates an inconsistent visual behavior where selected value and typed text overlap.

### Decision 2: Skip status/priority/unit/reason selects
Selects with ≤5 static/predefined options do not benefit from search — the dropdown is already scannable.

**Skipped selects**: Status filters (~7), Priority selects (~3), Unit selector (g/kg), Operation type (1), Reason dropdown (1), Demo page selects (3).

### Decision 3: Template-only changes
No script changes needed. The `use-input` prop enables Quasar's built-in client-side filtering which works with the existing options arrays.

## Risks / Trade-offs

- [Low risk] Some selects with only 3-5 options (e.g., warehouse, department) get autocomplete which may feel unnecessary → Acceptable trade-off for consistency, and it doesn't hurt UX
- [No risk] Additive-only change — adding props never breaks existing behavior
