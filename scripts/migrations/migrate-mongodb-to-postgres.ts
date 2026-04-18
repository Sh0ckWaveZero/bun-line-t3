#!/usr/bin/env bun
/**
 * migrate-mongodb-to-postgres.ts
 *
 * ย้ายข้อมูลทั้งหมดจาก MongoDB → PostgreSQL
 *
 * Usage:
 *   MONGODB_URL="mongodb+srv://..." bun scripts/migrate-mongodb-to-postgres.ts
 *   MONGODB_URL="..." DRY_RUN=1 bun scripts/migrate-mongodb-to-postgres.ts        # ทดสอบโดยไม่ write
 *   MONGODB_URL="..." COLLECTIONS=users,accounts bun scripts/migrate-mongodb-to-postgres.ts  # เลือก collection
 *
 * ENV vars:
 *   MONGODB_URL   - MongoDB connection string (required)
 *   DATABASE_URL  - PostgreSQL connection string (from .env.local)
 *   DRY_RUN       - "1" = อ่านอย่างเดียว ไม่ write
 *   COLLECTIONS   - comma-separated list ถ้าต้องการ migrate บาง collection
 *   BATCH_SIZE    - จำนวน docs ต่อ batch (default: 100)
 */

import { MongoClient, type Db, type Document } from "mongodb";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// ─── Config ────────────────────────────────────────────────────────────────

const MONGODB_URL = process.env.MONGODB_URL;
const DRY_RUN = process.env.DRY_RUN === "1";
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE ?? "100", 10);
const ONLY_COLLECTIONS = process.env.COLLECTIONS
  ? process.env.COLLECTIONS.split(",").map((s) => s.trim())
  : null;

if (!MONGODB_URL) {
  console.error("❌ MONGODB_URL is required");
  console.error(
    '   MONGODB_URL="mongodb+srv://..." bun scripts/migrate-mongodb-to-postgres.ts',
  );
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL (PostgreSQL) is not set in .env.local");
  process.exit(1);
}

// ─── Helpers ───────────────────────────────────────────────────────────────

/** แปลง ObjectId หรือ string ให้เป็น string เสมอ */
function toStr(v: unknown): string {
  if (!v) return "";
  if (typeof v === "object" && v !== null && "toHexString" in v) {
    return (v as { toHexString(): string }).toHexString();
  }
  return String(v);
}

/** แปลง ObjectId → string, null-safe */
function toId(v: unknown): string | null {
  if (v == null) return null;
  return toStr(v);
}

/** แปลง Date / ISOString → Date, null-safe */
function toDate(v: unknown): Date | null {
  if (v == null) return null;
  if (v instanceof Date) return v;
  const d = new Date(v as string);
  return isNaN(d.getTime()) ? null : d;
}

function toDateRequired(v: unknown): Date {
  return toDate(v) ?? new Date();
}

/** อ่าน cursor แบบ batch */
async function* batchCursor<T extends Document>(
  db: Db,
  collection: string,
  batchSize: number,
): AsyncGenerator<T[]> {
  const cursor = db.collection<T>(collection).find({});
  let batch: T[] = [];
  for await (const doc of cursor) {
    batch.push(doc);
    if (batch.length >= batchSize) {
      yield batch;
      batch = [];
    }
  }
  if (batch.length > 0) yield batch;
}

// ─── Logger ────────────────────────────────────────────────────────────────

let totalMigrated = 0;
let totalSkipped = 0;
let totalErrors = 0;

function log(msg: string) {
  console.log(msg);
}

function logCollection(name: string, total: number) {
  console.log(`\n${"─".repeat(60)}`);
  console.log(`📦  ${name}  (${total} documents)`);
  console.log("─".repeat(60));
}

function logBatch(inserted: number, orphaned: number) {
  if (orphaned > 0) {
    process.stdout.write(`  ✓ +${inserted} inserted, ~${orphaned} orphaned\r`);
  } else {
    process.stdout.write(`  ✓ +${inserted} inserted\r`);
  }
}

// ─── Collection Migrations ─────────────────────────────────────────────────

