-- Seed แจ้งเตือนเงินทุน DCA: ตรวจยอดเงินบาทใน Bitkub ทุกวัน 08:05 แล้ว push LINE ถ้าต่ำกว่า 108 บาท
INSERT INTO "cron_jobs" (
    "id", "job_key", "name", "method", "endpoint", "cron_expression",
    "schedule_label", "timezone", "environment", "target_name", "target_kind",
    "owner_name", "owner_initials", "owner_color", "enabled", "created_at", "updated_at"
) VALUES
    ('cron_seed_dca_balance_alert', 'dca-balance-alert', 'แจ้งเตือนเงินทุน DCA', 'GET', '/api/cron/dca-balance-alert', '5 8 * * *', '08:05 ทุกวัน', 'Asia/Bangkok', 'production', 'LINE Messaging', 'notifications', 'ระบบ DCA', 'DCA', '#f59e0b', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("job_key") DO NOTHING;
