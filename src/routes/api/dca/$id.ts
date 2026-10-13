/**
 * DCA Order by ID API
 * DELETE /api/dca/$id - ลบ DCA order
 */
import { createFileRoute } from "@tanstack/react-router";
import { dcaService } from "@/features/dca";
import { dcaEventManager } from "@/features/dca/lib/event-manager";
import { getAuthorizedLineUserId } from "@/lib/auth";
import { z } from "zod";

const updateDcaOrderSchema = z
  .object({
    lineUserId: z.string().trim().min(1).optional(),
    amountTHB: z.number().finite().positive(),
    coinReceived: z.number().finite().positive(),
    pricePerCoin: z.number().finite().positive(),
    executedAt: z.string().datetime({ offset: true }),
    note: z.string().max(500).optional(),
  })
  .strict();

/**
 * PATCH /api/dca/$id
 */
export async function PATCH(request: Request, id: string) {
  try {
    if (!id) {
      return Response.json({ error: "ต้องระบุ ID" }, { status: 400 });
    }

    const body = await request.json().catch(() => null);
    const parsed = updateDcaOrderSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "ข้อมูลรายการ DCA ไม่ถูกต้อง" },
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

    const existing = await dcaService.getOrderById(id);
    if (!existing) {
      return Response.json({ error: "ไม่พบข้อมูล" }, { status: 404 });
    }
    if (existing.lineUserId !== lineUserId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const order = await dcaService.updateOrder(id, {
      amountTHB: parsed.data.amountTHB,
      coinReceived: parsed.data.coinReceived,
      pricePerCoin: parsed.data.pricePerCoin,
      executedAt: new Date(parsed.data.executedAt),
      note: parsed.data.note,
    });
    if (!order) {
      return Response.json({ error: "ไม่พบข้อมูล" }, { status: 404 });
    }

    dcaEventManager.emit({
      type: "dca-order-updated",
      data: { id, lineUserId },
    });

    return Response.json({ order }, { status: 200 });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return Response.json(
        { error: "มีรายการ DCA อยู่แล้วในวันและเวลาที่เลือก" },
        { status: 409 },
      );
    }

    console.error("DCA PATCH error:", error);
    return Response.json({ error: "ไม่สามารถแก้ไขข้อมูลได้" }, { status: 500 });
  }
}

/**
 * DELETE /api/dca/$id
 */
export async function DELETE(request: Request, id: string) {
  try {
    if (!id) {
      return Response.json({ error: "ต้องระบุ ID" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const lineUserId = await getAuthorizedLineUserId(
      request,
      searchParams.get("lineUserId"),
    );

    if (!lineUserId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await dcaService.getOrderById(id);
    if (!existing) {
      return Response.json({ error: "ไม่พบข้อมูล" }, { status: 404 });
    }

    if (existing.lineUserId !== lineUserId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dcaService.deleteOrder(id);

    // 🗑️ Emit SSE event เพื่อให้ clients รับทราบ
    dcaEventManager.emit({
      type: "dca-order-deleted",
      data: { id, lineUserId },
    });

    return Response.json({ message: "ลบข้อมูลสำเร็จ" }, { status: 200 });
  } catch (error) {
    console.error("DCA DELETE error:", error);
    return Response.json({ error: "ไม่สามารถลบข้อมูลได้" }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/dca/$id")({
  server: {
    handlers: {
      PATCH: ({ request, params }) => PATCH(request, params.id),
      DELETE: ({ request, params }) => DELETE(request, params.id),
    },
  },
});
