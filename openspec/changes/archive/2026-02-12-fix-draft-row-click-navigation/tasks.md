## 1. Fix Draft Row Click Navigation

- [x] 1.1 Extract draft-loading logic from `onMounted` into a standalone `loadDraftFromQuery` async function in `src/pages/thread/issues/v2/index.vue`
- [x] 1.2 Add `watch(() => route.query.issue)` that calls `loadDraftFromQuery` when the issue param changes
- [x] 1.3 Replace the duplicate logic in `onMounted` to use `loadDraftFromQuery` (or use immediate watcher)

## 2. Verification

- [x] 2.1 Type-check passed (`npm run type-check`)
- [ ] 2.2 Verify clicking a DRAFT row in history navigates and loads the draft form correctly (manual test)
- [ ] 2.3 Verify direct URL access with `?issue={id}` still works on initial page load (manual test)
- [ ] 2.4 Verify clicking a CONFIRMED row still navigates to the detail page (manual test)
