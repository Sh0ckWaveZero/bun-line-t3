-- Onsite Service Report (FM-PM-01) — รายงานเข้าบริการหน้างาน (กรอกบนเว็บ แล้วสร้าง PDF)
CREATE TABLE "onsite_service_reports" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "company" TEXT NOT NULL,
  "doc_no" TEXT NOT NULL,
  "revision" TEXT NOT NULL DEFAULT '-1',
  "client_name" TEXT NOT NULL,
  "project_code" TEXT NOT NULL,
  "onsite_date" TEXT NOT NULL,
  "time_start" DOUBLE PRECISION,
  "time_end" DOUBLE PRECISION,
  "phase" TEXT,
  "main_contact" TEXT NOT NULL,
  "execution_team" TEXT NOT NULL,
  "objective" TEXT NOT NULL,
  "action_item" TEXT NOT NULL,
  "pending_note" TEXT,
  "next_actions" JSONB,
  "attendees" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "onsite_service_reports_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "onsite_service_reports_user_id_onsite_date_idx" ON "onsite_service_reports"("user_id", "onsite_date");

ALTER TABLE "onsite_service_reports" ADD CONSTRAINT "onsite_service_reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
