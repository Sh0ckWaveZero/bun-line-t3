import { afterEach, describe, expect, test } from "bun:test";

process.env.SKIP_ENV_VALIDATION = "1";
const { GET } = await import("@/routes/api/health");
const originalDatabaseUrl = process.env.DATABASE_URL;
const originalAuthSecret = process.env.AUTH_SECRET;

afterEach(() => {
  if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = originalDatabaseUrl;
  if (originalAuthSecret === undefined) delete process.env.AUTH_SECRET;
  else process.env.AUTH_SECRET = originalAuthSecret;
});

describe("ความพร้อมก่อน deploy", () => {
  test("คืน 200 เมื่อ environment และฐานข้อมูลพร้อม", async () => {
    process.env.DATABASE_URL = "postgresql://test";
    process.env.AUTH_SECRET = "test";
    const response = await GET(async () => [{ result: 1 }]);
    expect(response.status).toBe(200);
    expect((await response.json()).database).toBe("connected");
  });
  test("ฐานข้อมูลล้มเหลวคืน 503 และไม่เปิดเผย error ภายใน", async () => {
    process.env.DATABASE_URL = "postgresql://test";
    process.env.AUTH_SECRET = "test";
    const response = await GET(async () => {
      throw new Error("secret-database-password");
    });
    expect(response.status).toBe(503);
    const body = await response.text();
    expect(body).toContain("unhealthy");
    expect(body).not.toContain("secret-database-password");
  });
  test("environment ไม่ครบคืน 503 แม้ฐานข้อมูลตอบได้", async () => {
    delete process.env.AUTH_SECRET;
    const response = await GET(async () => []);
    expect(response.status).toBe(503);
  });
});
