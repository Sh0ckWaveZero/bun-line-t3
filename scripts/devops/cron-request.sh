#!/bin/sh

set -eu

METHOD="${1:-GET}"
ENDPOINT="${2:-}"

if [ -z "$ENDPOINT" ]; then
  echo "Usage: $0 <METHOD> <ENDPOINT>" >&2
  exit 1
fi

if [ -z "${CRON_SECRET:-}" ]; then
  echo "CRON_SECRET is not set" >&2
  exit 1
fi

BASE_URL="${CRON_BASE_URL:-http://app:12914}"
TARGET_URL="${BASE_URL}${ENDPOINT}"

echo "[$(date -Iseconds)] ${METHOD} ${TARGET_URL}"

curl \
  --fail \
  --show-error \
  --silent \
  --retry 3 \
  --retry-delay 2 \
  --max-time 30 \
  --request "$METHOD" \
  --header "Authorization: Bearer ${CRON_SECRET}" \
  "$TARGET_URL"
