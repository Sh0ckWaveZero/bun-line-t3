/** โหมดการแสดงผลของกราฟ DCA */
export type ChartMode = "portfolio" | "pnl" | "cost" | "sats" | "entries";

/** ช่วงเวลาของกราฟ DCA */
export type Timeframe = "30D" | "90D" | "1Y" | "ALL";

/** จุดข้อมูลรายการซื้อที่คำนวณค่าสะสมแล้วสำหรับกราฟ */
export interface EnrichedPoint {
  id: string;
  date: string;
  fiat: number;
  satoshi: number;
  price: number;
  cumSat: number;
  cumFiat: number;
  portfolioValue: number;
  invested: number;
  unrealized: number;
  pctUnrealized: number;
}

/** ชุดข้อมูลเส้นหนึ่งในกราฟ */
export interface SeriesItem {
  key: string;
  label: string;
  color: string;
  fill: string | undefined;
  dash: string | undefined;
  zero: boolean;
  values: number[];
}

/** ขนาดพื้นที่ (กว้าง × สูง) */
export interface ChartDimensions {
  w: number;
  h: number;
}

/** แถวข้อมูลใน tooltip ของกราฟ */
export interface ChartTooltipRow {
  lbl: string;
  val: string;
}

/** แท็บเลือกโหมดของกราฟ */
export interface ChartTab {
  key: ChartMode;
  label: string;
  shortLabel: string;
}
