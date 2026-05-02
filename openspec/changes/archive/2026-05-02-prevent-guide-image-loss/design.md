## Context

The `guides` feature stores article content as JSONB (`content`) and HTML (`content_html`) with embedded image URLs of the form `/api/guides/images/guides/{filename}.webp`. Images are physically stored in the Supabase Storage bucket `guide-images`. There is no hard link between the Storage objects and the guides that reference them. As a result:

- Uploading an image and then navigating away before saving leaves a permanent orphan in Storage.
- Clicking Save immediately after clicking the image-upload button — before the async upload resolves — saves content without the image URL, making the file unreachable forever.
- Deleting a guide does not remove its Storage files.

DB evidence: 6 files in bucket, 3 are orphaned (50%). The Docker volume for Storage is `supabase_storage_project-datchi`. The DB backup script excludes `--exclude-schema=storage`, so Storage metadata (`storage.objects`) is not backed up.

## Goals / Non-Goals

**Goals:**

- Guarantee that every uploaded image is tracked in a DB table with lifecycle status.
- Prevent saves while an upload is still in flight (frontend guard).
- Clean up Storage when a guide is deleted.
- Automatically purge abandoned uploads (PENDING > 24 h) via cron.
- Provide a manual admin trigger for the cleanup.
- Include Storage volume in full backups.

**Non-Goals:**

- Custom Tiptap paste/drop handler with auto-upload (Sprint 3).
- RLS lock on `storage.objects` DELETE policy (Sprint 3).
- GET guide validation that each embedded image still exists (Sprint 3).
- CDN migration.

## Decisions

### D1: Synchronous image tracking row on upload (no deferred job)

**Decision:** `POST /upload-image` inserts a `guide_images` row with `status='PENDING'` synchronously, in the same request, before returning the URL to the client.

**Rationale:** Deferred tracking (queue/background job) adds infrastructure complexity. Since the upload itself is already synchronous (Storage `upload()` call), inserting one row in the same handler costs ~1 ms and guarantees the row exists before the URL is ever returned to the editor.

**Alternative considered:** Insert row only when guide is saved (linker creates it). Rejected — if the editor never saves, or saves without the image URL (race condition), the orphan is never registered and can never be cleaned up.

### D2: Synchronous linker on save (parse content_html)

**Decision:** On `POST /` and `PUT /:id`, after the guide row is written, call `linkImagesToGuide(guideId, extractedPaths)`. This function:
1. Parses `content_html` with a regex to extract all storage paths matching `/api/guides/images/(.+)`.
2. `UPDATE guide_images SET guide_id = $guideId, status = 'LINKED', linked_at = now() WHERE storage_path = ANY($paths) AND (guide_id IS NULL OR guide_id = $guideId)`.
3. Identifies rows previously LINKED to this guide but no longer in the new content, deletes their Storage objects, then deletes their DB rows.

**Rationale:** Async linker (background job) risks a window where images appear PENDING even though a valid guide exists. Synchronous parse-and-link in the same request is simpler, cheaper, and eliminates the window entirely.

**Alternative considered:** Using JSONB content to extract image sources instead of `content_html`. Rejected — `content_html` is always present, is a single TEXT field, and the regex `/api/guides/images/(.+?)(?="|')` is trivially reliable on the project's own URL format.

**Path extraction regex:** `/\/api\/guides\/images\/(guides\/[^"'\s]+)/g` — matches the relative URL prefix and captures the storage path `guides/{filename}.webp`.

### D3: Cron auto-delete PENDING rows older than 24 h

**Decision:** `cleanupOrphans()` runs on a timer (driven by the admin endpoint manually in Sprint 1; autonomous scheduler in Sprint 3) and:
1. Selects all `guide_images` WHERE `status = 'PENDING'` AND `uploaded_at < now() - interval '24 hours'`.
2. For each batch: calls `supabase.storage.from('guide-images').remove(paths)`.
3. Deletes the DB rows.

**Why 24 h:** Gives ample time for a user to finish editing and save. Shorter (e.g. 1 h) risks deleting images for users who left a tab open. Longer (e.g. 7 days) means the Storage cost of abandoned files accumulates.

**The 3 current orphans** have no `guide_images` row. The backfill migration inserts them as `PENDING` with `uploaded_at = now() - interval '48 hours'` so the first cleanup run removes them.

### D4: Frontend — disable Save/Publish while upload is in-flight

**Decision:** Add `uploadingCount` ref (incremented before `guideService.uploadImage`, decremented in finally). Export `isUploading = computed(() => uploadingCount.value > 0)`. Parent `editor.vue` binds `:disable="isUploading || saving"` on both buttons.

**Rationale:** Eliminates the race condition without changing the upload flow. An AbortController is registered per upload and called in `onBeforeUnmount` to cancel in-flight requests when the user navigates away — preventing the "URL returns after editor is destroyed" scenario.

**Alternative considered:** Queue uploads and auto-retry on unmount. Rejected — adds complexity; the simpler approach (cancel + warn user) is sufficient.

### D5: Paste/drop — toast warning only (no auto-upload)

**Decision:** Register `handlePaste` and `handleDrop` event listeners on the editor DOM element that detect `image/*` files, call `event.preventDefault()`, and show toast "Vui lòng dùng nút Thêm ảnh để tải lên". Tiptap `Image.configure({ allowBase64: false })` already prevents base64 insertion silently; this change makes it visible.

