# Learned Patterns

Patterns discovered during implementation that should be followed consistently.

---

## 2026-02-02 Responsive Layout

**Context**: Fixing responsive design issues with sidebar open/close behavior
**Pattern**: Avoid fixed `max-width` values (e.g., `max-width: 1200px`) for page containers when using Quasar's drawer layout. Use `width: 100%; max-width: 100%` instead to allow content to properly adapt when sidebar opens/closes.
**Reason**: Quasar's layout system (`view="hHh Lpr fFf"`) automatically adjusts the page container width when drawer opens/closes. Fixed max-width values prevent the content from properly filling the available space, causing layout issues.

---

## 2026-02-02 Overflow Handling

**Context**: Ensuring tables and stepper content adapt to container width changes
**Pattern**: Add `:deep(.q-stepper__content) { overflow-x: auto; }` for stepper pages and `:deep(.q-table__middle) { overflow-x: auto; }` for table pages to handle horizontal overflow gracefully when sidebar state changes.
**Reason**: When sidebar opens, the available width decreases. Without proper overflow handling, content may get cut off or cause horizontal scroll on the entire page.

---
