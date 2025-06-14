#!/bin/bash

# 🎯 Process Management Helper Script
# ระบบจัดการ process ที่ใช้งานง่าย

set -e

# 🎨 Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# 📁 Directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOGS_DIR="$PROJECT_DIR/logs"
LOCKS_DIR="$PROJECT_DIR/.locks"

# 🔧 Functions

print_header() {
    echo -e "${CYAN}"
    echo "╔═══════════════════════════════════════════════════════════════════════════════╗"
    echo "║                        🔧 PROCESS MANAGEMENT HELPER                           ║"
    echo "╚═══════════════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_usage() {
    echo -e "${WHITE}Usage: $0 <command> [options]${NC}"
    echo ""
    echo -e "${YELLOW}📋 Available Commands:${NC}"
    echo ""
    echo -e "${GREEN}🔍 Monitoring:${NC}"
    echo -e "  ${CYAN}status${NC}           - Show current process status"
    echo -e "  ${CYAN}monitor${NC}          - Start interactive monitoring dashboard"
    echo -e "  ${CYAN}logs${NC}             - Show live monitoring dashboard"
    echo ""
    echo -e "${GREEN}🎮 Process Control:${NC}"
    echo -e "  ${CYAN}start <process>${NC}   - Start a specific process"
    echo -e "  ${CYAN}stop <process>${NC}    - Stop a specific process"
    echo -e "  ${CYAN}restart <process>${NC} - Restart a specific process"
    echo -e "  ${CYAN}list${NC}             - List all active processes"
    echo -e "  ${CYAN}clean${NC}            - Clean up stale lock files"
    echo ""
    echo -e "${GREEN}📊 Log Management:${NC}"
    echo -e "  ${CYAN}log-read <file>${NC}   - Read a log file"
    echo -e "  ${CYAN}log-watch <file>${NC}  - Watch a log file in real-time"
    echo -e "  ${CYAN}log-analyze <file>${NC} - Analyze log entries"
    echo ""
    echo -e "${GREEN}🔄 Specific Operations:${NC}"
    echo -e "  ${CYAN}dev${NC}             - Start enhanced development server"
    echo -e "  ${CYAN}dev-stop${NC}        - Stop development server"
    echo -e "  ${CYAN}dev-restart${NC}     - Restart development server"
    echo -e "  ${CYAN}dev-status${NC}      - Check development server status"
    echo -e "  ${CYAN}checkout${NC}         - Run checkout reminder (enhanced version)"
    echo -e "  ${CYAN}checkout-old${NC}     - Run checkout reminder (legacy version)"
    echo ""
    echo -e "${YELLOW}📝 Examples:${NC}"
    echo -e "  ${BLUE}$0 status${NC}                        # Show all process status"
    echo -e "  ${BLUE}$0 start checkout-reminder${NC}       # Start checkout reminder"
    echo -e "  ${BLUE}$0 dev${NC}                           # Start enhanced dev server"
    echo -e "  ${BLUE}$0 dev-status${NC}                    # Check dev server status"
    echo -e "  ${BLUE}$0 log-watch dev-server.log${NC}      # Watch dev server logs"
    echo -e "  ${BLUE}$0 log-watch checkout-reminder.log${NC} # Watch checkout logs"
    echo -e "  ${BLUE}$0 monitor${NC}                       # Start monitoring dashboard"
    echo -e "  ${BLUE}$0 checkout${NC}                      # Run checkout reminder"
}

ensure_directories() {
    mkdir -p "$LOGS_DIR"
    mkdir -p "$LOCKS_DIR"
}

run_command() {
    local cmd="$1"
    echo -e "${BLUE}🚀 Running: ${cmd}${NC}"
    cd "$PROJECT_DIR"
    eval "$cmd"
}

check_prerequisites() {
    if ! command -v bun &> /dev/null; then
        echo -e "${RED}❌ Error: Bun is not installed or not in PATH${NC}"
        echo -e "${YELLOW}💡 Please install Bun: https://bun.sh${NC}"
        exit 1
    fi

    if [ ! -f "$PROJECT_DIR/package.json" ]; then
        echo -e "${RED}❌ Error: package.json not found${NC}"
        echo -e "${YELLOW}💡 Please run this script from the project root${NC}"
        exit 1
    fi
}

