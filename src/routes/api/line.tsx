import { createFileRoute } from "@tanstack/react-router";
import { env } from "@/env.mjs";
import { lineService } from "@/features/line/services/line.server";
import { utils } from "@/lib/validation";
import crypto from "node:crypto";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const body = JSON.parse(rawBody);
    const secret = env.LINE_CHANNEL_SECRET;
    const signature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("base64");

    // Compare your signature and header's signature
    const lineSignature = req.headers.get("x-line-signature");

    const expectedSignature = Buffer.from(signature, "utf8");
    const receivedSignature = Buffer.from(lineSignature ?? "", "utf8");
    const isValidSignature =
      expectedSignature.length === receivedSignature.length &&
      crypto.timingSafeEqual(expectedSignature, receivedSignature);

    if (!isValidSignature) {
      console.error("❌ [/api/line] Unauthorized - signature mismatch");
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    // set webhook
    if (utils.isEmpty(body?.events)) {
      return Response.json({ message: "ok" }, { status: 200 });
    }

    // 📋 Log Bot User IDs ทุก event
    const events = body.events || [];
    events.forEach((event: any, index: number) => {
      const botUserId = event?.source?.userId;
      const eventType = event?.type;
      const messageType = event?.message?.type;

      console.log(`📨 [LINE Webhook] Event ${index + 1}/${events.length}:`, {
        eventType,
        messageType,
        botUserId,
        timestamp: event.timestamp,
      });
    });

    // Create a more complete compatible request object for lineService
    const compatibleReq = {
      body,
      headers: Object.fromEntries(req.headers.entries()),
      query: {},
      cookies: {},
      method: "POST",
      url: req.url,
    } as any;

    const compatibleRes = {
      status: (code: number) => ({
        send: (data: any) => {
          return { status: code, data };
        },
        json: (data: any) => {
          return { status: code, data };
        },
      }),
      json: (data: any) => {
        return data;
      },
    } as any;

    await lineService.handleEvent(compatibleReq, compatibleRes);

    return Response.json({ message: "ok" }, { status: 200 });
  } catch (error) {
    console.error(
      "LINE API error:",
      error instanceof Error ? error.message : "unknown error",
    );
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/line")({
  server: {
    handlers: {
      POST: ({ request }) => POST(request),
    },
  },
});
