## 1. Database — Migration and Backfill

- [x] 1.1 Create `supabase/migrations/{timestamp}_create_guide_images.sql`: table `guide_images(id UUID PK DEFAULT gen_random_uuid(), guide_id UUID NULLABLE REFERENCES guides(id) ON DELETE CASCADE, storage_path TEXT UNIQUE NOT NULL, file_size BIGINT, mime_type TEXT, status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','LINKED')), uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(), linked_at TIMESTAMPTZ)`
- [x] 1.2 In the same migration, add indexes: `CREATE INDEX idx_guide_images_guide_id ON guide_images(guide_id)` and `CREATE INDEX idx_guide_images_status_uploaded ON guide_images(status, uploaded_at)` (supports cron query)
- [x] 1.3 Create `scripts/backfill-guide-images.ts` (one-time, safe to re-run): query `storage.objects` WHERE `bucket_id = 'guide-images'` AND `name LIKE 'guides/%'`; for each, check if path appears in any `guides.content_html` (regex match); INSERT into `guide_images` with `guide_id` if matched (status `LINKED`) or NULL (status `PENDING`, `uploaded_at = now() - interval '48 hours'`) — skip if row already exists (`ON CONFLICT (storage_path) DO NOTHING`) ← (verify: run `SELECT status, count(*) FROM guide_images GROUP BY status` — expect 3 PENDING, 3 LINKED matching current bucket state; re-running script produces no duplicate rows)

## 2. Backend — Image Linker Utility

- [x] 2.1 Create `server/utils/guide-image-linker.ts`: export `extractStoragePaths(contentHtml: string): string[]` — regex `/\/api\/guides\/images\/(guides\/[^"'\s]+)/g`, returns array of storage paths
- [x] 2.2 In `server/utils/guide-image-linker.ts`, export `linkImagesToGuide(supabase: SupabaseClient, guideId: string, contentHtml: string | null): Promise<void>`:
  1. Call `extractStoragePaths(contentHtml ?? '')`
  2. If paths present: `UPDATE guide_images SET guide_id = guideId, status = 'LINKED', linked_at = now() WHERE storage_path = ANY(paths) AND (guide_id IS NULL OR guide_id = guideId)`
  3. SELECT `storage_path` from `guide_images` WHERE `guide_id = guideId AND storage_path NOT IN paths` (removed images)
  4. For each removed: `supabase.storage.from('guide-images').remove([path])`, then DELETE from `guide_images` WHERE `storage_path = path`
- [x] 2.3 Add TypeScript types for `GuideImage` row in `server/types/` (or inline in the util file): `{ id: string; guide_id: string | null; storage_path: string; status: 'PENDING' | 'LINKED'; uploaded_at: string; linked_at: string | null }` ← (verify: `npm run type-check` passes with no errors in guide-image-linker.ts)

## 3. Backend — Orphan Cleanup Utility

- [x] 3.1 Create `server/utils/guide-image-cleanup.ts`: export `cleanupOrphans(supabase: SupabaseClient): Promise<{ deleted: number }>`:
  1. `SELECT id, storage_path FROM guide_images WHERE status = 'PENDING' AND uploaded_at < now() - interval '24 hours'`
  2. Collect paths; call `supabase.storage.from('guide-images').remove(paths)` (Storage errors logged, not thrown)
  3. `DELETE FROM guide_images WHERE id = ANY(ids)`, return `{ deleted: ids.length }`
- [x] 3.2 Create `server/routes/admin-guides.ts` (new file, Hono router `adminGuides`): `POST /cleanup-orphans` route requiring `requirePermission('guides.edit')`, calls `cleanupOrphans(supabaseAdmin)`, returns `{ data: { deleted: N }, error: null, message: 'Đã dọn dẹp N ảnh không sử dụng' }`
- [x] 3.3 Register `adminGuides` router in `server/index.ts`: `import adminGuidesRouter from './routes/admin-guides'` + `app.route('/api/admin/guides', adminGuidesRouter)` — place BEFORE the `app.route('/api/guides', guidesRouter)` line ← (verify: `curl -X POST http://localhost:3000/api/admin/guides/cleanup-orphans -H "Authorization: Bearer {token}"` returns 200 with `{ data: { deleted: N } }`; calling without token returns 401)

