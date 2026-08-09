import { describe, expect, test } from "bun:test";

process.env.SKIP_ENV_VALIDATION = "1";
process.env.APP_ENV = "test";

const {
  DELETE: deleteHoliday,
  POST: createHoliday,
  PUT: updateHoliday,
} = await import("@/routes/api/holidays");
const { secureMonitoringHandler } =
  await import("@/routes/api/monitoring/dashboard");

const forbiddenAuthorizer = async () =>
  Response.json(
    { success: false, message: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลส่วนผู้ดูแล" },
    { status: 403 },
  );

const allowedAuthorizer = async () => null;

describe("Admin endpoint authorization", () => {
  test("holiday mutations ปฏิเสธ authenticated non-admin ทุก method", async () => {
    const requests = [
      createHoliday(
        new Request("http://localhost/api/holidays", { method: "POST" }),
        forbiddenAuthorizer,
      ),
      updateHoliday(
        new Request("http://localhost/api/holidays", { method: "PUT" }),
        forbiddenAuthorizer,
      ),
      deleteHoliday(
        new Request("http://localhost/api/holidays", { method: "DELETE" }),
        forbiddenAuthorizer,
      ),
    ];

    const responses = await Promise.all(requests);
    expect(responses.map((response) => response.status)).toEqual([
      403, 403, 403,
    ]);
  });

  test("holiday mutations ผ่าน authorization ก่อนเข้าสู่ validation", async () => {
    const invalidJsonRequest = (method: string) =>
      new Request("http://localhost/api/holidays", {
        method,
        body: "not-json",
      });

    expect(
      (await createHoliday(invalidJsonRequest("POST"), allowedAuthorizer))
        .status,
    ).toBe(400);
    expect(
      (await updateHoliday(invalidJsonRequest("PUT"), allowedAuthorizer))
        .status,
    ).toBe(400);
    expect(
      (
        await deleteHoliday(
          new Request("http://localhost/api/holidays", { method: "DELETE" }),
          allowedAuthorizer,
        )
      ).status,
    ).toBe(422);
  });

  test("monitoring dashboard ปฏิเสธ non-admin ก่อนอ่านข้อมูลระบบ", async () => {
    const response = await secureMonitoringHandler(
      new Request("http://localhost/api/monitoring/dashboard", {
        headers: { "User-Agent": "Security-Test/1.0" },
      }),
      forbiddenAuthorizer,
    );

    expect(response.status).toBe(403);
  });

  test("monitoring dashboard ที่ผ่าน authorization เข้าสู่ request validation", async () => {
    const response = await secureMonitoringHandler(
      new Request(
        "http://localhost/api/monitoring/dashboard?timeRange=invalid",
        {
          headers: { "User-Agent": "Security-Test/1.0" },
        },
      ),
      allowedAuthorizer,
    );

    expect(response.status).toBe(400);
  });
});