show_status() {
    echo -e "${CYAN}📊 Current Process Status:${NC}"
    run_command "bun scripts/process-manager.ts list"
    echo ""
    echo -e "${CYAN}📁 Available Log Files:${NC}"
    run_command "bun scripts/log-viewer.ts list"
}

start_process() {
    local process_name="$1"
    if [ -z "$process_name" ]; then
        echo -e "${RED}❌ Error: Process name is required${NC}"
        echo -e "${YELLOW}💡 Usage: $0 start <process-name>${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}▶️ Starting process: $process_name${NC}"
    run_command "bun scripts/process-monitor.ts start \"$process_name\""
}

stop_process() {
    local process_name="$1"
    if [ -z "$process_name" ]; then
        echo -e "${RED}❌ Error: Process name is required${NC}"
        echo -e "${YELLOW}💡 Usage: $0 stop <process-name>${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}⏹️ Stopping process: $process_name${NC}"
    run_command "bun scripts/process-manager.ts kill \"$process_name\""
}

restart_process() {
    local process_name="$1"
    if [ -z "$process_name" ]; then
        echo -e "${RED}❌ Error: Process name is required${NC}"
        echo -e "${YELLOW}💡 Usage: $0 restart <process-name>${NC}"
        exit 1
    fi
    
    echo -e "${MAGENTA}🔄 Restarting process: $process_name${NC}"
    run_command "bun scripts/process-monitor.ts restart \"$process_name\""
}

list_processes() {
    echo -e "${CYAN}📋 Active Processes:${NC}"
    run_command "bun scripts/process-manager.ts list"
}

clean_locks() {
    echo -e "${YELLOW}🧹 Cleaning stale lock files...${NC}"
    run_command "bun scripts/process-manager.ts clean"
}

start_monitor() {
    echo -e "${CYAN}📊 Starting monitoring dashboard...${NC}"
    echo -e "${YELLOW}Press Ctrl+C to exit${NC}"
    run_command "bun scripts/process-monitor.ts monitor"
}

show_logs_dashboard() {
    echo -e "${CYAN}📊 Starting logs dashboard...${NC}"
    echo -e "${YELLOW}Press Ctrl+C to exit${NC}"
    run_command "bun scripts/log-viewer.ts dashboard"
}

read_log() {
    local log_file="$1"
    if [ -z "$log_file" ]; then
        echo -e "${RED}❌ Error: Log file name is required${NC}"
        echo -e "${YELLOW}💡 Usage: $0 log-read <filename>${NC}"
        echo -e "${CYAN}📋 Available log files:${NC}"
        run_command "bun scripts/log-viewer.ts list"
        exit 1
    fi
    
    echo -e "${CYAN}📖 Reading log file: $log_file${NC}"
    run_command "bun scripts/log-viewer.ts read \"$log_file\""
}

watch_log() {
    local log_file="$1"
    if [ -z "$log_file" ]; then
        echo -e "${RED}❌ Error: Log file name is required${NC}"
        echo -e "${YELLOW}💡 Usage: $0 log-watch <filename>${NC}"
        echo -e "${CYAN}📋 Available log files:${NC}"
        run_command "bun scripts/log-viewer.ts list"
        exit 1
    fi
    
    echo -e "${CYAN}👀 Watching log file: $log_file${NC}"
    echo -e "${YELLOW}Press Ctrl+C to exit${NC}"
    run_command "bun scripts/log-viewer.ts watch \"$log_file\""
}

analyze_log() {
    local log_file="$1"
    local hours="${2:-24}"
    
    if [ -z "$log_file" ]; then
        echo -e "${RED}❌ Error: Log file name is required${NC}"
        echo -e "${YELLOW}💡 Usage: $0 log-analyze <filename> [hours]${NC}"
        echo -e "${CYAN}📋 Available log files:${NC}"
        run_command "bun scripts/log-viewer.ts list"
        exit 1
    fi
    
    echo -e "${CYAN}📊 Analyzing log file: $log_file (last $hours hours)${NC}"
    run_command "bun scripts/log-viewer.ts analyze \"$log_file\" \"$hours\""
}

