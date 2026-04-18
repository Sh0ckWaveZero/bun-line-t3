#!/bin/bash

# 📊 Enhanced Monitoring Dashboard Script
# ใช้สำหรับตรวจสอบสถานะระบบแบบครอบคลุม

set -euo pipefail

# 🎨 Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# 📊 Configuration
API_URL="${API_URL:-${APP_URL:-http://localhost:4325}}"
REFRESH_INTERVAL="${REFRESH_INTERVAL:-30}"
MAX_LOG_LINES="${MAX_LOG_LINES:-50}"
MONITOR_PORT="${MONITOR_PORT:-4325}"

print_header() {
    clear
    echo -e "${BLUE}📊 Enhanced System Monitoring Dashboard${NC}"
    echo -e "${BLUE}=========================================${NC}"
    echo -e "⏰ $(date)"
    echo -e "🔄 Auto-refresh every ${REFRESH_INTERVAL}s (Ctrl+C to exit)"
    echo ""
}

check_api_health() {
    echo -e "${CYAN}🏥 Health Check Status${NC}"
    echo "-------------------"
    
    if command -v curl >/dev/null 2>&1; then
        local health_response=$(curl -s "${API_URL}/api/health/enhanced" 2>/dev/null || echo '{"status":"unavailable"}')
        
        # Parse JSON response (basic parsing)
        local status=$(echo "$health_response" | grep -o '"status":"[^"]*"' | cut -d'"' -f4 2>/dev/null || echo "unknown")
        local health_score=$(echo "$health_response" | grep -o '"healthScore":[0-9]*' | cut -d':' -f2 2>/dev/null || echo "0")
        local response_time=$(echo "$health_response" | grep -o '"responseTime":[0-9]*' | cut -d':' -f2 2>/dev/null || echo "0")
        
        case "$status" in
            "healthy")
                echo -e "✅ ${GREEN}System Status: HEALTHY${NC} (Score: ${health_score}/100)"
                ;;
            "degraded")
                echo -e "⚠️  ${YELLOW}System Status: DEGRADED${NC} (Score: ${health_score}/100)"
                ;;
            "unhealthy")
                echo -e "❌ ${RED}System Status: UNHEALTHY${NC} (Score: ${health_score}/100)"
                ;;
            *)
                echo -e "🔍 ${PURPLE}System Status: CHECKING...${NC}"
                ;;
        esac
        
        echo -e "⏱️  Response Time: ${response_time}ms"
        
        # Show alerts if any (basic parsing)
        local alerts=$(echo "$health_response" | grep -o '"alerts":\[[^]]*\]' 2>/dev/null || echo "")
        if [[ -n "$alerts" && "$alerts" != '"alerts":[]' ]]; then
            echo -e "🚨 ${RED}Active Alerts Detected${NC}"
        fi
        
    else
        echo -e "❌ ${RED}curl not available - cannot check API health${NC}"
    fi
    echo ""
}

check_processes() {
    echo -e "${CYAN}⚙️  Process Status${NC}"
    echo "---------------"
    
    # Check for Node.js processes
    if command -v pgrep >/dev/null 2>&1; then
        local node_processes=$(pgrep -f "node\|bun" | wc -l | tr -d ' ')
        echo -e "🟢 Active Node/Bun processes: ${node_processes}"
        
        # Check for specific processes
        if pgrep -f "vite|bun dist/server/server.js|server.js" >/dev/null 2>&1; then
            echo -e "🟢 TanStack Start server: ${GREEN}Running${NC}"
        else
            echo -e "🔍 TanStack Start server: ${YELLOW}Not detected${NC}"
        fi
        
    else
        echo -e "⚠️  Process monitoring not available"
    fi
    
    # Check ports
    if command -v lsof >/dev/null 2>&1; then
        if lsof -i :"${MONITOR_PORT}" >/dev/null 2>&1; then
            echo -e "🟢 Port ${MONITOR_PORT}: ${GREEN}Active${NC}"
        else
            echo -e "🔍 Port ${MONITOR_PORT}: ${YELLOW}Not in use${NC}"
        fi
    elif command -v ss >/dev/null 2>&1; then
        if ss -ln | grep -q ":${MONITOR_PORT} "; then
            echo -e "🟢 Port ${MONITOR_PORT}: ${GREEN}Active${NC}"
        else
            echo -e "🔍 Port ${MONITOR_PORT}: ${YELLOW}Not in use${NC}"
        fi
    fi
    echo ""
}

