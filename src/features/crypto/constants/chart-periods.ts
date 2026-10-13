export const CHART_PERIODS = {
  "24h": {
    hours: 24,
    bitkubResolution: "60",
    binanceInterval: "1h",
    label: "24 ชั่วโมง",
    shortLabel: "24 ชม.",
    candleLabel: "1 ชม.",
  },
  "7d": {
    hours: 24 * 7,
    bitkubResolution: "240",
    binanceInterval: "4h",
    label: "7 วัน",
    shortLabel: "7 วัน",
    candleLabel: "4 ชม.",
  },
  "30d": {
    hours: 24 * 30,
    bitkubResolution: "1D",
    binanceInterval: "1d",
    label: "30 วัน",
    shortLabel: "30 วัน",
    candleLabel: "1 วัน",
  },
  "90d": {
    hours: 24 * 90,
    bitkubResolution: "1D",
    binanceInterval: "1d",
    label: "90 วัน",
    shortLabel: "90 วัน",
    candleLabel: "1 วัน",
  },
} as const;

export type ChartPeriod = keyof typeof CHART_PERIODS;

export const isChartPeriod = (value: string): value is ChartPeriod =>
  Object.hasOwn(CHART_PERIODS, value);