async function migrateUsers(db: Db, pg: PrismaClient) {
  const total = await db.collection("users").countDocuments();
  logCollection("users", total);
  if (total === 0) return;

  for await (const batch of batchCursor(db, "users", BATCH_SIZE)) {
    const data = batch.map((doc) => ({
      id: toStr(doc._id),
      name: doc.name ?? "Unknown",
      email: doc.email ?? `unknown-${toStr(doc._id)}@unknown.local`,
      emailVerified: doc.emailVerified ?? false,
      image: doc.image ?? null,
      role: doc.role ?? "user",
      createdAt: toDateRequired(doc.createdAt),
      updatedAt: toDateRequired(doc.updatedAt),
    }));

    if (!DRY_RUN) {
      await (pg as any).user.createMany({ data, skipDuplicates: true });
    }
    totalMigrated += data.length;
    logBatch(data.length, 0);
  }
  console.log();
}

async function migrateAccounts(db: Db, pg: PrismaClient) {
  const total = await db.collection("accounts").countDocuments();
  logCollection("accounts", total);
  if (total === 0) return;

  const validUserIds = new Set(
    (await (pg as any).user.findMany({ select: { id: true } })).map((u: any) => u.id as string),
  );
  let totalOrphaned = 0;

  for await (const batch of batchCursor(db, "accounts", BATCH_SIZE)) {
    const mapped = batch.map((doc) => ({
      id: toStr(doc._id),
      accountId: doc.accountId ?? doc.providerAccountId ?? toStr(doc._id),
      providerId: doc.providerId ?? doc.provider ?? "unknown",
      userId: toStr(doc.userId ?? doc.user_id),
      accessToken: doc.accessToken ?? null,
      refreshToken: doc.refreshToken ?? null,
      idToken: doc.idToken ?? null,
      accessTokenExpiresAt: toDate(doc.accessTokenExpiresAt),
      refreshTokenExpiresAt: toDate(doc.refreshTokenExpiresAt),
      scope: doc.scope ?? null,
      password: doc.password ?? null,
      createdAt: toDateRequired(doc.createdAt),
      updatedAt: toDateRequired(doc.updatedAt),
    }));

    const data = mapped.filter((r) => validUserIds.has(r.userId));
    const orphaned = mapped.length - data.length;
    totalOrphaned += orphaned;

    if (data.length === 0) continue;
    if (!DRY_RUN) {
      await (pg as any).account.createMany({ data, skipDuplicates: true });
    }
    totalMigrated += data.length;
    logBatch(data.length, orphaned);
  }
  if (totalOrphaned > 0) log(`  ⚠️  Skipped ${totalOrphaned} orphaned records (userId not in users)`);
  console.log();
}

async function migrateSessions(db: Db, pg: PrismaClient) {
  const total = await db.collection("sessions").countDocuments();
  logCollection("sessions", total);
  if (total === 0) return;

  const validUserIds = new Set(
    (await (pg as any).user.findMany({ select: { id: true } })).map((u: any) => u.id as string),
  );
  const now = new Date();
  let expiredSkipped = 0;
  let totalOrphaned = 0;

  for await (const batch of batchCursor(db, "sessions", BATCH_SIZE)) {
    // ข้าม session ที่หมดอายุแล้ว
    const notExpired = batch.filter((doc) => {
      const exp = toDate(doc.expiresAt);
      return exp && exp > now;
    });
    expiredSkipped += batch.length - notExpired.length;

    if (notExpired.length === 0) continue;

    const mapped = notExpired.map((doc) => ({
      id: toStr(doc._id),
      token: doc.token ?? toStr(doc._id),
      userId: toStr(doc.userId ?? doc.user_id),
      expiresAt: toDateRequired(doc.expiresAt),
      ipAddress: doc.ipAddress ?? null,
      userAgent: doc.userAgent ?? null,
      createdAt: toDateRequired(doc.createdAt),
      updatedAt: toDateRequired(doc.updatedAt),
    }));

    const data = mapped.filter((r) => validUserIds.has(r.userId));
    const orphaned = mapped.length - data.length;
    totalOrphaned += orphaned;

    if (data.length === 0) continue;
    if (!DRY_RUN) {
      await (pg as any).session.createMany({ data, skipDuplicates: true });
    }
    totalMigrated += data.length;
    totalSkipped += expiredSkipped;
    logBatch(data.length, expiredSkipped + orphaned);
  }
  console.log(`  ℹ️  ${expiredSkipped} expired sessions skipped`);
  if (totalOrphaned > 0) log(`  ⚠️  Skipped ${totalOrphaned} orphaned records (userId not in users)`);
}

