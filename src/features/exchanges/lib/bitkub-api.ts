import { z } from "zod";

export const bitkubConnectionSchema = z.object({
  connected: z.boolean(),
  configured: z.boolean(),
  keyHint: z.string().nullable(),
  lastSyncedAt: z.string().nullable(),
});

export async function requestBitkub<T>(
  url: string,
  schema: z.ZodType<T>,
  init?: RequestInit,
): Promise<T> {
  let response: Response;
  let body: unknown;
  try {
    response = await fetch(url, { ...init, cache: "no-store" });
  } catch {
    throw new Error("ไม่สามารถติดต่อระบบได้ กรุณาลองใหม่");
  }
  try {
    body = await response.json();
  } catch {
    throw new Error(
      response.ok
        ? "รูปแบบข้อมูลจากระบบไม่ถูกต้อง กรุณาลองใหม่"
        : `ไม่สามารถโหลดข้อมูล Bitkub ได้ (HTTP ${response.status})`,
    );
  }
  if (!response.ok) {
    const error = z.object({ error: z.string() }).safeParse(body);
    throw new Error(
      error.success ? error.data.error : "ไม่สามารถโหลดข้อมูล Bitkub ได้",
    );
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    throw new Error("รูปแบบข้อมูลจากระบบไม่ถูกต้อง กรุณาลองใหม่");
  return parsed.data;
}
