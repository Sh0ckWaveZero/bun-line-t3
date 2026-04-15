import { createFileRoute } from "@tanstack/react-router";
import { env } from "@/env.mjs";
import { lineService } from "@/features/line/services/line.server";
import { utils } from "@/lib/validation";
import crypto from "node:crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = JSON.stringify(body);

    const secret = env.LINE_CHANNEL_SECRET;
    const signature = crypto
      .createHmac("SHA256", secret as string)
      .update(data as string)
      .digest("base64")
      .toString();

    // Compare your signature and header's signature
    const lineSignature = req.headers.get("x-line-signature");

    if (signature !== lineSignature) {
      console.error("❌ [/api/line] Unauthorized - signature mismatch");
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    // set webhook
    if (utils.isEmpty(body?.events)) {
      return Response.json({ message: "ok" }, { status: 200 });
    }

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
    console.error("LINE API error:", error);
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
