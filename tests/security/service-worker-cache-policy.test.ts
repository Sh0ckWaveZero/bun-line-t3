import { describe, expect, mock, test } from "bun:test";
import { runInNewContext } from "node:vm";

const serviceWorkerSource = await Bun.file(
  new URL("../../public/sw.js", import.meta.url),
).text();

interface WorkerEvent {
  request?: Request;
  respondWith?: (response: Response | Promise<Response>) => void;
  waitUntil?: (promise: Promise<unknown>) => void;
}

type WorkerHandler = (event: WorkerEvent) => void;

function createServiceWorkerRuntime() {
  const handlers = new Map<string, WorkerHandler>();
  const addAll = mock(async (_urls: string[]) => undefined);
  const put = mock(async () => undefined);
  const open = mock(async () => ({ addAll, put }));
  const match = mock(async () => undefined);
  const keys = mock(async () => ["bun-line-t3-static-v1", "other-cache"]);
  const deleteCache = mock(async () => true);
  const claim = mock(async () => undefined);
  const skipWaiting = mock(async () => undefined);
  const networkFetch = mock(async () => new Response("network"));

  const workerScope = {
    addEventListener: (name: string, handler: WorkerHandler) => {
      handlers.set(name, handler);
    },
    clients: { claim },
    skipWaiting,
  };

  runInNewContext(serviceWorkerSource, {
    self: workerScope,
    caches: { open, match, keys, delete: deleteCache },
    fetch: networkFetch,
    URL,
  });

  return {
    handlers,
    cache: { addAll, put, open, match, keys, deleteCache },
    claim,
    networkFetch,
  };
}

describe("Service Worker cache policy", () => {
  test("ส่ง GET /api/** เข้า network โดยไม่อ่านหรือเขียน Cache Storage", async () => {
    const runtime = createServiceWorkerRuntime();
    const request = new Request("https://example.com/api/holidays");
    let responsePromise: Promise<Response> | undefined;

    runtime.handlers.get("fetch")?.({
      request,
      respondWith: (response) => {
        responsePromise = Promise.resolve(response);
      },
    });

    const response = await responsePromise;
    expect(await response?.text()).toBe("network");
    expect(runtime.networkFetch).toHaveBeenCalledTimes(1);
    expect(runtime.cache.match).not.toHaveBeenCalled();
    expect(runtime.cache.open).not.toHaveBeenCalled();
    expect(runtime.cache.put).not.toHaveBeenCalled();
  });

  test("precache เฉพาะ static assets และล้าง cache รุ่นเก่าเมื่อ activate", async () => {
    const runtime = createServiceWorkerRuntime();
    let installPromise: Promise<unknown> | undefined;
    let activatePromise: Promise<unknown> | undefined;

    runtime.handlers.get("install")?.({
      waitUntil: (promise) => {
        installPromise = promise;
      },
    });
    await installPromise;

    expect(runtime.cache.addAll).toHaveBeenCalledWith([
      "/manifest.json",
      "/icon-192x192.png",
      "/icon-512x512.png",
    ]);

    runtime.handlers.get("activate")?.({
      waitUntil: (promise) => {
        activatePromise = promise;
      },
    });
    await activatePromise;

    expect(runtime.cache.deleteCache).toHaveBeenCalledWith(
      "bun-line-t3-static-v1",
    );
    expect(runtime.cache.deleteCache).toHaveBeenCalledWith("other-cache");
    expect(runtime.claim).toHaveBeenCalledTimes(1);
  });
});
