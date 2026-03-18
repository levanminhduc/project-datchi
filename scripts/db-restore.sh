#!/usr/bin/env bash
set -euo pipefail

DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-54322}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-postgres}"

if [ $# -eq 0 ]; then
  echo "Usage: bash scripts/db-restore.sh <backup_file>"
  echo ""
  echo "Available backups:"
  ls -lh backups/supabase_*.dump 2>/dev/null || echo "  (none found)"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "ERROR: File not found: $BACKUP_FILE"
  exit 1
fi

echo "=== Supabase DB Restore ==="
echo "File: $BACKUP_FILE"
echo "Target: $DB_HOST:$DB_PORT/$DB_NAME"
echo ""
echo "WARNING: This will OVERWRITE public schema data!"
read -p "Continue? (y/N): " CONFIRM

if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
  echo "Cancelled."
  exit 0
fi

PGPASSWORD=postgres pg_restore \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  --schema=public \
  "$BACKUP_FILE" 2>&1 || true

echo ""
echo "Restore completed. Verify data:"
echo "  psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME"
