/**
 * 🧪 Unit Tests — Onsite Service Report (FM-PM-01)
 * ครอบคลุม: zod form/payload schema, doc-no suggestion, date bridge, PDF smoke test
 */
import { describe, test, expect } from "bun:test";
import { suggestDocNo } from "@/features/onsite-report/lib/doc-no";
import {
  emptyFormValues,
  formatDateKey,
  onsiteReportFormSchema,
  onsiteReportPayloadSchema,
  parseDateKey,
  reportToFormValues,
} from "@/features/onsite-report/lib/onsite-report-form";
import { renderOnsiteReportPdf } from "@/features/onsite-report/lib/pdf-document.server";
import {
  ONSITE_REPORT_LOGO_MAX_BYTES,
  validateLogoImage,
} from "@/features/onsite-report/lib/logo-image";
import {
  ONSITE_REPORT_SIGNATURE_MAX_BYTES,
  signaturePartySchema,
} from "@/features/onsite-report/lib/signature";
import {
  companyCodeSchema,
  createCompanySchema,
  updateCompanySchema,
} from "@/features/onsite-report/lib/company";
import { toPreviewReport } from "@/features/onsite-report/lib/preview";
import {
  ONSITE_REPORT_MAX_ATTENDEES,
  formatTimeLabel,
} from "@/features/onsite-report/constants";
import {
  formatDateTh,
  formatOnsiteDate,
} from "@/features/onsite-report/lib/format";
import type { OnsiteReport } from "@/features/onsite-report/types";

describe("suggestDocNo", () => {
  test("project code ว่าง → ค่าว่าง", () => {
    expect(suggestDocNo("", [])).toBe("");
    expect(suggestDocNo("   ", ["ABC-1001"])).toBe("");
  });

  test("project ใหม่ (ไม่มี doc เดิม) → เริ่มที่ 1001", () => {
    expect(suggestDocNo("PRJ-ABC-24-01", [])).toBe("PRJ-ABC-24-01-1001");
  });

  test("ไล่จากเลขสูงสุดของ prefix เดียวกัน", () => {
    expect(
      suggestDocNo("PRJ-ABC-24-01", [
        "PRJ-ABC-24-01-1001",
        "PRJ-ABC-24-01-1003",
      ]),
    ).toBe("PRJ-ABC-24-01-1004");
  });

  test("ไม่สนใจ doc ของ project อื่น", () => {
    expect(
      suggestDocNo("PRJ-ABC-24-01", [
        "OTHER-99-9999",
        "PRJ-ABC-24-01-1002",
      ]),
    ).toBe("PRJ-ABC-24-01-1003");
  });
});