async function migrateVerifications(db: Db, pg: PrismaClient) {
  const total = await db.collection("verifications").countDocuments();
  logCollection("verifications", total);
  if (total === 0) return;

  const now = new Date();

  for await (const batch of batchCursor(db, "verifications", BATCH_SIZE)) {
    const valid = batch.filter((doc) => {
      const exp = toDate(doc.expiresAt);
      return exp && exp > now;
    });

    if (valid.length === 0) continue;

    const data = valid.map((doc) => ({
      id: toStr(doc._id),
      identifier: doc.identifier ?? "",
      value: doc.value ?? "",
      expiresAt: toDateRequired(doc.expiresAt),
      createdAt: toDateRequired(doc.createdAt),
      updatedAt: toDateRequired(doc.updatedAt),
    }));

    if (!DRY_RUN) {
      await (pg as any).verification.createMany({ data, skipDuplicates: true });
    }
    totalMigrated += data.length;
    logBatch(data.length, 0);
  }
  console.log();
}

async function migrateCmc(db: Db, pg: PrismaClient) {
  const total = await db.collection("cmc").countDocuments();
  logCollection("cmc", total);
  if (total === 0) return;

  for await (const batch of batchCursor(db, "cmc", BATCH_SIZE)) {
    const data = batch.map((doc) => ({
      id: toStr(doc._id),
      no: doc.no ?? 0,
      name: doc.name ?? "",
      symbol: doc.symbol ?? "",
      slug: doc.slug ?? "",
      createdAt: toDateRequired(doc.createdAt),
      updatedAt: toDateRequired(doc.updatedAt),
    }));

    if (!DRY_RUN) {
      await (pg as any).cmc.createMany({ data, skipDuplicates: true });
    }
    totalMigrated += data.length;
    logBatch(data.length, 0);
  }
  console.log();
}

async function migratePublicHolidays(db: Db, pg: PrismaClient) {
  const total = await db.collection("public_holidays").countDocuments();
  logCollection("public_holidays", total);
  if (total === 0) return;

  for await (const batch of batchCursor(db, "public_holidays", BATCH_SIZE)) {
    const data = batch.map((doc) => ({
      id: toStr(doc._id),
      date: doc.date ?? doc.date_str ?? "",
      nameEnglish: doc.name_english ?? doc.nameEnglish ?? "",
      nameThai: doc.name_thai ?? doc.nameThai ?? "",
      year: doc.year ?? new Date(doc.date ?? Date.now()).getFullYear(),
      type: doc.type ?? "national",
      isActive: doc.is_active ?? doc.isActive ?? true,
      description: doc.description ?? null,
      createdAt: toDateRequired(doc.created_at ?? doc.createdAt),
      updatedAt: toDateRequired(doc.updated_at ?? doc.updatedAt),
    }));

    if (!DRY_RUN) {
      await (pg as any).publicHoliday.createMany({ data, skipDuplicates: true });
    }
    totalMigrated += data.length;
    logBatch(data.length, 0);
  }
  console.log();
}

