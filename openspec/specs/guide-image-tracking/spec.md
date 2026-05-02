### Requirement: Upload creates a PENDING tracking row
Every successful image upload to the `guide-images` Storage bucket SHALL result in an INSERT into `guide_images` with `status = 'PENDING'`, `storage_path` set to the bucket-relative path (e.g. `guides/{filename}.webp`), `file_size`, `mime_type`, and `uploaded_at = now()`. The row SHALL be created before the API returns the URL to the client.

#### Scenario: Upload succeeds
- **WHEN** `POST /api/guides/upload-image` receives a valid image file
- **THEN** Storage upload succeeds, a `guide_images` row with `status = 'PENDING'` is inserted, and the API returns `{ data: { url }, error: null }` with the relative URL

#### Scenario: Upload fails at Storage level
- **WHEN** the Supabase Storage `upload()` call returns an error
- **THEN** no `guide_images` row is inserted and the API returns `{ data: null, error: 'Lỗi khi tải ảnh lên' }`

### Requirement: Save links PENDING images to their guide
After a guide is created (`POST /api/guides`) or updated (`PUT /api/guides/:id`), the system SHALL parse `content_html` for all embedded image storage paths and UPDATE matching `guide_images` rows to set `guide_id`, `status = 'LINKED'`, and `linked_at = now()`.

#### Scenario: New guide created with images
- **WHEN** `POST /api/guides` succeeds
- **THEN** all `guide_images` rows whose `storage_path` matches paths found in `content_html` are updated to `status = 'LINKED'` with the new guide's `id` as `guide_id`

#### Scenario: Guide updated, images removed from content
- **WHEN** `PUT /api/guides/:id` is called with `content_html` that no longer references a previously linked image
- **THEN** the `guide_images` row for that removed image is deleted from the DB and the corresponding Storage object is removed from the `guide-images` bucket

#### Scenario: Guide updated, new images added
- **WHEN** `PUT /api/guides/:id` is called with `content_html` that references a new PENDING image
- **THEN** that `guide_images` row transitions to `status = 'LINKED'` with `guide_id` set to the updated guide's `id`

#### Scenario: content_html contains no images
- **WHEN** guide is saved with empty or image-free `content_html`
- **THEN** no `guide_images` rows are inserted or updated for that guide; previously linked images (if any) are removed from Storage and DB

### Requirement: Delete guide removes its Storage files
When a guide is soft-deleted (`DELETE /api/guides/:id`), the system SHALL remove all Storage objects whose `storage_path` exists in `guide_images` rows linked to that guide before setting `deleted_at`.

#### Scenario: Guide with images is deleted
- **WHEN** `DELETE /api/guides/:id` is called and the guide exists with linked images
- **THEN** all Storage objects for that guide are removed from the bucket, the guide's `deleted_at` is set, and `guide_images` rows are CASCADE-deleted by the FK

#### Scenario: Storage removal fails during delete
- **WHEN** Supabase Storage `remove()` returns an error for one or more paths
- **THEN** the error is logged, the DELETE continues, and `deleted_at` is still set (Storage orphans are handled by the next cleanup run)

#### Scenario: Guide has no images
- **WHEN** `DELETE /api/guides/:id` is called for a guide with zero `guide_images` rows
- **THEN** the guide is soft-deleted immediately with no Storage API calls

### Requirement: Orphan cleanup removes PENDING images older than 24 hours
The system SHALL provide a `cleanupOrphans()` function that deletes Storage objects and DB rows for all `guide_images` records where `status = 'PENDING'` AND `uploaded_at < now() - interval '24 hours'`.

#### Scenario: Cleanup finds stale PENDING rows
- **WHEN** `cleanupOrphans()` is called and PENDING rows older than 24 h exist
- **THEN** their Storage objects are removed and the DB rows are deleted; the function returns the count of deleted rows

#### Scenario: Cleanup finds no stale rows
- **WHEN** `cleanupOrphans()` is called and no PENDING rows are older than 24 h
- **THEN** no Storage or DB changes occur and the function returns `{ deleted: 0 }`

#### Scenario: Cleanup for existing 3 orphaned files
- **WHEN** backfill migration inserts the 3 currently orphaned files as PENDING with `uploaded_at = now() - interval '48 hours'` and cleanup runs
- **THEN** all 3 Storage objects are removed and their DB rows are deleted

### Requirement: Admin endpoint triggers manual cleanup
The system SHALL expose `POST /api/admin/guides/cleanup-orphans` (requiring `guides.edit` permission) that calls `cleanupOrphans()` and returns the result.

#### Scenario: Authorized user triggers cleanup
- **WHEN** an authenticated user with `guides.edit` permission calls `POST /api/admin/guides/cleanup-orphans`
- **THEN** the endpoint calls `cleanupOrphans()` and returns `{ data: { deleted: N }, error: null, message: 'Đã dọn dẹp N ảnh không sử dụng' }`

#### Scenario: Unauthorized user attempts cleanup
- **WHEN** a user without `guides.edit` permission calls the endpoint
- **THEN** the endpoint returns 403

### Requirement: Backup includes Storage schema metadata
The DB backup script (`scripts/db-backup.sh`) SHALL NOT exclude the `storage` schema so that `storage.objects` metadata (including `guide_images` rows) is captured in pg_dump.

#### Scenario: Full DB backup
- **WHEN** `npm run backup:db` (or `bash scripts/db-backup.sh`) is executed
- **THEN** the resulting `.dump` file contains `storage.objects` data and can restore `guide_images` rows via `pg_restore`

### Requirement: Storage volume is backed up separately
The system SHALL provide `scripts/storage-volume-backup.sh` that tars the `supabase_storage_project-datchi` Docker volume into `backups/storage_{timestamp}.tar.gz`.

#### Scenario: Storage volume backup
- **WHEN** `npm run backup:storage` (or `bash scripts/storage-volume-backup.sh`) is executed
- **THEN** a `backups/storage_{timestamp}.tar.gz` file is created containing all files from the `supabase_storage_project-datchi` volume

### Requirement: Full backup orchestrator combines DB and Storage
The system SHALL provide `scripts/full-backup.sh` that runs both `db-backup.sh` and `storage-volume-backup.sh` and combines output into a single `backups/full_{timestamp}.tar.gz` archive.

#### Scenario: Full backup
- **WHEN** `npm run backup:full` is executed
- **THEN** `backups/full_{timestamp}.tar.gz` is created containing both the DB dump and Storage volume archive
