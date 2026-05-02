#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: bash scripts/full-restore.sh <full_archive_file>"
  exit 1
fi

FULL_ARCHIVE="$1"

if [ ! -f "$FULL_ARCHIVE" ]; then
  echo "ERROR: Archive '$FULL_ARCHIVE' not found."
  exit 1
fi

TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT

echo "=== Full Restore ==="
echo "Archive: $FULL_ARCHIVE"
echo ""

echo "--- Extracting bundle ---"
tar xzf "$FULL_ARCHIVE" -C "$TMPDIR"

DB_DUMP=$(ls "$TMPDIR"/supabase_*.dump 2>/dev/null | head -1 || true)
STORAGE_ARCHIVE=$(ls "$TMPDIR"/storage_*.tar.gz 2>/dev/null | head -1 || true)

if [ -n "$DB_DUMP" ] && [ -f "$DB_DUMP" ]; then
  echo ""
  echo "--- Restoring DB ---"
  bash scripts/db-restore.sh "$DB_DUMP"
else
  echo "WARNING: No DB dump found in archive."
fi

if [ -n "$STORAGE_ARCHIVE" ] && [ -f "$STORAGE_ARCHIVE" ]; then
  echo ""
  echo "--- Restoring Storage volume ---"
  bash scripts/storage-volume-restore.sh "$STORAGE_ARCHIVE"
else
  echo "WARNING: No storage archive found in bundle."
fi

echo ""
echo "Full restore complete."
