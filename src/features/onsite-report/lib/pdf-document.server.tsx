/**
 * เอกสาร PDF: Onsite Service Report (FM-PM-01)
 * Server-only — ห้าม import ใน client components/hooks
 *
 * เลย์เอาต์ตามไฟล์ export จริงของบริษัท:
 * โลโก้ซ้ายบน (เลือกตามบริษัท) + ชื่อบริษัท/ชื่อเอกสารกลาง + Doc No ขวา →
 * ข้อมูลงานแบบเส้นขีดใต้ → Section 1-3 (แถบหัวข้อพื้นสี + กล่องขอบซ้าย/ขวา) →
 * Section 4 (ตาราง Next Action เส้นนอน) → Section 5 (ผู้เข้าร่วม 2×5 คน) →
 * เส้นลายเซ็น 2 ฝั่ง + เลขหน้ามุมขวาล่าง
 */
import path from "node:path";
// ไฟล์ .server.tsx — ใช้ที่ API route ฝั่ง server เท่านั้น ไม่ถูกรวมใน client bundle
// จึงไม่มี "page load" ให้ชะลอ และ React.lazy/next/dynamic ใช้กับฝั่ง server ไม่ได้
// eslint-disable-next-line react-doctor/prefer-dynamic-import
import {
  Document,
  Font,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import { formatDateTh, formatOnsiteDate, formatSheetTime } from "./format";
import type { OnsiteReport } from "../types";

// ─────────────────────────────────────────────
// Fonts — Sarabun (ฟอนต์เดียวกับไฟล์ export จริง) ใน public/fonts (fontkit จัด shaping ภาษาไทย)
// ─────────────────────────────────────────────

const FONT_DIR = path.resolve(process.cwd(), "public/fonts");

/** คำยาวเกินนี้ถึงยอมให้ตัดกลางคำ (รหัสโปรเจกต์/โทเคนที่ไม่มีช่องว่าง) */
const LONG_WORD_LENGTH = 24;
const LONG_WORD_CHUNK = 10;

let fontsRegistered = false;

const ensureFonts = (): void => {
  if (fontsRegistered) return;
  Font.register({
    family: "Sarabun",
    fonts: [
      { src: path.join(FONT_DIR, "Sarabun-Regular.ttf"), fontWeight: 400 },
      { src: path.join(FONT_DIR, "Sarabun-Bold.ttf"), fontWeight: 700 },
    ],
  });
  // คำปกติไม่ตัดด้วย hyphen ("Presi-dent") — ขึ้นบรรทัดใหม่ทั้งคำ
  // แต่โทเคนยาวไม่มีช่องว่าง (เช่น Project Code 60 ตัว) ต้องยอมหั่นเป็นชิ้น ไม่งั้นล้นกรอบหน้ากระดาษ
  Font.registerHyphenationCallback((word) => {
    if (word.length <= LONG_WORD_LENGTH) return [word];
    const chunks: string[] = [];
    for (let i = 0; i < word.length; i += LONG_WORD_CHUNK) {
      chunks.push(word.slice(i, i + LONG_WORD_CHUNK));
    }
    return chunks;
  });
  fontsRegistered = true;
};

/** โลโก้ที่ส่งเข้า PDF — ไบต์มาจาก DB (ไม่มีไฟล์รูปใน git) */
export interface OnsiteReportPdfLogo {
  data: Buffer;
  mimeType: string;
  width: number;
  height: number;
}

/** บริษัทผู้ออกเอกสาร: ชื่อขึ้นหัว PDF/ช่องเซ็น + โลโก้ (ถ้ามี) */
export interface OnsiteReportPdfCompany {
  name: string;
  logo: OnsiteReportPdfLogo | null;
}

/** ลายเซ็นที่ส่งเข้า PDF — แสดงเหนือเส้นเซ็นของแต่ละฝั่ง (null = ช่องว่างให้เซ็นด้วยปากกา) */
export interface OnsiteReportPdfSignatures {
  company: OnsiteReportPdfLogo | null;
  client: OnsiteReportPdfLogo | null;
}

export interface OnsiteReportPdfOptions {
  signatures?: OnsiteReportPdfSignatures;
  /** ไม่ส่ง = ใช้ code ของรายงานเป็นชื่อ และออกหัวกระดาษโดยไม่มีโลโก้ */
  company?: OnsiteReportPdfCompany;
}

/** ความสูงโลโก้ใน PDF (pt) — กว้างคำนวณตามสัดส่วน และไม่เกิน LOGO_MAX_WIDTH */
const LOGO_HEIGHT = 52;
const LOGO_MAX_WIDTH = 96;

const logoDisplaySize = (logo: OnsiteReportPdfLogo) => {
  const ratio = logo.width / logo.height;
  const width = Math.min(LOGO_HEIGHT * ratio, LOGO_MAX_WIDTH);
  return { width, height: width / ratio };
};

// ─────────────────────────────────────────────
// Formatting — ใช้ helpers จาก lib/format.ts (isomorphic)
// ─────────────────────────────────────────────

const nextActionRows = (rows: OnsiteReport["nextActions"], minRows: number) => {
  const padded: (OnsiteReport["nextActions"][number] | null)[] = [...rows];
  while (padded.length < minRows) padded.push(null);
  return padded;
};

/** แถว Next Action ขั้นต่ำที่เติมให้เหมือนไฟล์ export จริง (5 แถว) */
const NEXT_ACTION_MIN_ROWS = 5;

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────

// สีทุกค่าอ่านจาก color operator ในไฟล์ export จริงของบริษัท (FM-PM-01_02102026.pdf)
const LINE = "#B7B7B7"; // เส้นตาราง Next Action / Attendees
const LINE_LIGHT = "#CCCCCC"; // เส้นขีดใต้ข้อมูล (เทาอ่อนตามไฟล์จริง — ดำจะเข้มเกิน)
const SECTION_BAR_BG = "#D0E0E3"; // พื้นแถบหัวข้อ Section
const SECTION_BORDER = "#CCCCCC"; // ขอบซ้าย/ขวากล่อง Section
const TABLE_HEAD_BG = "#B7B7B7"; // พื้นหัวตาราง
/** 1pt — ตรงความหนาเส้นของไฟล์ export จริง; บางกว่านี้ (0.7) จะ rasterize ขาดเป็นช่วงใน preview */
const W = 1;

/** ความกว้างพื้นที่เนื้อหา A4 (ขอบซ้าย/ขวา 60pt ตามไฟล์ export จริง) */
const CONTENT_WIDTH = 595.28 - 120;

/** ตำแหน่งบล็อกข้อมูลงาน (pt) — วัดจากไฟล์ export จริง */
const INFO_LEFT_WIDTH = 317.5; // บล็อกซ้าย (Client / Date+Time / Contact)
const INFO_RIGHT_LEFT = 328; // จุดเริ่มบล็อกขวา (Project Code / Phase)
const INFO_LABEL_LEFT = 74; // กว้าง label คอลัมน์ซ้าย → เส้นขีดใต้เริ่มแนวเดียวกันทุกแถว
const INFO_LABEL_RIGHT = 60;

const styles = StyleSheet.create({
  page: {
    paddingTop: 56,
    paddingBottom: 36,
    paddingHorizontal: 60,
    backgroundColor: "#FFFFFF",
    fontFamily: "Sarabun",
    fontSize: 9,
    color: "#000000",
  },
  // หัวกระดาษ: โลโก้ซ้าย · ชื่อบริษัท/เอกสารกลาง · Doc No ขวา
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  headerLeft: {
    width: "30%",
  },
  headerCenter: {
    width: "34%",
    alignItems: "center",
  },
  headerRight: {
    width: "36%",
  },
  headerCompany: {
    fontSize: 12,
    fontWeight: 700,
  },
  headerTitle: {
    fontSize: 11.5,
    fontWeight: 700,
    marginTop: 2,
  },
  headerDocNo: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingRight: 8,
    marginTop: 14,
    fontSize: 9,
  },
  // ข้อมูลงาน — label ตัวหนา + เส้นขีดใต้ค่า
  // แถวสูงขั้นต่ำ 15pt แล้วขยายตามเนื้อหา (ค่ายาวขึ้นหลายบรรทัดได้ ไม่ทับแถวก่อนหน้า)
  // ไม่ตั้ง alignItems: ค่าเริ่มต้น stretch ทำให้ทุกช่องในแถวสูงเท่ากัน
  // label อยู่บนสุด ข้อความชิดบน และเส้นขีดใต้ของทุกช่องอยู่แนวเดียวกันที่ขอบล่างของแถว
  infoRow: {
    flexDirection: "row",
    minHeight: 15,
  },
  infoField: {
    flexDirection: "row",
  },
  infoLabel: {
    flexShrink: 0,
    fontWeight: 700,
    fontSize: 9,
    paddingLeft: 2,
  },
  infoValueWrap: {
    flex: 1,
    borderBottomWidth: W,
    borderBottomColor: LINE_LIGHT,
    paddingHorizontal: 3,
    minHeight: 13,
  },
  infoValue: {
    fontSize: 9,
  },
  infoDash: {
    width: 26,
    textAlign: "center",
    fontSize: 9,
  },
  // แถบหัวข้อ Section — กรอบซ้าย/ขวา/ล่าง (เส้นบนใช้เส้นล่างของบล็อกก่อนหน้า)
  sectionBar: {
    backgroundColor: SECTION_BAR_BG,
    borderLeftWidth: W,
    borderLeftColor: SECTION_BORDER,
    borderRightWidth: W,
    borderRightColor: SECTION_BORDER,
    borderBottomWidth: W,
    borderBottomColor: SECTION_BORDER,
    fontWeight: 700,
    fontSize: 9,
    paddingVertical: 2.5,
    paddingHorizontal: 6,
  },
  sectionBody: {
    borderLeftWidth: W,
    borderLeftColor: SECTION_BORDER,
    borderRightWidth: W,
    borderRightColor: SECTION_BORDER,
    borderBottomWidth: W,
    borderBottomColor: SECTION_BORDER,
    padding: 6,
    fontSize: 10,
    lineHeight: 1.4,
  },
  // ตารางแบบมีกรอบ (Next Action / Attendees)
  // กรอบนอก ซ้าย/ขวา/ล่าง วาดที่ container เดียว
  // เซลล์ลากเฉพาะเส้นภายใน (ขวา ยกเว้นคอลัมน์สุดท้าย / ล่าง ยกเว้นแถวสุดท้าย)
  // กันเส้นที่ชนกันถูกวาดซ้ำจนหนา/เข้มไม่เท่ากรอบนอก
  gridBox: {
    borderLeftWidth: W,
    borderLeftColor: LINE,
    borderRightWidth: W,
    borderRightColor: LINE,
    borderBottomWidth: W,
    borderBottomColor: LINE,
  },
  gridRow: {
    flexDirection: "row",
  },
  gridHeadCell: {
    backgroundColor: TABLE_HEAD_BG,
    fontWeight: 700,
    fontSize: 9,
    paddingVertical: 2.5,
    paddingHorizontal: 4,
    textAlign: "center",
  },
  gridCell: {
    fontSize: 8.5,
    paddingVertical: 2,
    paddingHorizontal: 3,
    minHeight: 14,
  },
  gridInnerRight: {
    borderRightWidth: W,
    borderRightColor: LINE,
  },
  gridHeadInnerRight: {
    borderRightWidth: W,
    borderRightColor: LINE_LIGHT,
  },
  gridInnerBottom: {
    borderBottomWidth: W,
    borderBottomColor: LINE,
  },
  note: {
    marginTop: 4,
    fontSize: 9,
    fontWeight: 700,
    color: "#000000",
  },
  // ลายเซ็น — เส้นเทาบางเหนือชื่อ ตรงแนวคอลัมน์ Name/Position ของตารางผู้เข้าร่วม
  signatureRow: {
    flexDirection: "row",
    marginTop: 8,
    paddingLeft: 26.4,
  },
  // กล่องลายเซ็นเหนือเส้น — สูงคงที่เสมอ (แม้ยังไม่เซ็น) เพื่อให้เลย์เอาต์ไม่ขยับ
  signatureImageBox: {
    width: "100%",
    height: 52,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 2,
  },
  signatureCol: {
    width: 211.5,
    alignItems: "center",
  },
  signatureGap: {
    width: 26,
  },
  signatureLine: {
    width: "100%",
    borderTopWidth: W,
    borderTopColor: LINE_LIGHT,
  },
  signatureName: {
    width: "100%",
    marginTop: 4,
    fontSize: 9,
    textAlign: "center",
  },
  signatureDate: {
    width: "100%",
    marginTop: 3,
    fontSize: 9,
    textAlign: "center",
  },
  pageNumber: {
    position: "absolute",
    bottom: 20,
    right: 28,
    fontSize: 10,
    color: "#000000",
  },
  docNoLabel: {
    fontWeight: 700,
  },
  docNoValue: {
    fontWeight: 700,
  },
});

