/**
 * BLE Listener ตาชั่ง Xiaomi Mi Body Composition Scale 2 — รันด้วย Bun
 *
 *   bun run scale:listen
 *
 * สแกน advertisement บน Body Composition service (0x181B) แล้วส่ง packet ที่
 * parse แล้วเข้า webhook ของแอป (event "reading") — ฝั่งแอปเป็นคนจับกลุ่ม
 * เป็นการชั่ง เดาเจ้าของ คำนวณ body composition และ push LINE เอง
 *
 * env (Bun โหลด .env / .env.local ให้เอง):
 *   SCALE_WEBHOOK_SECRET  — ค่าเดียวกับ env ฝั่งแอป (บังคับ)
 *   APP_URL               — ยิงไป `${APP_URL}/api/body-weight/webhook`
 *                           (ไม่ตั้ง = http://localhost:4325/api/body-weight/webhook)
 *
 * หมายเหตุตามแพลตฟอร์ม:
 * - macOS: CoreBluetooth ไม่เปิดเผย MAC จริง (ได้ UUID แทน) และครั้งแรกจะมี
 *   popup ขอสิทธิ์ Bluetooth — ต้องกด Allow
 * - Linux (Pi): ต้องมีสิทธิ์ CAP_NET_RAW/CAP_NET_ADMIN บน HCI socket
 *   (รันด้วย sudo หรือ setcap ที่ binary ของ bun)
 */

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

if (!SECRET) {
  console.error("❌ SCALE_WEBHOOK_SECRET is required (ค่าเดียวกับฝั่งแอป)");
  process.exit(1);
}

// CoreBluetooth ส่ง advertisement ซ้ำเมื่อ content ไม่เปลี่ยน — ส่งต่อเฉพาะที่เนื้อหาเปลี่ยน
const lastRaw = new Map<string, string>();
// ส่ง webhook ทีละรายการตามลำดับที่รับ กัน packet จั่วหน้า
let posting: Promise<void> = Promise.resolve();

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
      body: JSON.stringify({ event: "reading", reading }),
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

Noble.on("stateChange", async (state: string) => {
  if (state === "poweredOn") {
    try {
      await Noble.startScanningAsync([], true);
      console.log(`⚖️ listening for Mi Body Composition Scale 2 (0x181B)…`);
      console.log(`   → webhook: ${WEBHOOK_URL}`);
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
    console.error(`❌ Bluetooth state: ${state}`);
    process.exit(1);
  }
});

Noble.on("warning", (message: string) => {
  console.warn("noble:", message);
});

Noble.on("discover", (peripheral: any) => {
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

process.on("SIGINT", () => {
  console.log("\nbye");
  Noble.stopScanningAsync()
    .catch(() => {})
    .finally(() => process.exit(0));
});
