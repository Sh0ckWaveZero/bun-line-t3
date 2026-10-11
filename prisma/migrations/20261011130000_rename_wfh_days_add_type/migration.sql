ALTER TABLE "wfh_days" RENAME TO "work_mode_days";
ALTER TABLE "work_mode_days" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'wfh';
ALTER TABLE "work_mode_days" RENAME CONSTRAINT "wfh_days_user_id_fkey" TO "work_mode_days_user_id_fkey";
ALTER INDEX "wfh_days_user_id_date_key" RENAME TO "work_mode_days_user_id_date_key";
ALTER INDEX "wfh_days_date_is_active_idx" RENAME TO "work_mode_days_date_is_active_idx";
