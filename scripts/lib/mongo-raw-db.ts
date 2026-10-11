/**
 * สคริปต์ชุด MongoDB-era ใช้ $runCommandRaw ซึ่งไม่มีบน PrismaClient ของ
 * Postgres provider — สคริปต์เหล่านี้คงไว้เพื่ออ้างอิง index เดิม
 * helper นี้ cast ให้ครั้งเดียวแทนการวาง cast ซ้ำในทุกไฟล์
 */
type AppDb = (typeof import("../../src/lib/database/db"))["db"];

export const asRawDb = (database: AppDb) =>
  database as unknown as {
    $runCommandRaw: (command: Record<string, unknown>) => Promise<unknown>;
  };
