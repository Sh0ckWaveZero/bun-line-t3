import { env } from "@/env.mjs";
import { lineService } from "@/features/line/services/line";
import { utils } from "@/lib/validation";
import { NextRequest } from "next/server";
import crypto from "node:crypto";

export async function POST(req: NextRequest) {
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
      // Add missing properties that might be used
      query: {},
      cookies: {},
      method: "POST",
      url: req.url,
    } as any;

    const compatibleRes = {
      status: (code: number) => ({
        send: (data: any) => {
          console.log(`Response ${code}:`, data);
          return { status: code, data };
        },
        json: (data: any) => {
          console.log(`Response ${code}:`, data);
          return { status: code, data };
        },
      }),
      json: (data: any) => {
        console.log("Response:", data);
        return data;
      },
    } as any;

    // Send loading indicator immediately for each event
    // This provides instant visual feedback to user
    // Extract userId from any event type (message, postback, etc.)
    const events = body.events || [];
    const userIds = new Set<string>();

    for (const event of events) {
      // Get userId from various event source types
      const userId =
        event.source?.userId || // Standard message/postback events
        event.source?.groupId || // Group events
        event.source?.roomId; // Room events

      if (userId) {
        userIds.add(userId);
      }
    }

    // Fire-and-forget pattern - respond to LINE immediately
    lineService.handleEvent(compatibleReq, compatibleRes).catch((error) => {
      console.error("❌ Error processing LINE event:", error);
    });

    // Return immediately to LINE (must respond within 3 seconds)
    return Response.json({ message: "ok" }, { status: 200 });
  } catch (error) {
    console.error("LINE API error:", error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