**Rationale:** Auto-upload from paste requires custom Tiptap extension and careful cursor-position handling. Deferred to Sprint 3 per user decision.

### D6: DELETE guide — Storage cleanup before soft-delete

**Decision:** In `DELETE /:id`:
1. `SELECT storage_path FROM guide_images WHERE guide_id = $id` (all, regardless of status).
2. `supabase.storage.from('guide-images').remove(paths)` — Storage errors are logged but do NOT abort the delete (idempotent; file may already be gone).
3. `UPDATE guides SET deleted_at = now()` — CASCADE on FK automatically deletes `guide_images` rows.

**Why Storage before DB:** If Storage removal fails, the DB still soft-deletes — the orphan is registered and will be cleaned up by the cron (it transitions to a PENDING-like state via the backfill check, or admins can trigger manual cleanup). If DB fails first, the Storage file remains linked and is not deleted. This order is safer.

**Alternative considered:** Transactional approach using a DB function. Rejected — Storage API is not transactional with PostgreSQL; the best we can do is order operations to minimize leak surface.

### D7: Backup — remove `--exclude-schema=storage` + Docker volume tar

**Decision:** Remove `--exclude-schema=storage` from `db-backup.sh` so `storage.objects` metadata is included in pg_dump. Add a separate script to `docker volume export` (via tar) the `supabase_storage_project-datchi` volume.

**Rationale:** Without Storage schema, restoring from a DB backup loses all image metadata. Without the Docker volume, the actual binary files are not backed up. Both are needed for a complete restore.

**Volume name confirmed:** `supabase_storage_project-datchi` (from `docker volume ls`).

**Note on volume backup approach:** `docker run --rm -v supabase_storage_project-datchi:/data -v $(pwd)/backups:/backup alpine tar czf /backup/storage_{timestamp}.tar.gz -C /data .` — does not require stopping the Supabase container (read-safe for Storage files).

## Risks / Trade-offs

**[Risk] Storage removal fails during DELETE guide, leaving orphans in Storage** → Mitigation: Error is logged; cleanup cron removes orphans within 24 h. The guide_images rows are CASCADE-deleted so the cron won't see them, but the Storage files themselves have no corresponding row and thus are outside the cron's scope. To address: the backfill script should be re-runnable — if a Storage file exists with no guide_images row, it gets inserted as PENDING and cleaned up on next cron run.

**[Risk] Linker regex false positive (matches URL in non-image context)** → Mitigation: The project uses a controlled URL format `/api/guides/images/guides/{filename}.webp`. The regex anchors to this prefix. False positives are theoretically possible if someone types the URL as text, but Storage removal is only done for rows that exist in `guide_images`, not based on the regex match alone — so no Storage file is deleted unless it was tracked.

**[Risk] Multiple concurrent saves race (two editors saving the same guide simultaneously)** → Mitigation: The UPDATE in the linker uses `guide_id IS NULL OR guide_id = $guideId` predicate, so concurrent saves on the same guide converge to the correct state. Out-of-scope for Sprint 1; noted for future pessimistic locking.

**[Risk] Docker volume backup while Supabase writes** → Mitigation: Storage files are immutable once written (filenames include timestamp+random). The volume backup captures a consistent snapshot at the file level. Minor inconsistency possible only if a file is written mid-backup, which is acceptable for the recovery use-case.

**[Trade-off] Synchronous Storage cleanup on DELETE adds latency** → If a guide has many images, the Storage API calls happen in the request handler. For typical guides (< 20 images), this is negligible (< 2 s). For a guide with 100+ images, use `storage.remove()` with batch arrays (Supabase supports array of paths) — single API call regardless of count.

## Migration Plan

1. Apply migration `{timestamp}_create_guide_images.sql` via `supabase migration up`.
2. Run backfill script once (`npx tsx scripts/backfill-guide-images.ts`) — safe, read-only except for `INSERT INTO guide_images`.
3. Deploy backend changes (linker, cleanup util, updated routes, admin endpoint).
4. Deploy frontend changes (useGuideEditor, editor.vue).
5. Update `scripts/db-backup.sh` (remove `--exclude-schema=storage`).
6. Add new backup scripts.
7. Update `package.json` npm scripts.
8. Trigger initial cleanup: `POST /api/admin/guides/cleanup-orphans` to remove the 3 existing orphans (or wait 24 h for their PENDING rows to age out).

**Rollback:** Drop `guide_images` table, revert `server/routes/guides.ts` and `src/composables/useGuideEditor.ts` to the commit before this change. No existing data is modified by the migration.

## Open Questions

- **Volume backup in CI/CD:** The Docker volume approach works for local development. For production (hosted Supabase), Storage files are managed by Supabase infrastructure and do not need Docker volume backup. Confirm with user whether production also uses self-hosted Supabase or hosted. If hosted, the storage-volume scripts are dev-only and should be documented accordingly.
- **Cron scheduler:** Sprint 1 ships the `cleanupOrphans()` function and a manual admin endpoint. Sprint 3 should wire it to the project's existing cron/scheduler pattern (if one exists) or use a simple `node-cron` in `server/index.ts`.
