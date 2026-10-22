/**
 * เลือกเครื่องที่รับสัญญาณตาชั่ง — Pi (production) / เครื่อง dev / ปิด
 *
 * listener แต่ละตัวมีชื่อ (SCALE_LISTENER_NAME) และ check-in ทุก ~10 วิ เพื่อถามว่า
 * ตัวเองเปิดอยู่ไหม (เป็น heartbeat ไปด้วย) — webhook กรองซ้ำฝั่ง server
 * กันสองเครื่องรับการชั่งเดียวกันแล้วบันทึกซ้ำ (address ต่างกัน: MAC vs UUID ของ macOS)
 */
import { db } from "@/lib/database";
import {
  LISTENER_MODE,
  type ScaleListenerOverview,
} from "@/features/body-weight/types";

const SETTINGS_ID = "default";
/** อ่านค่าจาก DB ใหม่หลังเวลานี้ — webhook ถูกเรียกหลายครั้งต่อวินาทีระหว่างชั่ง */
const CACHE_TTL_MS = 5_000;

interface ListenerStore {
  cache: { active: string; at: number } | null;
  lastSeen: Map<string, number>;
  tableReady: boolean;
  tableCheckedAt: number;
  warnedMissing: boolean;
}

const g = globalThis as typeof globalThis & {
  __scaleListenerStore?: ListenerStore;
};
if (!g.__scaleListenerStore) {
  g.__scaleListenerStore = {
    cache: null,
    lastSeen: new Map(),
    tableReady: false,
    tableCheckedAt: 0,
    warnedMissing: false,
  };
}
const store: ListenerStore = g.__scaleListenerStore;
// store จากก่อน HMR อาจยังไม่มี field ใหม่
store.tableReady ??= false;
store.tableCheckedAt ??= 0;
store.warnedMissing ??= false;

export const getActiveListener = async (
  now: number = Date.now(),
): Promise<string> => {
  if (store.cache && now - store.cache.at < CACHE_TTL_MS) {
    return store.cache.active;
  }
  // DB ยังไม่ได้รัน migration (เช่น dev ที่ชี้ DB ก่อน deploy) — อย่าให้ตาชั่งหยุดทำงาน รับทุกเครื่อง
  // เช็กด้วย to_regclass ก่อน: query ตารางที่ไม่มีทำให้ Prisma log error ทุกครั้ง
  if (!(await isSettingsTableReady(now))) {
    store.cache = { active: LISTENER_MODE.all, at: now };
    return LISTENER_MODE.all;
  }
  try {
    const row = await db.scaleSettings.findUnique({
      where: { id: SETTINGS_ID },
      select: { activeListener: true },
    });
    const active = row?.activeListener ?? LISTENER_MODE.all;
    store.cache = { active, at: now };
    return active;
  } catch (error) {
    console.error(
      "[body-weight] read scale_settings failed, accepting all listeners:",
      (error as Error)?.message ?? error,
    );
    return LISTENER_MODE.all;
  }
};

/** ตารางหาย → เช็กใหม่ทุก 60 วิ (migration อาจเพิ่งลง); มีแล้วไม่ต้องเช็กอีก */
const TABLE_RECHECK_MS = 60_000;

const isSettingsTableReady = async (now: number): Promise<boolean> => {
  if (store.tableReady) return true;
  if (store.tableCheckedAt && now - store.tableCheckedAt < TABLE_RECHECK_MS) {
    return false;
  }
  store.tableCheckedAt = now;
  try {
    const rows = await db.$queryRaw<{ found: string | null }[]>`
      SELECT to_regclass('public.scale_settings')::text AS found`;
    store.tableReady = Boolean(rows[0]?.found);
  } catch {
    store.tableReady = false;
  }
  if (!store.tableReady && !store.warnedMissing) {
    store.warnedMissing = true;
    console.warn(
      "[body-weight] ตาราง scale_settings ยังไม่มี (รอ migration) — รับสัญญาณจากทุกเครื่องไปก่อน",
    );
  }
  return store.tableReady;
};

export const setActiveListener = async (active: string): Promise<void> => {
  await db.scaleSettings.upsert({
    where: { id: SETTINGS_ID },
    create: { id: SETTINGS_ID, activeListener: active },
    update: { activeListener: active },
  });
  store.cache = { active, at: Date.now() };
};

/** listener ที่ไม่ส่งชื่อ (เวอร์ชันเก่า) รับเฉพาะโหมด "ทุกเครื่อง" */
export const isListenerAccepted = (
  name: string | null,
  active: string,
): boolean => {
  if (active === LISTENER_MODE.all) return true;
  if (active === LISTENER_MODE.off) return false;
  return name === active;
};

export const recordListenerCheckIn = (
  name: string,
  now: number = Date.now(),
): void => {
  store.lastSeen.set(name, now);
};

export const getListenerOverview = async (
  now: number = Date.now(),
): Promise<ScaleListenerOverview> => ({
  active: await getActiveListener(now),
  listeners: [...store.lastSeen.entries()]
    .map(([name, at]) => ({ name, lastSeenAgoMs: Math.max(0, now - at) }))
    .sort((a, b) => a.name.localeCompare(b.name)),
});