check_system_resources() {
    echo -e "${CYAN}💻 System Resources${NC}"
    echo "-------------------"
    
    # Memory usage
    if command -v free >/dev/null 2>&1; then
        local mem_usage=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
        if (( $(echo "$mem_usage > 80" | bc -l) )); then
            echo -e "🔴 Memory: ${RED}${mem_usage}%${NC} (High)"
        elif (( $(echo "$mem_usage > 60" | bc -l) )); then
            echo -e "🟡 Memory: ${YELLOW}${mem_usage}%${NC} (Moderate)"
        else
            echo -e "🟢 Memory: ${GREEN}${mem_usage}%${NC} (Good)"
        fi
    elif command -v vm_stat >/dev/null 2>&1; then
        echo -e "🟢 Memory: ${GREEN}Available${NC} (macOS)"
    else
        echo -e "⚠️  Memory monitoring not available"
    fi
    
    # Disk usage
    local disk_usage=$(df . | tail -1 | awk '{print $5}' | sed 's/%//')
    if [[ $disk_usage -gt 80 ]]; then
        echo -e "🔴 Disk: ${RED}${disk_usage}%${NC} (High)"
    elif [[ $disk_usage -gt 60 ]]; then
        echo -e "🟡 Disk: ${YELLOW}${disk_usage}%${NC} (Moderate)"
    else
        echo -e "🟢 Disk: ${GREEN}${disk_usage}%${NC} (Good)"
    fi
    
    # Load average (Linux/macOS)
    if command -v uptime >/dev/null 2>&1; then
        local load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
        echo -e "📊 Load Average: ${load_avg}"
    fi
    echo ""
}

show_recent_logs() {
    echo -e "${CYAN}📋 Recent Activity${NC}"
    echo "---------------"
    
    # Check for log files
    if [[ -d "logs" ]]; then
        local log_count=$(find logs -name "*.md" -o -name "*.log" | wc -l | tr -d ' ')
        echo -e "📄 Log files found: ${log_count}"
        
        # Show most recent log entries
        local recent_log=$(find logs -name "*.md" -o -name "*.log" -type f -exec ls -t {} + | head -1)
        if [[ -n "$recent_log" ]]; then
            echo -e "📖 Latest: $(basename "$recent_log")"
            echo -e "${PURPLE}Last ${MAX_LOG_LINES} lines:${NC}"
            tail -n "$MAX_LOG_LINES" "$recent_log" | head -20 | while IFS= read -r line; do
                if [[ "$line" =~ ERROR|FAIL|❌ ]]; then
                    echo -e "  ${RED}$line${NC}"
                elif [[ "$line" =~ SUCCESS|COMPLETE|✅ ]]; then
                    echo -e "  ${GREEN}$line${NC}"
                elif [[ "$line" =~ WARNING|⚠️ ]]; then
                    echo -e "  ${YELLOW}$line${NC}"
                else
                    echo -e "  $line"
                fi
            done
        fi
    else
        echo -e "⚠️  No logs directory found"
    fi
    echo ""
}

show_quick_actions() {
    echo -e "${CYAN}🎯 Quick Actions${NC}"
    echo "---------------"
    echo -e "• ${GREEN}bun run dev${NC} - Start development server"
    echo -e "• ${GREEN}bun test${NC} - Run test suite"
    echo -e "• ${GREEN}./scripts/health-check.sh${NC} - Detailed health check"
    echo -e "• ${GREEN}bun scripts/simple-lock.ts list${NC} - Show active processes"
    echo -e "• ${GREEN}curl ${API_URL}/api/health${NC} - Basic health check"
    echo ""
}

show_monitoring_tips() {
    echo -e "${CYAN}💡 Monitoring Tips${NC}"
    echo "---------------"
    echo -e "• Watch for memory usage > 80%"
    echo -e "• Monitor disk space regularly" 
    echo -e "• Check logs for errors/warnings"
    echo -e "• Verify API endpoints are responding"
    echo -e "• Use enhanced health check for detailed status"
    echo ""
}

# 🚀 Main monitoring loop
main() {
    while true; do
        print_header
        check_api_health
        check_processes
        check_system_resources
        show_recent_logs
        show_quick_actions
        show_monitoring_tips
        
        echo -e "${BLUE}🔄 Refreshing in ${REFRESH_INTERVAL} seconds...${NC}"
        sleep "$REFRESH_INTERVAL"
    done
}

# Handle command line arguments
case "${1:-}" in
    --help|-h)
        echo "Enhanced Monitoring Dashboard"
        echo ""
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --once         Run once and exit (no auto-refresh)"
        echo "  --interval N   Set refresh interval to N seconds (default: 30)"
        echo ""
        echo "Environment Variables:"
        echo "  API_URL            API endpoint (default: http://localhost:4325)"
        echo "  REFRESH_INTERVAL   Refresh interval in seconds (default: 30)"
        echo "  MAX_LOG_LINES      Max log lines to show (default: 50)"
        echo "  MONITOR_PORT       Port to check locally (default: 4325)"
        exit 0
        ;;
    --once)
        print_header
        check_api_health
        check_processes
        check_system_resources
        show_recent_logs
        show_quick_actions
        show_monitoring_tips
        exit 0
        ;;
    --interval)
        if [[ -n "${2:-}" ]] && [[ "$2" =~ ^[0-9]+$ ]]; then
            REFRESH_INTERVAL="$2"
            echo "Setting refresh interval to ${REFRESH_INTERVAL} seconds"
            shift 2
        else
            echo "Error: --interval requires a numeric value"
            exit 1
        fi
        ;;
esac

# Start monitoring
main
