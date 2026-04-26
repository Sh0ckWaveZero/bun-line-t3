import { createFileRoute } from "@tanstack/react-router";
import { dcaEventManager } from "@/features/dca/lib/event-manager";

export async function GET(req: Request) {
  const headers = new Headers({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no", // ปิด buffering ใน nginx
    "Alt-Svc": "clear", // บังคับ HTTP/1.1 ไม่ใช้ QUIC (HTTP/3) กับ SSE
  });

  const encoder = new TextEncoder();

  // Create a readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const connectEvent = `data: ${JSON.stringify({ type: "connected", timestamp: Date.now() })}\n\n`;
      controller.enqueue(encoder.encode(connectEvent));

      // Subscribe to DCA events
      const unsubscribe = dcaEventManager.subscribe((event) => {
        try {
          const sseEvent = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(sseEvent));
        } catch (err) {
          console.error("SSE stream error:", err);
          unsubscribe();
          controller.close();
        }
      });

      // Keep-alive ping every 30 seconds
      const pingInterval = setInterval(() => {
        try {
          const ping = `: ping\n\n`;
          controller.enqueue(encoder.encode(ping));
        } catch {
          clearInterval(pingInterval);
        }
      }, 30000);

      // Cleanup on disconnect
      req.signal.addEventListener("abort", () => {
        clearInterval(pingInterval);
        unsubscribe();
        controller.close();
      });
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
