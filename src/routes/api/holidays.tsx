import { createFileRoute } from "@tanstack/react-router";
import { getServerAuthSession } from "@/lib";
import { holidayService } from "@/features/attendance/services/holidays.server";
import { canRequestAttendanceReport } from "@/lib/line/permissions";
import { db } from "@/lib/database/db";

// GET - Fetch all holidays or filtered by year/month
export async function GET(req: Request) {
  try {
    const session = await getServerAuthSession(req);
    if (!session?.user?.id) {
      return Response.json(
        { success: false, message: "กรุณาเข้าสู่ระบบ" },
        { status: 401 },
      );
    }

    // LINE Permission check - ต้องได้รับอนุมัติให้ดูรายงาน
    const lineAccount = await db.account.findFirst({
      where: {
        userId: session.user.id,
        providerId: "line",
      },
      select: {
        accountId: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    if (lineAccount) {
      const hasPermission = await canRequestAttendanceReport(lineAccount.accountId);
      if (!hasPermission) {
        return Response.json(
          {
            success: false,
            message: "คุณยังไม่ได้รับอนุมัติให้ดูข้อมูลวันหยุด กรุณาติดต่อผู้ดูแลระบบ",
          },
          { status: 403 },
        );
      }
    }

    const { searchParams } = new URL(req.url);
    const year = searchParams.get("year");
    const month = searchParams.get("month");
    const type = searchParams.get("type");
    const exportFormat = searchParams.get("export"); // json or csv

    let holidays;

    // Export functionality
    if (exportFormat === "json" || exportFormat === "csv") {
      holidays = await holidayService.getAllHolidays({
        year: year ? parseInt(year) : undefined,
        type: type || undefined,
        isActive: true,
      });

      if (exportFormat === "json") {
        return new Response(JSON.stringify(holidays, null, 2), {
          headers: {
            "Content-Type": "application/json",
            "Content-Disposition": `attachment; filename="holidays-${year || "all"}.json"`,
          },
        });
      } else if (exportFormat === "csv") {
        const headers = ["date", "nameEnglish", "nameThai", "year", "type", "description"];
        const csvContent = [
          headers.join(","),
          ...holidays.map((h) =>
            [
              h.date,
              `"${h.nameEnglish}"`,
              `"${h.nameThai}"`,
              h.year,
              h.type,
              `"${h.description || ""}"`,
            ].join(","),
          ),
        ].join("\n");

        return new Response(csvContent, {
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="holidays-${year || "all"}.csv"`,
          },
        });
      }
    }

    // Normal GET request
    if (year && month) {
      holidays = await holidayService.getHolidaysByMonth(
        parseInt(year),
        parseInt(month),
      );
    } else if (year) {
      holidays = await holidayService.getHolidaysByYear(parseInt(year));
    } else {
      holidays = await holidayService.getAllHolidays({
        type: type || undefined,
        isActive: true,
      });
    }

    return Response.json({ success: true, holidays });
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

// POST - Create new holiday or batch import
export async function POST(req: Request) {
  try {
    const session = await getServerAuthSession(req);
    if (!session?.user?.id) {
      return Response.json(
        { success: false, message: "กรุณาเข้าสู่ระบบ" },
        { status: 401 },
      );
    }

    // LINE Permission check - ต้องได้รับอนุมัติให้ดูรายงาน
    const lineAccount = await db.account.findFirst({
      where: {
        userId: session.user.id,
        providerId: "line",
      },
      select: {
        accountId: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    if (lineAccount) {
      const hasPermission = await canRequestAttendanceReport(lineAccount.accountId);
      if (!hasPermission) {
        return Response.json(
          {
            success: false,
            message: "คุณยังไม่ได้รับอนุมัติให้จัดการข้อมูลวันหยุด กรุณาติดต่อผู้ดูแลระบบ",
          },
          { status: 403 },
        );
      }
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return Response.json(
        { success: false, message: "ข้อมูลไม่ถูกต้อง" },
        { status: 400 },
      );
    }

    const { holidays, import: isImport } = body;

    // Batch import
    if (isImport && Array.isArray(holidays)) {
      try {
        const result = await holidayService.batchCreateHolidays(holidays);
        return Response.json({
          success: true,
          message: `นำเข้าวันหยุด ${result.count} วันสำเร็จ`,
          count: result.count,
        });
      } catch (err: any) {
        return Response.json(
          {
            success: false,
            message: err?.message || "เกิดข้อผิดพลาดขณะนำเข้าข้อมูล",
          },
          { status: 400 },
        );
      }
    }

    // Single holiday creation
    const { date, nameEnglish, nameThai, year, type, description } = body;

    if (!date || !nameEnglish || !nameThai || !year) {
      return Response.json(
        {
          success: false,
          message: "กรุณาระบุข้อมูลให้ครบถ้วน (date, nameEnglish, nameThai, year)",
        },
        { status: 422 },
      );
    }

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return Response.json(
        { success: false, message: "รูปแบบวันที่ไม่ถูกต้อง (ต้องเป็น YYYY-MM-DD)" },
        { status: 422 },
      );
    }

    try {
      const holiday = await holidayService.createHoliday({
        date,
        nameEnglish,
        nameThai,
        year,
        type: type || "national",
        description,
      });

      return Response.json({
        success: true,
        message: "เพิ่มวันหยุดสำเร็จ",
        holiday,
      });
    } catch (err: any) {
      if (err?.code === "P2002") {
        return Response.json(
          { success: false, message: "วันที่นี้มีวันหยุดอยู่แล้ว" },
          { status: 409 },
        );
      }
      return Response.json(
        {
          success: false,
          message: err?.message || "เกิดข้อผิดพลาดขณะเพิ่มวันหยุด",
        },
        { status: 400 },
      );
    }
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

// PUT - Update existing holiday
export async function PUT(req: Request) {
  try {
    const session = await getServerAuthSession(req);
    if (!session?.user?.id) {
      return Response.json(
        { success: false, message: "กรุณาเข้าสู่ระบบ" },
        { status: 401 },
      );
    }

    // LINE Permission check
    const lineAccount = await db.account.findFirst({
      where: {
        userId: session.user.id,
        providerId: "line",
      },
      select: {
        accountId: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    if (lineAccount) {
      const hasPermission = await canRequestAttendanceReport(lineAccount.accountId);
      if (!hasPermission) {
        return Response.json(
          {
            success: false,
            message: "คุณยังไม่ได้รับอนุมัติให้จัดการข้อมูลวันหยุด กรุณาติดต่อผู้ดูแลระบบ",
          },
          { status: 403 },
        );
      }
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return Response.json(
        { success: false, message: "ข้อมูลไม่ถูกต้อง" },
        { status: 400 },
      );
    }

    const { id, date, nameEnglish, nameThai, year, type, description, isActive } =
      body;

    if (!id) {
      return Response.json(
        { success: false, message: "กรุณาระบุ ID ของวันหยุด" },
        { status: 422 },
      );
    }

    try {
      const holiday = await holidayService.updateHoliday(id, {
        date,
        nameEnglish,
        nameThai,
        year,
        type,
        description,
        isActive,
      });

      return Response.json({
        success: true,
        message: "อัพเดทวันหยุดสำเร็จ",
        holiday,
      });
    } catch (err: any) {
      return Response.json(
        {
          success: false,
          message: err?.message || "เกิดข้อผิดพลาดขณะอัพเดทวันหยุด",
        },
        { status: 400 },
      );
    }
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

// DELETE - Soft delete holiday
export async function DELETE(req: Request) {
  try {
    const session = await getServerAuthSession(req);
    if (!session?.user?.id) {
      return Response.json(
        { success: false, message: "กรุณาเข้าสู่ระบบ" },
        { status: 401 },
      );
    }

    // LINE Permission check
    const lineAccount = await db.account.findFirst({
      where: {
        userId: session.user.id,
        providerId: "line",
      },
      select: {
        accountId: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    if (lineAccount) {
      const hasPermission = await canRequestAttendanceReport(lineAccount.accountId);
      if (!hasPermission) {
        return Response.json(
          {
            success: false,
            message: "คุณยังไม่ได้รับอนุมัติให้จัดการข้อมูลวันหยุด กรุณาติดต่อผู้ดูแลระบบ",
          },
          { status: 403 },
        );
      }
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return Response.json(
        { success: false, message: "กรุณาระบุ ID ของวันหยุด" },
        { status: 422 },
      );
    }

    try {
      const holiday = await holidayService.deleteHoliday(id);

      return Response.json({
        success: true,
        message: "ลบวันหยุดสำเร็จ",
        holiday,
      });
    } catch (err: any) {
      return Response.json(
        {
          success: false,
          message: err?.message || "เกิดข้อผิดพลาดขณะลบวันหยุด",
        },
        { status: 400 },
      );
    }
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

export const Route = createFileRoute("/api/holidays")({
  server: {
    handlers: {
      GET: ({ request }) => GET(request),
      POST: ({ request }) => POST(request),
      PUT: ({ request }) => PUT(request),
      DELETE: ({ request }) => DELETE(request),
    },
  },
});
