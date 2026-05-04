import { createFileRoute } from "@tanstack/react-router";
import { dcaService } from "@/features/dca";
import { getAuthorizedLineUserId } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lineUserId = await getAuthorizedLineUserId(
      request,
      searchParams.get("lineUserId"),
    );

    if (!lineUserId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orders = await dcaService.listAllOrders(lineUserId);

    return Response.json(
      {
        orders,
        total: orders.length,
        page: 1,
        limit: orders.length,
        totalPages: 1,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("DCA ALL GET error:", error);
    return Response.json({ error: "ไม่สามารถดึงข้อมูลได้" }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/dca/all")({
  server: {
    handlers: {
      GET: ({ request }) => GET(request),
    },
  },
});

