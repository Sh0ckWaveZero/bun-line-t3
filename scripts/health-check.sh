#!/bin/bash

# 🔍 Health Check Script สำหรับ LINE Attendance System
# วัตถุประสงค์: ตรวจสอบสถานะของ services และ dependencies ต่างๆ

set -euo pipefail

# 🎨 Colors สำหรับ output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 📊 ตัวแปรสำหรับ tracking
HEALTH_ISSUES=0
TOTAL_CHECKS=0

# 🔧 Functions
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
    
    # Required environment variables
    local required_vars=(
        "DATABASE_URL"
        "NEXTAUTH_SECRET"
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
    echo ""
}

check_database() {
    echo -e "${BLUE}🗄️  Database Connectivity${NC}"
    echo "-------------------------"
    
    # ตรวจสอบ DATABASE_URL format
    if [[ -n "${DATABASE_URL:-}" ]]; then
        if [[ "$DATABASE_URL" =~ ^mongodb ]]; then
            print_status "OK" "Database URL format is valid (MongoDB)"
        else
            print_status "WARNING" "Database URL format may be invalid"
        fi
    else
        print_status "ERROR" "DATABASE_URL not set"
    fi
    
    # ตรวจสอบ Prisma client (ถ้ามี)
    if command -v bunx >/dev/null 2>&1; then
        if bunx prisma db pull --dry-run >/dev/null 2>&1; then
            print_status "OK" "Database connection successful"
        else
            print_status "ERROR" "Cannot connect to database"
        fi
    elif command -v npx >/dev/null 2>&1; then
        if npx prisma db pull --dry-run >/dev/null 2>&1; then
            print_status "OK" "Database connection successful"
        else
            print_status "ERROR" "Cannot connect to database"
        fi
    else
        print_status "WARNING" "Cannot test database connection - no prisma client"
    fi
    echo ""
}

check_next_app() {
    echo -e "${BLUE}🚀 Next.js Application${NC}"
    echo "----------------------"
    
    # ตรวจสอบ Next.js dev server (port 3000)
    check_port 3000 "Next.js Dev Server"
    
    # ตรวจสอบ production build (ถ้ามี)
    if [[ -d ".next" ]]; then
        print_status "OK" "Next.js build directory exists"
    else
        print_status "WARNING" "No Next.js build found (normal for dev)"
    fi
    echo ""
}

check_dependencies() {
    echo -e "${BLUE}📦 Dependencies${NC}"
    echo "---------------"
    
    # ตรวจสอบ Node.js runtime
    if command -v bun >/dev/null 2>&1; then
        local bun_version=$(bun --version)
        print_status "OK" "Bun runtime available (v$bun_version)"
    elif command -v node >/dev/null 2>&1; then
        local node_version=$(node --version)
        print_status "OK" "Node.js runtime available ($node_version)"
    else
        print_status "ERROR" "No JavaScript runtime found"
    fi
    
    # ตรวจสอบ package manager
    if [[ -f "bun.lockb" ]] && command -v bun >/dev/null 2>&1; then
        print_status "OK" "Bun package manager detected"
    elif [[ -f "package-lock.json" ]] && command -v npm >/dev/null 2>&1; then
        print_status "OK" "NPM package manager detected"
    elif [[ -f "yarn.lock" ]] && command -v yarn >/dev/null 2>&1; then
        print_status "OK" "Yarn package manager detected"
    else
        print_status "WARNING" "Cannot determine package manager"
    fi
    echo ""
}

