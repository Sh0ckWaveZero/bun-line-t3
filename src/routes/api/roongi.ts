import { createFileRoute } from "@tanstack/react-router";
import { getLatestLottery } from "@/features/roongi/services/lottery.server";

export const Route = createFileRoute("/api/roongi")({
  server: {
    handlers: {
      GET: async () => {
        try {
          return Response.json(await getLatestLottery(), {
            headers: { "Cache-Control": "public, max-age=300" },
          });
        } catch {
          return Response.json(
            { error: "ไม่สามารถโหลดผลสลากได้ กรุณาลองใหม่อีกครั้ง" },
            { status: 503 },
          );
        }
      },
    },
  },
});