/** คอลัมน์ตาราง (% รวม 100) — วัดสัดส่วนจากไฟล์ export จริง */
const NEXT_ACTION_COLUMNS = [
  { width: "16.6%", label: "Date" },
  { width: "33.4%", label: "Milestone" },
  { width: "50%", label: "Description" },
] as const;

const ATTENDEE_COLUMNS = [
  { width: "5.5%", label: "" },
  { width: "20%", label: "Name" },
  { width: "24.5%", label: "Position" },
  { width: "5.5%", label: "" },
  { width: "20%", label: "Name" },
  { width: "24.5%", label: "Position" },
] as const;

// ─────────────────────────────────────────────
// Blocks
// ─────────────────────────────────────────────

interface TextSectionProps {
  title: string;
  body: string;
  minHeight: number;
  /** เส้นบนของแถบหัวข้อ — ใส่เฉพาะ Section แรก (ที่เหลือใช้เส้นล่างของบล็อกก่อนหน้า) */
  hasTopBorder?: boolean;
}

/** แถบหัวข้อพื้นสี + กล่องเนื้อหาขอบซ้าย/ขวา/ล่าง (เหมือนไฟล์ export) */
const TextSection = ({
  title,
  body,
  minHeight,
  hasTopBorder = false,
}: TextSectionProps) => (
  <View>
    <Text
      style={[
        styles.sectionBar,
        ...(hasTopBorder
          ? [{ borderTopWidth: W, borderTopColor: SECTION_BORDER }]
          : []),
      ]}
    >
      {title}
    </Text>
    <View style={[styles.sectionBody, { minHeight }]}>
      <Text>{body}</Text>
    </View>
  </View>
);

