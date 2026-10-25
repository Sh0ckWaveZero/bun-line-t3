const TOKEN_PREFIX = "planning-poker:token:";
const NAME_KEY = "planning-poker:name";

type StorageKind = "local" | "session";

// storage อาจใช้ไม่ได้ (private mode / SSR) จึงครอบ try/catch ทุกจุด
const getStorage = (kind: StorageKind): Storage =>
  kind === "local" ? window.localStorage : window.sessionStorage;

const readStorage = (kind: StorageKind, key: string): string | null => {
  try {
    return getStorage(kind).getItem(key);
  } catch {
    return null;
  }
};

const writeStorage = (
  kind: StorageKind,
  key: string,
  value: string | null,
): void => {
  try {
    if (value === null) getStorage(kind).removeItem(key);
    else getStorage(kind).setItem(key, value);
  } catch {
    // ignore
  }
};

// token เก็บใน sessionStorage = ตัวตนแยกตามแท็บ
// เปิดห้องเดียวกันอีกแท็บ (แม้เบราว์เซอร์เดียวกัน) จึงได้เป็นอีกคน และรีเฟรชแล้วยังเป็นคนเดิม
export const loadRoomToken = (code: string): string | null =>
  readStorage("session", `${TOKEN_PREFIX}${code}`);

export const saveRoomToken = (code: string, token: string): void =>
  writeStorage("session", `${TOKEN_PREFIX}${code}`, token);

export const clearRoomToken = (code: string): void =>
  writeStorage("session", `${TOKEN_PREFIX}${code}`, null);

// ชื่อเก็บใน localStorage ไว้เติมในฟอร์มให้อัตโนมัติ ใช้ร่วมกันทุกแท็บ
export const loadSavedName = (): string => readStorage("local", NAME_KEY) ?? "";

export const saveName = (name: string): void =>
  writeStorage("local", NAME_KEY, name);
