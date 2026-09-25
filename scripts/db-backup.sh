#!/usr/bin/env bash
set -euo pipefail

DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-datchi}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
KEEP_DAYS="${KEEP_DAYS:-7}"

mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/db_${TIMESTAMP}.dump"

echo "=== DB Backup ==="
echo "Host: $DB_HOST:$DB_PORT"
echo "File: $BACKUP_FILE"
echo ""

PGPASSWORD=postgres pg_dump \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --format=custom \
  --no-owner \
  --no-privileges \
  --schema=public \
  -f "$BACKUP_FILE"

FILESIZE=$(stat -c%s "$BACKUP_FILE" 2>/dev/null || stat -f%z "$BACKUP_FILE" 2>/dev/null || echo "?")
echo "Backup OK: $BACKUP_FILE ($FILESIZE bytes)"

if [ "$KEEP_DAYS" -gt 0 ]; then
  DELETED=$(find "$BACKUP_DIR" -name "db_*.dump" -mtime +"$KEEP_DAYS" -delete -print 2>/dev/null | wc -l || echo 0)
  echo "Cleaned $DELETED old backups (>$KEEP_DAYS days)"
fi

echo ""
echo "Restore with: bash scripts/db-restore.sh $BACKUP_FILE"