async function migrateLeaves(db: Db, pg: PrismaClient) {
  const total = await db.collection("leaves").countDocuments();
  logCollection("leaves", total);
  if (total === 0) return;

  const validUserIds = new Set(
    (await (pg as any).user.findMany({ select: { id: true } })).map((u: any) => u.id as string),
  );
  let totalOrphaned = 0;

  for await (const batch of batchCursor(db, "leaves", BATCH_SIZE)) {
    const mapped = batch.map((doc) => ({
      id: toStr(doc._id),
      userId: toStr(doc.user_id ?? doc.userId),
      date: doc.date ?? "",
      type: doc.type ?? "personal",
      reason: doc.reason ?? null,
      isActive: doc.is_active ?? doc.isActive ?? true,
      createdAt: toDateRequired(doc.created_at ?? doc.createdAt),
      updatedAt: toDateRequired(doc.updated_at ?? doc.updatedAt),
    }));

    const data = mapped.filter((r) => validUserIds.has(r.userId));
    const orphaned = mapped.length - data.length;
    totalOrphaned += orphaned;

    if (data.length === 0) continue;
    if (!DRY_RUN) {
      await (pg as any).leave.createMany({ data, skipDuplicates: true });
    }
    totalMigrated += data.length;
    logBatch(data.length, orphaned);
  }
  if (totalOrphaned > 0) log(`  ⚠️  Skipped ${totalOrphaned} orphaned records (userId not in users)`);
  console.log();
}

async function migrateUserSettings(db: Db, pg: PrismaClient) {
  const total = await db.collection("user_settings").countDocuments();
  logCollection("user_settings", total);
  if (total === 0) return;

  const validUserIds = new Set(
    (await (pg as any).user.findMany({ select: { id: true } })).map((u: any) => u.id as string),
  );
  let totalOrphaned = 0;

  for await (const batch of batchCursor(db, "user_settings", BATCH_SIZE)) {
    const mapped = batch.map((doc) => ({
      id: toStr(doc._id),
      userId: toStr(doc.user_id ?? doc.userId),
      enableCheckInReminders:
        doc.enable_checkin_reminders ?? doc.enableCheckInReminders ?? true,
      enableCheckOutReminders:
        doc.enable_checkout_reminders ?? doc.enableCheckOutReminders ?? true,
      enableHolidayNotifications:
        doc.enable_holiday_notifications ??
        doc.enableHolidayNotifications ??
        false,
      timezone: doc.timezone ?? "Asia/Bangkok",
      language: doc.language ?? "th",
      createdAt: toDateRequired(doc.created_at ?? doc.createdAt),
      updatedAt: toDateRequired(doc.updated_at ?? doc.updatedAt),
    }));

    const data = mapped.filter((r) => validUserIds.has(r.userId));
    const orphaned = mapped.length - data.length;
    totalOrphaned += orphaned;

    if (data.length === 0) continue;
    if (!DRY_RUN) {
      await (pg as any).userSettings.createMany({ data, skipDuplicates: true });
    }
    totalMigrated += data.length;
    logBatch(data.length, orphaned);
  }
  if (totalOrphaned > 0) log(`  ⚠️  Skipped ${totalOrphaned} orphaned records (userId not in users)`);
  console.log();
}

async function migrateWorkAttendances(db: Db, pg: PrismaClient) {
  const total = await db.collection("work_attendance").countDocuments();
  logCollection("work_attendance", total);
  if (total === 0) return;

  const validUserIds = new Set(
    (await (pg as any).user.findMany({ select: { id: true } })).map((u: any) => u.id as string),
  );
  let totalOrphaned = 0;

  for await (const batch of batchCursor(db, "work_attendance", BATCH_SIZE)) {
    const mapped = batch.map((doc) => ({
      id: toStr(doc._id),
      userId: toStr(doc.user_id ?? doc.userId),
      checkInTime: toDateRequired(doc.check_in_time ?? doc.checkInTime),
      checkOutTime: toDate(doc.check_out_time ?? doc.checkOutTime),
      workDate: doc.work_date ?? doc.workDate ?? "",
      status: doc.status ?? "CHECKED_IN_ON_TIME",
      hoursWorked: doc.hours_worked ?? doc.hoursWorked ?? null,
      leaveId: toId(doc.leave_id ?? doc.leaveId),
      reminderSent10Min:
        doc.reminder_sent_10min ?? doc.reminderSent10Min ?? false,
      reminderSentFinal:
        doc.reminder_sent_final ?? doc.reminderSentFinal ?? false,
      createdAt: toDateRequired(doc.created_at ?? doc.createdAt),
      updatedAt: toDateRequired(doc.updated_at ?? doc.updatedAt),
    }));

    const data = mapped.filter((r) => validUserIds.has(r.userId));
    const orphaned = mapped.length - data.length;
    totalOrphaned += orphaned;

    if (data.length === 0) continue;
    if (!DRY_RUN) {
      await (pg as any).workAttendance.createMany({ data, skipDuplicates: true });
    }
    totalMigrated += data.length;
    logBatch(data.length, orphaned);
  }
  if (totalOrphaned > 0) log(`  ⚠️  Skipped ${totalOrphaned} orphaned records (userId not in users)`);
  console.log();
}

