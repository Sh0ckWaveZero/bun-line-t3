#!/bin/bash

# 🚀 Development Helper Script
# Quick commands สำหรับ development workflow

set -e

# 🎨 Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
echo "╔═══════════════════════════════════════════════════════════════════════════════╗"
echo "║                           🚀 DEVELOPMENT HELPER                               ║"
echo "╚═══════════════════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${WHITE}🚀 Enhanced Development Server Commands:${NC}"
echo ""
echo -e "${GREEN}📱 Development Server:${NC}"
echo -e "  ${CYAN}bun run dev${NC}                    - Start enhanced dev server (recommended)"
echo -e "  ${CYAN}bun run dev:basic${NC}              - Start basic dev server (no monitoring)"
echo -e "  ${CYAN}bun run dev:clean${NC}              - Clean cache and start enhanced dev server"
echo -e "  ${CYAN}bun run dev:force${NC}              - Force start (clean locks first)"
echo ""
echo -e "${GREEN}🔧 Management:${NC}"
echo -e "  ${CYAN}bun run dev:stop${NC}               - Stop development server"
echo -e "  ${CYAN}bun run dev:status${NC}             - Check development server status"
echo -e "  ${CYAN}bun run dev:logs${NC}               - Watch development server logs"
echo ""
echo -e "${GREEN}🎛️ Shell Commands (easier):${NC}"
echo -e "  ${CYAN}./scripts/manage-processes.sh dev${NC}         - Start enhanced dev server"
echo -e "  ${CYAN}./scripts/manage-processes.sh dev-stop${NC}    - Stop dev server"
echo -e "  ${CYAN}./scripts/manage-processes.sh dev-restart${NC} - Restart dev server"
echo -e "  ${CYAN}./scripts/manage-processes.sh dev-status${NC}  - Check dev server status"
echo ""
echo -e "${YELLOW}💡 Key Benefits of Enhanced Dev Server:${NC}"
echo -e "  🔒 Prevents multiple dev servers running simultaneously"
echo -e "  📊 Comprehensive logging and monitoring"
echo -e "  🔍 Health checks and performance monitoring"
echo -e "  ⚡ Auto-detection of port conflicts"
echo -e "  🛡️ Graceful shutdown handling"
echo -e "  📈 Development statistics tracking"
echo ""
echo -e "${YELLOW}🔍 Monitoring & Debugging:${NC}"
echo -e "  ${CYAN}./scripts/manage-processes.sh status${NC}              - Overall system status"
echo -e "  ${CYAN}./scripts/manage-processes.sh monitor${NC}             - Interactive monitoring dashboard"
echo -e "  ${CYAN}./scripts/manage-processes.sh log-watch dev-server.log${NC} - Watch dev server logs real-time"
echo -e "  ${CYAN}./scripts/manage-processes.sh clean${NC}               - Clean up stale process locks"
echo ""
echo -e "${BLUE}🚨 Troubleshooting:${NC}"
echo ""
echo -e "${WHITE}If dev server won't start:${NC}"
echo -e "  1. Check what's using port 4325: ${CYAN}lsof -i :4325${NC}"
echo -e "  2. Check process status: ${CYAN}./scripts/manage-processes.sh dev-status${NC}"
echo -e "  3. Clean stale locks: ${CYAN}./scripts/manage-processes.sh clean${NC}"
echo -e "  4. Force start: ${CYAN}bun run dev:force${NC}"
echo ""
echo -e "${WHITE}If you see 'process already running':${NC}"
echo -e "  1. Stop existing server: ${CYAN}./scripts/manage-processes.sh dev-stop${NC}"
echo -e "  2. Or restart: ${CYAN}./scripts/manage-processes.sh dev-restart${NC}"
echo ""
echo -e "${WHITE}To see what the server is doing:${NC}"
echo -e "  1. Watch logs: ${CYAN}bun run dev:logs${NC}"
echo -e "  2. Check status: ${CYAN}./scripts/manage-processes.sh dev-status${NC}"
echo -e "  3. Monitor dashboard: ${CYAN}./scripts/manage-processes.sh monitor${NC}"
echo ""
echo -e "${GREEN}🎯 Quick Start:${NC}"
echo -e "  ${YELLOW}Just run: ${CYAN}bun run dev${NC} ${YELLOW}and enjoy enhanced development experience!${NC}"
echo ""
