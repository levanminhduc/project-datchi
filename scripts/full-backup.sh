#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "=== Full Backup ==="
echo ""

echo "--- Step 1: DB backup ---"
DB_OUTPUT=$(bash scripts/db-backup.sh 2>&1)
echo "$DB_OUTPUT"
DB_FILE=$(echo "$DB_OUTPUT" | grep -oP '\./backups/supabase_\S+\.dump' | tail -1 || true)
if [ -z "$DB_FILE" ]; then
  DB_FILE=$(ls -t "$BACKUP_DIR"/supabase_*.dump 2>/dev/null | head -1 || true)
fi

echo ""
echo "--- Step 2: Storage volume backup ---"
STORAGE_OUTPUT=$(bash scripts/storage-volume-backup.sh 2>&1)
echo "$STORAGE_OUTPUT"
STORAGE_FILE=$(echo "$STORAGE_OUTPUT" | grep -oP '\./backups/storage_\S+\.tar\.gz' | tail -1 || true)
if [ -z "$STORAGE_FILE" ]; then
  STORAGE_FILE=$(ls -t "$BACKUP_DIR"/storage_*.tar.gz 2>/dev/null | head -1 || true)
fi

echo ""
echo "--- Step 3: Bundling into full archive ---"
FULL_ARCHIVE="$BACKUP_DIR/full_${TIMESTAMP}.tar.gz"

FILES_TO_BUNDLE=()
[ -n "$DB_FILE" ] && [ -f "$DB_FILE" ] && FILES_TO_BUNDLE+=("$DB_FILE")
[ -n "$STORAGE_FILE" ] && [ -f "$STORAGE_FILE" ] && FILES_TO_BUNDLE+=("$STORAGE_FILE")

if [ ${#FILES_TO_BUNDLE[@]} -eq 0 ]; then
  echo "ERROR: No backup files found to bundle."
  exit 1
fi

tar czf "$FULL_ARCHIVE" "${FILES_TO_BUNDLE[@]}"

echo "Full archive: $FULL_ARCHIVE"
echo ""
echo "To restore: bash scripts/full-restore.sh $FULL_ARCHIVE"