interface InfoFieldProps {
  label: string;
  value: string;
  width: number;
  labelWidth: number;
  /** ไม่ขีดเส้นใต้ (เช่น Execution Team ที่ใช้เส้นบนของ Section 1 แทน) */
  hasUnderline?: boolean;
  isValueBold?: boolean;
  marginLeft?: number;
}

/** label ตัวหนา + ค่าบนเส้นขีดใต้ (ความกว้างคงที่ตามไฟล์ export) */
const InfoField = ({
  label,
  value,
  width,
  labelWidth,
  hasUnderline = true,
  isValueBold = false,
  marginLeft = 0,
}: InfoFieldProps) => (
  <View style={[styles.infoField, { width, marginLeft }]}>
    <Text style={[styles.infoLabel, { width: labelWidth }]}>{label}</Text>
    <View
      style={[
        styles.infoValueWrap,
        ...(hasUnderline ? [] : [{ borderBottomWidth: 0 }]),
      ]}
    >
      <Text
        style={[
          styles.infoValue,
          ...(isValueBold ? [{ fontWeight: 700 as const }] : []),
        ]}
      >
        {value}
      </Text>
    </View>
  </View>
);

/** ช่องเวลา: label + [เริ่ม] - [สิ้นสุด] แต่ละช่องมีเส้นขีดใต้แยกกัน */
const TimeField = ({
  start,
  end,
  width,
  marginLeft,
}: {
  start: string;
  end: string;
  width: number;
  marginLeft: number;
}) => (
  <View style={[styles.infoField, { width, marginLeft }]}>
    <Text style={[styles.infoLabel, { width: 58 }]}>Onsite Time :</Text>
    <View style={[styles.infoValueWrap, { alignItems: "center" }]}>
      <Text style={styles.infoValue}>{start}</Text>
    </View>
    <Text style={styles.infoDash}>-</Text>
    <View style={[styles.infoValueWrap, { alignItems: "center" }]}>
      <Text style={styles.infoValue}>{end}</Text>
    </View>
  </View>
);

