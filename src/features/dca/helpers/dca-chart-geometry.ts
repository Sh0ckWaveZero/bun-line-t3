import type {
  ChartDimensions,
  EnrichedPoint,
  SeriesItem,
} from "@/features/dca/types/chart";
import { computeYDomain } from "@/features/dca/helpers/dca-chart-data";

/** ระยะขอบซ้ายของพื้นที่วาดกราฟ (พิกเซล) */
export const CHART_PAD_LEFT = 46;
/** ระยะขอบขวาของพื้นที่วาดกราฟ (พิกเซล) */
export const CHART_PAD_RIGHT = 8;
/** ระยะขอบบนของพื้นที่วาดกราฟ (พิกเซล) */
export const CHART_PAD_TOP = 10;
/** ระยะขอบล่างของพื้นที่วาดกราฟ (พิกเซล) */
export const CHART_PAD_BOTTOM = 24;

/** เรขาคณิตทั้งหมดที่จำเป็นต่อการวาดกราฟ */
export interface ChartGeometry {
  w: number;
  h: number;
  cw: number;
  ch: number;
  padL: number;
  padR: number;
  padT: number;
  padB: number;
  yMin: number;
  yMax: number;
  grid: Array<{ v: number; y: number }>;
  zeroY: number | null;
  xTicks: Array<{ idx: number; x: number; date: string | undefined }>;
  x: (i: number) => number;
  y: (v: number) => number;
  buildPath: (values: number[], withArea: boolean) => string;
}

/** สร้างเรขาคณิตของกราฟ (สเกลแกน, เส้น grid, เส้นทาง) จากข้อมูลและขนาด container */
export const createChartGeometry = (
  data: EnrichedPoint[],
  dims: ChartDimensions,
  series: SeriesItem[],
): ChartGeometry => {
  const { w, h } = dims;
  const padL = CHART_PAD_LEFT;
  const padR = CHART_PAD_RIGHT;
  const padT = CHART_PAD_TOP;
  const padB = CHART_PAD_BOTTOM;
  const cw = Math.max(0, w - padL - padR);
  const ch = Math.max(0, h - padT - padB);
  const { yMin, yMax } = computeYDomain(series);

  const x = (i: number) =>
    padL + (data.length <= 1 ? 0 : (i / (data.length - 1)) * cw);
  const y = (v: number) => padT + ch - ((v - yMin) / (yMax - yMin)) * ch;

  const grid = Array.from({ length: 5 }, (_, i) => {
    const v = yMin + ((yMax - yMin) / 4) * i;
    return { v, y: y(v) };
  });
  const zeroY = yMin < 0 && yMax > 0 ? y(0) : null;

  const buildPath = (values: number[], withArea: boolean): string => {
    if (values.length === 0) return "";
    let d = `M ${x(0)} ${y(values[0]!)}`;
    for (let i = 1; i < values.length; i++) d += ` L ${x(i)} ${y(values[i]!)}`;
    if (withArea) {
      const baseY = zeroY !== null ? zeroY : padT + ch;
      d += ` L ${x(values.length - 1)} ${baseY} L ${x(0)} ${baseY} Z`;
    }
    return d;
  };

  const xTickCount = Math.min(6, data.length);
  const xTicks = Array.from({ length: xTickCount }, (_, i) => {
    const idx = Math.round((i / (xTickCount - 1 || 1)) * (data.length - 1));
    return { idx, x: x(idx), date: data[idx]?.date };
  });

  return {
    w,
    h,
    cw,
    ch,
    padL,
    padR,
    padT,
    padB,
    yMin,
    yMax,
    grid,
    zeroY,
    xTicks,
    x,
    y,
    buildPath,
  };
};

/** ตำแหน่งและขนาดของ tooltip ที่คำนวณแล้ว */
export interface TooltipLayout {
  tooltipWidth: number;
  tooltipLeft: number;
  showTooltipBelow: boolean;
}

interface TooltipLayoutParams {
  activeIdx: number | null;
  xAt: (i: number) => number;
  w: number;
  h: number;
  padL: number;
  padR: number;
  padT: number;
  tooltipSize: ChartDimensions;
}

/** คำนวณตำแหน่ง tooltip ให้ไม่ล้นขอบกราฟ */
export const computeTooltipLayout = ({
  activeIdx,
  xAt,
  w,
  h,
  padL,
  padR,
  padT,
  tooltipSize,
}: TooltipLayoutParams): TooltipLayout => {
  const tooltipPad = 8;
  const tooltipGap = 10;
  const availableTooltipWidth = Math.max(140, w - padL - padR - tooltipPad * 2);
  const tooltipWidth = Math.min(
    Math.max(tooltipSize.w, 160),
    availableTooltipWidth,
  );
  const rawTooltipX = activeIdx !== null ? xAt(activeIdx) : padL;
  const minTooltipLeft = padL + tooltipPad;
  const maxTooltipLeft = w - padR - tooltipWidth - tooltipPad;
  const safeMaxTooltipLeft = Math.max(minTooltipLeft, maxTooltipLeft);
  const rightEdgeLimit = w - padR - tooltipPad;
  const preferredRightLeft = rawTooltipX + tooltipGap;
  const preferredLeftLeft = rawTooltipX - tooltipWidth - tooltipGap;

  const tooltipLeft = (() => {
    const rightWouldOverflow =
      preferredRightLeft + tooltipWidth > rightEdgeLimit;
    const initialLeft = rightWouldOverflow
      ? preferredLeftLeft
      : preferredRightLeft;
    return Math.max(minTooltipLeft, Math.min(safeMaxTooltipLeft, initialLeft));
  })();
  const showTooltipBelow = padT + tooltipSize.h + 16 > h;

  return { tooltipWidth, tooltipLeft, showTooltipBelow };
};