## 4. Backend — Update Upload Endpoint

- [x] 4.1 In `server/routes/guides.ts`, modify `POST /upload-image` (line ~101): after the Storage `upload()` call succeeds and before `return c.json(...)`, INSERT into `guide_images`: `supabaseAdmin.from('guide_images').insert({ storage_path: filePath, file_size: processed.length, mime_type: 'image/webp', status: 'PENDING' })` — INSERT error is logged but does NOT fail the upload response (return the URL regardless) ← (verify: after upload, `SELECT * FROM guide_images WHERE storage_path = 'guides/{filename}.webp'` returns 1 row with status='PENDING')

## 5. Backend — Wire Linker into Create and Update Handlers

- [x] 5.1 In `server/routes/guides.ts`, modify `POST /` (create guide, line ~356): after the guide INSERT succeeds and `data` is returned, call `await linkImagesToGuide(supabaseAdmin, data.id, data.content_html)` — import from `../utils/guide-image-linker`
- [x] 5.2 In `server/routes/guides.ts`, modify `PUT /:id` (update guide, line ~408): after the guide UPDATE succeeds and `data` is returned, call `await linkImagesToGuide(supabaseAdmin, data.id, data.content_html)` ← (verify: save a guide with 1 embedded image; `SELECT status, guide_id FROM guide_images WHERE storage_path = 'guides/{filename}.webp'` returns status='LINKED' with correct guide_id; then update the guide removing that image and re-saving; `SELECT count(*) FROM guide_images WHERE storage_path = 'guides/{filename}.webp'` returns 0 and Storage file is gone)

## 6. Backend — Update Delete Handler

- [x] 6.1 In `server/routes/guides.ts`, modify `DELETE /:id` (line ~468): before the `UPDATE guides SET deleted_at` call, add:
  1. `SELECT storage_path FROM guide_images WHERE guide_id = id` — collect paths
  2. If paths non-empty: `supabaseAdmin.storage.from('guide-images').remove(paths)` — log error if any, do not throw
  3. Proceed with the soft-delete UPDATE as-is (CASCADE FK deletes guide_images rows automatically) ← (verify: create guide with image, call DELETE endpoint, check Storage bucket via Supabase Studio or `SELECT * FROM storage.objects WHERE name LIKE 'guides/%'` — file must be absent; guide_images row must be absent)

## 7. Frontend — Race Condition and Upload Tracking

- [x] 7.1 In `src/composables/useGuideEditor.ts`, add `const uploadingCount = ref(0)` and `const isUploading = computed(() => uploadingCount.value > 0)` after the existing `isSaving` ref
- [x] 7.2 In `src/composables/useGuideEditor.ts`, refactor `uploadImage(file: File)`: create an `AbortController`, store it in a `Set<AbortController>` ref named `pendingUploads`; increment `uploadingCount` before the `guideService.uploadImage` call; decrement in a `finally` block; pass signal to service call if the service supports it (or just track count for now)
- [x] 7.3 In `src/composables/useGuideEditor.ts`, update `onBeforeUnmount`: after `editor.value?.destroy()`, iterate `pendingUploads` and call `controller.abort()` on each, then clear the set
- [x] 7.4 In `src/composables/useGuideEditor.ts`, add the `isUploading` computed to the return object alongside existing exports ← (verify: in browser DevTools, open editor, start upload of a large image, immediately check that Save button is disabled; after upload completes, Save button re-enables)

## 8. Frontend — Paste and Drop Warning

- [x] 8.1 In `src/composables/useGuideEditor.ts`, add `handlePaste` function: register on editor DOM via `editor.value?.view.dom.addEventListener('paste', ...)` inside a `watchEffect` or `onMounted` that checks `editor.value` exists; in the handler, if `event.clipboardData?.files` has any `image/*` file, call `event.preventDefault()` and `snackbar.error('Vui lòng dùng nút Thêm ảnh để tải lên')`
- [x] 8.2 In `src/composables/useGuideEditor.ts`, add `handleDrop` function with same pattern on `'drop'` event using `event.dataTransfer?.files`
- [x] 8.3 Remove event listeners in `onBeforeUnmount` to prevent leaks ← (verify: open guide editor, paste an image from clipboard → snackbar "Vui lòng dùng nút Thêm ảnh..." appears and no image is inserted into editor; drag-and-drop image onto editor → same snackbar appears)

