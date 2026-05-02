## Why

Guide articles lose embedded images after publishing because there is no hard link between Supabase Storage objects and the guides they belong to: a race condition lets users save before an upload finishes, editor unmount silently discards in-flight URL insertions, and soft-deleting a guide never removes its Storage files. DB evidence confirms 3 of 6 files in the `guide-images` bucket are already orphaned (50%).

## What Changes

- **New DB table `guide_images`**: tracks every uploaded file with its `status` (`PENDING` → `LINKED`), `guide_id` FK, and `uploaded_at`; provides the hard link missing today.
- **Upload endpoint enhancement** (`POST /api/guides/upload-image`): inserts a `PENDING` row immediately after Storage upload succeeds.
- **Image linker** (`server/utils/guide-image-linker.ts`): parses `content_html` on every create/update, sets `guide_id` + status `LINKED` on matching rows, and removes (Storage + DB row) images that were unlinked from updated content.
- **Delete flow change** (`DELETE /api/guides/:id`): before soft-deleting a guide, loads all linked Storage paths and removes them from Supabase Storage; cascade FK then cleans `guide_images` rows.
- **Cron cleanup** (`server/utils/guide-image-cleanup.ts` + admin endpoint `POST /api/admin/guides/cleanup-orphans`): deletes `PENDING` rows older than 24 h and their Storage objects; handles the 3 currently-orphaned files on first run.
- **Frontend race-condition guard** (`src/composables/useGuideEditor.ts`): tracks in-flight upload count; cancels uploads on `onBeforeUnmount`; exports `isUploading` flag.
- **Save/Publish button guard** (`src/pages/guides/editor.vue`): disables both buttons while `isUploading` is true.
- **Paste/drop warning toast** (`src/composables/useGuideEditor.ts`): intercepts paste/drop image events and shows Vietnamese toast "Vui lòng dùng nút Thêm ảnh để tải lên" without auto-uploading.
- **Backup completeness fix** (`scripts/db-backup.sh`): removes `--exclude-schema=storage` so `guide_images` metadata is included in DB dumps.
- **New backup scripts**: `storage-volume-backup.sh`, `storage-volume-restore.sh`, `full-backup.sh`, `full-restore.sh` — tars the `supabase_storage_project-datchi` Docker volume alongside the DB dump.
- **Backfill migration**: one-time script imports existing `storage.objects` rows for the `guide-images` bucket, matches against `guides.content_html`, and sets correct `guide_id` + `LINKED` status; leaves the 3 orphans as `PENDING` with `uploaded_at` far enough in the past to be deleted on first cron run.

## Capabilities

### New Capabilities

- `guide-image-tracking`: Upload tracking with PENDING/LINKED lifecycle, linker algorithm, cron orphan cleanup, and admin cleanup endpoint.

### Modified Capabilities

- `guides`: Guide create/update/delete flows now maintain Storage integrity and disable save while uploads are in-flight.

## Impact

**Files modified:**
- `supabase/migrations/{timestamp}_create_guide_images.sql` (new)
- `server/routes/guides.ts` — upload, create, update, delete handlers
- `server/utils/guide-image-linker.ts` (new)
- `server/utils/guide-image-cleanup.ts` (new)
- `server/routes/admin-guides.ts` (new or extended) — cleanup endpoint
- `src/composables/useGuideEditor.ts`
- `src/pages/guides/editor.vue`
- `scripts/db-backup.sh`
- `scripts/storage-volume-backup.sh` (new)
- `scripts/storage-volume-restore.sh` (new)
- `scripts/full-backup.sh` (new)
- `scripts/full-restore.sh` (new)
- `package.json` — new npm scripts

**Dependencies:** None new; uses existing `supabaseAdmin`, Hono, Zod, Tiptap.

**Risk:** Medium. The DELETE flow change is the highest-risk modification — it performs Storage deletion before the DB soft-delete, so a Storage API failure leaves the DB row intact (safe). Backfill migration is read-only except for `guide_images` inserts; no existing table is altered.

**Rollback plan:** Drop `guide_images` table (`supabase migration down` or manual), revert `server/routes/guides.ts` diff, revert `src/composables/useGuideEditor.ts` diff. No existing data is deleted by the migration itself.

**Out of scope (Sprint 3):**
- Custom Tiptap paste/drop handler with auto-upload
- RLS DELETE policy lock on `storage.objects`
- Health-check endpoint / admin dashboard
- CDN migration (R2/S3)
- GET guide HEAD-check for missing files
