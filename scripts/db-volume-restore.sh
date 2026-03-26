#!/usr/bin/env bash
set -euo pipefail

VOLUME_NAME="${2:-supabase_db_project-datchi}"

if [ $# -eq 0 ]; then
  echo "Usage: bash scripts/db-volume-restore.sh <backup_file> [volume_name]"
  echo ""
  echo "Available backups:"
  ls -lh backups/volume_*.tar.gz 2>/dev/null || echo "  (none found)"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "ERROR: File not found: $BACKUP_FILE"
  exit 1
fi

echo "=== Docker Volume Restore ==="
echo "File: $BACKUP_FILE"
echo "Volume: $VOLUME_NAME"
echo ""
echo "WARNING: Supabase must be STOPPED before restoring!"
echo "  Run: supabase stop"
echo ""
read -p "Continue? (y/N): " CONFIRM

if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
  echo "Cancelled."
  exit 0
fi

docker run --rm \
  -v "${VOLUME_NAME}:/target" \
  -v "$(pwd)/$BACKUP_FILE:/backup.tar.gz:ro" \
  alpine sh -c "rm -rf /target/* && tar xzf /backup.tar.gz -C /target"

echo "Volume restored. Start Supabase:"
echo "  supabase start"
