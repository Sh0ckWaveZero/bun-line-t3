-- CreateTable
CREATE TABLE "cron_jobs" (
    "id" TEXT NOT NULL,
    "job_key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "cron_expression" TEXT NOT NULL,
    "schedule_label" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Bangkok',
    "environment" TEXT NOT NULL DEFAULT 'production',
    "target_name" TEXT NOT NULL,
    "target_kind" TEXT NOT NULL,
    "owner_name" TEXT NOT NULL,
    "owner_initials" TEXT NOT NULL,
    "owner_color" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cron_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cron_job_executions" (
    "id" TEXT NOT NULL,
    "cron_job_id" TEXT NOT NULL,
    "scheduled_for" TIMESTAMP(3),
    "trigger" TEXT NOT NULL DEFAULT 'scheduled',
    "status" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL,
    "finished_at" TIMESTAMP(3),
    "duration_ms" INTEGER,
    "http_status" INTEGER,
    "message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cron_job_executions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cron_jobs_job_key_key" ON "cron_jobs"("job_key");

-- CreateIndex
CREATE INDEX "cron_jobs_enabled_idx" ON "cron_jobs"("enabled");

-- CreateIndex
CREATE INDEX "cron_jobs_environment_enabled_idx" ON "cron_jobs"("environment", "enabled");

-- CreateIndex
CREATE UNIQUE INDEX "cron_job_executions_cron_job_id_scheduled_for_key" ON "cron_job_executions"("cron_job_id", "scheduled_for");

-- CreateIndex
CREATE INDEX "cron_job_executions_cron_job_id_started_at_idx" ON "cron_job_executions"("cron_job_id", "started_at");

-- CreateIndex
CREATE INDEX "cron_job_executions_status_started_at_idx" ON "cron_job_executions"("status", "started_at");

-- AddForeignKey
ALTER TABLE "cron_job_executions" ADD CONSTRAINT "cron_job_executions_cron_job_id_fkey" FOREIGN KEY ("cron_job_id") REFERENCES "cron_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed the schedules currently deployed by the container cron worker.
INSERT INTO "cron_jobs" (
    "id", "job_key", "name", "method", "endpoint", "cron_expression",
    "schedule_label", "timezone", "environment", "target_name", "target_kind",
    "owner_name", "owner_initials", "owner_color", "enabled", "created_at", "updated_at"
) VALUES
    ('cron_seed_check_in_reminder', 'check-in-reminder', 'แจ้งเตือนเข้างาน', 'GET', '/api/cron/check-in-reminder', '0 8 * * 1-5', '08:00 จันทร์–ศุกร์', 'Asia/Bangkok', 'production', 'LINE Messaging', 'notifications', 'ระบบลงเวลา', 'SYS', '#0f9f72', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('cron_seed_enhanced_checkout', 'enhanced-checkout-reminder', 'แจ้งเตือนออกงานแบบเฉพาะบุคคล', 'GET', '/api/cron/enhanced-checkout-reminder', '*/5 16-20 * * 1-5', 'ทุก 5 นาที · 16:00–20:59', 'Asia/Bangkok', 'production', 'LINE Messaging', 'notifications', 'ระบบลงเวลา', 'SYS', '#0f9f72', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('cron_seed_auto_checkout', 'auto-checkout', 'ลงชื่อออกงานอัตโนมัติ', 'GET', '/api/cron/auto-checkout', '0 0 * * *', 'เที่ยงคืนทุกวัน', 'Asia/Bangkok', 'production', 'Work attendance', 'attendance', 'ระบบลงเวลา', 'SYS', '#0f9f72', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('cron_seed_image_cleanup', 'image-cleanup', 'ล้างไฟล์รูปชั่วคราว', 'POST', '/api/cron/image-cleanup', '0 */2 * * *', 'ทุก 2 ชั่วโมง', 'Asia/Bangkok', 'production', 'Temporary chart files', 'storage', 'ระบบจัดเก็บไฟล์', 'SYS', '#64748b', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("job_key") DO NOTHING;