async function migrateSubscriptions(db: Db, pg: PrismaClient) {
  const total = await db.collection("subscriptions").countDocuments();
  logCollection("subscriptions", total);
  if (total === 0) return;

  for await (const batch of batchCursor(db, "subscriptions", BATCH_SIZE)) {
    const data = batch.map((doc) => ({
      id: toStr(doc._id),
      name: doc.name ?? "",
      service: doc.service ?? "OTHER",
      planType: doc.plan_type ?? doc.planType ?? "INDIVIDUAL",
      billingCycle: doc.billing_cycle ?? doc.billingCycle ?? "MONTHLY",
      totalPrice: doc.total_price ?? doc.totalPrice ?? 0,
      currency: doc.currency ?? "THB",
      billingDay: doc.billing_day ?? doc.billingDay ?? 1,
      ownerId: toStr(doc.owner_id ?? doc.ownerId),
      isActive: doc.is_active ?? doc.isActive ?? true,
      startDate: toDateRequired(doc.start_date ?? doc.startDate),
      endDate: toDate(doc.end_date ?? doc.endDate),
      logoUrl: doc.logo_url ?? doc.logoUrl ?? null,
      note: doc.note ?? null,
      createdAt: toDateRequired(doc.created_at ?? doc.createdAt),
      updatedAt: toDateRequired(doc.updated_at ?? doc.updatedAt),
    }));

    if (!DRY_RUN) {
      await (pg as any).subscription.createMany({ data, skipDuplicates: true });
    }
    totalMigrated += data.length;
    logBatch(data.length, 0);
  }
  console.log();
}

async function migrateSubscriptionMembers(db: Db, pg: PrismaClient) {
  const total = await db.collection("subscription_members").countDocuments();
  logCollection("subscription_members", total);
  if (total === 0) return;

  for await (const batch of batchCursor(
    db,
    "subscription_members",
    BATCH_SIZE,
  )) {
    const data = batch.map((doc) => ({
      id: toStr(doc._id),
      subscriptionId: toStr(doc.subscription_id ?? doc.subscriptionId),
      userId: toId(doc.user_id ?? doc.userId),
      name: doc.name ?? "",
      email: doc.email ?? null,
      shareAmount: doc.share_amount ?? doc.shareAmount ?? 0,
      isActive: doc.is_active ?? doc.isActive ?? true,
      joinedAt: toDateRequired(doc.joined_at ?? doc.joinedAt ?? doc.createdAt),
      leftAt: toDate(doc.left_at ?? doc.leftAt),
      note: doc.note ?? null,
      tags: doc.tags ?? null,
      createdAt: toDateRequired(doc.created_at ?? doc.createdAt),
      updatedAt: toDateRequired(doc.updated_at ?? doc.updatedAt),
    }));

    if (!DRY_RUN) {
      await (pg as any).subscriptionMember.createMany({
        data,
        skipDuplicates: true,
      });
    }
    totalMigrated += data.length;
    logBatch(data.length, 0);
  }
  console.log();
}

