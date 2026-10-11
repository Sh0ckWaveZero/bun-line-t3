CREATE TABLE "dca_webhook_receipts" (
  "webhook_event_id" TEXT NOT NULL,
  "line_user_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "dca_webhook_receipts_pkey" PRIMARY KEY ("webhook_event_id")
);

ALTER TABLE "line_approval_requests" ADD COLUMN "can_auto_record_dca" BOOLEAN NOT NULL DEFAULT false;
