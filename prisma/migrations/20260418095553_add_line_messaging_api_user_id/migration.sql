-- Add lineMessagingApiUserId field to accounts table
-- This field stores the LINE Messaging API user ID separately from LINE Login user ID
-- to support proper 1 LINE user per 1 user mapping

ALTER TABLE "accounts"
ADD COLUMN "line_messaging_api_user_id" TEXT;

-- Create unique constraint to ensure 1 LINE Messaging API user maps to only 1 account
CREATE UNIQUE INDEX "accounts_line_messaging_api_user_id_key" ON "accounts"("line_messaging_api_user_id");

-- Create index for faster lookups by LINE Messaging API user ID
CREATE INDEX "accounts_line_messaging_api_user_id_idx" ON "accounts"("line_messaging_api_user_id");
