import { afterEach, describe, expect, spyOn, test } from "bun:test";
import { getBangkokCurrentWeather } from "@/features/weather/services/bangkok-weather.server";

const NOW = 1_800_000_000;
const originalFetch = globalThis.fetch;

function weatherResponse(code = 61, time = NOW) {
  return {
    current_units: { time: "unixtime", temperature_2m: "°C" },
    current: { time, temperature_2m: 28.4, weather_code: code },
  };
}

afterEach(() => {
  globalThis.fetch = originalFetch;
  spyOn(Date, "now").mockRestore();
});

describe("Bangkok current weather", () => {
  test("requests Bangkok current conditions with a three-second deadline", async () => {
    spyOn(Date, "now").mockReturnValue(NOW * 1000);
    const timeout = spyOn(AbortSignal, "timeout");
    let requestedUrl: URL | undefined;
    let requestedSignal: AbortSignal | null | undefined;
    globalThis.fetch = (async (input, init) => {
      requestedUrl = new URL(String(input));
      requestedSignal = init?.signal;
      return Response.json(weatherResponse());
    }) as typeof fetch;
    try {
      expect(await getBangkokCurrentWeather()).toBe(
        "Open-Meteo ประเมินสภาพอากาศปัจจุบันบริเวณกรุงเทพฯ มีฝนเล็กน้อย อุณหภูมิ 28°C",
      );
      expect(requestedUrl?.origin).toBe("https://api.open-meteo.com");
      expect(requestedUrl?.searchParams.get("latitude")).toBe("13.7563");
      expect(requestedUrl?.searchParams.get("longitude")).toBe("100.5018");
      expect(requestedUrl?.searchParams.get("current")).toBe(
        "temperature_2m,weather_code",
      );
      expect(requestedUrl?.searchParams.get("timezone")).toBe("Asia/Bangkok");
      expect(requestedUrl?.searchParams.get("timeformat")).toBe("unixtime");
      expect(timeout).toHaveBeenCalledWith(3000);
      expect(requestedSignal).toBeInstanceOf(AbortSignal);
    } finally {
      timeout.mockRestore();
    }
  });

  test.each([
    [0, "ท้องฟ้าโปร่ง"],
    [3, "มีเมฆมาก"],
    [51, "มีฝนละอองเล็กน้อย"],
    [65, "มีฝนตกหนัก"],
    [95, "มีพายุฝนฟ้าคะนอง"],
    [97, "มีพายุฝนฟ้าคะนองรุนแรง"],
    [99, "มีพายุฝนฟ้าคะนองและลูกเห็บหนัก"],
  ])(
    "describes code %i without assuming sunlight",
    async (code, description) => {
      spyOn(Date, "now").mockReturnValue(NOW * 1000);
      globalThis.fetch = (async () =>
        Response.json(weatherResponse(code))) as typeof fetch;
      expect(await getBangkokCurrentWeather()).toContain(description);
    },
  );

  test.each([
    ["unknown code", weatherResponse(100)],
    ["stale", weatherResponse(61, NOW - 3601)],
    ["future", weatherResponse(61, NOW + 301)],
    ["null current", { ...weatherResponse(), current: null }],
    [
      "null temperature",
      {
        ...weatherResponse(),
        current: { ...weatherResponse().current, temperature_2m: null },
      },
    ],
    [
      "extreme temperature",
      {
        ...weatherResponse(),
        current: { ...weatherResponse().current, temperature_2m: 100 },
      },
    ],
    ["fractional time", weatherResponse(61, NOW + 0.5)],
    ["negative time", weatherResponse(61, -1)],
    ["fractional code", weatherResponse(61.5)],
    [
      "wrong temperature unit",
      {
        ...weatherResponse(),
        current_units: { time: "unixtime", temperature_2m: "°F" },
      },
    ],
    [
      "wrong time unit",
      {
        ...weatherResponse(),
        current_units: { time: "iso8601", temperature_2m: "°C" },
      },
    ],
    ["missing units", { current: weatherResponse().current }],
    [
      "wrong weather unit",
      {
        ...weatherResponse(),
        current_units: {
          ...weatherResponse().current_units,
          weather_code: "unknown",
        },
      },
    ],
  ])("omits %s data", async (_label, payload) => {
    spyOn(Date, "now").mockReturnValue(NOW * 1000);
    globalThis.fetch = (async () => Response.json(payload)) as typeof fetch;
    expect(await getBangkokCurrentWeather()).toBeUndefined();
  });

  test.each(["http", "json", "network", "abort"])(
    "omits weather on %s failure",
    async (failure) => {
      globalThis.fetch = (async () => {
        if (failure === "http")
          return new Response("unavailable", { status: 503 });
        if (failure === "json") return new Response("invalid JSON");
        throw failure === "abort"
          ? new DOMException("Timed out", "TimeoutError")
          : new Error("Network unavailable");
      }) as typeof fetch;
      expect(await getBangkokCurrentWeather()).toBeUndefined();
    },
  );
});
