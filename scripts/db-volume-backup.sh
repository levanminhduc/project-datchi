#!/usr/bin/env bash
set -euo pipefail

VOLUME_NAME="${1:-supabase_db_project-datchi}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/volume_${TIMESTAMP}.tar.gz"

mkdir -p "$BACKUP_DIR"

echo "=== Docker Volume Backup ==="
echo "Volume: $VOLUME_NAME"
echo "File: $BACKUP_FILE"
echo ""

docker run --rm \
  -v "${VOLUME_NAME}:/source:ro" \
  -v "$(pwd)/$BACKUP_DIR:/backup" \
  alpine tar czf "/backup/volume_${TIMESTAMP}.tar.gz" -C /source .

FILESIZE=$(stat -c%s "$BACKUP_FILE" 2>/dev/null || stat -f%z "$BACKUP_FILE" 2>/dev/null || echo "?")
echo "Volume backup OK: $BACKUP_FILE ($FILESIZE bytes)"
echo ""
echo "Restore: bash scripts/db-volume-restore.sh $BACKUP_FILE"