async function migrateSubscriptionPayments(db: Db, pg: PrismaClient) {
  const total = await db.collection("subscription_payments").countDocuments();
  logCollection("subscription_payments", total);
  if (total === 0) return;

  for await (const batch of batchCursor(
    db,
    "subscription_payments",
    BATCH_SIZE,
  )) {
    const data = batch.map((doc) => ({
      id: toStr(doc._id),
      subscriptionId: toStr(doc.subscription_id ?? doc.subscriptionId),
      memberId: toStr(doc.member_id ?? doc.memberId),
      billingMonth: doc.billing_month ?? doc.billingMonth ?? "",
      amount: doc.amount ?? 0,
      status: doc.status ?? "PENDING",
      paidAt: toDate(doc.paid_at ?? doc.paidAt),
      dueDate: toDateRequired(doc.due_date ?? doc.dueDate),
      paidBy: toId(doc.paid_by ?? doc.paidBy),
      note: doc.note ?? null,
      createdAt: toDateRequired(doc.created_at ?? doc.createdAt),
      updatedAt: toDateRequired(doc.updated_at ?? doc.updatedAt),
    }));

    if (!DRY_RUN) {
      await (pg as any).subscriptionPayment.createMany({
        data,
        skipDuplicates: true,
      });
    }
    totalMigrated += data.length;
    logBatch(data.length, 0);
  }
  console.log();
}

async function migrateHealthActivities(db: Db, pg: PrismaClient) {
  const total = await db.collection("health_activities").countDocuments();
  logCollection("health_activities", total);
  if (total === 0) return;

  const validUserIds = new Set(
    (await (pg as any).user.findMany({ select: { id: true } })).map((u: any) => u.id as string),
  );
  let totalOrphaned = 0;

  for await (const batch of batchCursor(db, "health_activities", BATCH_SIZE)) {
    const mapped = batch.map((doc) => ({
      id: toStr(doc._id),
      userId: toStr(doc.user_id ?? doc.userId),
      activityType: doc.activity_type ?? doc.activityType ?? "OTHER",
      date: toDateRequired(doc.date),
      duration: doc.duration ?? 0,
      distance: doc.distance ?? null,
      calories: doc.calories ?? null,
      steps: doc.steps ?? null,
      heartRate: doc.heart_rate ?? doc.heartRate ?? null,
      metadata: doc.metadata ?? null,
      createdAt: toDateRequired(doc.created_at ?? doc.createdAt),
      updatedAt: toDateRequired(doc.updated_at ?? doc.updatedAt),
    }));

    const data = mapped.filter((r) => validUserIds.has(r.userId));
    const orphaned = mapped.length - data.length;
    totalOrphaned += orphaned;

    if (data.length === 0) continue;
    if (!DRY_RUN) {
      await (pg as any).healthActivity.createMany({ data, skipDuplicates: true });
    }
    totalMigrated += data.length;
    logBatch(data.length, orphaned);
  }
  if (totalOrphaned > 0) log(`  ⚠️  Skipped ${totalOrphaned} orphaned records (userId not in users)`);
  console.log();
}

async function migrateHealthMetrics(db: Db, pg: PrismaClient) {
  const total = await db.collection("health_metrics").countDocuments();
  logCollection("health_metrics", total);
  if (total === 0) return;

  const validUserIds = new Set(
    (await (pg as any).user.findMany({ select: { id: true } })).map((u: any) => u.id as string),
  );
  let totalOrphaned = 0;

  for await (const batch of batchCursor(db, "health_metrics", BATCH_SIZE)) {
    const mapped = batch.map((doc) => ({
      id: toStr(doc._id),
      userId: toStr(doc.user_id ?? doc.userId),
      date: toDateRequired(doc.date),
      weight: doc.weight ?? null,
      height: doc.height ?? null,
      bmi: doc.bmi ?? null,
      bodyFat: doc.body_fat ?? doc.bodyFat ?? null,
      bloodPressure: doc.blood_pressure ?? doc.bloodPressure ?? null,
      restingHeartRate:
        doc.resting_heart_rate ?? doc.restingHeartRate ?? null,
      sleepHours: doc.sleep_hours ?? doc.sleepHours ?? null,
      waterIntake: doc.water_intake ?? doc.waterIntake ?? null,
      createdAt: toDateRequired(doc.created_at ?? doc.createdAt),
      updatedAt: toDateRequired(doc.updated_at ?? doc.updatedAt),
    }));

    const data = mapped.filter((r) => validUserIds.has(r.userId));
    const orphaned = mapped.length - data.length;
    totalOrphaned += orphaned;

    if (data.length === 0) continue;
    if (!DRY_RUN) {
      await (pg as any).healthMetrics.createMany({ data, skipDuplicates: true });
    }
    totalMigrated += data.length;
    logBatch(data.length, orphaned);
  }
  if (totalOrphaned > 0) log(`  ⚠️  Skipped ${totalOrphaned} orphaned records (userId not in users)`);
  console.log();
}

