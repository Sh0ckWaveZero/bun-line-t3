-- AlterTable
ALTER TABLE "user_settings" ADD COLUMN     "hide_amounts_line_group" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hide_amounts_line_personal" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hide_amounts_web" BOOLEAN NOT NULL DEFAULT false;
