-- โลโก้บริษัทสำหรับหัว PDF ของ Onsite Service Report (เก็บใน DB แทน git — เป็นทรัพย์สินแบรนด์)
CREATE TABLE "onsite_report_logos" (
  "company" TEXT NOT NULL,
  "mime_type" TEXT NOT NULL,
  "data" BYTEA NOT NULL,
  "width" INTEGER NOT NULL,
  "height" INTEGER NOT NULL,
  "updated_by_id" TEXT,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "onsite_report_logos_pkey" PRIMARY KEY ("company")
);
