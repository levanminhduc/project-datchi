#!/usr/bin/env bash
set -euo pipefail

STORAGE_HOST_DIR="${STORAGE_HOST_DIR:-./storage}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"

mkdir -p "$BACKUP_DIR"

if [ ! -d "$STORAGE_HOST_DIR" ]; then
  echo "ERROR: Storage folder '${STORAGE_HOST_DIR}' not found."
  exit 1
fi

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
ARCHIVE="$BACKUP_DIR/storage_${TIMESTAMP}.tar.gz"

echo "=== Storage Folder Backup ==="
echo "Folder:  $STORAGE_HOST_DIR"
echo "Archive: $ARCHIVE"
echo ""

tar czf - -C "$STORAGE_HOST_DIR" . > "$ARCHIVE"

echo "Backup OK: $ARCHIVE"
echo "$ARCHIVE"
