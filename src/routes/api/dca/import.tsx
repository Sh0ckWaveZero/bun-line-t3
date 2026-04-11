/**
 * DCA Import API
 * POST /api/dca/import
 *
 * รับไฟล์ multipart/form-data (field name: "file")
 * รองรับ .csv, .json, .xlsx
 *
 * Response: { imported, skipped, errors }
 */
import { createFileRoute } from "@tanstack/react-router";
import * as XLSX from "xlsx";
import { z } from "zod";
import { dcaService } from "@/features/dca";
import type { ExportFormat, ImportResult } from "@/features/dca/types";
import { getLineUserId } from "@/lib/auth";

const VALID_FORMATS: ExportFormat[] = ["csv", "json", "xlsx"];

/** unique key สำหรับตรวจ duplicate: coin + executedAt ISO */
const dupKey = (coin: string, executedAt: Date) =>
  `${coin}|${executedAt.toISOString()}`;

/** Zod validator สำหรับตัวเลข positive (รองรับ string และ number จาก CSV/Excel) */
const positiveFloat = (fieldName: string) =>
  z
    .union([z.string(), z.number()])
    .transform((v) => parseFloat(String(v)))
    .refine((v) => !isNaN(v) && v > 0, `${fieldName} ต้องมากกว่า 0`);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * แปลง Excel date serial number → ISO string
 * Excel เก็บวันที่เป็นตัวเลข เช่น 45678 = วันที่ xx/xx/xxxx
 */
const excelSerialToIso = (serial: number): string => {
  // Excel epoch = 1 Jan 1900, แต่มี bug ที่นับ 1900 ว่าเป็น leap year
  // จึงต้องลบ 25569 (จำนวนวันจาก 1900-01-01 ถึง 1970-01-01) และ offset 1 วัน
  const ms = (serial - 25569) * 86400 * 1000;
  return new Date(ms).toISOString();
};

/**
 * Normalize executedAt ให้เป็น ISO string ไม่ว่าจะมาจาก:
 * - ISO string "2026-04-11T08:00:14.663+07:00"
 * - Simple date string "2026-04-11"
 * - Excel serial number 45678
 */
const normalizeExecutedAt = (raw: unknown): string => {
  if (typeof raw === "number") {
    return excelSerialToIso(raw);
  }
  return String(raw ?? "");
};

// ─── Validation schema สำหรับแต่ละแถวของข้อมูล ────────────────────────────────

const importRowSchema = z.object({
  orderId: z.string().optional(),
  executedAt: z
    .union([z.string(), z.number()])
    .transform(normalizeExecutedAt)
    .refine((v) => v.length > 0 && !isNaN(new Date(v).getTime()), "executedAt ไม่ใช่วันที่ที่ถูกต้อง"),
  coin: z.string().min(1).max(20).transform((v) => v.toUpperCase()),
  amountTHB: positiveFloat("amountTHB"),
  coinReceived: positiveFloat("coinReceived"),
  pricePerCoin: positiveFloat("pricePerCoin"),
  status: z.enum(["SUCCESS", "FAILED", "PENDING"]).optional().default("SUCCESS"),
  note: z.string().optional().default(""),
});

// ─── Parsers ──────────────────────────────────────────────────────────────────

/** Parse JSON file → raw row array */
const parseJson = (text: string): unknown[] => {
  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed)) throw new Error("JSON ต้องเป็น array ของ objects");
  return parsed;
};

/** Parse CSV text → raw row array */
const parseCsv = (text: string): Record<string, string>[] => {
  // filter empty lines ก่อน (trailing newlines, blank lines กลางไฟล์)
  const lines = text.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) throw new Error("CSV ต้องมีอย่างน้อย 1 แถวข้อมูล (นอกจาก header)");

  const headers = lines[0]!.split(",").map((h) => h.trim().replace(/^"|"$/g, ""));

  return lines.slice(1).map((line, idx) => {
    // Simple CSV parse ที่รองรับ quoted fields
    const values: string[] = [];
    let current = "";
    let inQuote = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuote = !inQuote;
        }
      } else if (ch === "," && !inQuote) {
        values.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
    values.push(current);

    if (values.length !== headers.length) {
      throw new Error(`แถวที่ ${idx + 2}: จำนวน columns ไม่ตรงกับ header`);
    }

    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]));
  });
};

/** Parse XLSX buffer → raw row array */
const parseXlsx = (buffer: ArrayBuffer): unknown[] => {
  const wb = XLSX.read(buffer, { type: "array" });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) throw new Error("ไม่พบ sheet ใน Excel file");
  const ws = wb.Sheets[sheetName]!;
  return XLSX.utils.sheet_to_json(ws, { defval: "" });
};