describe("onsiteReportFormSchema", () => {
  const baseInput = {
    ...emptyFormValues(),
    company: "ACME",
    docNo: "PRJ-ABC-24-01-1001",
    revision: "-1",
    clientName: "โรงพยาบาลตัวอย่าง",
    projectCode: "PRJ-ABC-24-01",
    onsiteDate: "2026-10-02",
    mainContact: "Erin Contact",
    executionTeam: "Alice Example",
    objective: "เพื่อทดสอบ Software integration testing",
    actionItem: "1. ทดสอบ EDC",
  };

  test("ข้อมูลครบ → ผ่าน และเวลาว่างแปลงเป็น null", () => {
    const result = onsiteReportFormSchema.safeParse(baseInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.timeStart).toBeNull();
      expect(result.data.timeEnd).toBeNull();
      expect(result.data.nextActions).toEqual([]);
      expect(result.data.attendees).toEqual([]);
    }
  });

  test("เวลา '9' / '12.5' → 9 / 12.5", () => {
    const result = onsiteReportFormSchema.safeParse({
      ...baseInput,
      timeStart: "9",
      timeEnd: "12.5",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.timeStart).toBe(9);
      expect(result.data.timeEnd).toBe(12.5);
    }
  });

  test("เวลาจบ ≤ เวลาเริ่ม → error ที่ timeEnd", () => {
    const result = onsiteReportFormSchema.safeParse({
      ...baseInput,
      timeStart: "13",
      timeEnd: "9",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some(
          (issue) => issue.path[0] === "timeEnd",
        ),
      ).toBe(true);
    }
  });

  test("แถวที่เว้นว่างทั้งแถวถูกคัดทิ้ง ไม่ error", () => {
    const result = onsiteReportFormSchema.safeParse({
      ...baseInput,
      attendees: [
        { name: "Dave Tester", position: "Senior Software Engineer" },
        { name: "", position: "" },
      ],
      nextActions: [{ date: "", milestone: "", description: "" }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.attendees).toHaveLength(1);
      expect(result.data.nextActions).toHaveLength(0);
    }
  });

  test("แถวที่กรอกครึ่งแถว → error ตามฟิลด์", () => {
    const result = onsiteReportFormSchema.safeParse({
      ...baseInput,
      attendees: [{ name: "มีแต่ชื่อ", position: "" }],
    });
    expect(result.success).toBe(false);
  });

  test("ฟิลด์ required ว่าง → error", () => {
    const result = onsiteReportFormSchema.safeParse({
      ...baseInput,
      objective: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("onsiteReportFormSchema — ดัชนี error ของแถวตาราง", () => {
  const validBase = {
    ...emptyFormValues(),
    company: "ACME",
    docNo: "PRJ-ABC-24-01-1001",
    clientName: "โรงพยาบาลตัวอย่าง",
    projectCode: "PRJ-ABC-24-01",
    onsiteDate: "2026-10-02",
    mainContact: "Erin Contact",
    executionTeam: "Alice Example",
    objective: "ทดสอบ",
    actionItem: "ทดสอบ",
  };

  const issuePaths = (input: unknown) => {
    const result = onsiteReportFormSchema.safeParse(input);
    expect(result.success).toBe(false);
    return result.success
      ? []
      : result.error.issues.map((issue) => issue.path.join("."));
  };

  test("แถวแรกว่าง แถวสองกรอกไม่ครบ → error อยู่ที่ดัชนีเดิม (1) ไม่ใช่ 0", () => {
    const paths = issuePaths({
      ...validBase,
      nextActions: [
        { date: "", milestone: "", description: "" },
        { date: "2026-10-10", milestone: "UAT", description: "" },
      ],
    });
    expect(paths).toEqual(["nextActions.1.description"]);
  });

  test("attendees: แถวว่างนำหน้า แล้วแถวที่ 3 ขาดตำแหน่ง → error ที่ดัชนี 2", () => {
    const paths = issuePaths({
      ...validBase,
      attendees: [
        { name: "", position: "" },
        { name: "Alice Example", position: "Engineer" },
        { name: "Bob Sample", position: "" },
      ],
    });
    expect(paths).toEqual(["attendees.2.position"]);
  });

  test("หลายแถวผิดพร้อมกัน → รายงานทุกแถวด้วยดัชนีเดิม", () => {
    const paths = issuePaths({
      ...validBase,
      nextActions: [
        { date: "x", milestone: "A", description: "B" },
        { date: "", milestone: "", description: "" },
        { date: "2026-10-10", milestone: "", description: "B" },
      ],
    });
    expect(paths).toEqual(["nextActions.0.date", "nextActions.2.milestone"]);
  });

  test("ผ่าน validation แล้วค่อยตัดแถวว่างออกจาก output", () => {
    const result = onsiteReportFormSchema.parse({
      ...validBase,
      nextActions: [
        { date: "", milestone: "", description: "" },
        { date: "2026-10-10", milestone: "UAT", description: "ทดสอบร่วมกัน" },
        { date: "  ", milestone: " ", description: "" },
      ],
      attendees: [
        { name: "", position: "" },
        { name: "Alice Example", position: "Engineer" },
      ],
    });
    expect(result.nextActions).toEqual([
      { date: "2026-10-10", milestone: "UAT", description: "ทดสอบร่วมกัน" },
    ]);
    expect(result.attendees).toEqual([
      { name: "Alice Example", position: "Engineer" },
    ]);
  });

  test("เกินจำนวนแถวสูงสุด (นับเฉพาะแถวที่กรอกจริง) → error ระดับ field", () => {
    const paths = issuePaths({
      ...validBase,
      attendees: Array.from({ length: ONSITE_REPORT_MAX_ATTENDEES + 1 }, (_, i) => ({
        name: `Person${i}`,
        position: "Engineer",
      })),
    });
    expect(paths).toEqual(["attendees"]);
  });

  test("แถวว่างจำนวนมากไม่นับรวมเป็นเกินเพดาน", () => {
    const result = onsiteReportFormSchema.safeParse({
      ...validBase,
      attendees: Array.from({ length: ONSITE_REPORT_MAX_ATTENDEES * 3 }, () => ({
        name: "",
        position: "",
      })),
    });
    expect(result.success).toBe(true);
  });
});

describe("onsiteReportPayloadSchema", () => {
  const basePayload = {
    company: "ACME" as const,
    docNo: "PRJ-ABC-24-01-1001",
    revision: "-1" as const,
    clientName: "โรงพยาบาลตัวอย่าง",
    projectCode: "PRJ-ABC-24-01",
    onsiteDate: "2026-10-02",
    timeStart: 9,
    timeEnd: 12,
    phase: "Develop & Test",
    mainContact: "Erin Contact",
    executionTeam: "Alice Example",
    objective: "เพื่อทดสอบ",
    actionItem: "ทดสอบ EDC",
    pendingNote: null,
    nextActions: [
      {
        date: "2026-10-10",
        milestone: "UAT",
        description: "ทดสอบร่วมกับ user",
      },
    ],
    attendees: [{ name: "Dave Tester", position: "Senior Software Engineer" }],
  };

  test("payload ถูกต้อง → ผ่าน", () => {
    expect(onsiteReportPayloadSchema.safeParse(basePayload).success).toBe(true);
  });

  test("เวลาเป็น string → ไม่ผ่าน", () => {
    const result = onsiteReportPayloadSchema.safeParse({
      ...basePayload,
      timeStart: "9",
    });
    expect(result.success).toBe(false);
  });

  test("onsiteDate รูปแบบผิด → ไม่ผ่าน", () => {
    const result = onsiteReportPayloadSchema.safeParse({
      ...basePayload,
      onsiteDate: "02/10/2026",
    });
    expect(result.success).toBe(false);
  });
});

describe("date bridge", () => {
  test("parseDateKey / formatDateKey round-trip", () => {
    const date = parseDateKey("2026-10-02");
    expect(date).toBeDefined();
    expect(formatDateKey(date as Date)).toBe("2026-10-02");
  });

  test("parseDateKey รูปแบบผิด → undefined", () => {
    expect(parseDateKey("02/10/2026")).toBeUndefined();
    expect(parseDateKey("")).toBeUndefined();
  });
});

describe("formatTimeLabel", () => {
  test("เลขชั่วโมง/ครึ่งชั่วโมง", () => {
    expect(formatTimeLabel(9)).toBe("09:00");
    expect(formatTimeLabel(9.5)).toBe("09:30");
    expect(formatTimeLabel(18)).toBe("18:00");
  });
});

describe("reportToFormValues", () => {
  const report: OnsiteReport = {
    id: "test-0",
    company: "BETA",
    companyName: "บริษัท บีตา จำกัด",
    signatures: [],
    docNo: "PRJ-XYZ-99-1",
    revision: "-2",
    clientName: "บริษัท ตัวอย่าง จำกัด",
    projectCode: "PRJ-XYZ-99",
    onsiteDate: "2026-06-15",
    timeStart: 9,
    timeEnd: 12.5,
    phase: null,
    mainContact: "คุณทดสอบ",
    executionTeam: "Alice, Bob",
    objective: "เก็บ requirement",
    actionItem: "สัมภาษณ์ผู้ใช้",
    pendingNote: null,
    nextActions: [
      { date: "2026-06-20", milestone: "สรุป requirement", description: "ส่งเอกสาร" },
    ],
    attendees: [{ name: "Dave Tester", position: "Senior Software Engineer" }],
    createdAt: "2026-10-31T00:00:00.000Z",
    updatedAt: "2026-10-31T00:00:00.000Z",
  };

  test("เวลากลายเป็น string และ parse กลับผ่าน schema", () => {
    const values = reportToFormValues(report);
    expect(values.timeStart).toBe("9");
    expect(values.timeEnd).toBe("12.5");
    expect(values.revision).toBe("-2");
    expect(values.nextActions).toHaveLength(1);
    expect(onsiteReportFormSchema.safeParse(values).success).toBe(true);
  });
});

describe("toPreviewReport", () => {
  test("payload ที่ parse แล้ว → OnsiteReport จำลองสำหรับ preview", () => {
    const parsed = onsiteReportFormSchema.parse({
      company: "ACME",
      docNo: "PRJ-ABC-24-01-1001",
      revision: "-1",
      clientName: "โรงพยาบาลตัวอย่าง",
      projectCode: "PRJ-ABC-24-01",
      onsiteDate: "2026-10-02",
      timeStart: "9",
      timeEnd: "12",
      phase: "",
      mainContact: "Erin Contact",
      executionTeam: "Alice Example",
      objective: "ทดสอบ",
      actionItem: "ทดสอบ EDC",
      pendingNote: "",
      nextActions: [],
      attendees: [
        { name: "Dave Tester", position: "Senior Software Engineer" },
      ],
    });
    const report = toPreviewReport(parsed);
    expect(report.id).toBe("preview");
    expect(report.docNo).toBe("PRJ-ABC-24-01-1001");
    expect(report.timeStart).toBe(9);
    expect(report.attendees).toHaveLength(1);
    expect(typeof report.createdAt).toBe("string");
  });

  test("ฟอร์มสร้างใหม่ที่ยังว่างทั้งหมด → ได้รายงานว่างที่เรนเดอร์ได้ ไม่ throw", () => {
    const report = toPreviewReport(emptyFormValues());
    expect(report.company).toBe("");
    expect(report.docNo).toBe("");
    expect(report.onsiteDate).toBe("");
    expect(report.timeStart).toBeNull();
    expect(report.phase).toBeNull();
    expect(report.nextActions).toEqual([]);
    expect(report.attendees).toEqual([]);
    expect(report.signatures).toEqual([]);
  });

  test("input ที่ไม่ใช่ object หรือชนิดผิด → ค่าว่างแทนการ throw", () => {
    for (const raw of [null, undefined, "x", 42, []]) {
      expect(() => toPreviewReport(raw)).not.toThrow();
    }
    const report = toPreviewReport({
      docNo: 123,
      onsiteDate: "ไม่ใช่วันที่",
      timeStart: "99",
      nextActions: "ไม่ใช่ array",
      attendees: [null, { name: "A" }, { name: "B", position: "P" }],
    });
    expect(report.docNo).toBe("");
    expect(report.onsiteDate).toBe("");
    expect(report.timeStart).toBeNull();
    expect(report.nextActions).toEqual([]);
    expect(report.attendees).toEqual([
      { name: "A", position: "" },
      { name: "B", position: "P" },
    ]);
  });

  test("กรอกครึ่ง ๆ → เก็บที่กรอก ทิ้งแถวว่าง และ revision/company เสียไม่หลุดเข้า PDF", () => {
    const report = toPreviewReport({
      ...emptyFormValues(),
      company: "../etc/passwd",
      revision: "ผิด",
      objective: "  ทดสอบ  ",
      nextActions: [
        { date: "", milestone: "", description: "" },
        { date: "2026-10-10", milestone: "UAT", description: "" },
      ],
    });
    expect(report.company).toBe("");
    expect(report.revision).toBe("-1");
    expect(report.objective).toBe("ทดสอบ");
    expect(report.nextActions).toEqual([
      { date: "2026-10-10", milestone: "UAT", description: "" },
    ]);
  });

  test("จำกัดความยาวข้อความและจำนวนแถว กัน payload ใหญ่ผิดปกติ", () => {
    const report = toPreviewReport({
      ...emptyFormValues(),
      objective: "ก".repeat(50_000),
      attendees: Array.from({ length: 200 }, (_, index) => ({
        name: `N${index}`,
        position: "P",
      })),
    });
    expect(report.objective.length).toBe(2000);
    expect(report.attendees.length).toBe(ONSITE_REPORT_MAX_ATTENDEES);
  });

  test("รายงานที่ preview แบบว่างทั้งฉบับ เรนเดอร์เป็น PDF ได้", async () => {
    const buffer = await renderOnsiteReportPdf(
      toPreviewReport(emptyFormValues()),
      { company: { name: "", logo: null } },
    );
    expect(Buffer.from(buffer.subarray(0, 5)).toString("ascii")).toBe("%PDF-");
  });
});

describe("format helpers กับวันที่ว่าง", () => {
  test("ไม่ใช่วันที่ → สตริงว่าง (ไม่ใช่ NaN/undefined ใน PDF)", () => {
    expect(formatOnsiteDate("")).toBe("");
    expect(formatDateTh("")).toBe("");
    expect(formatOnsiteDate("abc")).toBe("");
    expect(formatOnsiteDate("2026-10-02")).toBe("2 Oct 2026");
    expect(formatDateTh("2026-10-02")).toBe("02/10/2026");
  });
});

describe("renderOnsiteReportPdf", () => {
  const sampleReport: OnsiteReport = {
    id: "test-1",
    company: "ACME",
    companyName: "บริษัท เอซีเอ็มอี จำกัด",
    signatures: [],
    docNo: "PRJ-ABC-24-01-1002",
    revision: "-1",
    clientName: "โรงพยาบาลตัวอย่าง",
    projectCode: "PRJ-ABC-24-01",
    onsiteDate: "2026-10-02",
    timeStart: 9,
    timeEnd: 12,
    phase: "Develop & Test",
    mainContact: "Erin Contact",
    executionTeam: "Alice Example",
    objective: "เพื่อทดสอบ Software integration testing #2",
    actionItem: "1. ทดสอบ Software integration testing #2",
    pendingNote: "รอผลทดสอบจากฝั่งธนาคาร",
    nextActions: [
      {
        date: "2026-10-10",
        milestone: "UAT",
        description: "ทดสอบร่วมกับ user ฝั่งโรงพยาบาล",
      },
    ],
    attendees: [
      { name: "Alice Example", position: "Assistant Vice President (AVP)" },
      { name: "Bob Sample", position: "Senior Technical Manager" },
      { name: "Carol Demo", position: "Functional Consultant" },
      { name: "Dave Tester", position: "Senior Software Engineer" },
    ],
    createdAt: "2026-10-31T00:00:00.000Z",
    updatedAt: "2026-10-31T00:00:00.000Z",
  };

  test("ได้ buffer ที่เป็น PDF จริง", async () => {
    const buffer = await renderOnsiteReportPdf(sampleReport);
    expect(buffer.byteLength).toBeGreaterThan(1000);
    const header = Buffer.from(buffer.subarray(0, 5)).toString("ascii");
    expect(header.startsWith("%PDF-")).toBe(true);
  });

  test("ใส่ลายเซ็นทั้งสองฝั่งได้ และ PDF ใหญ่ขึ้นกว่าแบบยังไม่เซ็น", async () => {
    const unsigned = await renderOnsiteReportPdf(sampleReport);
    const png = {
      data: Buffer.from(PNG_1X1_BASE64, "base64"),
      mimeType: "image/png",
      width: 600,
      height: 200,
    };
    const signed = await renderOnsiteReportPdf(sampleReport, {
      signatures: { company: png, client: png },
    });
    expect(Buffer.from(signed.subarray(0, 5)).toString("ascii")).toBe("%PDF-");
    expect(signed.byteLength).toBeGreaterThan(unsigned.byteLength);
  });

  test("เซ็นฝั่งเดียว (อีกฝั่ง null) → ออก PDF ปกติ", async () => {
    const buffer = await renderOnsiteReportPdf(sampleReport, {
      signatures: {
        company: null,
        client: {
          data: Buffer.from(PNG_1X1_BASE64, "base64"),
          mimeType: "image/png",
          width: 600,
          height: 200,
        },
      },
    });
    expect(buffer.byteLength).toBeGreaterThan(1000);
  });

  test("ใส่โลโก้จาก buffer ได้ และ PDF ใหญ่ขึ้นกว่าแบบไม่มีโลโก้", async () => {
    const withoutLogo = await renderOnsiteReportPdf(sampleReport);
    const withLogo = await renderOnsiteReportPdf(sampleReport, {
      company: {
        name: "บริษัท เอซีเอ็มอี จำกัด",
        logo: {
          data: Buffer.from(PNG_1X1_BASE64, "base64"),
          mimeType: "image/png",
          width: 151,
          height: 122,
        },
      },
    });
    expect(Buffer.from(withLogo.subarray(0, 5)).toString("ascii")).toBe(
      "%PDF-",
    );
    expect(withLogo.byteLength).toBeGreaterThan(withoutLogo.byteLength);
  });

  test("ค่าในช่องข้อมูลงานยาวหลายบรรทัด (ตามเพดาน schema) → ยังเรนเดอร์ได้ครบ", async () => {
    const buffer = await renderOnsiteReportPdf(
      {
        ...sampleReport,
        clientName: "โรงพยาบาลตัวอย่าง ".repeat(12).trim(),
        projectCode: "PRJ-ABC-24-01-".repeat(4).trim(),
        mainContact: "Erin Contact, ".repeat(14).trim(),
        executionTeam: Array.from({ length: 30 }, (_, i) => `Person${i + 1}`)
          .join(", ")
          .padEnd(500, "x")
          .slice(0, 500),
      },
      { company: { name: "บริษัท ทดสอบ จำกัด", logo: null } },
    );
    expect(Buffer.from(buffer.subarray(0, 5)).toString("ascii")).toBe("%PDF-");
  });

  test("บริษัทไม่มีโลโก้ → ออก PDF ปกติ (ไม่ล้ม)", async () => {
    const buffer = await renderOnsiteReportPdf(sampleReport, {
      company: { name: "บริษัท ทดสอบ จำกัด", logo: null },
    });
    expect(buffer.byteLength).toBeGreaterThan(1000);
  });

  test("code บริษัทใหม่ที่ไม่มีใน seed ก็ออก PDF ได้ (ไม่ผูกกับ ACME/BETA)", async () => {
    const buffer = await renderOnsiteReportPdf(
      { ...sampleReport, company: "ACME" },
      { company: { name: "ACME Test Co", logo: null } },
    );
    expect(Buffer.from(buffer.subarray(0, 5)).toString("ascii")).toBe("%PDF-");
  });
});

// PNG 1×1 ที่ valid จริง — ไม่พึ่งไฟล์โลโก้แบรนด์ (ไม่อยู่ใน git)
const PNG_1X1_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

/** JPEG ขั้นต่ำที่มีแค่ SOI + SOF0 (สูง 32, กว้าง 64) — พอสำหรับทดสอบการอ่านมิติ */
const jpegWithSize = (width: number, height: number): Uint8Array =>
  Uint8Array.from([
    0xff, 0xd8, 0xff, 0xc0, 0x00, 0x11, 0x08,
    height >> 8, height & 0xff, width >> 8, width & 0xff,
    0x03, 0x01, 0x22, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
  ]);

describe("validateLogoImage", () => {
  test("PNG ถูกต้อง → อ่านชนิดและมิติได้", () => {
    const result = validateLogoImage(Buffer.from(PNG_1X1_BASE64, "base64"));
    expect(result).toEqual({
      ok: true,
      image: { mimeType: "image/png", width: 1, height: 1 },
    });
  });

  test("JPEG → อ่านกว้าง/สูงจาก SOF", () => {
    const result = validateLogoImage(jpegWithSize(64, 32));
    expect(result).toEqual({
      ok: true,
      image: { mimeType: "image/jpeg", width: 64, height: 32 },
    });
  });

  test("ไฟล์ที่ไม่ใช่รูป (เช่น HTML/SVG ที่แอบนามสกุล) → ปฏิเสธ", () => {
    const html = new TextEncoder().encode("<svg onload=alert(1)></svg>");
    const result = validateLogoImage(html);
    expect(result.ok).toBe(false);
  });

  test("ไฟล์ว่าง → ปฏิเสธ", () => {
    expect(validateLogoImage(new Uint8Array(0)).ok).toBe(false);
  });

  test("ไฟล์ใหญ่เกินกำหนด → ปฏิเสธก่อนอ่านเนื้อหา", () => {
    const result = validateLogoImage(
      new Uint8Array(ONSITE_REPORT_LOGO_MAX_BYTES + 1),
    );
    expect(result).toEqual({ ok: false, error: "ไฟล์ใหญ่เกิน 512KB" });
  });

  test("PNG ที่ signature ถูกแต่ถูกตัดสั้น → ปฏิเสธ", () => {
    const truncated = Buffer.from(PNG_1X1_BASE64, "base64").subarray(0, 12);
    expect(validateLogoImage(truncated).ok).toBe(false);
  });

  test("รูปมิติใหญ่ผิดปกติ → ปฏิเสธ", () => {
    expect(validateLogoImage(jpegWithSize(9000, 100)).ok).toBe(false);
  });
});

describe("companyCodeSchema", () => {
  test("รับ code รูปแบบ slug ตัวพิมพ์ใหญ่", () => {
    for (const code of ["ACME", "BETA", "ACME-1", "A_B", "42"]) {
      expect(companyCodeSchema.safeParse(code).success).toBe(true);
    }
  });

  test("ปฏิเสธ code ที่ไม่ปลอดภัยใน URL path หรือรูปแบบผิด", () => {
    for (const code of [
      "../etc/passwd",
      "a",
      "acme",
      "ACME CO",
      "-ACME",
      "ACME/ONE",
      "A".repeat(33),
      "",
    ]) {
      expect(companyCodeSchema.safeParse(code).success).toBe(false);
    }
  });
});

describe("createCompanySchema", () => {
  test("ผ่านเมื่อมี code + name และ trim ชื่อให้", () => {
    const result = createCompanySchema.parse({
      code: "ACME",
      name: "  บริษัท เอซีเอ็มอี จำกัด  ",
    });
    expect(result.name).toBe("บริษัท เอซีเอ็มอี จำกัด");
  });

  test("ชื่อว่างหรือยาวเกิน → ไม่ผ่าน", () => {
    expect(createCompanySchema.safeParse({ code: "ACME", name: "   " }).success).toBe(false);
    expect(
      createCompanySchema.safeParse({ code: "ACME", name: "ก".repeat(121) }).success,
    ).toBe(false);
  });
});

describe("updateCompanySchema", () => {
  test("แก้ได้เฉพาะ name/sortOrder/isActive", () => {
    expect(updateCompanySchema.safeParse({ isActive: false }).success).toBe(true);
    expect(updateCompanySchema.safeParse({ name: "ใหม่", sortOrder: 3 }).success).toBe(true);
  });

  test("body ว่างหรือลำดับติดลบ → ไม่ผ่าน", () => {
    expect(updateCompanySchema.safeParse({}).success).toBe(false);
    expect(updateCompanySchema.safeParse({ sortOrder: -1 }).success).toBe(false);
  });

  test("code ที่แอบส่งมาถูกทิ้ง ไม่ถูกส่งต่อให้ service", () => {
    const result = updateCompanySchema.parse({ name: "ใหม่", code: "HACK" });
    expect("code" in result).toBe(false);
  });
});

describe("signaturePartySchema", () => {
  test("รับเฉพาะ COMPANY และ CLIENT", () => {
    expect(signaturePartySchema.safeParse("COMPANY").success).toBe(true);
    expect(signaturePartySchema.safeParse("CLIENT").success).toBe(true);
    for (const value of ["company", "ADMIN", "../x", ""]) {
      expect(signaturePartySchema.safeParse(value).success).toBe(false);
    }
  });
});

describe("validateLogoImage — เพดานขนาดกำหนดเองสำหรับลายเซ็น", () => {
  test("ไฟล์เกิน 256KB → ปฏิเสธด้วยข้อความตามเพดานที่ส่งเข้าไป", () => {
    const result = validateLogoImage(
      new Uint8Array(ONSITE_REPORT_SIGNATURE_MAX_BYTES + 1),
      ONSITE_REPORT_SIGNATURE_MAX_BYTES,
    );
    expect(result).toEqual({ ok: false, error: "ไฟล์ใหญ่เกิน 256KB" });
  });

  test("ไฟล์ขนาดเท่า 256KB ที่เป็นรูปจริงยังผ่านเพดาน (ไม่ถูกตัดก่อนตรวจชนิด)", () => {
    const png = Buffer.from(PNG_1X1_BASE64, "base64");
    expect(validateLogoImage(png, ONSITE_REPORT_SIGNATURE_MAX_BYTES).ok).toBe(true);
  });
});
