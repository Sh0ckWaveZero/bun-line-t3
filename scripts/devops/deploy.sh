#!/usr/bin/env bash
# ใช้ secrets จาก environment เท่านั้น ห้ามเปิด shell tracing
set -euo pipefail
cd "$(dirname "$0")/../.."

command="${1:-all}"
case "$command" in
  all|preflight|backup|build|migrate|release) ;;
  *) echo "❌ ขั้นตอนที่รองรับ: all, preflight, backup, build, migrate, release" >&2; exit 1 ;;
esac

validate_environment() {
  local key
  local required=(DATABASE_URL APP_URL AUTH_SECRET FRONTEND_URL JWT_SECRET INTERNAL_API_KEY
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
  # เผื่อ prefix rollback- ให้ Docker tag รวมยาวไม่เกิน 128 ตัวอักษร
  [[ "$RELEASE_TAG" =~ ^[a-zA-Z0-9_][a-zA-Z0-9_.-]{0,118}$ ]] || exit 1
}

validate_environment
# Pi 4 RAM 4 GB: เรียก build ทีละ service และจำกัด Compose parallelism
export COMPOSE_PARALLEL_LIMIT=1
export APP_IMAGE_TAG="$RELEASE_TAG" CRON_IMAGE_TAG="$RELEASE_TAG" RUN_MIGRATIONS=false
compose=(docker compose --env-file /dev/null -f docker-compose.yml)
previous_app="${PREVIOUS_APP_IMAGE:-}"
previous_cron="${PREVIOUS_CRON_IMAGE:-}"
rollback_tag="rollback-$RELEASE_TAG"

preflight() {
  "${compose[@]}" config --quiet
  docker info >/dev/null
  docker network inspect yadom >/dev/null
  "${compose[@]}" up --help | grep -q -- --wait-timeout
  # แสดงทรัพยากรเครื่องโดยไม่อ่าน environment หรือ credentials
  if command -v free >/dev/null; then free -m; fi
  df -h .
}

backup() {
  # เก็บ image ของ container ที่รันจริง แทนการเดาชื่อ image เดิม
  previous_app=$(docker inspect --format '{{.Image}}' bun-line-t3-app 2>/dev/null || true)
  previous_cron=$(docker inspect --format '{{.Image}}' bun-line-t3-cron 2>/dev/null || true)
  if [[ -n "$previous_app" && -n "$previous_cron" ]]; then
    docker tag "$previous_app" "bun-line-t3-app:$rollback_tag"
    docker tag "$previous_cron" "bun-line-t3-cron:$rollback_tag"
  fi
  # ส่งเฉพาะ image ID ไปยัง release step ไม่มี secrets หรือไฟล์ state ถาวร
  if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
    printf 'previous_app=%s\nprevious_cron=%s\n' "$previous_app" "$previous_cron" >> "$GITHUB_OUTPUT"
  fi
}

build() {
  local service
  local build_args
  # บริการเดิมยังทำงานระหว่าง build; BuildKit อาจขนานภายใน service เดียว
  for service in app cron migrate; do
    build_args=("$service")
    if [[ "${FORCE_REBUILD:-false}" == true ]]; then
      build_args=(--pull --no-cache "$service")
    fi
    echo "🔨 สร้าง image: $service"
    "${compose[@]}" build "${build_args[@]}"
  done
}

migrate() {
  "${compose[@]}" run --rm --no-deps migrate
}

rollback() {
  local status=$?
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

release() {
  # เปลี่ยนบริการ ตรวจ health และ rollback ใน shell เดียวกัน
  trap rollback EXIT
  "${compose[@]}" up -d --no-build --wait --wait-timeout 240 app cron
  curl --fail --silent --show-error --max-time 10 "http://127.0.0.1:${PORT:-12914}/api/health" >/dev/null
  trap - EXIT
  echo "✅ Deploy และ health check ผ่าน"
}

if [[ "$command" == all ]]; then
  preflight
  backup
  build
  migrate
  release
else
  "$command"
fi