// ─── Main Handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const lineUserId = await getLineUserId(request);
    if (!lineUserId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("multipart/form-data")) {
      return Response.json(
        { error: "Content-Type ต้องเป็น multipart/form-data" },
        { status: 400 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return Response.json({ error: "ไม่พบไฟล์ (field name: file)" }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    const ext = fileName.split(".").pop();

    if (!VALID_FORMATS.includes((ext ?? "") as ExportFormat)) {
      return Response.json(
        { error: "รองรับเฉพาะไฟล์ .csv, .json, .xlsx เท่านั้น" },
        { status: 400 },
      );
    }

    // ─── Parse raw rows ───────────────────────────────────────────────────
    let rawRows: unknown[];

    if (ext === "json") {
      const text = await file.text();
      rawRows = parseJson(text);
    } else if (ext === "csv") {
      const text = await file.text();
      rawRows = parseCsv(text);
    } else {
      // xlsx
      const arrayBuffer = await file.arrayBuffer();
      rawRows = parseXlsx(arrayBuffer);
    }

    // ─── Step 1: Validate rows ────────────────────────────────────────────
    const result: ImportResult = { imported: 0, skipped: 0, errors: [] };

    type ValidRow = {
      index: number;
      data: z.infer<typeof importRowSchema>;
      executedAt: Date;
    };

    const validRows: ValidRow[] = [];

    for (let i = 0; i < rawRows.length; i++) {
      const rowLabel = `แถวที่ ${i + 1}`;
      const parsed = importRowSchema.safeParse(rawRows[i]);

      if (!parsed.success) {
        const msg = parsed.error.issues.map((e: { message: string }) => e.message).join(", ");
        result.errors.push(`${rowLabel}: ${msg}`);
        result.skipped++;
        continue;
      }

      // executedAt ผ่าน schema refine มาแล้ว แน่ใจว่า valid
      const executedAt = new Date(parsed.data.executedAt);
      validRows.push({ index: i, data: parsed.data, executedAt });
    }

    // ─── Step 2: ตรวจซ้ำภายในไฟล์เดียวกัน ───────────────────────────────
    const seenInFile = new Set<string>();
    const uniqueInFile: ValidRow[] = [];

    for (const row of validRows) {
      const key = dupKey(row.data.coin, row.executedAt);
      if (seenInFile.has(key)) {
        result.errors.push(
          `แถวที่ ${row.index + 1}: ซ้ำกับแถวอื่นในไฟล์เดียวกัน (${row.data.coin} @ ${row.executedAt.toISOString()})`,
        );
        result.skipped++;
      } else {
        seenInFile.add(key);
        uniqueInFile.push(row);
      }
    }

    // ─── Step 3: ตรวจซ้ำกับ DB (1 query) ────────────────────────────────
    const existingInDb = await dcaService.findDuplicates(
      lineUserId,
      uniqueInFile.map((r) => ({ coin: r.data.coin, executedAt: r.executedAt })),
    );

    const dupInDbKeys = new Set(existingInDb.map((d) => dupKey(d.coin, d.executedAt)));
    const rowsToInsert: ValidRow[] = [];

    for (const row of uniqueInFile) {
      if (dupInDbKeys.has(dupKey(row.data.coin, row.executedAt))) {
        result.errors.push(
          `แถวที่ ${row.index + 1}: ซ้ำกับข้อมูลที่มีอยู่แล้ว (${row.data.coin} @ ${row.executedAt.toISOString()})`,
        );
        result.skipped++;
      } else {
        rowsToInsert.push(row);
      }
    }

    // ─── Step 4: Create orders แบบ parallel ──────────────────────────────
    const createResults = await Promise.allSettled(
      rowsToInsert.map(({ data, executedAt }) =>
        dcaService.createOrder({
          lineUserId,
          coin: data.coin,
          amountTHB: data.amountTHB,
          coinReceived: data.coinReceived,
          pricePerCoin: data.pricePerCoin,
          executedAt,
          status: data.status,
          note: data.note || undefined,
        }),
      ),
    );

    for (let i = 0; i < createResults.length; i++) {
      const res = createResults[i]!;
      const rowLabel = `แถวที่ ${rowsToInsert[i]!.index + 1}`;
      if (res.status === "fulfilled") {
        result.imported++;
      } else {
        const msg = res.reason instanceof Error ? res.reason.message : "unknown error";
        result.errors.push(`${rowLabel}: บันทึกไม่สำเร็จ — ${msg}`);
        result.skipped++;
      }
    }

    return Response.json(result, { status: 200 });
  } catch (error) {
    console.error("DCA import error:", error);
    const msg = error instanceof Error ? error.message : "ไม่สามารถนำเข้าข้อมูลได้";
    return Response.json({ error: msg }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/dca/import")({
  server: {
    handlers: {
      POST: ({ request }) => POST(request),
    },
  },
});