run_checkout() {
    echo -e "${GREEN}🔔 Running enhanced checkout reminder...${NC}"
    run_command "bun scripts/enhanced-checkout-reminder.ts"
}

run_checkout_old() {
    echo -e "${YELLOW}🔔 Running legacy checkout reminder...${NC}"
    run_command "bun scripts/checkout-reminder.ts"
}

start_dev_server() {
    echo -e "${GREEN}🚀 Starting enhanced development server...${NC}"
    echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}"
    run_command "bun scripts/enhanced-dev-server.ts"
}

stop_dev_server() {
    echo -e "${YELLOW}⏹️ Stopping development server...${NC}"
    run_command "bun scripts/process-manager.ts kill dev-server"
}

restart_dev_server() {
    echo -e "${MAGENTA}🔄 Restarting development server...${NC}"
    stop_dev_server
    sleep 2
    start_dev_server
}

check_dev_status() {
    echo -e "${CYAN}📊 Development server status:${NC}"
    
    # Check if dev server process is running
    local dev_lock="$LOCKS_DIR/dev-server.lock"
    if [ -f "$dev_lock" ]; then
        echo -e "${GREEN}✅ Development server lock file exists${NC}"
        
        # Read lock file content
        if [ -s "$dev_lock" ]; then
            echo -e "${BLUE}📋 Process information:${NC}"
            cat "$dev_lock" | jq '.' 2>/dev/null || cat "$dev_lock"
        fi
    else
        echo -e "${RED}❌ Development server is not running${NC}"
    fi
    
    # Check if port 4325 is in use
    if command -v lsof >/dev/null 2>&1; then
        local port_usage
        port_usage=$(lsof -ti:4325 2>/dev/null)
        if [ -n "$port_usage" ]; then
            echo -e "${GREEN}🌐 Port 4325 is in use by PID: $port_usage${NC}"
        else
            echo -e "${YELLOW}🌐 Port 4325 is available${NC}"
        fi
    fi
    
    # Check recent logs
    local dev_log="$LOGS_DIR/dev-server.log"
    if [ -f "$dev_log" ]; then
        echo -e "${BLUE}📊 Recent development server logs (last 5 lines):${NC}"
        tail -5 "$dev_log" | while read -r line; do
            echo "  $line"
        done
    else
        echo -e "${YELLOW}📝 No development server logs found${NC}"
    fi
}

# 🎯 Main execution
main() {
    ensure_directories
    check_prerequisites
    
    local command="$1"
    shift || true
    
    case "$command" in
        "status")
            print_header
            show_status
            ;;
        "start")
            print_header
            start_process "$@"
            ;;
        "stop")
            print_header
            stop_process "$@"
            ;;
        "restart")
            print_header
            restart_process "$@"
            ;;
        "list")
            print_header
            list_processes
            ;;
        "clean")
            print_header
            clean_locks
            ;;
        "monitor")
            print_header
            start_monitor
            ;;
        "logs")
            print_header
            show_logs_dashboard
            ;;
        "log-read")
            print_header
            read_log "$@"
            ;;
        "log-watch")
            print_header
            watch_log "$@"
            ;;
        "log-analyze")
            print_header
            analyze_log "$@"
            ;;
        "checkout")
            print_header
            run_checkout
            ;;
        "checkout-old")
            print_header
            run_checkout_old
            ;;
        "dev")
            print_header
            start_dev_server
            ;;
        "dev-stop")
            print_header
            stop_dev_server
            ;;
        "dev-restart")
            print_header
            restart_dev_server
            ;;
        "dev-status")
            print_header
            check_dev_status
            ;;
        "help"|"-h"|"--help"|"")
            print_header
            print_usage
            ;;
        *)
            print_header
            echo -e "${RED}❌ Unknown command: $command${NC}"
            echo ""
            print_usage
            exit 1
            ;;
    esac
}

# Execute main function with all arguments
main "$@"
