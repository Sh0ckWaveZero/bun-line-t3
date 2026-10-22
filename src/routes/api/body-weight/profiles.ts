/**
 * Body Weight Profiles API — สร้าง/แก้โปรไฟล์ผู้ใช้ตาชั่ง
 * PUT /api/body-weight/profiles — บันทึกแล้วคำนวณ body composition ใหม่ทั้งประวัติของโปรไฟล์
 */

import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { getServerAuthSession } from "@/lib/auth/auth";
import { saveScaleProfile } from "@/features/body-weight/services/body-weight.server";

const saveProfileSchema = z.object({
  id: z.string().min(1).optional(),
  name: z.string().min(1, "กรุณาใส่ชื่อ").max(60),
  heightCm: z
    .number()
    .min(50, "ส่วนสูงไม่ถูกต้อง")
    .max(260, "ส่วนสูงไม่ถูกต้อง")
    .nullable(),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "รูปแบบวันเกิดไม่ถูกต้อง (YYYY-MM-DD)")
    .nullable(),
  male: z.boolean(),
  refWeightKg: z
    .number()
    .min(1, "น้ำหนักอ้างอิงไม่ถูกต้อง")
    .max(300, "น้ำหนักอ้างอิงไม่ถูกต้อง")
    .nullable(),
});

export async function PUT(request: Request) {
  try {
    const session = await getServerAuthSession(request);
    if (!session?.user?.id) {
      return Response.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 401 });
    }

    const input = saveProfileSchema.parse(await request.json());
    const profile = await saveScaleProfile(input);

    return Response.json(
      { success: true, data: profile, message: "บันทึกโปรไฟล์สำเร็จ" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "ข้อมูลไม่ถูกต้อง", details: error.issues },
        { status: 400 },
      );
    }
    console.error(
      "[PUT /api/body-weight/profiles]",
      (error as Error)?.message ?? error,
    );
    return Response.json(
      { error: "ไม่สามารถบันทึกโปรไฟล์ได้" },
      { status: 500 },
    );
  }
}

export const Route = createFileRoute("/api/body-weight/profiles")({
  server: {
    handlers: {
      PUT: ({ request }) => PUT(request),
    },
  },
});
