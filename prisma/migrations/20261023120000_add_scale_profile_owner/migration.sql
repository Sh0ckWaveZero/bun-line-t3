ALTER TABLE "scale_profiles" ADD COLUMN "user_id" TEXT;
CREATE INDEX "scale_profiles_user_id_idx" ON "scale_profiles"("user_id");
ALTER TABLE "scale_profiles" ADD CONSTRAINT "scale_profiles_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