async function migrateDcaOrders(db: Db, pg: PrismaClient) {
  const total = await db.collection("dca_orders").countDocuments();
  logCollection("dca_orders", total);
  if (total === 0) return;

  for await (const batch of batchCursor(db, "dca_orders", BATCH_SIZE)) {
    const data = batch.map((doc) => ({
      id: toStr(doc._id),
      orderId: doc.order_id ?? doc.orderId ?? toStr(doc._id),
      lineUserId: doc.line_user_id ?? doc.lineUserId ?? "",
      coin: doc.coin ?? "BTC",
      amountTHB: doc.amount_thb ?? doc.amountTHB ?? 0,
      coinReceived: doc.coin_received ?? doc.coinReceived ?? 0,
      pricePerCoin: doc.price_per_coin ?? doc.pricePerCoin ?? 0,
      round: doc.round ?? 0,
      status: doc.status ?? "SUCCESS",
      note: doc.note ?? null,
      executedAt: toDateRequired(doc.executed_at ?? doc.executedAt),
      createdAt: toDateRequired(doc.created_at ?? doc.createdAt),
      updatedAt: toDateRequired(doc.updated_at ?? doc.updatedAt),
    }));

    if (!DRY_RUN) {
      await (pg as any).dcaOrder.createMany({ data, skipDuplicates: true });
    }
    totalMigrated += data.length;
    logBatch(data.length, 0);
  }
  console.log();
}

async function migrateLineApprovalRequests(db: Db, pg: PrismaClient) {
  const total = await db.collection("line_approval_requests").countDocuments();
  logCollection("line_approval_requests", total);
  if (total === 0) return;

  for await (const batch of batchCursor(
    db,
    "line_approval_requests",
    BATCH_SIZE,
  )) {
    const data = batch.map((doc) => ({
      id: toStr(doc._id),
      lineUserId: doc.line_user_id ?? doc.lineUserId ?? toStr(doc._id),
      loginLineUserId:
        doc.login_line_user_id ?? doc.loginLineUserId ?? null,
      displayName: doc.display_name ?? doc.displayName ?? null,
      pictureUrl: doc.picture_url ?? doc.pictureUrl ?? null,
      statusMessage: doc.status_message ?? doc.statusMessage ?? null,
      reason: doc.reason ?? null,
      rejectReason: doc.reject_reason ?? doc.rejectReason ?? null,
      status: doc.status ?? "PENDING",
      approvedBy: doc.approved_by ?? doc.approvedBy ?? null,
      approvedAt: toDate(doc.approved_at ?? doc.approvedAt),
      expiresAt: toDate(doc.expires_at ?? doc.expiresAt),
      notifiedAt: toDate(doc.notified_at ?? doc.notifiedAt),
      canRequestAttendanceReport:
        doc.can_request_attendance_report ??
        doc.canRequestAttendanceReport ??
        false,
      canRequestLeave: doc.can_request_leave ?? doc.canRequestLeave ?? false,
      canReceiveReminders:
        doc.can_receive_reminders ?? doc.canReceiveReminders ?? false,
      createdAt: toDateRequired(doc.created_at ?? doc.createdAt),
      updatedAt: toDateRequired(doc.updated_at ?? doc.updatedAt),
    }));

    if (!DRY_RUN) {
      await (pg as any).lineApprovalRequest.createMany({
        data,
        skipDuplicates: true,
      });
    }
    totalMigrated += data.length;
    logBatch(data.length, 0);
  }
  console.log();
}

// ─── Migration Plan (ordered by FK dependencies) ──────────────────────────

