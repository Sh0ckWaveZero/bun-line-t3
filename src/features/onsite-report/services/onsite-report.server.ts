/**
 * Service จัดการ Onsite Service Report (FM-PM-01)
 * Server-only — ห้าม import ใน client components/hooks
 */
import { Prisma } from "@prisma/client";
import { db } from "@/lib/database";
import type {
  OnsiteReport,
  OnsiteReportAttendee,
  OnsiteReportNextAction,
  OnsiteReportPayload,
  OnsiteReportSignatureParty,
} from "../types";

interface ReportRow {
  id: string;
  company: string;
  companyRef: { name: string };
  signatures: { party: string; updatedAt: Date }[];
  docNo: string;
  revision: string;
  clientName: string;
  projectCode: string;
  onsiteDate: string;
  timeStart: number | null;
  timeEnd: number | null;
  phase: string | null;
  mainContact: string;
  executionTeam: string;
  objective: string;
  actionItem: string;
  pendingNote: string | null;
  nextActions: Prisma.JsonValue | null;
  attendees: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
}

const parseJsonArray = <T>(value: Prisma.JsonValue | null): T[] =>
  Array.isArray(value) ? (value as unknown as T[]) : [];

/** Prisma row → app type (Json fields → typed arrays, Date → ISO string) */
const toReport = (row: ReportRow): OnsiteReport => ({
  id: row.id,
  company: row.company,
  companyName: row.companyRef.name,
  signatures: row.signatures.map((signature) => ({
    party: signature.party as OnsiteReportSignatureParty,
    updatedAt: signature.updatedAt.toISOString(),
  })),
  docNo: row.docNo,
  revision: row.revision,
  clientName: row.clientName,
  projectCode: row.projectCode,
  onsiteDate: row.onsiteDate,
  timeStart: row.timeStart,
  timeEnd: row.timeEnd,
  phase: row.phase,
  mainContact: row.mainContact,
  executionTeam: row.executionTeam,
  objective: row.objective,
  actionItem: row.actionItem,
  pendingNote: row.pendingNote,
  nextActions: parseJsonArray<OnsiteReportNextAction>(row.nextActions),
  attendees: parseJsonArray<OnsiteReportAttendee>(row.attendees),
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

// ─────────────────────────────────────────────
// Queries — ทุกเมธอด scope ด้วย userId เสมอ (ป้องกัน IDOR)
// ─────────────────────────────────────────────

/** ชื่อบริษัท + สถานะลายเซ็น (ไม่ดึงไบต์ของรูป) ที่ toReport ต้องใช้ */
const REPORT_INCLUDE = {
  companyRef: { select: { name: true } },
  signatures: { select: { party: true, updatedAt: true } },
} as const;

export const listOnsiteReports = async (userId: string): Promise<OnsiteReport[]> => {
  const rows = await db.onsiteServiceReport.findMany({
    where: { userId },
    orderBy: [{ onsiteDate: "desc" }, { createdAt: "desc" }],
    include: REPORT_INCLUDE,
  });
  return rows.map(toReport);
};

export const getOnsiteReport = async (
  id: string,
  userId: string,
): Promise<OnsiteReport | null> => {
  const row = await db.onsiteServiceReport.findFirst({
    where: { id, userId },
    include: REPORT_INCLUDE,
  });
  return row ? toReport(row) : null;
};

// ─────────────────────────────────────────────
// Mutations
// ─────────────────────────────────────────────

export const createOnsiteReport = async (
  userId: string,
  payload: OnsiteReportPayload,
): Promise<OnsiteReport> => {
  const row = await db.onsiteServiceReport.create({
    data: {
      userId,
      company: payload.company,
      docNo: payload.docNo,
      revision: payload.revision,
      clientName: payload.clientName,
      projectCode: payload.projectCode,
      onsiteDate: payload.onsiteDate,
      timeStart: payload.timeStart,
      timeEnd: payload.timeEnd,
      phase: payload.phase,
      mainContact: payload.mainContact,
      executionTeam: payload.executionTeam,
      objective: payload.objective,
      actionItem: payload.actionItem,
      pendingNote: payload.pendingNote,
      nextActions:
        payload.nextActions as unknown as Prisma.InputJsonValue[],
      attendees: payload.attendees as unknown as Prisma.InputJsonValue[],
    },
    include: REPORT_INCLUDE,
  });
  return toReport(row);
};

export const updateOnsiteReport = async (
  id: string,
  userId: string,
  payload: OnsiteReportPayload,
): Promise<OnsiteReport | null> => {
  const existing = await db.onsiteServiceReport.findFirst({
    where: { id, userId },
    select: { id: true },
  });
  if (!existing) return null;

  const row = await db.onsiteServiceReport.update({
    where: { id },
    data: {
      company: payload.company,
      docNo: payload.docNo,
      revision: payload.revision,
      clientName: payload.clientName,
      projectCode: payload.projectCode,
      onsiteDate: payload.onsiteDate,
      timeStart: payload.timeStart,
      timeEnd: payload.timeEnd,
      phase: payload.phase,
      mainContact: payload.mainContact,
      executionTeam: payload.executionTeam,
      objective: payload.objective,
      actionItem: payload.actionItem,
      pendingNote: payload.pendingNote,
      nextActions:
        payload.nextActions as unknown as Prisma.InputJsonValue[],
      attendees: payload.attendees as unknown as Prisma.InputJsonValue[],
    },
    include: REPORT_INCLUDE,
  });
  return toReport(row);
};

export const deleteOnsiteReport = async (
  id: string,
  userId: string,
): Promise<boolean> => {
  const existing = await db.onsiteServiceReport.findFirst({
    where: { id, userId },
    select: { id: true },
  });
  if (!existing) return false;

  await db.onsiteServiceReport.delete({ where: { id } });
  return true;
};