check_security() {
    echo -e "${BLUE}🔒 Security Checks${NC}"
    echo "------------------"
    
    # ตรวจสอบ SSL certificates
    if [[ -f "certificates/localhost.pem" ]] && [[ -f "certificates/localhost-key.pem" ]]; then
        print_status "OK" "SSL certificates found"
    else
        print_status "WARNING" "SSL certificates missing (HTTPS unavailable)"
    fi
    
    # ตรวจสอบ .env files
    if [[ -f ".env.local" ]] || [[ -f ".env" ]]; then
        print_status "OK" "Environment file found"
    else
        print_status "WARNING" "No environment file found"
    fi
    
    # ตรวจสอบ file permissions (ถ้าเป็น production)
    if [[ -f ".env.local" ]]; then
        local env_perms=$(stat -f "%A" .env.local 2>/dev/null || stat -c "%a" .env.local 2>/dev/null || echo "unknown")
        if [[ "$env_perms" == "600" ]] || [[ "$env_perms" == "644" ]]; then
            print_status "OK" "Environment file permissions secure"
        else
            print_status "WARNING" "Environment file permissions may be too open ($env_perms)"
        fi
    fi
    echo ""
}

check_processes() {
    echo -e "${BLUE}⚙️  Process Management${NC}"
    echo "---------------------"
    
    # ตรวจสอบ lock files
    if [[ -f ".dev-locks/dev-server.lock" ]]; then
        local lock_content=$(cat .dev-locks/dev-server.lock)
        local pid=$(echo "$lock_content" | grep "pid" | cut -d'"' -f4)
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
    
    # ตรวจสอบ disk space
    local disk_usage=$(df . | tail -1 | awk '{print $5}' | sed 's/%//')
    if [[ $disk_usage -lt 80 ]]; then
        print_status "OK" "Disk usage: ${disk_usage}%"
    elif [[ $disk_usage -lt 90 ]]; then
        print_status "WARNING" "Disk usage high: ${disk_usage}%"
    else
        print_status "ERROR" "Disk usage critical: ${disk_usage}%"
    fi
    
    # ตรวจสอบ memory (ถ้าใช้ได้)
    if command -v free >/dev/null 2>&1; then
        local mem_usage=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
        if [[ $mem_usage -lt 80 ]]; then
            print_status "OK" "Memory usage: ${mem_usage}%"
        else
            print_status "WARNING" "Memory usage high: ${mem_usage}%"
        fi
    elif command -v vm_stat >/dev/null 2>&1; then
        print_status "OK" "Memory monitoring available (macOS)"
    fi
    echo ""
}

print_summary() {
    echo "=================================================="
    echo -e "${BLUE}📊 Health Check Summary${NC}"
    echo "Total checks: $TOTAL_CHECKS"
    
    if [[ $HEALTH_ISSUES -eq 0 ]]; then
        echo -e "Status: ${GREEN}✅ ALL HEALTHY${NC}"
        echo "🎉 System is running optimally!"
    elif [[ $HEALTH_ISSUES -le 3 ]]; then
        echo -e "Status: ${YELLOW}⚠️  MINOR ISSUES${NC}"
        echo "🔧 $HEALTH_ISSUES issue(s) detected - review warnings above"
    else
        echo -e "Status: ${RED}❌ MAJOR ISSUES${NC}"
        echo "🚨 $HEALTH_ISSUES issue(s) detected - immediate attention required"
    fi
    
    echo ""
    echo "📋 Quick Actions:"
    echo "• To start dev server: bun run dev"
    echo "• To check logs: tail -f logs/*.md"
    echo "• To view processes: bun scripts/simple-lock.ts list"
    echo "• To run tests: bun test"
}

# 🚀 Main execution
main() {
    print_header
    
    check_env_vars
    check_dependencies
    check_security
    check_database
    check_next_app
    check_processes
    check_disk_space
    
    print_summary
    
    # Exit with appropriate code
    if [[ $HEALTH_ISSUES -eq 0 ]]; then
        exit 0
    elif [[ $HEALTH_ISSUES -le 3 ]]; then
        exit 1  # Minor issues
    else
        exit 2  # Major issues
    fi
}

# ตรวจสอบ command line arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [--quiet]"
        echo "Health check script for LINE Attendance System"
        echo ""
        echo "Options:"
        echo "  --quiet    Suppress detailed output, only show summary"
        echo "  --help     Show this help message"
        exit 0
        ;;
    --quiet)
        # Redirect detailed output to /dev/null, keep only summary
        exec 3>&1
        exec 1>/dev/null
        main
        exec 1>&3
        print_summary
        ;;
    *)
        main
        ;;
esac
