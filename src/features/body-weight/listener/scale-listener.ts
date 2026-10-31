/**
 * BLE Listener ตาชั่ง Xiaomi Mi Body Composition Scale 2 — รันด้วย Bun
 *
 *   bun run scale:listen
 *
 * สแกน advertisement บน Body Composition service (0x181B) แล้วส่ง packet ที่
 * parse แล้วเข้า webhook ของแอป (event "reading") — ฝั่งแอปเป็นคนจับกลุ่ม
 * เป็นการชั่ง เดาเจ้าของ คำนวณ body composition และ push LINE เอง
 *
 * เปิด/ปิดจากหน้า /body-weight: listener check-in ทุก 10 วิ ถามว่าเครื่องนี้ถูกเลือก
 * ให้รับสัญญาณอยู่ไหม — ไม่ถูกเลือกก็หยุดสแกน (ใช้ตอน dev บน Mac แทน Pi)
 *
 * env (Bun โหลด .env / .env.local ให้เอง):
 *   SCALE_WEBHOOK_SECRET  — ค่าเดียวกับ env ฝั่งแอป (บังคับ)
 *   APP_URL               — ยิงไป `${APP_URL}/api/body-weight/webhook`
 *                           (ไม่ตั้ง = http://localhost:4325/api/body-weight/webhook)
 *   SCALE_LISTENER_NAME   — ชื่อเครื่องที่โชว์ในหน้าเว็บ (ไม่ตั้ง = hostname)
 *
 * หมายเหตุตามแพลตฟอร์ม:
 * - macOS: CoreBluetooth ไม่เปิดเผย MAC จริง (ได้ UUID แทน) และครั้งแรกจะมี
 *   popup ขอสิทธิ์ Bluetooth — ต้องกด Allow. รันจาก iTerm2/Ghostty เท่านั้น
 *   (Warp/Terminal.app ไม่มี NSBluetoothAlwaysUsageDescription → macOS abort process)
 * - Linux (Pi): ต้องมีสิทธิ์ CAP_NET_RAW/CAP_NET_ADMIN บน HCI socket
 *   (docker-compose service scale-listener ให้สิทธิ์ไว้แล้ว)
 */

import { hostname } from "node:os";
import Noble from "@stoprocent/noble";
import {
  isBodyCompositionService,
  parseScalePacket,
} from "@/features/body-weight/helpers/ble-packet";

// localhost ไม่ใช่ 127.0.0.1 — Vite บน macOS bind แค่ IPv6 [::1]
const APP_URL = (process.env.APP_URL || "http://localhost:4325").replace(
  /\/+$/,
  "",
);
const WEBHOOK_URL = `${APP_URL}/api/body-weight/webhook`;
const SECRET = process.env.SCALE_WEBHOOK_SECRET;
const CHECK_IN_INTERVAL_MS = 10_000;

/** ชื่อเครื่องตามรูปแบบที่แอปรับ (ตัวเล็ก ตัวเลข ขีด) — "all"/"off" สงวนไว้ */
const toListenerName = (raw: string): string => {
  const cleaned = raw
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
  if (!cleaned) return "dev";
  return cleaned === "all" || cleaned === "off" ? `${cleaned}-listener` : cleaned;
};
const LISTENER_NAME = toListenerName(
  process.env.SCALE_LISTENER_NAME || hostname().split(".")[0] || "dev",
);

if (!SECRET) {
  console.error("❌ SCALE_WEBHOOK_SECRET is required (ค่าเดียวกับฝั่งแอป)");
  process.exit(1);
}

// CoreBluetooth ส่ง advertisement ซ้ำเมื่อ content ไม่เปลี่ยน — ส่งต่อเฉพาะที่เนื้อหาเปลี่ยน
const lastRaw = new Map<string, string>();
// ส่ง webhook ทีละรายการตามลำดับที่รับ กัน packet จั่วหน้า
let posting: Promise<void> = Promise.resolve();

let isPoweredOn = false;
let isScanning = false;
/** null = ยังไม่รู้ (แอปยังไม่ตอบ) — ถือว่าเปิด webhook จะกรองซ้ำฝั่ง server อยู่แล้ว */
let isEnabled: boolean | null = null;

const postReading = async (reading: {
  address: string;
  weightKg: number;
  impedance: number | null;
  stabilized: boolean;
  removed: boolean;
}): Promise<void> => {
  try {
    // secret ทาง header ไม่ใส่ใน query — URL ไปโผล่ใน access log ของ tunnel/proxy
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-secret": SECRET,
      },
      body: JSON.stringify({
        event: "reading",
        listener: LISTENER_NAME,
        reading,
      }),
    });
    if (!response.ok) {
      console.error(
        `⚠️ webhook ${response.status}:`,
        await response.text().catch(() => ""),
      );
      return;
    }
    const body = (await response.json()) as { status?: string };
    if (body.status && body.status !== "ignored") {
      console.log(
        `[${new Date().toLocaleTimeString("th-TH")}] ${reading.weightKg.toFixed(2)} kg (impedance ${
          reading.impedance ?? "—"
        }) → ${body.status}`,
      );
    }
  } catch (error) {
    console.error("⚠️ webhook failed:", (error as Error)?.message ?? error);
  }
};

