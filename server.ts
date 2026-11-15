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
  subscribe: (
    lineUserId: string,
    cb: (event: { type: string }) => void,
  ) => () => void;
};

type DcaStreamAuthorizer = (request: Request) => Promise<string | null>;

function getDcaEventManager(): DCAEventManagerLike | undefined {
  return (globalThis as Record<string, unknown>).__dcaEventManager as
    DCAEventManagerLike | undefined;
}

function getDcaStreamAuthorizer(): DcaStreamAuthorizer | undefined {
  return (globalThis as Record<string, unknown>).__authorizeDcaStreamRequest as
    DcaStreamAuthorizer | undefined;
}

export async function initializeDcaServerBridge(serverEntry: ServerEntry) {
  if (getDcaStreamAuthorizer()) return;

  // TanStack route modules are lazy-loaded in the production bundle. Resolve
  // the DCA route once so it can register the auth bridge on globalThis.
  const response = await serverEntry.fetch(
    new Request("http://localhost/api/dca/stream", { method: "OPTIONS" }),
  );
  await response.body?.cancel();

  if (!getDcaStreamAuthorizer()) {
    throw new Error("DCA stream authorization bridge failed to initialize");
  }
}

export async function handleDcaSseStream(request: Request): Promise<Response> {
  const authorizeRequest = getDcaStreamAuthorizer();
  if (!authorizeRequest) {
    return Response.json(
      { error: "ระบบยังไม่พร้อมให้บริการ" },
      { status: 503 },
    );
  }

  let lineUserId: string | null;
  try {
    lineUserId = await authorizeRequest(request);
  } catch {
    return Response.json(
      { error: "ระบบยังไม่พร้อมให้บริการ" },
      { status: 503 },
    );
  }

  if (!lineUserId) {
    return Response.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }

  const eventManager = getDcaEventManager();
  if (!eventManager) {
    return Response.json(
      { error: "ระบบยังไม่พร้อมให้บริการ" },
      { status: 503 },
    );
  }

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
      const unsubscribe = eventManager.subscribe(lineUserId, (event) => {
        send(`data: ${JSON.stringify({ type: event.type })}\n\n`);
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
        unsubscribe();
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

// ─── Security headers (modern-web-guidance: security Phase 1 + companion) ───
// เติมบน response ทุกเส้นทาง (SSE/static/SSR) — mutate บน response เดิมเพื่อไม่
// ต้อง clone body (สำคัญกับ SSE stream)
/**
 * คืน security headers ตาม environment — HSTS ใส่เฉพาะ production เพราะ dev/preview
 * รันบน plain HTTP แล้ว header จะ cache ค้างใน browser
 */
export function buildSecurityHeaders(
  env: Record<string, string | undefined>,
): Record<string, string> {
  const headers: Record<string, string> = {
    // Clickjacking: อนุญาตเฉพาะ same-origin framing — หน้า onsite-report ฝัง PDF
    // ผ่าน <iframe src="blob:..."> ซึ่ง blob document สืบทอด CSP ของหน้าสร้างมัน
    // ('none' จะบล็อก preview ของเราเอง)
    "Content-Security-Policy": "frame-ancestors 'self'",
    "X-Frame-Options": "SAMEORIGIN",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    // แอปไม่ใช้ camera/geolocation/microphone
    "Permissions-Policy": "camera=(), geolocation=(), microphone=()",
    // เว็บนี้เปิด OAuth popup เอง (LINE Login) — allow-popups ยังคง opener ของ popup ที่เราเปิด
    "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    // resource ภายในไม่ได้ถูกออกแบบให้ embed ข้าม origin
    "Cross-Origin-Resource-Policy": "same-origin",
  };

  if (env.APP_ENV === "production") {
    headers["Strict-Transport-Security"] =
      "max-age=31536000; includeSubDomains";
  }

  return headers;
}

// ─── CSP Report-Only (modern-web-guidance: security Phase 2) ────────────────
// รายงานละเมิดของ CSP เต็มรูปแบบโดยยัง "ไม่" บล็อกอะไร — เก็บ telemetry ก่อน
// โปรโมตเป็น enforce (Phase 3) ตาม staged rollout ของ guide
const CSP_REPORT_ENDPOINT_NAME = "csp-report";

/** URL ของ endpoint รับ report (absolute ตามที่ browser ต้องการ) — ไม่รู้ APP_URL = null */
export function buildReportingEndpoints(
  env: Record<string, string | undefined>,
): string | null {
  const rawAppUrl = env.APP_URL?.trim() ?? "";
  if (!rawAppUrl) return null;

  let origin: string;
  try {
    origin = new URL(rawAppUrl).origin;
  } catch {
    origin = rawAppUrl.replace(/\/+$/, "");
  }
  return `${CSP_REPORT_ENDPOINT_NAME}="${origin}/api/security/csp-report"`;
}

/**
 * Policy ที่ "ตั้งใจ" enforce ในระยะถัดไป — script-src ยังต้องยอม 'unsafe-inline'
 * เพราะ TanStack Start ฉีด inline script (hydration) + theme/SW bootstrap ของเรา;
 * ระยะถัดไปเปลี่ยนเป็น nonce-based ตาม guide security §3.2
 */
export function buildCspReportOnly(
  reportEndpointName: string | null = CSP_REPORT_ENDPOINT_NAME,
): string {
  const directives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    // LINE CDN avatars + blob: (โลโก้/ลายมือชื่อ onsite-report)
    "img-src 'self' data: blob: https:",
    "media-src 'self'",
    "connect-src 'self'",
    "worker-src 'self'",
    "manifest-src 'self'",
    // iframe PDF preview ผ่าน blob: URL
    "frame-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ];
  if (reportEndpointName) {
    directives.push(`report-to ${reportEndpointName}`);
  }
  return directives.join("; ");
}
// ────────────────────────────────────────────────────────────────────────────

function applySecurityHeaders(response: Response): Response {
  for (const [name, value] of Object.entries(
    buildSecurityHeaders(process.env),
  )) {
    response.headers.set(name, value);
  }

  // CSP report-only ต้องมีปลายทาง report ถึงจะมีประโยชน์ — ไม่รู้ APP_URL ข้ามไป
  const reportingEndpoints = buildReportingEndpoints(process.env);
  if (reportingEndpoints) {
    response.headers.set("Reporting-Endpoints", reportingEndpoints);
    response.headers.set(
      "Content-Security-Policy-Report-Only",
      buildCspReportOnly(),
    );
  }
  return response;
}
// ────────────────────────────────────────────────────────────────────────────

interface ServerEntry {
  fetch: (request: Request) => Response | Promise<Response>;
}

const port = Number(process.env.PORT ?? 3000);
const hostname = process.env.HOSTNAME ?? "0.0.0.0";
const rootDir = process.cwd();
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

export async function startServer() {
  const serverEntryModule = (await import(
    pathToFileURL(path.join(rootDir, "dist", "server", "server.js")).href
  )) as { default: ServerEntry };
  const serverEntry = serverEntryModule.default;
  await initializeDcaServerBridge(serverEntry);

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
        return applySecurityHeaders(await handleDcaSseStream(request));
      }
      // ────────────────────────────────────────────────────────────────────────

      // 🔒 Handle X-Forwarded-* headers from reverse proxy / Cloudflare
      // This fixes OAuth callbacks by preserving the original HTTPS protocol

      // Try X-Forwarded-Proto (standard reverse proxies)
      let forwardedProto = request.headers.get("x-forwarded-proto");

      // Cloudflare Tunnel: Check CF-Visitor header
      if (!forwardedProto) {
        const cfVisitor = request.headers.get("cf-visitor");
        if (cfVisitor) {
          try {
            const visitorData = JSON.parse(cfVisitor);
            if (visitorData.scheme) {
              forwardedProto = visitorData.scheme;
            }
          } catch {
            // Invalid JSON, ignore
          }
        }
      }

      const forwardedHost = request.headers.get("x-forwarded-host");
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
          // @ts-expect-error - duplex is supported by Bun but absent from DOM types
          duplex: "half",
        });

        // Log for debugging
        if (process.env.APP_ENV === "production") {
          console.log(
            `[Proxy] Forwarded request: ${protocol}//${host}${forwardedUrl.pathname}`,
          );
        }
      }

      const staticResponse = await serveStaticFile(request);

      if (staticResponse) {
        return applySecurityHeaders(staticResponse);
      }

      return applySecurityHeaders(await serverEntry.fetch(request));
    },
  });

  console.info(
    `TanStack Start server listening on http://${hostname}:${server.port}`,
  );

  return server;
}

if (import.meta.main) {
  await startServer();
}
