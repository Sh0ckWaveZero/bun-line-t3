#!/bin/bash

# 🔧 RASPBERRY PI BUILD SCRIPT
# Build script ที่ optimize สำหรับ Raspberry Pi 4 RAM 4GB
# ป้องกันการค้างระหว่าง build process

set -e  # Exit on any error

echo "🚀 Starting Raspberry Pi optimized build..."

# 🔧 ตั้งค่า swap behavior เพื่อลดการใช้ swap ยกเว้นจำเป็น
echo "📊 Configuring swap settings for build..."
sudo sysctl vm.swappiness=10
sudo sysctl vm.vfs_cache_pressure=50

# 🔧 ปิด services ที่ไม่จำเป็นชั่วคราวเพื่อเพิ่ม memory
echo "🔧 Temporarily stopping non-essential services..."
sudo systemctl stop --quiet apache2 2>/dev/null || true
sudo systemctl stop --quiet nginx 2>/dev/null || true
sudo systemctl stop --quiet mysql 2>/dev/null || true
sudo systemctl stop --quiet postgresql 2>/dev/null || true

# 🧹 ทำความสะอาด Docker เพื่อเพิ่ม available space
echo "🧹 Cleaning up Docker resources..."
docker system prune -f >/dev/null 2>&1 || true

# 📊 แสดง memory status ก่อน build
echo "📊 Memory status before build:"
free -h

# 🚀 Build โดยจำกัด concurrent processes
echo "🔨 Building Docker images with memory optimization..."
export DOCKER_BUILDKIT=1
export BUILDKIT_PROGRESS=plain

# 🔧 Build ทีละ stage เพื่อลด memory pressure
echo "📦 Building main application..."
docker-compose build --no-cache --memory=1.5g app

echo "⏰ Building cron service..."
docker-compose build --no-cache --memory=512m cron

# 📊 แสดง size ของ images ที่สร้าง
echo "📊 Built images:"
docker images | grep -E "(bun-line-t3|<none>)"

# 🧹 ทำความสะอาด temporary images
echo "🧹 Cleaning up temporary build artifacts..."
docker image prune -f >/dev/null 2>&1 || true

# 🔧 คืนค่า swap settings
echo "🔧 Restoring swap settings..."
sudo sysctl vm.swappiness=60
sudo sysctl vm.vfs_cache_pressure=100

# 🔄 เปิด services ที่ปิดไป
echo "🔄 Restarting services..."
sudo systemctl start --quiet apache2 2>/dev/null || true
sudo systemctl start --quiet nginx 2>/dev/null || true

echo "✅ Raspberry Pi build completed successfully!"
echo "🚀 You can now run: docker-compose up -d"
