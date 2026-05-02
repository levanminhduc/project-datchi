#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: bash scripts/storage-volume-restore.sh <archive_file>"
  exit 1
fi

ARCHIVE="$1"
VOLUME_NAME="supabase_storage_project-datchi"

if [ ! -f "$ARCHIVE" ]; then
  echo "ERROR: Archive file '$ARCHIVE' not found."
  exit 1
fi

echo "=== Storage Volume Restore ==="
echo "Archive: $ARCHIVE"
echo "Volume:  $VOLUME_NAME"
echo ""
echo "WARNING: This will OVERWRITE all files in the '${VOLUME_NAME}' volume."
read -rp "Continue? [y/N] " CONFIRM
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 0
fi

ARCHIVE_ABS="$(cd "$(dirname "$ARCHIVE")" && pwd)/$(basename "$ARCHIVE")"

docker run --rm \
  -v "${VOLUME_NAME}:/data" \
  -v "$(dirname "$ARCHIVE_ABS"):/backup" \
  alpine tar xzf "/backup/$(basename "$ARCHIVE_ABS")" -C /data

echo "Restore complete."
