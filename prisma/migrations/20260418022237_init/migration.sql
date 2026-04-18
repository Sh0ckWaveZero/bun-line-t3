-- CreateEnum
CREATE TYPE "AttendanceStatusType" AS ENUM ('CHECKED_IN_ON_TIME', 'CHECKED_IN_LATE', 'CHECKED_OUT', 'AUTO_CHECKOUT_MIDNIGHT', 'LEAVE');

-- CreateEnum
CREATE TYPE "SubscriptionService" AS ENUM ('YOUTUBE', 'YOUTUBE_MUSIC', 'SPOTIFY', 'APPLE_MUSIC', 'NETFLIX', 'APPLE_TV', 'HBO_MAX', 'TWITCH', 'STEAM', 'PLAYSTATION', 'ICLOUD', 'LINE', 'GOOGLE_TV', 'OTHER');

-- CreateEnum
CREATE TYPE "SubscriptionPlanType" AS ENUM ('INDIVIDUAL', 'FAMILY');

-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'SKIPPED');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('WALKING', 'RUNNING', 'CYCLING', 'SWIMMING', 'WORKOUT', 'YOGA', 'OTHER');

-- CreateEnum
CREATE TYPE "DcaStatus" AS ENUM ('SUCCESS', 'FAILED', 'PENDING');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verifications" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cmc" (
    "id" TEXT NOT NULL,
    "no" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cmc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_attendance" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "check_in_time" TIMESTAMP(3) NOT NULL,
    "check_out_time" TIMESTAMP(3),
    "work_date" TEXT NOT NULL,
    "status" "AttendanceStatusType" NOT NULL DEFAULT 'CHECKED_IN_ON_TIME',
    "hours_worked" DOUBLE PRECISION,
    "leave_id" TEXT,
    "reminder_sent_10min" BOOLEAN NOT NULL DEFAULT false,
    "reminder_sent_final" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public_holidays" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "name_english" TEXT NOT NULL,
    "name_thai" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'national',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "public_holidays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leaves" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'personal',
    "reason" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leaves_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_settings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "enable_checkin_reminders" BOOLEAN NOT NULL DEFAULT true,
    "enable_checkout_reminders" BOOLEAN NOT NULL DEFAULT true,
    "enable_holiday_notifications" BOOLEAN NOT NULL DEFAULT false,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Bangkok',
    "language" TEXT NOT NULL DEFAULT 'th',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "service" "SubscriptionService" NOT NULL,
    "plan_type" "SubscriptionPlanType" NOT NULL DEFAULT 'INDIVIDUAL',
    "billing_cycle" "BillingCycle" NOT NULL DEFAULT 'MONTHLY',
    "total_price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'THB',
    "billing_day" INTEGER NOT NULL,
    "owner_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "logo_url" TEXT,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_members" (
    "id" TEXT NOT NULL,
    "subscription_id" TEXT NOT NULL,
    "user_id" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "share_amount" DOUBLE PRECISION NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" TIMESTAMP(3),
    "note" TEXT,
    "tags" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_payments" (
    "id" TEXT NOT NULL,
    "subscription_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "billing_month" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paid_at" TIMESTAMP(3),
    "due_date" TIMESTAMP(3) NOT NULL,
    "paid_by" TEXT,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "health_activities" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "activity_type" "ActivityType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "duration" DOUBLE PRECISION NOT NULL,
    "distance" DOUBLE PRECISION,
    "calories" DOUBLE PRECISION,
    "steps" INTEGER,
    "heart_rate" JSONB,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "health_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "health_metrics" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "weight" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "bmi" DOUBLE PRECISION,
    "body_fat" DOUBLE PRECISION,
    "blood_pressure" JSONB,
    "resting_heart_rate" INTEGER,
    "sleep_hours" DOUBLE PRECISION,
    "water_intake" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "health_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dca_orders" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "line_user_id" TEXT NOT NULL,
    "coin" TEXT NOT NULL DEFAULT 'BTC',
    "amount_thb" DOUBLE PRECISION NOT NULL,
    "coin_received" DOUBLE PRECISION NOT NULL,
    "price_per_coin" DOUBLE PRECISION NOT NULL,
    "round" INTEGER NOT NULL,
    "status" "DcaStatus" NOT NULL DEFAULT 'SUCCESS',
    "note" TEXT,
    "executed_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dca_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "line_approval_requests" (
    "id" TEXT NOT NULL,
    "line_user_id" TEXT NOT NULL,
    "login_line_user_id" TEXT,
    "display_name" TEXT,
    "picture_url" TEXT,
    "status_message" TEXT,
    "reason" TEXT,
    "reject_reason" TEXT,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "notified_at" TIMESTAMP(3),
    "can_request_attendance_report" BOOLEAN NOT NULL DEFAULT false,
    "can_request_leave" BOOLEAN NOT NULL DEFAULT false,
    "can_receive_reminders" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "line_approval_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "accounts_userId_idx" ON "accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_providerId_accountId_key" ON "accounts"("providerId", "accountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "verifications_identifier_idx" ON "verifications"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "work_attendance_user_id_work_date_key" ON "work_attendance"("user_id", "work_date");

-- CreateIndex
CREATE UNIQUE INDEX "public_holidays_date_key" ON "public_holidays"("date");

-- CreateIndex
CREATE INDEX "public_holidays_year_is_active_idx" ON "public_holidays"("year", "is_active");

-- CreateIndex
CREATE INDEX "public_holidays_date_is_active_idx" ON "public_holidays"("date", "is_active");

-- CreateIndex
CREATE INDEX "leaves_user_id_date_is_active_idx" ON "leaves"("user_id", "date", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_user_id_key" ON "user_settings"("user_id");

-- CreateIndex
CREATE INDEX "subscriptions_owner_id_is_active_idx" ON "subscriptions"("owner_id", "is_active");

-- CreateIndex
CREATE INDEX "subscriptions_service_is_active_idx" ON "subscriptions"("service", "is_active");

-- CreateIndex
CREATE INDEX "subscription_members_subscription_id_is_active_idx" ON "subscription_members"("subscription_id", "is_active");

-- CreateIndex
CREATE INDEX "subscription_payments_subscription_id_billing_month_idx" ON "subscription_payments"("subscription_id", "billing_month");

-- CreateIndex
CREATE INDEX "subscription_payments_member_id_status_idx" ON "subscription_payments"("member_id", "status");

-- CreateIndex
CREATE INDEX "subscription_payments_billing_month_status_idx" ON "subscription_payments"("billing_month", "status");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_payments_member_id_billing_month_key" ON "subscription_payments"("member_id", "billing_month");

-- CreateIndex
CREATE INDEX "health_activities_user_id_date_idx" ON "health_activities"("user_id", "date");

-- CreateIndex
CREATE INDEX "health_activities_user_id_activity_type_idx" ON "health_activities"("user_id", "activity_type");

-- CreateIndex
CREATE UNIQUE INDEX "health_metrics_user_id_date_key" ON "health_metrics"("user_id", "date");

-- CreateIndex
CREATE INDEX "dca_orders_order_id_idx" ON "dca_orders"("order_id");

-- CreateIndex
CREATE INDEX "dca_orders_line_user_id_executed_at_idx" ON "dca_orders"("line_user_id", "executed_at");

-- CreateIndex
CREATE INDEX "dca_orders_coin_executed_at_idx" ON "dca_orders"("coin", "executed_at");

-- CreateIndex
CREATE INDEX "dca_orders_round_idx" ON "dca_orders"("round");

-- CreateIndex
CREATE UNIQUE INDEX "dca_orders_line_user_id_coin_executed_at_key" ON "dca_orders"("line_user_id", "coin", "executed_at");

-- CreateIndex
CREATE UNIQUE INDEX "line_approval_requests_line_user_id_key" ON "line_approval_requests"("line_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "line_approval_requests_login_line_user_id_key" ON "line_approval_requests"("login_line_user_id");

-- CreateIndex
CREATE INDEX "line_approval_requests_status_idx" ON "line_approval_requests"("status");

-- CreateIndex
CREATE INDEX "line_approval_requests_line_user_id_status_idx" ON "line_approval_requests"("line_user_id", "status");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_attendance" ADD CONSTRAINT "work_attendance_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_attendance" ADD CONSTRAINT "work_attendance_leave_id_fkey" FOREIGN KEY ("leave_id") REFERENCES "leaves"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leaves" ADD CONSTRAINT "leaves_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_members" ADD CONSTRAINT "subscription_members_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_payments" ADD CONSTRAINT "subscription_payments_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_payments" ADD CONSTRAINT "subscription_payments_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "subscription_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
