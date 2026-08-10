import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { handleDcaSseStream, initializeDcaServerBridge } from "../../server";

interface DcaEventLike {
  type: string;
  data: {
    lineUserId: string;
  };
}

interface DcaBridgeGlobal {
  __authorizeDcaStreamRequest?: (request: Request) => Promise<string | null>;
  __dcaEventManager?: {
    subscribe: (
      lineUserId: string,
      callback: (event: DcaEventLike) => void,
    ) => () => void;
  };
}

const bridgeGlobal = globalThis as typeof globalThis & DcaBridgeGlobal;
let previousAuthorizer: DcaBridgeGlobal["__authorizeDcaStreamRequest"];
let previousEventManager: DcaBridgeGlobal["__dcaEventManager"];

beforeEach(() => {
  previousAuthorizer = bridgeGlobal.__authorizeDcaStreamRequest;
  previousEventManager = bridgeGlobal.__dcaEventManager;
});

afterEach(() => {
  bridgeGlobal.__authorizeDcaStreamRequest = previousAuthorizer;
  bridgeGlobal.__dcaEventManager = previousEventManager;
});

describe("DCA native SSE adapter", () => {
  test("bootstrap โหลด route เพื่อ register authorizer ก่อนรับ request แรก", async () => {
    bridgeGlobal.__authorizeDcaStreamRequest = undefined;
    const authorizer = async () => "U_AUTHORIZED";
    const fetch = mock(async (request: Request) => {
      expect(request.method).toBe("OPTIONS");
      expect(new URL(request.url).pathname).toBe("/api/dca/stream");
      bridgeGlobal.__authorizeDcaStreamRequest = authorizer;
      return new Response(null, { status: 204 });
    });

    await initializeDcaServerBridge({ fetch });

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(bridgeGlobal.__authorizeDcaStreamRequest).toBe(authorizer);
  });

  test("bootstrap หยุด startup เมื่อ route ไม่ register authorizer", async () => {
    bridgeGlobal.__authorizeDcaStreamRequest = undefined;

    await expect(
      initializeDcaServerBridge({
        fetch: async () => new Response(null, { status: 204 }),
      }),
    ).rejects.toThrow("DCA stream authorization bridge failed to initialize");
  });

  test("ปฏิเสธ request ที่ไม่มี session ก่อนเปิด stream", async () => {
    bridgeGlobal.__authorizeDcaStreamRequest = async () => null;
    const subscribe = mock(() => () => undefined);
    bridgeGlobal.__dcaEventManager = { subscribe };

    const response = await handleDcaSseStream(
      new Request("http://localhost/api/dca/stream"),
    );

    expect(response.status).toBe(401);
    expect(subscribe).not.toHaveBeenCalled();
  });

  test("ตอบ service unavailable เมื่อระบบตรวจ session ล้มเหลว", async () => {
    bridgeGlobal.__authorizeDcaStreamRequest = async () => {
      throw new Error("database unavailable");
    };
    const subscribe = mock(() => () => undefined);
    bridgeGlobal.__dcaEventManager = { subscribe };

    const response = await handleDcaSseStream(
      new Request("http://localhost/api/dca/stream"),
    );

    expect(response.status).toBe(503);
    expect(subscribe).not.toHaveBeenCalled();
  });

  test("ไม่เปิด stream เมื่อ event manager ยังไม่พร้อม", async () => {
    bridgeGlobal.__authorizeDcaStreamRequest = async () => "U_AUTHORIZED";
    bridgeGlobal.__dcaEventManager = undefined;

    const response = await handleDcaSseStream(
      new Request("http://localhost/api/dca/stream"),
    );

    expect(response.status).toBe(503);
  });

  test("ผูก listener กับ LINE user จาก session และไม่ส่ง ID กลับ client", async () => {
    const abortController = new AbortController();
    const unsubscribe = mock(() => undefined);
    let eventCallback: ((event: DcaEventLike) => void) | undefined;

    bridgeGlobal.__authorizeDcaStreamRequest = async () => "U_AUTHORIZED";
    const subscribe = mock(
      (lineUserId: string, callback: (event: DcaEventLike) => void) => {
        expect(lineUserId).toBe("U_AUTHORIZED");
        eventCallback = callback;
        return unsubscribe;
      },
    );
    bridgeGlobal.__dcaEventManager = { subscribe };

    const response = await handleDcaSseStream(
      new Request("http://localhost/api/dca/stream", {
        signal: abortController.signal,
      }),
    );
    const reader = response.body?.getReader();
    expect(reader).toBeDefined();

    const connectedChunk = await reader!.read();
    expect(new TextDecoder().decode(connectedChunk.value)).toContain(
      '"type":"connected"',
    );

    eventCallback?.({
      type: "dca-updated",
      data: { lineUserId: "U_AUTHORIZED" },
    });
    const eventChunk = await reader!.read();
    const eventText = new TextDecoder().decode(eventChunk.value);

    expect(eventText).toContain('data: {"type":"dca-updated"}');
    expect(eventText).not.toContain("U_AUTHORIZED");

    abortController.abort();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});
