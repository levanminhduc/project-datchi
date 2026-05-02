#!/usr/bin/env bash
set -euo pipefail

VOLUME_NAME="supabase_storage_project-datchi"
BACKUP_DIR="${BACKUP_DIR:-./backups}"

mkdir -p "$BACKUP_DIR"

if ! docker volume ls --format '{{.Name}}' | grep -q "^${VOLUME_NAME}$"; then
  echo "ERROR: Docker volume '${VOLUME_NAME}' not found."
  echo "Available volumes:"
  docker volume ls --format '{{.Name}}'
  exit 1
fi

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
ARCHIVE="$BACKUP_DIR/storage_${TIMESTAMP}.tar.gz"

echo "=== Storage Volume Backup ==="
echo "Volume: $VOLUME_NAME"
echo "Archive: $ARCHIVE"
echo ""

docker run --rm \
  -v "${VOLUME_NAME}:/data" \
  -v "$(pwd)/${BACKUP_DIR#./}:/backup" \
  alpine tar czf "/backup/storage_${TIMESTAMP}.tar.gz" -C /data .

echo "Backup OK: $ARCHIVE"
echo "$ARCHIVE"
