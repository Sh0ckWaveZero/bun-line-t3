#!/bin/bash

# 🔧 RASPBERRY PI MONITORING SCRIPT
# Script สำหรับตรวจสอบสถานะระบบขณะ build

# สี่สำหรับแสดงผล
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Raspberry Pi System Status ===${NC}"

# ตรวจสอบ Memory
echo -e "${YELLOW}📊 Memory Usage:${NC}"
free -h

echo ""

# ตรวจสอบ Swap
echo -e "${YELLOW}💾 Swap Usage:${NC}"
swapon --show

echo ""

# ตรวจสอบ CPU Load
echo -e "${YELLOW}⚡ CPU Load:${NC}"
uptime

echo ""

# ตรวจสอบ Disk Space
echo -e "${YELLOW}💿 Disk Usage:${NC}"
df -h / /tmp

echo ""

# ตรวจสอบ Temperature
echo -e "${YELLOW}🌡️  CPU Temperature:${NC}"
vcgencmd measure_temp 2>/dev/null || echo "Temperature monitoring not available"

echo ""

# ตรวจสอบ Docker
echo -e "${YELLOW}🐳 Docker Status:${NC}"
if command -v docker >/dev/null 2>&1; then
    docker system df
    echo ""
    echo -e "${YELLOW}🏷️  Docker Images:${NC}"
    docker images | head -5
else
    echo "Docker not installed"
fi

echo ""

# ตรวจสอบ running processes ที่ใช้ memory มาก
echo -e "${YELLOW}🔍 Top Memory Processes:${NC}"
ps aux --sort=-%mem | head -5

echo ""
echo -e "${GREEN}=== End System Status ===${NC}"