## 9. Frontend — Editor Page Button Guard

- [x] 9.1 In `src/pages/guides/editor.vue`, destructure `isUploading` from `useGuideEditor()` return value
- [x] 9.2 In `src/pages/guides/editor.vue`, bind `:disable="isUploading || saving"` (or equivalent local saving flag) on the Save button; same bind on the Publish/Toggle-publish button ← (verify: both buttons are disabled while `isUploading` is true; re-enabled immediately when upload finishes or fails)

## 10. Backup Scripts

- [x] 10.1 In `scripts/db-backup.sh`, remove the line `--exclude-schema=storage \` (line 30) so `storage.objects` is included in the pg_dump
- [x] 10.2 Create `scripts/storage-volume-backup.sh`: detect volume `supabase_storage_project-datchi` via `docker volume ls`; run `docker run --rm -v supabase_storage_project-datchi:/data -v "$(pwd)/backups":/backup alpine tar czf /backup/storage_${TIMESTAMP}.tar.gz -C /data .`; print output path
- [x] 10.3 Create `scripts/storage-volume-restore.sh`: accept `<archive_file>` argument; run `docker run --rm -v supabase_storage_project-datchi:/data -v "$(pwd)":/backup alpine tar xzf /backup/$1 -C /data`; warn user about overwrite
- [x] 10.4 Create `scripts/full-backup.sh`: run `bash scripts/db-backup.sh` and `bash scripts/storage-volume-backup.sh`; collect output files; bundle into `backups/full_${TIMESTAMP}.tar.gz`; print final archive path
- [x] 10.5 Create `scripts/full-restore.sh`: accept `<full_archive_file>` argument; extract into temp dir; call `bash scripts/db-restore.sh <db_dump>` and `bash scripts/storage-volume-restore.sh <storage_archive>`
- [x] 10.6 In `package.json`, add npm scripts: `"backup:storage": "bash scripts/storage-volume-backup.sh"`, `"backup:full": "bash scripts/full-backup.sh"`, `"restore:full": "bash scripts/full-restore.sh"`, `"cleanup:orphans": "curl -s -X POST http://localhost:3000/api/admin/guides/cleanup-orphans -H \"Authorization: Bearer $ADMIN_TOKEN\""` ← (verify: `npm run backup:full` creates `backups/full_{timestamp}.tar.gz`; extracting it shows both a `.dump` file and a `storage_*.tar.gz` file; `pg_restore --list <dump>` output includes `storage` schema tables)

## 11. Testing and Verification

- [x] 11.1 Run `npm run type-check` — zero errors (1 pre-existing error in weekly-order/index.vue unrelated to this change)
- [x] 11.2 Run `npm run lint` — zero errors in modified files (pre-existing warnings in other files)
- [ ] 11.3 Apply the migration: `supabase migration up` — verify `\d guide_images` shows correct schema and both indexes exist
- [ ] 11.4 Run the backfill script: `npx tsx scripts/backfill-guide-images.ts` — verify `SELECT status, count(*) FROM guide_images GROUP BY status` matches expected (3 PENDING + 3 LINKED or whatever the current bucket state is); verify re-running script adds 0 new rows
- [ ] 11.5 End-to-end: upload an image via the editor, do NOT save → wait 25 h (or manually set `uploaded_at = now() - interval '25 hours'` in DB) → call `POST /api/admin/guides/cleanup-orphans` → verify Storage file is gone and guide_images row is deleted
- [ ] 11.6 End-to-end: create guide with image → verify guide_images row is LINKED → update guide removing the image → verify Storage file deleted and guide_images row gone
- [ ] 11.7 End-to-end: create guide with image → delete guide via API → verify Storage file gone, guide row has `deleted_at` set, guide_images row absent
- [ ] 11.8 Frontend: open editor, start uploading a large image, immediately click Save → button must be disabled during upload; after upload completes button re-enables
- [ ] 11.9 Frontend: paste image in editor → snackbar warning appears, no image inserted into editor content ← (verify: all 7 end-to-end scenarios pass; `SELECT count(*) FROM guide_images WHERE status = 'PENDING' AND uploaded_at < now() - interval '24 hours'` returns 0 after cleanup)
