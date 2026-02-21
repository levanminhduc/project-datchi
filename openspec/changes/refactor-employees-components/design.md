## Context

`src/pages/employees.vue` is a 963-line page managing employee CRUD. The project has a full suite of App component wrappers (40+ components in `src/components/ui/`) that provide standardized Vietnamese defaults, consistent styling, and reduced boilerplate. However, this page predates the component library and still uses raw Quasar components in most areas except the FormDialog section.

Current component usage in employees.vue:
- **Correct**: FormDialog, AppInput, AppSelect (create/edit form only)
- **Incorrect**: Everything else uses raw q-* components

## Goals / Non-Goals

**Goals:**
- Replace all raw Quasar components with their App component equivalents where wrappers exist
- Reduce template verbosity (especially delete dialog ~42 lines → ~5, detail dialog ~200 lines simplified)
- Maintain 100% behavioral parity — no user-facing changes

**Non-Goals:**
- Refactoring script/logic — only template changes
- Creating new App components (e.g., DataTable wrapper, Avatar wrapper)
- Changing q-table structure or pagination behavior
- Modifying the FormDialog section (already correct)
- Adding new features or changing UX flow

## Decisions

### D1: PopupEdit for text columns only, keep raw for select column

**Decision**: Use `PopupEdit` for `full_name` and `department` (text input), keep raw `q-popup-edit` + `q-select` for `chuc_vu`.

**Rationale**: `PopupEdit` only supports text/number/textarea input types. The `chuc_vu` column requires a select dropdown. Forcing a workaround would add complexity without benefit.

**Alternative**: Extend PopupEdit to support select mode — rejected as out of scope for this refactor.

### D2: AppDialog for detail dialog, keep q-list internals

**Decision**: Wrap the detail dialog in `AppDialog` with header/actions slots, replace `q-list` → `AppList`, `q-item` → `ListItem`, replace `q-badge` → `AppBadge`, replace `q-btn` → `AppButton`. Keep `q-item-section`, `q-item-label`, `q-avatar` as-is (no wrappers exist).

**Rationale**: Maximize App component usage while staying within what wrappers provide. `ListItem` wraps `q-item` but its children (`q-item-section`, `q-item-label`) have no wrappers and are fine to use directly.

### D3: DeleteDialog replaces manual delete confirmation

**Decision**: Replace the 42-line manual `q-dialog` + `q-card` delete confirmation with the `DeleteDialog` component.

**Rationale**: `DeleteDialog` provides identical UX with Vietnamese defaults, danger styling, and optional typed confirmation — all in ~5 lines.

### D4: PageHeader replaces manual header div

**Decision**: Use `PageHeader` with title prop and actions slot for search + add button.

**Rationale**: `PageHeader` provides consistent page title styling (text-h5 vs current text-h4), back button support, and actions slot — matching other pages in the app.

### D5: Import cleanup

**Decision**: Add imports for all new App components. Remove unused raw Quasar imports if any become orphaned.

**Rationale**: Keep imports clean and explicit.

## Risks / Trade-offs

- **[Minor style differences]** `PageHeader` uses `text-h5` while current header uses `text-h4`. This is a minor visual change that brings consistency with other pages. → Accept as improvement.
- **[AppDialog cardStyle]** `AppDialog` has default `minWidth: 400px, maxWidth: 90vw`. Current detail dialog uses `max-width: 600px`. May need to pass style prop or adjust. → Verify AppDialog supports style customization via $attrs.
- **[PopupEdit @save event]** `PopupEdit` emits `@save` with just the value, while current code uses `@save="(val, initialVal) => ..."` from raw `q-popup-edit`. → Need to verify PopupEdit save event signature and adapt handler if needed.
