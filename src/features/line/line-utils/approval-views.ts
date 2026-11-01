import type {
  ApprovalItem,
  ApprovalListResponse,
} from "@/features/line/line-utils/approvals";

const APPROVAL_DATE_FORMATTER = new Intl.DateTimeFormat("th-TH", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const APPROVAL_SHORT_DATE_FORMATTER = new Intl.DateTimeFormat("th-TH", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const RELATIVE_FORMATTER = new Intl.RelativeTimeFormat("th-TH", {
  numeric: "auto",
});

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return "—";
  return APPROVAL_DATE_FORMATTER.format(new Date(dateStr));
};

/** ประทับเวลาตามสถานะล่าสุด: อนุมัติ/ปฏิเสธใช้เวลาตัดสินใจ (approvedAt), รออนุมัติใช้เวลาที่ขอ */
const getStatusTimestamp = (item: ApprovalItem): string | null => {
  const decidedAt =
    item.status === "APPROVED" || item.status === "REJECTED"
      ? item.approvedAt
      : null;
  const at = decidedAt ?? (item.status === "PENDING" ? item.createdAt : null);
  if (!at) return null;
  const label =
    item.status === "APPROVED"
      ? "อนุมัติ"
      : item.status === "REJECTED"
        ? "ปฏิเสธ"
        : "ขอ";
  return `${label} ${APPROVAL_SHORT_DATE_FORMATTER.format(new Date(at))}`;
};

/** relative เฉพาะ ≤ 7 วัน — เกินกว่านั้น fallback เป็นวันที่เต็มจะซ้ำกับ formatDate จึงคืน null */
const formatRelative = (dateStr: string): string | null => {
  const diffMinutes = Math.round(
    (Date.now() - new Date(dateStr).getTime()) / 60000,
  );
  if (Math.abs(diffMinutes) < 60) {
    return RELATIVE_FORMATTER.format(-diffMinutes, "minute");
  }
  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return RELATIVE_FORMATTER.format(-diffHours, "hour");
  }
  const diffDays = Math.round(diffHours / 24);
  if (Math.abs(diffDays) < 7) {
    return RELATIVE_FORMATTER.format(-diffDays, "day");
  }
  return null;
};

/** อีเมลปลอมที่ระบบสร้างจาก LINE user ID (รูปแบบ <id>@line.local) ไม่มีประโยชน์โชว์ซ้ำ */
const getRealEmail = (item: ApprovalItem): string | null => {
  const email = item.userEmail;
  if (!email) return null;
  const lineId = item.lineUserId.toLowerCase();
  const normalized = email.toLowerCase();
  if (normalized === lineId || normalized.startsWith(lineId)) return null;
  return email;
};

/**
 * รายการคำขอพร้อมข้อความวันที่ที่ฟอร์แมตไว้ล่วงหน้าแล้ว — คำนวณใน mapping layer
 * (นอก JSX/render path) เพื่อไม่ให้ Intl.DateTimeFormat ถึงมือจาก JSX กัน hydration mismatch
 */
export interface ApprovalItemView extends ApprovalItem {
  /** สตริงจาก getStatusTimestamp — null ถ้าไม่มีเวลาให้แสดง */
  statusTimestampText: string | null;
  /** สตริงจาก formatDate(item.createdAt) */
  createdAtText: string;
  /** สตริงจาก formatRelative(item.createdAt) — null ถ้าเกิน 7 วัน */
  createdAtRelativeText: string | null;
  /** สตริงจาก getRealEmail(item) — null ถ้าเป็นอีเมลปลอมจาก LINE ID */
  realEmailText: string | null;
}

export interface ApprovalListView {
  data: ApprovalItemView[];
  total: number;
}

/** mapper (non-component): แนบสตริงวันที่ฟอร์แมตแล้วทับรายการดิบก่อนเข้าสู่ render path */
export const mapApprovalItem = (item: ApprovalItem): ApprovalItemView => ({
  ...item,
  statusTimestampText: getStatusTimestamp(item),
  createdAtText: formatDate(item.createdAt),
  createdAtRelativeText: formatRelative(item.createdAt),
  realEmailText: getRealEmail(item),
});

/** mapper (non-component) สำหรับ query select — แปลง response ดิบทั้งก้อนเป็น view */
export const mapApprovalListView = (
  response: ApprovalListResponse,
): ApprovalListView => ({
  data: response.data.map(mapApprovalItem),
  total: response.total,
});
