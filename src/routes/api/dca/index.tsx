/**
 * DCA Orders API
 * GET  /api/dca - รายการ DCA orders พร้อม pagination (filter by session user)
 * POST /api/dca - สร้าง DCA order ใหม่ (ใช้ LINE userId จาก session อัตโนมัติ)
 */
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { dcaService } from "@/features/dca";
import { dcaEventManager } from "@/lib/dca/event-manager";
import { getAuthorizedLineUserId } from "@/lib/auth";

const createDcaSchema = z.object({
  lineUserId: z.string().min(1).optional(),
  coin: z.string().min(1).max(20).default("BTC"),
  amountTHB: z.number().positive("จำนวนเงินต้องมากกว่า 0"),
  coinReceived: z.number().positive("จำนวนเหรียญต้องมากกว่า 0"),
  pricePerCoin: z.number().positive("ราคาต่อเหรียญต้องมากกว่า 0"),
  executedAt: z.string().transform((val) => new Date(val)),
  note: z.string().optional(),
  status: z.enum(["SUCCESS", "FAILED", "PENDING"]).optional(),
});

/**
 * GET /api/dca
 * Query params: page, limit, coin, lineUserId
 * lineUserId จาก payload ต้องเป็น ID ที่ผูกกับ session นี้
 */
export async function GET(request: Request) {
  try {
    console.log(`🌐 [DCA GET] Incoming request:`, {
      url: request.url,
      method: request.method,
    });

    const { searchParams } = new URL(request.url);

    console.log(`🔍 [DCA GET] Query params:`, {
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      lineUserId: searchParams.get("lineUserId"),
    });

    const lineUserId = await getAuthorizedLineUserId(
      request,
      searchParams.get("lineUserId"),
    );

    console.log(`📊 [DCA GET] Authorized lineUserId:`, lineUserId);

    if (!lineUserId) {
      console.log(`❌ [DCA GET] No lineUserId found - unauthorized`);
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "10");
    const coin = searchParams.get("coin") ?? undefined;

    const result = await dcaService.listOrders({
      page,
      limit,
      coin,
      lineUserId,
    });

    return Response.json(result, { status: 200 });
  } catch (error) {
    console.error("DCA GET error:", error);
    return Response.json({ error: "ไม่สามารถดึงข้อมูลได้" }, { status: 500 });
  }
}

/**
 * POST /api/dca
 * Body: CreateDcaOrderInput + lineUserId
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createDcaSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const lineUserId = await getAuthorizedLineUserId(
      request,
      parsed.data.lineUserId,
    );

    if (!lineUserId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const order = await dcaService.createOrder({
      ...parsed.data,
      lineUserId,
    });

    // 🎉 Emit SSE event เพื่อให้ clients รับทราบ
    dcaEventManager.emit({
      type: "dca-order-created",
      data: order,
    });

    return Response.json(order, { status: 201 });
  } catch (error) {
    console.error("DCA POST error:", error);
    return Response.json(
      { error: "ไม่สามารถบันทึกข้อมูลได้" },
      { status: 500 },
    );
  }
}

export const Route = createFileRoute("/api/dca/")({
  server: {
    handlers: {
      GET: ({ request }) => GET(request),
      POST: ({ request }) => POST(request),
    },
  },
});
