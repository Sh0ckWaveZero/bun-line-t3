# 🛡️ Self-Hosted Runner Setup Guide สำหรับ Raspberry Pi

> **🔐 Security-First Setup**: คู่มือการตั้งค่า GitHub Actions Self-Hosted Runner บน Raspberry Pi อย่างปลอดภัย

## 📋 สารบัญ

1. [ข้อกำหนดระบบ](#ข้อกำหนดระบบ)
2. [การติดตั้ง Runner](#การติดตั้ง-runner)
3. [การจัดการ Environment Variables](#การจัดการ-environment-variables)
4. [การตั้งค่าความปลอดภัย](#การตั้งค่าความปลอดภัย)
5. [การ Monitoring และ Maintenance](#การ-monitoring-และ-maintenance)

---

## 🔧 ข้อกำหนดระบบ

### 📊 Hardware Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **RAM** | 2GB | 4GB+ |
| **Storage** | 16GB | 32GB+ SSD |
| **CPU** | Quad-core ARM64 | Raspberry Pi 4/5 |
| **Network** | 100Mbps | Gigabit Ethernet |

### 🛠️ Software Requirements

```bash
# 🔧 อัปเดตระบบ
sudo apt update && sudo apt upgrade -y

# 🐳 ติดตั้ง Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 🔧 ติดตั้ง Docker Compose
sudo apt install docker-compose-plugin -y

# 🔧 ติดตั้ง tools ที่จำเป็น
sudo apt install -y curl wget git jq bc
```

---

## 🤖 การติดตั้ง Runner

### 1. สร้าง Runner User

```bash
# 🔐 SECURITY: สร้าง dedicated user สำหรับ runner
sudo useradd -m -s /bin/bash github-runner
sudo usermod -aG docker github-runner

# 🔧 เปลี่ยนไปยัง runner user
sudo su - github-runner
```

### 2. ดาวน์โหลดและติดตั้ง GitHub Actions Runner

```bash
# 📂 สร้าง directory สำหรับ runner
mkdir -p ~/actions-runner && cd ~/actions-runner

# 📥 ดาวน์โหลด runner (ARM64 version)
curl -o actions-runner-linux-arm64-2.319.1.tar.gz -L \
  https://github.com/actions/runner/releases/download/v2.319.1/actions-runner-linux-arm64-2.319.1.tar.gz

# ✅ ตรวจสอบ checksum
echo "3f6efb7488a183e291fc2c62876e14c9ee732864173734facc85a1bfb1744464  actions-runner-linux-arm64-2.319.1.tar.gz" | shasum -a 256 -c

# 📦 แตกไฟล์
tar xzf ./actions-runner-linux-arm64-2.319.1.tar.gz
```

### 3. กำหนดค่า Runner

```bash
# ⚙️ กำหนดค่า runner
./config.sh --url https://github.com/YOUR_USERNAME/YOUR_REPO \
            --token YOUR_REGISTRATION_TOKEN \
            --name "safehost-pi" \
            --labels "self-hosted,safehost,linux,ARM64,raspberry-pi" \
            --work _work

# 🚀 ติดตั้งเป็น service
sudo ./svc.sh install github-runner
sudo ./svc.sh start
```

---

## 🔐 การจัดการ Environment Variables

### 🛡️ Secure Environment Setup

```bash
# 🔧 สร้าง secure directory สำหรับ deployments
sudo mkdir -p /opt/deployments/bun-line-t3
sudo chown github-runner:github-runner /opt/deployments/bun-line-t3
sudo chmod 700 /opt/deployments/bun-line-t3

# 🔐 สร้างไฟล์ .env.prod อย่างปลอดภัย
sudo -u github-runner nano /opt/deployments/bun-line-t3/.env.prod
```

### 📝 ตัวอย่าง `.env.prod` Template

```bash
# 🗄️ DATABASE CONFIGURATION
DATABASE_URL="mongodb://username:password@localhost:27017/bun-line-t3?authSource=admin"

# 🔐 AUTHENTICATION
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-super-secret-nextauth-secret-here"

# 📱 LINE BOT CONFIGURATION
LINE_CHANNEL_SECRET="your-line-channel-secret"
LINE_CHANNEL_ACCESS_TOKEN="your-line-channel-access-token"

# 🌐 API KEYS
AIRVISUAL_API_KEY="your-airvisual-api-key"
CMC_API_KEY="your-coinmarketcap-api-key"

# 🔧 APPLICATION CONFIGURATION
NODE_ENV="production"
PORT="12914"

# 🔐 SECURITY SETTINGS
ENCRYPTION_KEY="your-32-character-encryption-key"
HMAC_SECRET="your-hmac-secret-for-webhooks"

# 📊 MONITORING
LOG_LEVEL="info"
ENABLE_METRICS="true"
```

### 🔒 ตั้งค่า Permissions ที่ปลอดภัย

```bash
# 🔐 ตั้งค่า permissions อย่างปลอดภัย
sudo chmod 600 /opt/deployments/bun-line-t3/.env.prod
sudo chown github-runner:github-runner /opt/deployments/bun-line-t3/.env.prod

# ✅ ตรวจสอบ permissions
ls -la /opt/deployments/bun-line-t3/.env.prod
# ควรแสดง: -rw------- 1 github-runner github-runner
```

---

## 🛡️ การตั้งค่าความปลอดภัย

### 🔥 Firewall Configuration

```bash
# 🔧 ติดตั้งและกำหนดค่า UFW
sudo ufw enable
sudo ufw default deny incoming
sudo ufw default allow outgoing

# 🌐 เปิด ports ที่จำเป็น
sudo ufw allow ssh
sudo ufw allow 12914/tcp  # Application port
sudo ufw allow from 192.168.1.0/24  # Local network only

# ✅ ตรวจสอบสถานะ
sudo ufw status verbose
```

### 🔐 SSH Hardening

```bash
# 📝 แก้ไข SSH config
sudo nano /etc/ssh/sshd_config

# เพิ่มการตั้งค่าความปลอดภัย:
# PermitRootLogin no
# PasswordAuthentication no
# PubkeyAuthentication yes
# MaxAuthTries 3
# ClientAliveInterval 300
# ClientAliveCountMax 2

# 🔄 รีสตาร์ท SSH service
sudo systemctl restart sshd
```

### 🔍 Log Monitoring

```bash
# 📊 สร้าง log rotation สำหรับ runner
sudo nano /etc/logrotate.d/github-runner

# เนื้อหาไฟล์:
/home/github-runner/actions-runner/_diag/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    sharedscripts
}
```

---

## 📊 การ Monitoring และ Maintenance

### 🔍 Health Check Script

```bash
# 📝 สร้าง health check script
cat > /home/github-runner/check-runner-health.sh << 'EOF'
#!/bin/bash

# 🏥 GitHub Actions Runner Health Check
echo "🔍 Checking GitHub Actions Runner Health..."

# ✅ ตรวจสอบ service status
if systemctl is-active --quiet actions.runner.*.service; then
    echo "✅ Runner service is running"
else
    echo "❌ Runner service is not running"
    sudo systemctl restart actions.runner.*.service
fi

# 💾 ตรวจสอบ disk space
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 85 ]; then
    echo "⚠️  WARNING: Disk usage is high: ${DISK_USAGE}%"
    # 🧹 ทำความสะอาด Docker
    docker system prune -f
    docker image prune -a -f
fi

# 🧠 ตรวจสอบ memory
FREE_MEM=$(free -m | awk 'NR==2{printf "%.1f", $7/1024}')
echo "💾 Available Memory: ${FREE_MEM} GB"

# 🌡️ ตรวจสอบ temperature (Raspberry Pi)
if command -v vcgencmd &> /dev/null; then
    TEMP=$(vcgencmd measure_temp | cut -d= -f2 | cut -d\' -f1)
    echo "🌡️  CPU Temperature: ${TEMP}°C"
    if (( $(echo "$TEMP > 70" | bc -l) )); then
        echo "⚠️  WARNING: High CPU temperature!"
    fi
fi

echo "✅ Health check completed"
EOF

chmod +x /home/github-runner/check-runner-health.sh
```

### ⏰ Automated Maintenance

```bash
# 📅 เพิ่ม cron jobs สำหรับ maintenance
crontab -e

# เพิ่มบรรทัดต่อไปนี้:
# Health check ทุก 5 นาที
*/5 * * * * /home/github-runner/check-runner-health.sh >> /home/github-runner/health.log 2>&1

# ทำความสะอาด Docker ทุกวันเที่ยงคืน
0 0 * * * docker system prune -f >> /home/github-runner/cleanup.log 2>&1

# Backup logs ทุกสัปดาห์
0 0 * * 0 tar -czf /home/github-runner/logs-backup-$(date +\%Y\%m\%d).tar.gz /home/github-runner/actions-runner/_diag/
```

### 📊 Monitoring Dashboard

```bash
# 📝 สร้าง simple monitoring script
cat > /home/github-runner/runner-status.sh << 'EOF'
#!/bin/bash

echo "🤖 GitHub Actions Runner Status Dashboard"
echo "========================================"
echo "🕐 Time: $(date)"
echo ""

# 🔍 Service Status
echo "🔧 Service Status:"
systemctl status actions.runner.*.service --no-pager -l

echo ""
echo "💾 System Resources:"
echo "Memory: $(free -h | awk 'NR==2{printf "Used: %s/%s (%.2f%%)\n", $3,$2,$3*100/$2 }')"
echo "Disk: $(df -h / | awk 'NR==2{printf "Used: %s/%s (%s)\n", $3,$2,$5}')"

if command -v vcgencmd &> /dev/null; then
    echo "Temperature: $(vcgencmd measure_temp)"
fi

echo ""
echo "🐳 Docker Status:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "🌐 Network:"
docker network ls | grep yadom
EOF

chmod +x /home/github-runner/runner-status.sh
```

---

## 🚀 การใช้งาน Workflow

### ✅ Workflow จะทำงานอัตโนมัติเมื่อ:

1. **Push ไปยัง main branch** - จะรัน deployment อัตโนมัติ
2. **Manual trigger** - สามารถรันผ่าน GitHub Actions tab

### 🔍 การตรวจสอบ Deployment:

```bash
# 📊 ตรวจสอบสถานะ deployment
cd /home/github-runner/actions-runner/_work/YOUR_REPO/YOUR_REPO
./runner-status.sh

# 🏥 ตรวจสอบ application health
curl -f http://localhost:12914/api/health

# 📋 ดู logs ของ containers
docker-compose logs -f
```

---

## 🔧 Troubleshooting

### ❌ ปัญหาที่พบบ่อย:

**1. Runner ไม่สามารถเชื่อมต่อ GitHub**
```bash
# ตรวจสอบ network connectivity
ping github.com
curl -I https://api.github.com

# รีสตาร์ท runner service
sudo systemctl restart actions.runner.*.service
```

**2. Docker permission denied**
```bash
# ตรวจสอบ user ใน docker group
groups github-runner

# เพิ่ม user ใน docker group
sudo usermod -aG docker github-runner
sudo systemctl restart actions.runner.*.service
```

**3. Memory หรือ Storage เต็ม**
```bash
# ทำความสะอาด Docker
docker system prune -a -f
docker volume prune -f

# ลบ logs เก่า
find /home/github-runner/actions-runner/_diag/ -name "*.log" -mtime +7 -delete
```

---

## 📚 Additional Resources

- [GitHub Actions Self-Hosted Runners](https://docs.github.com/en/actions/hosting-your-own-runners)
- [Docker Security Best Practices](https://docs.docker.com/engine/security/)
- [Raspberry Pi Performance Optimization](https://www.raspberrypi.org/documentation/configuration/)

---

**🔐 Security Note**: อย่าลืมเปลี่ยน default passwords และอัปเดตระบบเป็นประจำเพื่อความปลอดภัย!
