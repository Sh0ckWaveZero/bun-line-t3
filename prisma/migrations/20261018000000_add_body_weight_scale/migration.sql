-- Body Weight: รับข้อมูลจากตาชั่ง Xiaomi Mi Body Composition Scale 2 ผ่าน webhook ของ miscale-dashboard
CREATE TABLE "scale_profiles" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "height_cm" DOUBLE PRECISION,
  "birth_date" TIMESTAMP(3),
  "male" BOOLEAN NOT NULL DEFAULT true,
  "upstream_name" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "scale_profiles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "scale_profiles_upstream_name_key" ON "scale_profiles"("upstream_name");

CREATE TABLE "scale_measurements" (
  "id" TEXT NOT NULL,
  "profile_id" TEXT,
  "upstream_id" INTEGER,
  "weight_kg" DOUBLE PRECISION NOT NULL,
  "impedance" INTEGER,
  "measured_at" TIMESTAMP(3) NOT NULL,
  "metrics" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "scale_measurements_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "scale_measurements_upstream_id_key" ON "scale_measurements"("upstream_id");
CREATE INDEX "scale_measurements_measured_at_idx" ON "scale_measurements"("measured_at");
CREATE INDEX "scale_measurements_profile_id_measured_at_idx" ON "scale_measurements"("profile_id", "measured_at");
ALTER TABLE "scale_measurements" ADD CONSTRAINT "scale_measurements_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "scale_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
