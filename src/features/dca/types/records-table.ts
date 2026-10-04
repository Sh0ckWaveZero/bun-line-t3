import type { DcaOrder } from "@/features/dca/types/index";

/** แถวข้อมูลประวัติการซื้อที่คำนวณค่าสะสมแล้วสำหรับตาราง */
export interface EnrichedRow {
  order: DcaOrder;
  dayActive: number;
  satoshi: number;
  cumSat: number;
  cumFiat: number;
  portfolioValue: number;
  invested: number;
  unrealized: number;
  pctUnrealized: number;
}

/** คีย์ที่ใช้เรียงลำดับในตารางประวัติการซื้อ */
export type RecordsSortKey =
  | "dayActive"
  | "date"
  | "fiat"
  | "satoshi"
  | "price"
  | "portfolioValue"
  | "invested"
  | "unrealized"
  | "pctUnrealized";

/** ทิศทางการเรียงลำดับ */
export type SortDirection = "asc" | "desc";

/** นิยามคอลัมน์ของตารางประวัติการซื้อ */
export interface TableColDef {
  key: RecordsSortKey;
  label: string;
  shortLabel: string;
  left?: boolean;
  hideMobile?: boolean;
}

/** รายการเลขหน้าในตัวแบ่งหน้า (มีจุดไข่ปลา) */
export interface PageNumItem {
  key: string;
  page: number | "...";
}
