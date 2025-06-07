#!/bin/sh
# 🔐 Docker Health Check Script
# Simple health check สำหรับ Next.js application

# ตรวจสอบว่า port ทำงานอยู่หรือไม่
if curl -f http://localhost:${PORT:-12914}/api/health > /dev/null 2>&1; then
    echo "✅ Health check passed"
    exit 0
else
    echo "❌ Health check failed"
    exit 1
fi
