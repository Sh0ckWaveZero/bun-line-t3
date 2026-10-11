import { z } from "zod";

const weatherResponseSchema = z.object({
  current_units: z.object({
    time: z.literal("unixtime"),
    temperature_2m: z.literal("°C"),
    weather_code: z.literal("wmo code").optional(),
  }),
  current: z.object({
    time: z.number().finite().int().nonnegative(),
    temperature_2m: z.number().finite().min(-90).max(60),
    weather_code: z.number().int(),
  }),
});

const weatherDescriptions: Readonly<Record<number, string>> = {
  0: "ท้องฟ้าโปร่ง",
  1: "ท้องฟ้าค่อนข้างโปร่ง",
  2: "มีเมฆบางส่วน",
  3: "มีเมฆมาก",
  45: "มีหมอก",
  48: "มีหมอกเยือกแข็ง",
  51: "มีฝนละอองเล็กน้อย",
  53: "มีฝนละอองปานกลาง",
  55: "มีฝนละอองหนาแน่น",
  56: "มีฝนละอองเยือกแข็งเล็กน้อย",
  57: "มีฝนละอองเยือกแข็งหนาแน่น",
  61: "มีฝนเล็กน้อย",
  63: "มีฝนปานกลาง",
  65: "มีฝนตกหนัก",
  66: "มีฝนเยือกแข็งเล็กน้อย",
  67: "มีฝนเยือกแข็งหนัก",
  71: "มีหิมะเล็กน้อย",
  73: "มีหิมะปานกลาง",
  75: "มีหิมะตกหนัก",
  77: "มีเกล็ดหิมะ",
  80: "มีฝนซู่เล็กน้อย",
  81: "มีฝนซู่ปานกลาง",
  82: "มีฝนซู่รุนแรง",
  85: "มีหิมะซู่เล็กน้อย",
  86: "มีหิมะซู่หนัก",
  95: "มีพายุฝนฟ้าคะนอง",
  96: "มีพายุฝนฟ้าคะนองและลูกเห็บเล็กน้อย",
  97: "มีพายุฝนฟ้าคะนองรุนแรง",
  99: "มีพายุฝนฟ้าคะนองและลูกเห็บหนัก",
};

/** Current model estimate from https://open-meteo.com/en/docs (WMO codes). */
export async function getBangkokCurrentWeather(): Promise<string | undefined> {
  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.search = new URLSearchParams({
      latitude: "13.7563",
      longitude: "100.5018",
      current: "temperature_2m,weather_code",
      timezone: "Asia/Bangkok",
      timeformat: "unixtime",
    }).toString();

    const response = await fetch(url, { signal: AbortSignal.timeout(3000) });
    if (!response.ok) return undefined;

    const parsed = weatherResponseSchema.safeParse(await response.json());
    if (!parsed.success) return undefined;

    const { time, temperature_2m, weather_code } = parsed.data.current;
    const ageSeconds = Date.now() / 1000 - time;
    if (ageSeconds > 3600 || ageSeconds < -300) return undefined;

    const description = weatherDescriptions[weather_code];
    if (!description) return undefined;

    return `Open-Meteo ประเมินสภาพอากาศปัจจุบันบริเวณกรุงเทพฯ ${description} อุณหภูมิ ${Math.round(temperature_2m)}°C`;
  } catch {
    return undefined;
  }
}
