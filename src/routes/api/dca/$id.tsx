/**
 * DCA Order by ID API
 * DELETE /api/dca/$id - ลบ DCA order
 */
import { createFileRoute } from "@tanstack/react-router";
import { dcaService } from "@/features/dca";
import { dcaEventManager } from "@/lib/dca/event-manager";

/**
 * DELETE /api/dca/$id
 */
export async function DELETE(request: Request, id: string) {
  try {
    if (!id) {
      return Response.json({ error: "ต้องระบุ ID" }, { status: 400 });
    }

    const existing = await dcaService.getOrderById(id);
    if (!existing) {
      return Response.json({ error: "ไม่พบข้อมูล" }, { status: 404 });
    }

    await dcaService.deleteOrder(id);

    // 🗑️ Emit SSE event เพื่อให้ clients รับทราบ
    dcaEventManager.emit({
      type: "dca-order-deleted",
      data: { id },
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
      DELETE: ({ request, params }) => DELETE(request, params.id),
    },
  },
});
