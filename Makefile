
# 🔧 Development
d:
	bun run dev

# 🔧 RASPBERRY PI BUILD COMMANDS
# Build optimized สำหรับ Raspberry Pi 4 RAM 4GB

# Build ด้วย memory optimization
build-pi:
	./build-pi.sh

# Build แบบธรรมดา (อาจค้าง)
build:
	docker-compose build

# Build โดยไม่ใช้ cache
build-clean:
	docker-compose build --no-cache

# รัน services
up:
	docker-compose up -d

# หยุด services
down:
	docker-compose down

# ดู logs
logs:
	docker-compose logs -f

# ทำความสะอาด Docker
clean:
	docker system prune -af
	docker volume prune -f

# ตรวจสอบ memory usage
mem:
	free -h
	echo "---"
	docker stats --no-stream

# รีสตาร์ท services
restart: down up
