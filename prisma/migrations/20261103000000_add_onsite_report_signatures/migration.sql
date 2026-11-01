-- ลายเซ็นบนรายงาน Onsite Service Report (รูปภาพ ฝั่งบริษัท/ลูกค้า) — แสดงเหนือเส้นเซ็นใน PDF
CREATE TABLE "onsite_report_signatures" (
  "report_id" TEXT NOT NULL,
  "party" TEXT NOT NULL,
  "mime_type" TEXT NOT NULL,
  "data" BYTEA NOT NULL,
  "width" INTEGER NOT NULL,
  "height" INTEGER NOT NULL,
  "signed_by_id" TEXT,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "onsite_report_signatures_pkey" PRIMARY KEY ("report_id", "party"),
  CONSTRAINT "onsite_report_signatures_party_check" CHECK ("party" IN ('COMPANY', 'CLIENT'))
);

-- ลบรายงาน → ลายเซ็นถูกลบตาม
ALTER TABLE "onsite_report_signatures"
  ADD CONSTRAINT "onsite_report_signatures_report_id_fkey"
  FOREIGN KEY ("report_id") REFERENCES "onsite_service_reports"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
