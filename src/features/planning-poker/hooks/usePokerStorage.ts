import { useSyncExternalStore } from "react";
import {
  loadRoomToken,
  loadSavedName,
  subscribePokerStorage,
} from "../lib/storage";

/** ค่า snapshot ฝั่ง server — ยังไม่อ่าน storage (SSR/hydration) */
const SERVER_NAME_SNAPSHOT = "";
const SERVER_TOKEN_SNAPSHOT: string | null = null;

/**
 * ชื่อที่เคยใช้จาก localStorage — external store ผ่าน useSyncExternalStore
 * อ่าน client snapshot หลัง hydration เสร็จ ไม่มี setState-in-effect ให้ค่ากระพริบหลัง paint
 */
export const useSavedName = (): string =>
  useSyncExternalStore(
    subscribePokerStorage,
    loadSavedName,
    () => SERVER_NAME_SNAPSHOT,
  );

/**
 * token ของห้องตาม code จาก sessionStorage — `undefined` = ยังไม่อ่าน (ฝั่ง server),
 * `null` = อ่านแล้วแต่ไม่มี token, string = มี token
 */
export const useRoomToken = (code: string): string | null | undefined =>
  useSyncExternalStore(
    subscribePokerStorage,
    () => loadRoomToken(code),
    () => SERVER_TOKEN_SNAPSHOT,
  );
