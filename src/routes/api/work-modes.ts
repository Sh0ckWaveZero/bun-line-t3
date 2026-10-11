import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { getServerAuthSession } from "@/lib";
import { workModeService } from "@/features/attendance/services/work-mode.server";
import { formatZodErrors } from "@/lib/validation/zod-error";

const DateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "รูปแบบวันที่ต้องเป็น YYYY-MM-DD");

const MonthStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}$/, "รูปแบบเดือนต้องเป็น YYYY-MM");

const CreateWorkModeDaySchema = z.object({
  date: DateStringSchema,
  type: z.enum(["wfh", "onsite"]),
  note: z.string().max(500).optional(),
});

async function requireSession(req: Request) {
  const session = await getServerAuthSession(req);
  if (!session?.user?.id) {
    return {
      session: null,
      response: Response.json(
        { success: false, message: "กรุณาเข้าสู่ระบบ" },
        { status: 401 },
      ),
    };
  }
  return { session, response: null };
}

export async function GET(req: Request) {
  try {
    const { session, response } = await requireSession(req);
    if (!session) return response;

    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");
    if (!month) {
      return Response.json(
        { success: false, message: "กรุณาระบุเดือน (YYYY-MM)" },
        { status: 422 },
      );
    }
    const parsedMonth = MonthStringSchema.safeParse(month);
    if (!parsedMonth.success) {
      return Response.json(
        { success: false, message: "รูปแบบเดือนไม่ถูกต้อง (YYYY-MM)" },
        { status: 422 },
      );
    }

    const workModeDays = await workModeService.getUserWorkModeDaysInMonth(
      session.user.id,
      month,
    );
    return Response.json({ success: true, workModeDays });
  } catch {
    return Response.json(
      {
        success: false,
        message: "เกิดข้อผิดพลาดของระบบ กรุณาลองใหม่หรือติดต่อผู้ดูแล",
      },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const { session, response } = await requireSession(req);
    if (!session) return response;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return Response.json(
        { success: false, message: "ข้อมูลไม่ถูกต้อง" },
        { status: 400 },
      );
    }

    const parsed = CreateWorkModeDaySchema.safeParse(body);
    if (!parsed.success) {
      const formatted = formatZodErrors(parsed.error);
      return Response.json(
        {
          success: false,
          message: formatted.details[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
          details: formatted.details,
        },
        { status: 400 },
      );
    }

    const workModeDay = await workModeService.markWorkModeDay({
      userId: session.user.id,
      date: parsed.data.date,
      type: parsed.data.type,
      note: parsed.data.note,
    });
    return Response.json({
      success: true,
      message: "บันทึกสำเร็จ",
      workModeDay,
    });
  } catch {
    return Response.json(
      {
        success: false,
        message: "เกิดข้อผิดพลาดของระบบ กรุณาลองใหม่หรือติดต่อผู้ดูแล",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { session, response } = await requireSession(req);
    if (!session) return response;

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const parsedDate = DateStringSchema.safeParse(date);
    if (!parsedDate.success) {
      return Response.json(
        { success: false, message: "กรุณาระบุวันที่ (YYYY-MM-DD)" },
        { status: 422 },
      );
    }

    const removed = await workModeService.unmarkWorkModeDay(
      session.user.id,
      parsedDate.data,
    );
    if (!removed) {
      return Response.json(
        { success: false, message: "ไม่พบรายการที่ต้องการยกเลิก" },
        { status: 404 },
      );
    }
    return Response.json({ success: true, message: "ยกเลิกสำเร็จ" });
  } catch {
    return Response.json(
      {
        success: false,
        message: "เกิดข้อผิดพลาดของระบบ กรุณาลองใหม่หรือติดต่อผู้ดูแล",
      },
      { status: 500 },
    );
  }
}

export const Route = createFileRoute("/api/work-modes")({
  server: {
    handlers: {
      GET: ({ request }) => GET(request),
      POST: ({ request }) => POST(request),
      DELETE: ({ request }) => DELETE(request),
    },
  },
});
