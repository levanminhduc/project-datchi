#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: bash scripts/storage-volume-restore.sh <archive_file>"
  exit 1
fi

ARCHIVE="$1"
STORAGE_HOST_DIR="${STORAGE_HOST_DIR:-./storage}"

if [ ! -f "$ARCHIVE" ]; then
  echo "ERROR: Archive file '$ARCHIVE' not found."
  exit 1
fi

echo "=== Storage Folder Restore ==="
echo "Archive: $ARCHIVE"
echo "Folder:  $STORAGE_HOST_DIR"
echo ""
echo "Files in the archive will be added to '${STORAGE_HOST_DIR}'. Existing files are kept."
read -rp "Continue? [y/N] " CONFIRM
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 0
fi

mkdir -p "$STORAGE_HOST_DIR"
tar xzf - -C "$STORAGE_HOST_DIR" < "$ARCHIVE"

echo "Restore complete."
