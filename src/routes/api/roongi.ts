import { createFileRoute } from "@tanstack/react-router";
import {
  getLatestLottery,
  getLotteryArchive,
  getLotteryByDate,
} from "@/features/roongi/services/lottery.server";
import { z } from "zod";

export const Route = createFileRoute("/api/roongi")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const params = new URL(request.url).searchParams;
          const date = params.get("date");
          const page = params.get("page");
          if (date && !z.iso.date().safeParse(date).success)
            return Response.json(
              { error: "วันที่ไม่ถูกต้อง" },
              { status: 400 },
            );
          if (page && !/^[1-9]\d{0,2}$/.test(page))
            return Response.json(
              { error: "หน้าข้อมูลไม่ถูกต้อง" },
              { status: 400 },
            );
          const result = date
            ? await getLotteryByDate(date)
            : page
              ? await getLotteryArchive(Number(page))
              : await getLatestLottery();
          return Response.json(result, {
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