interface GridTableProps {
  columns: readonly { width: string; label: string }[];
  headerRow: boolean;
  rows: { text: string; isCentered?: boolean }[][];
}

/** ตารางมีกรอบ: หัวพื้นเทา + เส้นภายในทุกเซลล์ (ใช้ร่วม Section 4 และ 5) */
const GridTable = ({ columns, headerRow, rows }: GridTableProps) => {
  const lastColIndex = columns.length - 1;
  return (
    <View style={styles.gridBox}>
      {headerRow && (
        <View style={styles.gridRow}>
          {columns.map((col, colIndex) => (
            <Text
              key={`head-${colIndex}`}
              style={[
                styles.gridHeadCell,
                { width: col.width },
                ...(colIndex < lastColIndex ? [styles.gridHeadInnerRight] : []),
              ]}
            >
              {col.label}
            </Text>
          ))}
        </View>
      )}
      {rows.map((cells, rowIndex) => (
        <View key={`row-${rowIndex}`} style={styles.gridRow}>
          {cells.map((cell, colIndex) => (
            <Text
              key={`row-${rowIndex}-${colIndex}`}
              style={[
                styles.gridCell,
                { width: columns[colIndex]?.width },
                ...(cell.isCentered ? [{ textAlign: "center" as const }] : []),
                ...(colIndex < lastColIndex ? [styles.gridInnerRight] : []),
                ...(rowIndex < rows.length - 1 ? [styles.gridInnerBottom] : []),
              ]}
            >
              {cell.text}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
};

// ─────────────────────────────────────────────
// Document
// ─────────────────────────────────────────────

const SignatureImage = ({ signature }: { signature: OnsiteReportPdfLogo | null }) => (
  <View style={styles.signatureImageBox}>
    {signature && (
      <Image
        src={{
          data: signature.data,
          format: signature.mimeType === "image/png" ? "png" : "jpg",
        }}
        style={{ maxWidth: "100%", maxHeight: 48, objectFit: "contain" }}
      />
    )}
  </View>
);

const OnsiteReportDocument = ({
  report,
  company,
  signatures,
}: {
  report: OnsiteReport;
  company: OnsiteReportPdfCompany;
  signatures: OnsiteReportPdfSignatures;
}) => {
  const { logo } = company;
  const companyLabel = company.name;
  const rightWidth = CONTENT_WIDTH - INFO_RIGHT_LEFT;
  const rightMargin = INFO_RIGHT_LEFT - INFO_LEFT_WIDTH;
  const dateWidth = 132.2;

  const nextActionTableRows = nextActionRows(
    report.nextActions,
    NEXT_ACTION_MIN_ROWS,
  ).map((row) => [
    { text: row ? formatOnsiteDate(row.date) : "" },
    { text: row?.milestone ?? "" },
    { text: row?.description ?? "" },
  ]);

  const attendeeTableRows = Array.from({ length: 5 }, (_, rowIndex) => {
    const left = report.attendees[rowIndex];
    const right = report.attendees[rowIndex + 5];
    return [
      { text: `${rowIndex + 1}`, isCentered: true },
      { text: left?.name ?? "" },
      { text: left?.position ?? "" },
      { text: `${rowIndex + 1}`, isCentered: true },
      { text: right?.name ?? "" },
      { text: right?.position ?? "" },
    ];
  });

  return (
    <Document
      title={`Onsite Service Report ${report.docNo} ${report.revision}`}
      author={companyLabel}
      subject="Onsite Service Report (FM-PM-01)"
    >
      <Page size="A4" style={styles.page}>
        {/* หัวกระดาษ */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            {logo && (
              <Image
                src={{
                  data: logo.data,
                  format: logo.mimeType === "image/png" ? "png" : "jpg",
                }}
                style={{ ...logoDisplaySize(logo), marginLeft: 20 }}
              />
            )}
          </View>
          <View style={styles.headerCenter}>
            <Text style={styles.headerCompany}>{companyLabel}</Text>
            <Text style={styles.headerTitle}>Onsite Service Report</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.headerDocNo}>
              <Text style={styles.docNoLabel}>Doc No:  </Text>
              <Text style={styles.docNoValue}>
                {report.docNo} {report.revision}
              </Text>
            </View>
          </View>
        </View>

        {/* ข้อมูลงาน — เส้นขีดใต้ */}
        <View style={{ marginTop: 18 }}>
          <View style={styles.infoRow}>
            <InfoField
              label="Client Name :"
              value={report.clientName}
              width={INFO_LEFT_WIDTH}
              labelWidth={INFO_LABEL_LEFT}
              isValueBold
            />
            <InfoField
              label="Project Code :"
              value={report.projectCode}
              width={rightWidth}
              labelWidth={INFO_LABEL_RIGHT}
              marginLeft={rightMargin}
            />
          </View>
          <View style={styles.infoRow}>
            <InfoField
              label="Onsite Date :"
              value={formatOnsiteDate(report.onsiteDate)}
              width={dateWidth}
              labelWidth={INFO_LABEL_LEFT}
            />
            <TimeField
              start={formatSheetTime(report.timeStart)}
              end={formatSheetTime(report.timeEnd)}
              width={INFO_LEFT_WIDTH - dateWidth - 13.2}
              marginLeft={13.2}
            />
            <InfoField
              label="Phase :"
              value={report.phase ?? ""}
              width={rightWidth}
              labelWidth={INFO_LABEL_RIGHT}
              marginLeft={rightMargin}
            />
          </View>
          <View style={styles.infoRow}>
            <InfoField
              label="Main Contact :"
              value={report.mainContact}
              width={INFO_LEFT_WIDTH}
              labelWidth={INFO_LABEL_LEFT}
            />
          </View>
          <View style={styles.infoRow}>
            <InfoField
              label="Execution Team :"
              value={report.executionTeam}
              width={INFO_LEFT_WIDTH}
              labelWidth={INFO_LABEL_LEFT}
              hasUnderline={false}
            />
          </View>
        </View>

        {/* Section 1-3 */}
        <TextSection
          title="1. วัตถุประสงค์การเข้าบริการ (Objective)"
          body={report.objective}
          minHeight={55}
          hasTopBorder
        />
        <TextSection
          title="2. รายละเอียดงาน (Action Item)"
          body={report.actionItem}
          minHeight={78}
        />
        <TextSection
          title="3. งานคงค้าง / ข้อแนะนำเพิ่มเติม (Pending & Recommendation)"
          body={report.pendingNote ?? ""}
          minHeight={66}
        />

        {/* Section 4 — ตารางมีกรอบ 3 คอลัมน์ (เติมแถวว่างเหมือนไฟล์ export) */}
        <View>
          <Text style={styles.sectionBar}>
            4. การดำเนินการต่อไป (Next Action)
          </Text>
          <GridTable
            columns={NEXT_ACTION_COLUMNS}
            headerRow
            rows={nextActionTableRows}
          />
        </View>

        {/* Section 5 — ผู้เข้าร่วม 2×5 (เลขทั้งสองฝั่ง 1-5 ตามไฟล์ export) */}
        <View>
          <Text style={styles.sectionBar}>5. ผู้เข้าร่วม (Attendees)</Text>
          <GridTable
            columns={ATTENDEE_COLUMNS}
            headerRow
            rows={attendeeTableRows}
          />
          <Text style={styles.note}>
            *กรณีมีรายชื่อมากกว่า 10 ท่าน ให้แนบเอกสาร attendee list ประกอบ
          </Text>
        </View>

        {/* เส้นลายเซ็น 2 ฝั่ง */}
        <View style={styles.signatureRow}>
          <View style={styles.signatureCol} wrap={false}>
            <SignatureImage signature={signatures.company} />
            <View style={styles.signatureLine} />
            <Text style={styles.signatureName}>{companyLabel}</Text>
            <Text style={styles.signatureDate}>
              Date : {formatDateTh(report.onsiteDate)}
            </Text>
          </View>
          <View style={styles.signatureGap} />
          <View style={styles.signatureCol} wrap={false}>
            <SignatureImage signature={signatures.client} />
            <View style={styles.signatureLine} />
            <Text style={styles.signatureName}>{report.clientName}</Text>
            <Text style={styles.signatureDate}>
              Date : {formatDateTh(report.onsiteDate)}
            </Text>
          </View>
        </View>

        {/* เลขหน้ามุมขวาล่าง */}
        <Text
          style={styles.pageNumber}
          fixed
          render={({ pageNumber }) => `${pageNumber}`}
        />
      </Page>
    </Document>
  );
};

/**
 * เรนเดอร์เอกสารเป็น PDF Buffer
 * เรียกจาก API route เท่านั้น (server-side)
 */
export const renderOnsiteReportPdf = async (
  report: OnsiteReport,
  options: OnsiteReportPdfOptions = {},
): Promise<Buffer> => {
  ensureFonts();
  return renderToBuffer(
    <OnsiteReportDocument
      report={report}
      company={options.company ?? { name: report.company, logo: null }}
      signatures={options.signatures ?? { company: null, client: null }}
    />,
  );
};
