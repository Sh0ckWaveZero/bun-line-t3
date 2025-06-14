#!/bin/bash

# 🚀 Simple Process Helper
# Easy interface for pm.ts

set -e

# 🎨 Colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

print_header() {
    echo -e "${CYAN}"
    echo "╔═══════════════════════════════════════════════════════════════════════════════╗"
    echo "║                         🚀 PROCESS HELPER                                     ║"
    echo "╚═══════════════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

show_help() {
    echo -e "${WHITE}Quick Commands:${NC}"
    echo ""
    echo -e "${GREEN}🚀 Development:${NC}"
    echo -e "  ${CYAN}./scripts/pm.sh dev${NC}          - Start dev server"
    echo -e "  ${CYAN}./scripts/pm.sh dev-stop${NC}     - Stop dev server"
    echo -e "  ${CYAN}./scripts/pm.sh dev-status${NC}   - Check dev server"
    echo -e "  ${CYAN}./scripts/pm.sh dev-logs${NC}     - Watch dev logs"
    echo ""
    echo -e "${GREEN}📊 Monitoring:${NC}"
    echo -e "  ${CYAN}./scripts/pm.sh status${NC}       - System status"
    echo -e "  ${CYAN}./scripts/pm.sh logs <file>${NC}  - Watch log file"
    echo -e "  ${CYAN}./scripts/pm.sh clean${NC}        - Clean stale locks"
    echo ""
    echo -e "${GREEN}🔔 Other:${NC}"
    echo -e "  ${CYAN}./scripts/pm.sh checkout${NC}     - Run checkout reminder"
    echo ""
    echo -e "${WHITE}Or use the full tool: ${CYAN}bun scripts/pm.ts <command>${NC}"
}

main() {
    cd "$PROJECT_DIR"
    
    case "${1:-help}" in
        "dev")
            print_header
            echo "🚀 Starting development server..."
            bun scripts/pm.ts dev start
            ;;
        "dev-stop")
            print_header
            echo "⏹️ Stopping development server..."
            bun scripts/pm.ts dev stop
            ;;
        "dev-status")
            print_header
            echo "📊 Development server status:"
            bun scripts/pm.ts dev status
            ;;
        "dev-logs")
            print_header
            echo "📊 Watching development server logs..."
            bun scripts/pm.ts logs watch dev-server.log
            ;;
        "status")
            print_header
            echo "📋 System status:"
            bun scripts/pm.ts process list
            ;;
        "logs")
            if [ -z "$2" ]; then
                print_header
                echo "📋 Available log files:"
                bun scripts/pm.ts logs list
            else
                print_header
                echo "📊 Watching log file: $2"
                bun scripts/pm.ts logs watch "$2"
            fi
            ;;
        "clean")
            print_header
            echo "🧹 Cleaning stale locks..."
            bun scripts/pm.ts process clean
            ;;
        "checkout")
            print_header
            echo "🔔 Running checkout reminder..."
            bun scripts/pm.ts checkout
            ;;
        "help"|"-h"|"--help"|"")
            print_header
            show_help
            ;;
        *)
            print_header
            echo "❌ Unknown command: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

main "$@"
