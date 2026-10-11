CREATE TABLE "wfh_days" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "date" TEXT NOT NULL,
  "note" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "wfh_days_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "wfh_days_user_id_date_key" ON "wfh_days"("user_id", "date");
CREATE INDEX "wfh_days_date_is_active_idx" ON "wfh_days"("date", "is_active");

ALTER TABLE "wfh_days" ADD CONSTRAINT "wfh_days_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
