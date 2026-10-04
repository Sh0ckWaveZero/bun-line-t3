import type { DcaLocaleStrings } from "@/features/dca/lib/locale";
import type { DcaOrder } from "@/features/dca/types";
import { fmtTHBFull } from "@/features/dca/helpers/dca-chart-format";
import type {
  ChartMode,
  ChartTab,
  ChartTooltipRow,
  EnrichedPoint,
  SeriesItem,
  Timeframe,
} from "@/features/dca/types/chart";

/** จำนวนวันย้อนหลังของแต่ละช่วงเวลา */
const TIMEFRAME_DAYS: Record<Timeframe, number> = {
  "30D": 30,
  "90D": 90,
  "1Y": 365,
  ALL: Infinity,
};

/** สร้างจุดข้อมูลสะสมจากรายการซื้อ (เรียงตามวันที่) */
export const buildEnrichedPoints = (
  orders: DcaOrder[],
  currentPrice: number | null,
): EnrichedPoint[] => {
  if (!currentPrice || orders.length === 0) return [];
  const sorted = [...orders].sort(
    (a, b) =>
      new Date(a.executedAt).getTime() - new Date(b.executedAt).getTime(),
  );
  let cumSat = 0;
  let cumFiat = 0;
  return sorted.map((order) => {
    const satoshi = Math.round(order.coinReceived * 1e8);
    cumSat += satoshi;
    cumFiat += order.amountTHB;
    const portfolioValue = (cumSat / 1e8) * order.pricePerCoin;
    const unrealized = portfolioValue - cumFiat;
    const pctUnrealized = cumFiat > 0 ? (unrealized / cumFiat) * 100 : 0;
    return {
      id: order.id,
      date: new Date(order.executedAt).toISOString().split("T")[0]!,
      fiat: order.amountTHB,
      satoshi,
      price: order.pricePerCoin,
      cumSat,
      cumFiat,
      portfolioValue,
      invested: cumFiat,
      unrealized,
      pctUnrealized,
    };
  });
};

/** กรองจุดข้อมูลตามช่วงเวลาที่เลือก */
export const filterPointsByTimeframe = (
  points: EnrichedPoint[],
  timeframe: Timeframe,
): EnrichedPoint[] => {
  const days = TIMEFRAME_DAYS[timeframe];
  return days === Infinity ? points : points.slice(-days);
};

/** สร้างแท็บเลือกโหมดของกราฟจาก locale */
export const buildChartTabs = (t: DcaLocaleStrings): ChartTab[] => [
  {
    key: "portfolio",
    label: t.chart.modePortfolio,
    shortLabel: t.chart.shortPortfolio,
  },
  { key: "pnl", label: t.chart.modePnl, shortLabel: t.chart.shortPnl },
  { key: "cost", label: t.chart.modeCost, shortLabel: t.chart.shortCost },
  { key: "sats", label: t.chart.modeSats, shortLabel: t.chart.shortSats },
  {
    key: "entries",
    label: t.chart.modeEntries,
    shortLabel: t.chart.shortEntries,
  },
];

/** สร้างชุดเส้นข้อมูลของกราฟตามโหมดที่เลือก */
export const buildSeries = (
  mode: ChartMode,
  data: EnrichedPoint[],
  t: DcaLocaleStrings,
): SeriesItem[] => {
  if (mode === "portfolio")
    return [
      {
        key: "portfolio",
        label: t.chart.seriesPortfolioValue,
        color: "rgb(249,115,22)",
        fill: "rgba(249,115,22,0.12)",
        dash: undefined,
        zero: false,
        values: data.map((d) => d.portfolioValue),
      },
      {
        key: "invested",
        label: t.chart.seriesInvested,
        color: "var(--foreground)",
        dash: "4 4",
        fill: undefined,
        zero: false,
        values: data.map((d) => d.invested),
      },
    ];
  if (mode === "pnl")
    return [
      {
        key: "unrealized",
        label: t.chart.seriesUnrealizedPnl,
        color: "rgb(249,115,22)",
        fill: "rgba(249,115,22,0.12)",
        dash: undefined,
        zero: true,
        values: data.map((d) => d.unrealized),
      },
    ];
  if (mode === "sats")
    return [
      {
        key: "sats",
        label: t.chart.seriesCumulativeSatoshi,
        color: "rgb(249,115,22)",
        fill: "rgba(249,115,22,0.12)",
        dash: undefined,
        zero: false,
        values: data.map((d) => d.cumSat),
      },
    ];
  if (mode === "entries")
    return [
      {
        key: "price",
        label: t.chart.seriesBtcPrice,
        color: "var(--muted-foreground)",
        fill: undefined,
        dash: undefined,
        zero: false,
        values: data.map((d) => d.price),
      },
    ];
  return [
    {
      key: "market",
      label: t.chart.seriesMarketPrice,
      color: "rgb(249,115,22)",
      fill: undefined,
      dash: undefined,
      zero: false,
      values: data.map((d) => d.price),
    },
    {
      key: "cost",
      label: t.chart.seriesAvgCostBasis,
      color: "var(--foreground)",
      dash: "4 4",
      fill: undefined,
      zero: false,
      values: data.map((d) => d.cumFiat / (d.cumSat / 1e8)),
    },
  ];
};

