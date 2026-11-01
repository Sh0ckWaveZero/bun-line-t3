-- สิทธิ์ใช้งาน Onsite Service Report (แอดมินติ๊กในหน้า LINE permissions) — เริ่มต้นไม่มีสิทธิ์ทุกคน
ALTER TABLE "line_approval_requests"
  ADD COLUMN "can_use_onsite_report" BOOLEAN NOT NULL DEFAULT false;
