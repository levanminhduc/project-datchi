## ADDED Requirements

### Requirement: Application-managed guide image storage
The system SHALL store `guide-images` files on a configured filesystem directory (env `STORAGE_DIR`, mounted as a durable volume) managed by the Hono backend, with no dependency on Supabase Storage.

#### Scenario: Upload writes to volume
- **WHEN** a guide image is uploaded
- **THEN** the backend writes the file under the configured `guide-images` directory and records the same reference path used before

#### Scenario: Remove deletes served file only
- **WHEN** a guide image is removed
- **THEN** the backend deletes the served file while DB references follow existing soft-delete rules and no data row is hard-deleted

#### Scenario: Missing STORAGE_DIR fails fast
- **WHEN** the backend starts without a usable `STORAGE_DIR`
- **THEN** startup fails with a clear error rather than silently using Supabase Storage

### Requirement: URL-compatible public serving
The system SHALL serve guide images at the existing public path `/storage/v1/object/public/guide-images/<path>` so previously stored image references keep resolving.

#### Scenario: Existing reference resolves
- **WHEN** a previously stored image URL `/storage/v1/object/public/guide-images/<path>` is requested
- **THEN** the Hono server serves the corresponding file from the storage directory

#### Scenario: Newly uploaded image resolves at same path shape
- **WHEN** a new image is uploaded and later requested
- **THEN** its public URL follows the identical path shape as before the migration

### Requirement: Image linking and cleanup updated to filesystem
The system SHALL update `guide-image-linker` and `guide-image-cleanup` to compute and compare the preserved URL shape against filesystem storage.

#### Scenario: Linker computes preserved URL
- **WHEN** the linker associates an image with a guide
- **THEN** it produces the same public URL shape consumers already store

#### Scenario: Cleanup never removes referenced files
- **WHEN** cleanup runs
- **THEN** files still referenced by a guide are retained and only unreferenced files are eligible for removal
