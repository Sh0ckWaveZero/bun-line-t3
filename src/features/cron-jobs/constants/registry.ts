import type { JobEnvironment, TargetKind } from "../types";

export type CronHttpMethod = "GET" | "POST";

export interface CronJobDefinition {
  id: string;
  name: string;
  command: string;
  method: CronHttpMethod;
  endpoint: string;
  scheduleLabel: string;
  cronExpression: string;
  timezone: "Asia/Bangkok";
  environment: JobEnvironment;
  targetName: string;
  targetKind: TargetKind;
  ownerName: string;
  ownerInitials: string;
  ownerColor: string;
}

/**
 * ค่าเริ่มต้นสำหรับ migration และการสร้าง job ใหม่ใน environment ที่ว่าง
 * source of truth หลัง migration คือข้อมูลในตาราง `cron_jobs` ของ PostgreSQL
 */
export const CRON_JOB_DEFINITIONS = [
  {
    id: "check-in-reminder",
    name: "แจ้งเตือนเข้างาน",
    command: "GET /api/cron/check-in-reminder",
    method: "GET",
    endpoint: "/api/cron/check-in-reminder",
    scheduleLabel: "08:00 จันทร์–ศุกร์",
    cronExpression: "0 8 * * 1-5",
    timezone: "Asia/Bangkok",
    environment: "production",
    targetName: "LINE Messaging",
    targetKind: "notifications",
    ownerName: "ระบบลงเวลา",
    ownerInitials: "SYS",
    ownerColor: "#0f9f72",
  },
  {
    id: "enhanced-checkout-reminder",
    name: "แจ้งเตือนออกงานแบบเฉพาะบุคคล",
    command: "GET /api/cron/enhanced-checkout-reminder",
    method: "GET",
    endpoint: "/api/cron/enhanced-checkout-reminder",
    scheduleLabel: "ทุก 5 นาที · 16:00–20:59",
    cronExpression: "*/5 16-20 * * 1-5",
    timezone: "Asia/Bangkok",
    environment: "production",
    targetName: "LINE Messaging",
    targetKind: "notifications",
    ownerName: "ระบบลงเวลา",
    ownerInitials: "SYS",
    ownerColor: "#0f9f72",
  },
  {
    id: "auto-checkout",
    name: "ลงชื่อออกงานอัตโนมัติ",
    command: "GET /api/cron/auto-checkout",
    method: "GET",
    endpoint: "/api/cron/auto-checkout",
    scheduleLabel: "เที่ยงคืนทุกวัน",
    cronExpression: "0 0 * * *",
    timezone: "Asia/Bangkok",
    environment: "production",
    targetName: "Work attendance",
    targetKind: "attendance",
    ownerName: "ระบบลงเวลา",
    ownerInitials: "SYS",
    ownerColor: "#0f9f72",
  },
  {
    id: "image-cleanup",
    name: "ล้างไฟล์รูปชั่วคราว",
    command: "POST /api/cron/image-cleanup",
    method: "POST",
    endpoint: "/api/cron/image-cleanup",
    scheduleLabel: "ทุก 2 ชั่วโมง",
    cronExpression: "0 */2 * * *",
    timezone: "Asia/Bangkok",
    environment: "production",
    targetName: "Temporary chart files",
    targetKind: "storage",
    ownerName: "ระบบจัดเก็บไฟล์",
    ownerInitials: "SYS",
    ownerColor: "#64748b",
  },
] as const satisfies readonly CronJobDefinition[];
