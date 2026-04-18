#!/bin/bash

# 🔍 Health Check Script สำหรับ LINE Attendance System (TanStack Start)

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

HEALTH_ISSUES=0
TOTAL_CHECKS=0

print_header() {
    echo -e "${BLUE}🔍 Health Check - LINE Attendance System${NC}"
    echo "=================================================="
    echo "⏰ $(date)"
    echo ""
}

print_status() {
    local status=$1
    local message=$2
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

    if [[ $status == "OK" ]]; then
        echo -e "✅ ${GREEN}[OK]${NC} $message"
    elif [[ $status == "WARNING" ]]; then
        echo -e "⚠️  ${YELLOW}[WARNING]${NC} $message"
        HEALTH_ISSUES=$((HEALTH_ISSUES + 1))
    else
        echo -e "❌ ${RED}[ERROR]${NC} $message"
        HEALTH_ISSUES=$((HEALTH_ISSUES + 1))
    fi
}

check_port() {
    local port=$1
    local service_name=$2

    if command -v nc >/dev/null 2>&1; then
        if nc -z localhost "$port" 2>/dev/null; then
            print_status "OK" "$service_name running on port $port"
        else
            print_status "ERROR" "$service_name not responding on port $port"
        fi
    elif command -v lsof >/dev/null 2>&1; then
        if lsof -i ":$port" >/dev/null 2>&1; then
            print_status "OK" "$service_name running on port $port"
        else
            print_status "ERROR" "$service_name not responding on port $port"
        fi
    else
        print_status "WARNING" "Cannot check port $port - no nc or lsof available"
    fi
}

check_env_vars() {
    echo -e "${BLUE}🔐 Environment Variables${NC}"
    echo "------------------------"

    local required_vars=(
        "DATABASE_URL"
        "LINE_CHANNEL_ACCESS"
        "LINE_CHANNEL_SECRET"
    )

    for var in "${required_vars[@]}"; do
        if [[ -n "${!var:-}" ]]; then
            print_status "OK" "$var is set"
        else
            print_status "ERROR" "$var is not set"
        fi
    done

    if [[ -n "${AUTH_SECRET:-}" ]]; then
        print_status "OK" "AUTH_SECRET is set"
    else
        print_status "ERROR" "Missing AUTH_SECRET"
    fi

    if [[ -n "${APP_URL:-}" ]] || [[ -n "${FRONTEND_URL:-}" ]]; then
        print_status "OK" "Application base URL is set"
    else
        print_status "ERROR" "Missing APP_URL / FRONTEND_URL"
    fi
    echo ""
}

check_database() {
    echo -e "${BLUE}🗄️  Database Connectivity${NC}"
    echo "-------------------------"

    if [[ -n "${DATABASE_URL:-}" ]]; then
        if [[ "$DATABASE_URL" =~ ^postgres ]] || [[ "$DATABASE_URL" =~ ^postgresql ]]; then
            print_status "OK" "Database URL format is valid (PostgreSQL)"
        elif [[ "$DATABASE_URL" =~ ^mongodb ]]; then
            print_status "WARNING" "Database URL is MongoDB (should be PostgreSQL for v7)"
        else
            print_status "WARNING" "Database URL format may be invalid"
        fi
    else
        print_status "ERROR" "DATABASE_URL not set"
    fi
    echo ""
}

check_app_runtime() {
    echo -e "${BLUE}🚀 TanStack Start Application${NC}"
    echo "-----------------------------"

    local app_port="${PORT:-12914}"
    check_port "$app_port" "TanStack Start Server"

    if [[ -f "dist/server/server.js" ]]; then
        print_status "OK" "Server bundle exists"
    else
        print_status "ERROR" "Missing dist/server/server.js"
    fi

    if [[ -d "dist/client" ]]; then
        print_status "OK" "Client bundle exists"
    else
        print_status "WARNING" "Missing dist/client bundle"
    fi
    echo ""
}

check_dependencies() {
    echo -e "${BLUE}📦 Dependencies${NC}"
    echo "---------------"

    if command -v bun >/dev/null 2>&1; then
        local bun_version
        bun_version=$(bun --version)
        print_status "OK" "Bun runtime available (v$bun_version)"
    elif command -v node >/dev/null 2>&1; then
        local node_version
        node_version=$(node --version)
        print_status "OK" "Node.js runtime available ($node_version)"
    else
        print_status "ERROR" "No JavaScript runtime found"
    fi

    if [[ -f "bun.lock" ]] && command -v bun >/dev/null 2>&1; then
        print_status "OK" "Bun package manager detected"
    else
        print_status "WARNING" "Cannot determine package manager"
    fi
    echo ""
}

check_security() {
    echo -e "${BLUE}🔒 Security Checks${NC}"
    echo "------------------"

    if [[ -f ".env.local" ]] || [[ -f ".env" ]]; then
        print_status "OK" "Environment file found"
    else
        print_status "WARNING" "No environment file found"
    fi
    echo ""
}

check_processes() {
    echo -e "${BLUE}⚙️  Process Management${NC}"
    echo "---------------------"

    if [[ -f ".dev-locks/dev-server.lock" ]]; then
        local lock_content
        lock_content=$(cat .dev-locks/dev-server.lock)
        local pid
        pid=$(echo "$lock_content" | grep "pid" | cut -d'"' -f4)
        if kill -0 "$pid" 2>/dev/null; then
            print_status "OK" "Dev server process running (PID: $pid)"
        else
            print_status "WARNING" "Stale lock file detected - process not running"
        fi
    else
        print_status "OK" "No active process locks"
    fi
    echo ""
}

check_disk_space() {
    echo -e "${BLUE}💾 System Resources${NC}"
    echo "-------------------"

    local disk_usage
    disk_usage=$(df . | tail -1 | awk '{print $5}' | sed 's/%//')
    if [[ $disk_usage -lt 80 ]]; then
        print_status "OK" "Disk usage: ${disk_usage}%"
    elif [[ $disk_usage -lt 90 ]]; then
        print_status "WARNING" "Disk usage high: ${disk_usage}%"
    else
        print_status "ERROR" "Disk usage critical: ${disk_usage}%"
    fi
    echo ""
}

print_summary() {
    echo "=================================================="
    echo -e "${BLUE}📊 Health Check Summary${NC}"
    echo "Total checks: $TOTAL_CHECKS"

    if [[ $HEALTH_ISSUES -eq 0 ]]; then
        echo -e "Status: ${GREEN}✅ ALL HEALTHY${NC}"
    else
        echo -e "Status: ${YELLOW}⚠️  ISSUES DETECTED${NC}"
        echo "Issues found: $HEALTH_ISSUES"
    fi
}

main() {
    print_header
    check_env_vars
    check_dependencies
    check_security
    check_database
    check_app_runtime
    check_processes
    check_disk_space
    print_summary

    if [[ $HEALTH_ISSUES -eq 0 ]]; then
        return 0
    fi

    return 1
}

case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [--quiet]"
        exit 0
        ;;
    --quiet)
        exec 3>&1
        exec 1>/dev/null
        status=0
        main || status=$?
        exec 1>&3
        print_summary
        exit "$status"
        ;;
    *)
        main
        exit $?
        ;;
esac
