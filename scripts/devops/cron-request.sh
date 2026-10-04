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
BASE_URL="${BASE_URL%/}"
TARGET_URL="${BASE_URL}${ENDPOINT}"

case "$METHOD" in
  GET|POST) ;;
  *)
    echo "Unsupported method: ${METHOD}" >&2
    exit 1
    ;;
esac

if [ "${CRON_DRY_RUN:-0}" = "1" ]; then
  echo "[$(date -Iseconds)] dry-run ${METHOD} ${TARGET_URL}"
  exit 0
fi

started_at="$(date -u -Iseconds)"
echo "[${started_at}] ${METHOD} ${TARGET_URL}"

set +e
HTTP_STATUS="$(curl \
  --fail \
  --show-error \
  --silent \
  --retry 3 \
  --retry-delay 2 \
  --max-time 30 \
  --request "$METHOD" \
  --header "Authorization: Bearer ${CRON_SECRET}" \
  --output /dev/null \
  --write-out '%{http_code}' \
  "$TARGET_URL")"
curl_exit=$?
set -e

finished_at="$(date -u -Iseconds)"

if [ "$curl_exit" -eq 28 ]; then
  outcome="timed-out"
elif [ "$curl_exit" -eq 0 ]; then
  case "$HTTP_STATUS" in
    2[0-9][0-9]) outcome="succeeded" ;;
    *) outcome="failed" ;;
  esac
else
  outcome="failed"
fi

echo "[${finished_at}] ${outcome} (HTTP ${HTTP_STATUS:-000})"

if [ "$curl_exit" -ne 0 ]; then
  exit "$curl_exit"
fi