/** เริ่ม/หยุดสแกนให้ตรงกับสถานะ Bluetooth และคำสั่งจากหน้าเว็บ */
const syncScanning = async (): Promise<void> => {
  const shouldScan = isPoweredOn && isEnabled !== false;
  if (shouldScan && !isScanning) {
    await Noble.startScanningAsync([], true);
    isScanning = true;
    console.log(
      `⚖️ [${LISTENER_NAME}] listening for Mi Body Composition Scale 2 (0x181B)…`,
    );
    console.log(`   → webhook: ${WEBHOOK_URL}`);
    return;
  }
  if (!shouldScan && isScanning) {
    await Noble.stopScanningAsync();
    isScanning = false;
    lastRaw.clear();
    console.log(
      `⏸️ [${LISTENER_NAME}] หยุดสแกน — เครื่องนี้ไม่ได้ถูกเลือกให้รับสัญญาณในหน้า /body-weight`,
    );
  }
};

/** ถามแอปว่าเครื่องนี้ควรรับสัญญาณไหม (เป็น heartbeat ด้วย) */
const checkIn = async (): Promise<void> => {
  try {
    const response = await fetch(
      `${APP_URL}/api/body-weight/listener?name=${encodeURIComponent(LISTENER_NAME)}`,
      { headers: { "x-webhook-secret": SECRET } },
    );
    if (!response.ok) {
      console.error(
        `⚠️ check-in ${response.status}:`,
        await response.text().catch(() => ""),
      );
      return;
    }
    const body = (await response.json()) as { enabled?: boolean };
    if (typeof body.enabled === "boolean") {
      isEnabled = body.enabled;
      await syncScanning();
    }
  } catch (error) {
    // แอปปิดอยู่/เครือข่ายหลุด — คงสถานะเดิมไว้ ลองใหม่รอบหน้า
    console.error("⚠️ check-in failed:", (error as Error)?.message ?? error);
  }
};

Noble.on("stateChange", async (state: string) => {
  if (state === "poweredOn") {
    isPoweredOn = true;
    try {
      await syncScanning();
    } catch (error) {
      console.error("❌ startScanning failed:", (error as Error)?.message);
      process.exit(1);
    }
    return;
  }
  if (state === "unauthorized") {
    console.error(
      "❌ ไม่ได้รับสิทธิ์ Bluetooth — บน macOS ให้อนุญาตใน System Settings → Privacy & Security → Bluetooth",
    );
    process.exit(1);
  }
  if (state === "poweredOff" || state === "unsupported") {
    // ออกให้ process manager (Docker restart: always) สตาร์ทใหม่เมื่อ Bluetooth กลับมา
    console.error(`❌ Bluetooth state: ${state}`);
    process.exit(1);
  }
});

Noble.on("warning", (message: string) => {
  console.warn("noble:", message);
});

Noble.on("discover", (peripheral: any) => {
  if (!isScanning) return;
  const serviceData = peripheral.advertisement?.serviceData ?? [];
  const entry = serviceData.find((sd: any) =>
    isBodyCompositionService(sd.uuid),
  );
  if (!entry?.data) return;

  const address: string =
    peripheral.address || peripheral.uuid || peripheral.id;
  const raw = Buffer.from(entry.data).toString("hex");
  if (lastRaw.get(address) === raw) return;
  lastRaw.set(address, raw);

  const reading = parseScalePacket(new Uint8Array(Buffer.from(entry.data)));
  if (!reading) return;
  reading.address = address;

  if (reading.stabilized) {
    console.log(
      `   packet: ${reading.weightKg.toFixed(2)} kg | imp ${reading.impedance ?? "—"} | stabilized${reading.removed ? " | removed" : ""}`,
    );
  }
  posting = posting
    .then(() =>
      postReading({
        address: reading.address,
        weightKg: reading.weightKg,
        impedance: reading.impedance,
        stabilized: reading.stabilized,
        removed: reading.removed,
      }),
    )
    .catch(() => {});
});

void checkIn();
const checkInTimer = setInterval(() => void checkIn(), CHECK_IN_INTERVAL_MS);

const shutdown = () => {
  console.log("\nbye");
  clearInterval(checkInTimer);
  Noble.stopScanningAsync()
    .catch(() => {})
    .finally(() => process.exit(0));
};
process.on("SIGINT", shutdown);
// docker stop ส่ง SIGTERM
process.on("SIGTERM", shutdown);
