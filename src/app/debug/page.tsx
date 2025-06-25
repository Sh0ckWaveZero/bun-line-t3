"use client";

import Link from "next/link";

import { useEffect, useState } from "react";

interface EnvironmentInfo {
  hostname: string;
  port: string;
  protocol: string;
  href: string;
  userAgent: string;
  env: Record<string, string>;
}

interface WebSocketStatus {
  connected: boolean;
  url: string;
  error?: string;
}

export default function DebugPage() {
  const [envInfo, setEnvInfo] = useState<EnvironmentInfo | null>(null);
  const [wsStatus, setWsStatus] = useState<WebSocketStatus | null>(null);
  const [hydrationSafe, setHydrationSafe] = useState(false);

  useEffect(() => {
    // เมื่อ component mount บน client
    setHydrationSafe(true);

    setEnvInfo({
      hostname: window.location.hostname,
      port: window.location.port,
      protocol: window.location.protocol,
      href: window.location.href,
      userAgent: navigator.userAgent,
      env: {
        NODE_ENV: process.env.NODE_ENV || "undefined",
        NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV || "undefined",
        NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || "undefined",
      },
    });

    // ทดสอบ WebSocket connection
    const testWebSocket = () => {
      try {
        const wsUrl = `ws://${window.location.hostname}:${window.location.port}/_next/webpack-hmr`;
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          setWsStatus({ connected: true, url: wsUrl });
          ws.close();
        };

        ws.onerror = (_error) => {
          setWsStatus({
            connected: false,
            url: wsUrl,
            error: "Connection failed",
          });
        };

        // Timeout after 5 seconds
        setTimeout(() => {
          if (ws.readyState === WebSocket.CONNECTING) {
            ws.close();
            setWsStatus({
              connected: false,
              url: wsUrl,
              error: "Connection timeout",
            });
          }
        }, 5000);
      } catch (error) {
        setWsStatus({
          connected: false,
          url: "N/A",
          error: `Error: ${error}`,
        });
      }
    };

    testWebSocket();
  }, []);

  if (!hydrationSafe) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto max-w-4xl p-8">
      <h1 className="mb-8 text-center text-3xl font-bold">
        🔍 Development Debug Console
      </h1>

      {/* Environment Information */}
      <div className="mb-6 rounded-lg bg-gray-100 p-6">
        <h2 className="mb-4 text-xl font-semibold text-gray-800">
          🌐 Environment Information
        </h2>
        {envInfo && (
          <div className="space-y-2 font-mono text-sm">
            <div>
              <strong>Hostname:</strong> {envInfo.hostname}
            </div>
            <div>
              <strong>Port:</strong> {envInfo.port}
            </div>
            <div>
              <strong>Protocol:</strong> {envInfo.protocol}
            </div>
            <div>
              <strong>Full URL:</strong> {envInfo.href}
            </div>
            <div className="mt-4">
              <strong>Environment Variables:</strong>
              <pre className="mt-2 overflow-x-auto rounded bg-gray-200 p-3">
                {JSON.stringify(envInfo.env, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* WebSocket Status */}
      <div className="mb-6 rounded-lg bg-gray-100 p-6">
        <h2 className="mb-4 text-xl font-semibold text-gray-800">
          🔌 WebSocket HMR Status
        </h2>
        {wsStatus && (
          <div className="space-y-2">
            <div
              className={`font-semibold ${wsStatus.connected ? "text-green-600" : "text-red-600"}`}
            >
              Status: {wsStatus.connected ? "✅ Connected" : "❌ Failed"}
            </div>
            <div className="font-mono text-sm">
              <strong>URL:</strong> {wsStatus.url}
            </div>
            {wsStatus.error && (
              <div className="font-mono text-sm text-red-600">
                <strong>Error:</strong> {wsStatus.error}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Browser Information */}
      <div className="mb-6 rounded-lg bg-gray-100 p-6">
        <h2 className="mb-4 text-xl font-semibold text-gray-800">
          🌐 Browser Information
        </h2>
        {envInfo && (
          <div className="font-mono text-sm">
            <strong>User Agent:</strong>
            <div className="mt-2 break-all rounded bg-gray-200 p-3">
              {envInfo.userAgent}
            </div>
          </div>
        )}
      </div>

      {/* Console Check Instructions */}
      <div className="border-l-4 border-blue-400 bg-blue-50 p-4">
        <h3 className="mb-2 text-lg font-semibold text-blue-800">
          📝 การตรวจสอบ Console
        </h3>
        <div className="space-y-2 text-sm text-blue-700">
          <p>1. เปิด Developer Tools (F12)</p>
          <p>2. ไปที่ Console tab</p>
          <p>3. ตรวจสอบข้อผิดพลาดต่อไปนี้:</p>
          <ul className="ml-4 list-inside list-disc space-y-1">
            <li>❌ Hydration mismatch warnings</li>
            <li>❌ WebSocket connection failures</li>
            <li>❌ Font loading errors (403)</li>
            <li>❌ Cross-origin request blocks</li>
          </ul>
          <p className="mt-3 font-semibold">
            ✅ หากไม่มีข้อผิดพลาดข้างต้น แสดงว่าการแก้ไขสำเร็จ!
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-8 text-center">
        <Link
          href="/"
          className="rounded bg-blue-500 px-6 py-2 text-white transition-colors hover:bg-blue-600"
        >
          ← กลับไปหน้าหลัก
        </Link>
      </div>
    </div>
  );
}
