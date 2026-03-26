#!/usr/bin/env bash
set -euo pipefail

DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-54322}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-postgres}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
KEEP_DAYS="${KEEP_DAYS:-7}"

mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/supabase_${TIMESTAMP}.dump"

echo "=== Supabase DB Backup ==="
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
  --exclude-schema=auth \
  --exclude-schema=storage \
  --exclude-schema=supabase_functions \
  --exclude-schema=supabase_migrations \
  --exclude-schema=extensions \
  --exclude-schema=realtime \
  --exclude-schema=_realtime \
  --exclude-schema=pgsodium \
  --exclude-schema=vault \
  --exclude-schema=graphql \
  --exclude-schema=graphql_public \
  -f "$BACKUP_FILE"

FILESIZE=$(stat -c%s "$BACKUP_FILE" 2>/dev/null || stat -f%z "$BACKUP_FILE" 2>/dev/null || echo "?")
echo "Backup OK: $BACKUP_FILE ($FILESIZE bytes)"

if [ "$KEEP_DAYS" -gt 0 ]; then
  DELETED=$(find "$BACKUP_DIR" -name "supabase_*.dump" -mtime +"$KEEP_DAYS" -delete -print 2>/dev/null | wc -l || echo 0)
  echo "Cleaned $DELETED old backups (>$KEEP_DAYS days)"
fi

echo ""
echo "Restore with: bash scripts/db-restore.sh $BACKUP_FILE"
