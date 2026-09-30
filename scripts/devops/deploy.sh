#!/usr/bin/env bash
# ใช้ secrets จาก environment เท่านั้น ห้ามเปิด shell tracing
set -euo pipefail
cd "$(dirname "$0")/../.."

required=(DATABASE_URL APP_URL AUTH_SECRET FRONTEND_URL JWT_SECRET INTERNAL_API_KEY
  CRON_SECRET LINE_CLIENT_ID LINE_CLIENT_SECRET LINE_LOGIN_CHANNEL_ID
  LINE_LOGIN_CHANNEL_SECRET LINE_CHANNEL_ACCESS LINE_CHANNEL_SECRET
  AQICN_TOKEN CMC_API_KEY OPENAI_API_KEY APP_DOMAIN ALLOWED_DOMAINS)
for key in "${required[@]}"; do
  if [[ -z "${!key:-}" ]]; then
    echo "❌ ต้องตั้งค่า $key" >&2
    exit 1
  fi
done
: "${RELEASE_TAG:?ต้องตั้งค่า RELEASE_TAG ให้ไม่ซ้ำในแต่ละ deploy}"
[[ "$RELEASE_TAG" =~ ^[a-zA-Z0-9_][a-zA-Z0-9_.-]{0,127}$ ]] || exit 1
# Pi 4 RAM 4 GB: ไม่ build หลาย service พร้อมกัน
export COMPOSE_PARALLEL_LIMIT=1
export APP_IMAGE_TAG="$RELEASE_TAG" CRON_IMAGE_TAG="$RELEASE_TAG" RUN_MIGRATIONS=false
compose=(docker compose --env-file /dev/null -f docker-compose.yml)

# ตรวจ configuration โดยไม่พิมพ์ secrets
"${compose[@]}" config --quiet
docker info >/dev/null
docker network inspect yadom >/dev/null
"${compose[@]}" up --help | grep -q -- --wait-timeout

# เก็บ image ของ container ที่รันจริง แทนการเดาชื่อ image เดิม
previous_app=$(docker inspect --format '{{.Image}}' bun-line-t3-app 2>/dev/null || true)
previous_cron=$(docker inspect --format '{{.Image}}' bun-line-t3-cron 2>/dev/null || true)
rollback_tag="rollback-$RELEASE_TAG"
if [[ -n "$previous_app" && -n "$previous_cron" ]]; then
  docker tag "$previous_app" "bun-line-t3-app:$rollback_tag"
  docker tag "$previous_cron" "bun-line-t3-cron:$rollback_tag"
fi

build_args=(app cron migrate)
if [[ "${FORCE_REBUILD:-false}" == true ]]; then
  build_args=(--pull --no-cache app cron migrate)
fi
# บริการเดิมยังทำงานระหว่าง build และ migration
"${compose[@]}" build "${build_args[@]}"
"${compose[@]}" run --rm --no-deps migrate

rollback() {
  status=$?
  trap - EXIT
  if [[ "$status" -eq 0 ]]; then return; fi
  echo "❌ Deploy ล้มเหลว" >&2
  if [[ -n "$previous_app" && -n "$previous_cron" ]]; then
    export APP_IMAGE_TAG="$rollback_tag" CRON_IMAGE_TAG="$rollback_tag"
    if "${compose[@]}" up -d --no-build --wait --wait-timeout 240 app cron; then
      echo "✅ กู้ image เดิมแล้ว (migration ฐานข้อมูลไม่ถูกย้อนกลับ)" >&2
    else
      echo "❌ กู้บริการไม่สำเร็จ ต้องตรวจสอบบน runner" >&2
    fi
  else
    echo "⚠️ ไม่มี image เดิมครบทั้งสองบริการสำหรับ rollback" >&2
  fi
  exit "$status"
}
# Rollback เฉพาะเมื่อเริ่มเปลี่ยนบริการแล้ว
trap rollback EXIT
"${compose[@]}" up -d --no-build --wait --wait-timeout 240 app cron
curl --fail --silent --show-error --max-time 10 "http://127.0.0.1:${PORT:-12914}/api/health" >/dev/null
trap - EXIT
echo "✅ Deploy และ health check ผ่าน"
