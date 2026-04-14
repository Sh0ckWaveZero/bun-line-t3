import { stat } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

// ─── SSE: DCA Stream ────────────────────────────────────────────────────────
// Handle SSE โดยตรงใน Bun server เพื่อหลีกเลี่ยงปัญหา TanStack Start
// buffer/close streaming response ก่อนเวลา (INTERNAL_ERROR err 2)
//
// globalThis.__dcaEventManager ถูก init โดย bundle ตอน import server entry
// ด้านล่าง — server.ts access ผ่าน globalThis จึงใช้ instance เดียวกันเสมอ

type DCAEventManagerLike = {
  subscribe: (cb: (event: unknown) => void) => () => void;
};

function getDcaEventManager(): DCAEventManagerLike | undefined {
  return (globalThis as Record<string, unknown>)
    .__dcaEventManager as DCAEventManagerLike | undefined;
}

function handleDcaSseStream(request: Request): Response {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;

      const send = (chunk: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          closed = true;
        }
      };

      // ส่ง event แรกทันทีที่ connect
      send(
        `data: ${JSON.stringify({ type: "connected", timestamp: Date.now() })}\n\n`,
      );

      // Subscribe รับ DCA events จาก event manager (shared via globalThis)
      const eventManager = getDcaEventManager();
      const unsubscribe = eventManager?.subscribe((event) => {
        send(`data: ${JSON.stringify(event)}\n\n`);
      });

      // Keep-alive ping ทุก 20 วินาที ป้องกัน proxy timeout
      const pingInterval = setInterval(() => {
        if (closed) {
          clearInterval(pingInterval);
          return;
        }
        send(`: ping\n\n`);
      }, 20_000);

      // Cleanup เมื่อ client disconnect
      request.signal.addEventListener("abort", () => {
        if (closed) return;
        closed = true;
        clearInterval(pingInterval);
        unsubscribe?.();
        try {
          controller.close();
        } catch {
          // controller อาจถูก close ไปแล้ว
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
// ────────────────────────────────────────────────────────────────────────────

interface StaticFileResult {
  filePath: string;
  size: number;
  mtime: Date;
}

interface ServerEntry {
  fetch: (request: Request) => Response | Promise<Response>;
}

const port = Number(process.env.PORT ?? 3000);
const hostname = process.env.HOSTNAME ?? "0.0.0.0";
const rootDir = process.cwd();
const serverEntryModule = (await import(
  pathToFileURL(path.join(rootDir, "dist", "server", "server.js")).href
)) as { default: ServerEntry };
const serverEntry = serverEntryModule.default;
const staticRoots = [
  path.join(rootDir, "dist", "client"),
  path.join(rootDir, "public"),
];

const contentTypes: Record<string, string> = {
  ".avif": "image/avif",
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function getRequestPath(request: Request) {
  try {
    return decodeURIComponent(new URL(request.url).pathname);
  } catch {
    return null;
  }
}

function resolveStaticPath(root: string, requestPath: string) {
  if (requestPath === "/" || requestPath.includes("\0")) {
    return null;
  }

  const relativePath = path.normalize(requestPath).replace(/^[/\\]+/, "");
  const filePath = path.join(root, relativePath);
  const rootWithSeparator = root.endsWith(path.sep)
    ? root
    : `${root}${path.sep}`;

  if (filePath !== root && !filePath.startsWith(rootWithSeparator)) {
    return null;
  }

  return filePath;
}

async function findStaticFile(requestPath: string) {
  for (const staticRoot of staticRoots) {
    const filePath = resolveStaticPath(staticRoot, requestPath);

    if (!filePath) {
      continue;
    }

    try {
      const fileStat = await stat(filePath);

      if (!fileStat.isFile()) {
        continue;
      }

      return {
        filePath,
        size: fileStat.size,
        mtime: fileStat.mtime,
      } satisfies StaticFileResult;
    } catch {
      continue;
    }
  }

  return null;
}

function getCacheControl(requestPath: string) {
  if (requestPath.startsWith("/assets/")) {
    return "public, max-age=31536000, immutable";
  }

  return "public, max-age=3600";
}

async function serveStaticFile(request: Request) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return null;
  }

  const requestPath = getRequestPath(request);

  if (!requestPath) {
    return null;
  }

  const staticFile = await findStaticFile(requestPath);

  if (!staticFile) {
    return null;
  }

  const headers = new Headers({
    "Cache-Control": getCacheControl(requestPath),
    "Content-Length": String(staticFile.size),
    "Content-Type":
      contentTypes[path.extname(staticFile.filePath).toLowerCase()] ??
      "application/octet-stream",
    "Last-Modified": staticFile.mtime.toUTCString(),
  });

  if (request.method === "HEAD") {
    return new Response(null, { headers });
  }

  return new Response(Bun.file(staticFile.filePath), { headers });
}

const server = Bun.serve({
  port,
  hostname,
  async fetch(request) {
    // ─── SSE endpoint: handle ก่อน TanStack Start ───────────────────────────
    // TanStack Start's server route ไม่ support long-lived streaming response
    // ทำให้ stream ปิดทันที (HTTP/2 INTERNAL_ERROR err 2)
    // จึง handle โดยตรงใน Bun native server แทน
    const url = new URL(request.url);
    if (url.pathname === "/api/dca/stream" && request.method === "GET") {
      return handleDcaSseStream(request);
    }
    // ────────────────────────────────────────────────────────────────────────

    // 🔒 Handle X-Forwarded-* headers from reverse proxy
    // This fixes OAuth callbacks by preserving the original HTTPS protocol
    const forwardedProto = request.headers.get("x-forwarded-proto");
    const forwardedHost = request.headers.get("x-forwarded-host");
    const forwardedFor = request.headers.get("x-forwarded-for");

    if (forwardedProto || forwardedHost) {
      // Reconstruct URL with forwarded headers
      const protocol = forwardedProto ?? url.protocol;
      const host = forwardedHost ?? url.host;
      const forwardedUrl = new URL(request.url);

      if (forwardedProto) {
        forwardedUrl.protocol = protocol;
      }
      if (forwardedHost) {
        forwardedUrl.host = host;
      }

      // Create new request with corrected URL
      request = new Request(forwardedUrl.toString(), {
        method: request.method,
        headers: request.headers,
        body: request.body,
        // @ts-ignore - duplex property is required for Node.js fetch
        duplex: "half",
      });

      // Log for debugging
      if (process.env.APP_ENV === "production") {
        console.log(`[Proxy] Forwarded request: ${protocol}//${host}${forwardedUrl.pathname}`);
      }
    }

    const staticResponse = await serveStaticFile(request);

    if (staticResponse) {
      return staticResponse;
    }

    return serverEntry.fetch(request);
  },
});

console.info(
  `TanStack Start server listening on http://${hostname}:${server.port}`,
);