const ALL_MIGRATIONS: Array<{
  name: string;
  fn: (db: Db, pg: PrismaClient) => Promise<void>;
}> = [
  // No FK dependencies
  { name: "users", fn: migrateUsers },
  { name: "public_holidays", fn: migratePublicHolidays },
  { name: "cmc", fn: migrateCmc },
  { name: "verifications", fn: migrateVerifications },
  { name: "dca_orders", fn: migrateDcaOrders },
  { name: "line_approval_requests", fn: migrateLineApprovalRequests },
  // Depends on users
  { name: "accounts", fn: migrateAccounts },
  { name: "sessions", fn: migrateSessions },
  { name: "user_settings", fn: migrateUserSettings },
  { name: "leaves", fn: migrateLeaves },
  // Depends on users + leaves
  { name: "work_attendance", fn: migrateWorkAttendances },
  // Subscription chain
  { name: "subscriptions", fn: migrateSubscriptions },
  { name: "subscription_members", fn: migrateSubscriptionMembers },
  { name: "subscription_payments", fn: migrateSubscriptionPayments },
  // Health (userId string, no strict FK)
  { name: "health_activities", fn: migrateHealthActivities },
  { name: "health_metrics", fn: migrateHealthMetrics },
];

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log("╔══════════════════════════════════════════════════════╗");
  console.log("║       MongoDB → PostgreSQL Migration Script          ║");
  console.log("╚══════════════════════════════════════════════════════╝");
  console.log(`Mode    : ${DRY_RUN ? "🔍 DRY RUN (no writes)" : "✍️  LIVE"}`);
  console.log(`Batch   : ${BATCH_SIZE} docs/batch`);
  if (ONLY_COLLECTIONS) {
    console.log(`Filter  : ${ONLY_COLLECTIONS.join(", ")}`);
  }

  // Parse MongoDB database name from URL
  const mongoDbName = MONGODB_URL!.split("/").pop()?.split("?")[0] || "linebot";
  console.log(`MongoDB : ${MONGODB_URL!.replace(/:[^:@]+@/, ":****@")}`);
  console.log(`Database: ${mongoDbName}`);
  console.log(`Postgres: ${process.env.DATABASE_URL!.replace(/:[^:@]+@/, ":****@")}`);

  // Connect MongoDB
  const mongoClient = new MongoClient(MONGODB_URL!);
  await mongoClient.connect();
  const db = mongoClient.db(mongoDbName);
  log("\n✅ Connected to MongoDB");

  // Connect PostgreSQL
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  });
  const pg = new PrismaClient({ adapter } as any);
  await pg.$connect();
  log("✅ Connected to PostgreSQL");

  const startTime = Date.now();

  // Filter migrations if COLLECTIONS env is set
  const migrations = ONLY_COLLECTIONS
    ? ALL_MIGRATIONS.filter((m) => ONLY_COLLECTIONS.includes(m.name))
    : ALL_MIGRATIONS;

  if (ONLY_COLLECTIONS && migrations.length === 0) {
    console.error(`❌ No matching collections: ${ONLY_COLLECTIONS.join(", ")}`);
    console.error(
      `   Available: ${ALL_MIGRATIONS.map((m) => m.name).join(", ")}`,
    );
    process.exit(1);
  }

  // Run migrations in order
  for (const migration of migrations) {
    try {
      await migration.fn(db, pg);
    } catch (err) {
      totalErrors++;
      console.error(`\n❌ Error migrating [${migration.name}]:`, err);
      console.error("   Continuing with next collection...\n");
    }
  }

  // Summary
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n${"═".repeat(60)}`);
  console.log("📊  Migration Summary");
  console.log("═".repeat(60));
  console.log(`  ✅ Migrated : ${totalMigrated.toLocaleString()} documents`);
  console.log(`  ⏭️  Skipped  : ${totalSkipped.toLocaleString()} (expired/duplicate)`);
  console.log(`  ❌ Errors   : ${totalErrors}`);
  console.log(`  ⏱️  Time     : ${elapsed}s`);
  if (DRY_RUN) {
    console.log("\n  ℹ️  DRY RUN — no data was written to PostgreSQL");
    console.log(
      "     Remove DRY_RUN=1 to run the actual migration",
    );
  }
  console.log("═".repeat(60));

  await mongoClient.close();
  await pg.$disconnect();
}

main().catch((err) => {
  console.error("💥 Fatal error:", err);
  process.exit(1);
});
