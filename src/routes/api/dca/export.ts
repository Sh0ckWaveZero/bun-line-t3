/**
 * DCA Export API
 * GET /api/dca/export?format=csv|json|xlsx
 *
 * ส่งออกประวัติคำสั่งซื้อ Auto DCA ทั้งหมดของ user ในรูปแบบที่เลือก
 */
import { createFileRoute } from "@tanstack/react-router";
import * as XLSX from "xlsx";
import { dcaService } from "@/features/dca";
import type {
  DcaExportRow,
  DcaOrder,
  ExportFormat,
} from "@/features/dca/types";
import { getAuthorizedLineUserId } from "@/lib/auth";

const EXPORT_COLUMNS: (keyof DcaExportRow)[] = [
  "orderId",
  "executedAt",
  "coin",
  "amountTHB",
  "coinReceived",
  "pricePerCoin",
  "round",
  "status",
  "note",
];

/** แปลง DcaOrder array เป็น flat row สำหรับ export */
const toExportRows = (orders: DcaOrder[]): DcaExportRow[] =>
  orders.map((order) => ({
    orderId: order.orderId,
    executedAt: order.executedAt.toISOString(),
    coin: order.coin,
    amountTHB: order.amountTHB,
    coinReceived: order.coinReceived,
    pricePerCoin: order.pricePerCoin,
    round: order.round,
    status: order.status,
    note: order.note ?? "",
  }));

/** สร้าง CSV string จาก rows */
const buildCsv = (rows: DcaExportRow[]): string => {
  const headerLine = EXPORT_COLUMNS.join(",");
  const dataLines = rows.map((row) =>
    EXPORT_COLUMNS.map((h) => {
      const val = String(row[h]);
      return val.includes(",") || val.includes('"')
        ? `"${val.replace(/"/g, '""')}"`
        : val;
    }).join(","),
  );
  return [headerLine, ...dataLines].join("\n");
};

/** สร้าง Excel buffer จาก rows */
const buildXlsx = (rows: DcaExportRow[]): Buffer => {
  const ws = XLSX.utils.json_to_sheet(rows, { header: EXPORT_COLUMNS });

  // ตั้ง column widths ให้อ่านง่าย
  ws["!cols"] = [
    { wch: 20 }, // orderId
    { wch: 26 }, // executedAt
    { wch: 8 }, // coin
    { wch: 14 }, // amountTHB
    { wch: 16 }, // coinReceived
    { wch: 16 }, // pricePerCoin
    { wch: 8 }, // round
    { wch: 10 }, // status
    { wch: 30 }, // note
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "DCA History");

  return Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
};

/**
 * GET /api/dca/export?format=csv|json|xlsx
 */
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

    const format = (searchParams.get("format") ?? "json") as ExportFormat;

    if (!["csv", "json", "xlsx"].includes(format)) {
      return Response.json(
        { error: "format ต้องเป็น csv, json หรือ xlsx เท่านั้น" },
        { status: 400 },
      );
    }

    const orders = await dcaService.listAllOrders(lineUserId);
    const rows = toExportRows(orders);
    const timestamp = new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/[:T]/g, "-");
    const filename = `dca-history-${timestamp}`;

    if (format === "json") {
      const body = JSON.stringify(rows, null, 2);
      return new Response(body, {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}.json"`,
        },
      });
    }

    if (format === "csv") {
      const body = buildCsv(rows);
      return new Response(body, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}.csv"`,
        },
      });
    }

    // xlsx
    const buffer = buildXlsx(rows);
    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}.xlsx"`,
      },
    });
  } catch (error) {
    console.error("DCA export error:", error);
    return Response.json(
      { error: "ไม่สามารถส่งออกข้อมูลได้" },
      { status: 500 },
    );
  }
}

export const Route = createFileRoute("/api/dca/export")({
  server: {
    handlers: {
      GET: ({ request }) => GET(request),
    },
  },
});
