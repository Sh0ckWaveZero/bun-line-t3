-- Body Weight: เลือกเครื่องที่รับสัญญาณตาชั่ง (Pi / เครื่อง dev / ปิด) จากหน้า /body-weight
-- มีแถวเดียว (id = 'default') — ไม่มีแถว = รับจากทุกเครื่อง
CREATE TABLE "scale_settings" (
  "id" TEXT NOT NULL DEFAULT 'default',
  "active_listener" TEXT NOT NULL DEFAULT 'all',
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "scale_settings_pkey" PRIMARY KEY ("id")
);