/** คำนวณขอบเขตแกน Y จากชุดเส้นข้อมูล */
export const computeYDomain = (
  series: SeriesItem[],
): { yMin: number; yMax: number } => {
  const allVals = series.flatMap((s) => s.values).filter((v) => isFinite(v));
  let yMin = allVals.length > 0 ? Math.min(...allVals) : 0;
  let yMax = allVals.length > 0 ? Math.max(...allVals) : 1;
  const needsZeroBaseline = Boolean(series.find((s) => s.zero));
  if (needsZeroBaseline) {
    yMin = Math.min(yMin, 0);
    yMax = Math.max(yMax, 0);
    const yRange = yMax - yMin || 1;
    yMin -= yRange * 0.06;
    yMax += yRange * 0.06;
  } else {
    yMin = Math.max(0, yMin);
    const yRange = yMax - yMin || 1;
    yMin = Math.max(0, yMin - yRange * 0.02);
    yMax += yRange * 0.04;
  }
  return { yMin, yMax };
};

/** สร้างแถวข้อมูลใน tooltip ตามโหมดที่เลือก */
export const buildTooltipRows = (
  mode: ChartMode,
  hovered: EnrichedPoint,
  t: DcaLocaleStrings,
): ChartTooltipRow[] => {
  if (mode === "portfolio") {
    return [
      {
        lbl: t.chart.tooltipPortfolio,
        val: fmtFull(hovered.portfolioValue),
      },
      {
        lbl: t.chart.tooltipInvested,
        val: fmtFull(hovered.invested),
      },
      {
        lbl: t.chart.tooltipUnrealized,
        val: fmtSignedFull(hovered.unrealized),
      },
    ];
  }
  if (mode === "pnl") {
    return [
      {
        lbl: t.chart.tooltipUnrealized,
        val: fmtSignedFull(hovered.unrealized),
      },
      {
        lbl: t.chart.tooltipPercent,
        val: hovered.pctUnrealized.toFixed(2) + "%",
      },
    ];
  }
  if (mode === "sats") {
    return [
      {
        lbl: t.chart.tooltipCumulative,
        val: hovered.cumSat.toLocaleString("en-US") + " sat",
      },
      {
        lbl: t.chart.tooltipTodaysBuy,
        val: hovered.satoshi.toLocaleString("en-US") + " sat",
      },
    ];
  }
  if (mode === "entries") {
    return [
      { lbl: t.chart.tooltipBtcPrice, val: fmtFull(hovered.price) },
      {
        lbl: t.chart.tooltipBought,
        val: hovered.satoshi.toLocaleString("en-US") + " sat",
      },
    ];
  }
  const costBasis = hovered.cumFiat / (hovered.cumSat / 1e8);
  return [
    { lbl: t.chart.tooltipMarket, val: fmtFull(hovered.price) },
    { lbl: t.chart.tooltipAvgCost, val: fmtFull(costBasis) },
  ];
};

const fmtFull = (n: number): string => fmtTHBFull(n) + " ฿";

const fmtSignedFull = (n: number): string =>
  (n >= 0 ? "+" : "") + fmtTHBFull(n) + " ฿";

/** หา index ของจุดข้อมูลจากตำแหน่ง clientX (clamp ในช่วงข้อมูล) */
export const pickIndexByClientX = (
  clientX: number,
  rectLeft: number,
  padL: number,
  cw: number,
  dataLength: number,
): number | null => {
  if (dataLength === 0 || cw <= 0) return null;
  const mx = clientX - rectLeft;
  if (mx < padL) return null;
  const rel = (mx - padL) / cw;
  return Math.max(
    0,
    Math.min(dataLength - 1, Math.round(rel * (dataLength - 1))),
  );
};
