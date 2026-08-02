import { createFileRoute } from "@tanstack/react-router";
import { dcaEventManager } from "@/features/dca/lib/event-manager";
import { getAuthorizedLineUserId } from "@/lib/auth";

export async function GET(req: Request) {
  const lineUserId = await getAuthorizedLineUserId(req);
  if (!lineUserId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const headers = new Headers({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no", // ปิด buffering ใน nginx
    "Alt-Svc": "clear", // บังคับ HTTP/1.1 ไม่ใช้ QUIC (HTTP/3) กับ SSE
  });

  const encoder = new TextEncoder();
  let cleanupStream: (() => void) | undefined;

  // Create a readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      let closed = false;

      const closeStream = () => {
        if (closed) return;
        closed = true;
        cleanupStream = undefined;
        try {
          controller.close();
        } catch {
          // The client may have already closed the stream.
        }
      };

      // Send initial connection message
      const connectEvent = `data: ${JSON.stringify({ type: "connected", timestamp: Date.now() })}\n\n`;
      controller.enqueue(encoder.encode(connectEvent));

      // Subscribe to DCA events
      const unsubscribe = dcaEventManager.subscribe(lineUserId, (event) => {
        try {
          if (closed) return;
          // The event manager already scopes this event; do not send the
          // internal LINE ID or financial fields to the browser.
          const sseEvent = `data: ${JSON.stringify({ type: event.type })}\n\n`;
          controller.enqueue(encoder.encode(sseEvent));
        } catch (err) {
          console.error("SSE stream error:", err);
          cleanupStream?.();
        }
      });

      // Keep-alive ping every 30 seconds
      const pingInterval = setInterval(() => {
        try {
          if (closed) return;
          const ping = `: ping\n\n`;
          controller.enqueue(encoder.encode(ping));
        } catch {
          cleanupStream?.();
        }
      }, 30000);

      cleanupStream = () => {
        clearInterval(pingInterval);
        unsubscribe();
        closeStream();
      };

      // Cleanup on disconnect
      req.signal.addEventListener("abort", () => {
        cleanupStream?.();
      });
    },
    cancel() {
      cleanupStream?.();
    },
  });

  return new Response(stream, { headers });
}

export const Route = createFileRoute("/api/dca/stream")({
  server: {
    handlers: {
      GET: ({ request }) => GET(request),
    },
  },
});
