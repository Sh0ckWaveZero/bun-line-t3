-- บริษัทผู้ออกเอกสารของ Onsite Service Report แบบ dynamic (แทนรายชื่อบริษัทที่เคย hardcode ในโค้ด)
-- รวมชื่อบริษัท + โลโก้ไว้ตารางเดียว และแทนที่ onsite_report_logos

CREATE TABLE "onsite_report_companies" (
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "logo_data" BYTEA,
  "logo_mime_type" TEXT,
  "logo_width" INTEGER,
  "logo_height" INTEGER,
  "logo_updated_at" TIMESTAMP(3),
  "logo_updated_by_id" TEXT,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "onsite_report_companies_pkey" PRIMARY KEY ("code")
);

-- seed จากข้อมูลที่มีอยู่จริง: ทุก code ที่ถูกรายงานหรือตารางโลโก้เดิมอ้างอิง ต้องมีแถวบริษัท
-- ไม่ระบุชื่อบริษัทในไฟล์นี้ (ไม่เก็บชื่อแบรนด์ใน git) — ใช้ code เป็นชื่อชั่วคราว แล้วแอดมินแก้ชื่อที่ /admin/onsite-report-companies
-- updated_at ต้องใส่เอง เพราะ @updatedAt ไม่มี DB default
INSERT INTO "onsite_report_companies" ("code", "name", "sort_order", "updated_at")
SELECT
  c."company",
  c."company",
  (ROW_NUMBER() OVER (ORDER BY c."company"))::INTEGER,
  CURRENT_TIMESTAMP
FROM (
  SELECT "company" FROM "onsite_service_reports"
  UNION
  SELECT "company" FROM "onsite_report_logos"
) AS c;

-- ย้ายโลโก้ที่อัปโหลดไว้แล้วจากตารางเดิม (ถ้ามี)
UPDATE "onsite_report_companies" AS c
SET "logo_data" = l."data",
    "logo_mime_type" = l."mime_type",
    "logo_width" = l."width",
    "logo_height" = l."height",
    "logo_updated_at" = l."updated_at",
    "logo_updated_by_id" = l."updated_by_id"
FROM "onsite_report_logos" AS l
WHERE l."company" = c."code";

DROP TABLE "onsite_report_logos";

-- FK: บริษัทที่มีรายงานอ้างอิงอยู่ลบจริงไม่ได้ (ให้ปิดใช้งานแทน)
ALTER TABLE "onsite_service_reports"
  ADD CONSTRAINT "onsite_service_reports_company_fkey"
  FOREIGN KEY ("company") REFERENCES "onsite_report_companies"("code")
  ON DELETE RESTRICT ON UPDATE CASCADE;
