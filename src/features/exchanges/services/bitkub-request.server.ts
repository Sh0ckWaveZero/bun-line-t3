import { z } from "zod";
import { env } from "@/env.mjs";
import { getServerAuthSession } from "@/lib/auth/auth";
import { isLineUserApproved } from "@/lib/auth/approval-guard";

const jsonResponse = (body: unknown, status = 200) =>
  Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store, private" },
  });

export const withBitkubOwner = async (
  request: Request,
  action: (userId: string) => Promise<unknown>,
) => {
  try {
    const session = await getServerAuthSession(request);
    if (!session?.user?.id)
      return jsonResponse({ error: "กรุณาเข้าสู่ระบบ" }, 401);
    if (!(await isLineUserApproved(session.user.id)))
      return jsonResponse({ error: "กรุณารอการอนุมัติบัญชี LINE" }, 403);
    if (request.method !== "GET") {
      const origin = request.headers.get("origin");
      if (
        !origin ||
        ![new URL(env.APP_URL).origin, new URL(request.url).origin].includes(
          origin,
        )
      )
        return jsonResponse({ error: "คำขอไม่ถูกต้อง" }, 403);
    }
    return jsonResponse(await action(session.user.id));
  } catch (error) {
    // Never return or log provider responses, credential input, decrypted keys, or request errors.
    return jsonResponse(
      {
        error:
          error instanceof z.ZodError
            ? "ข้อมูลหรือรูปแบบคำขอไม่ถูกต้อง"
            : "ไม่สามารถดำเนินการกับ Bitkub ได้ กรุณาตรวจสอบการเชื่อมต่อและลองใหม่",
      },
      error instanceof z.ZodError ? 400 : 502,
    );
  }
};

export const readBitkubJson = async (request: Request): Promise<unknown> => {
  if (!request.headers.get("content-type")?.includes("application/json"))
    throw new z.ZodError([]);
  const reader = request.body?.getReader();
  if (!reader) throw new z.ZodError([]);
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > 16_384) {
        await reader.cancel();
        throw new z.ZodError([]);
      }
      chunks.push(chunk.value);
    }
    try {
      return JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch {
      throw new z.ZodError([]);
    }
  } finally {
    reader.releaseLock();
  }
};
