"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import type { DcaOrder } from "@/features/dca/types";
import { useDcaLocale } from "@/features/dca/lib/dca-locale-context";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type ChartMode = "portfolio" | "pnl" | "cost" | "sats" | "entries";
type Timeframe = "30D" | "90D" | "1Y" | "ALL";

interface DcaChartCardProps {
  orders: DcaOrder[];
  currentPrice: number | null;
}

interface EnrichedPoint {
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

type SeriesItem = {
  key: string;
  label: string;
  color: string;
  fill: string | undefined;
  dash: string | undefined;
  zero: boolean;
  values: number[];
};

const fmtTHB = (n: number | null | undefined, decimals = 0): string => {
  if (n === null || n === undefined || isNaN(n)) return "—";
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  return n.toLocaleString("en-US", { maximumFractionDigits: decimals });
};

const fmtTHBFull = (n: number | null | undefined): string => {
  if (n === null || n === undefined || isNaN(n)) return "—";
  return n.toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 });
};

const fmtDateShort = (d: Date): string =>
  d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });

const fmtDate = (d: Date): string =>
  d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" });

const fmtSat = (n: number): string => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1000) return Math.round(n / 1000) + "K";
  return n.toLocaleString("en-US");
};

const TIMEFRAMES: Timeframe[] = ["30D", "90D", "1Y", "ALL"];

export const DcaChartCard = ({ orders, currentPrice }: DcaChartCardProps) => {
  const { t } = useDcaLocale();

  const TABS: { key: ChartMode; label: string; shortLabel: string }[] = [
    { key: "portfolio", label: t.chart.modePortfolio, shortLabel: t.chart.shortPortfolio },
    { key: "pnl", label: t.chart.modePnl, shortLabel: t.chart.shortPnl },
    { key: "cost", label: t.chart.modeCost, shortLabel: t.chart.shortCost },
    { key: "sats", label: t.chart.modeSats, shortLabel: t.chart.shortSats },
    { key: "entries", label: t.chart.modeEntries, shortLabel: t.chart.shortEntries },
  ];
  const [mode, setMode] = useState<ChartMode>("portfolio");
  const [timeframe, setTimeframe] = useState<Timeframe>("ALL");
  const [timeframeOpen, setTimeframeOpen] = useState(false);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const chartAreaRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 800, h: 280 });

  useEffect(() => {
    if (!chartAreaRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDims({ w: width, h: height });
        }
      }
    });
    ro.observe(chartAreaRef.current);
    return () => ro.disconnect();
  }, []);

  const allPoints: EnrichedPoint[] = useMemo(() => {
    if (!currentPrice || orders.length === 0) return [];
    const sorted = [...orders].sort(
      (a, b) => new Date(a.executedAt).getTime() - new Date(b.executedAt).getTime()
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
        date: new Date(order.executedAt).toISOString().split("T")[0]!,
        fiat: order.amountTHB, satoshi, price: order.pricePerCoin,
        cumSat, cumFiat, portfolioValue, invested: cumFiat, unrealized, pctUnrealized,
      };
    });
  }, [orders, currentPrice]);

  const data = useMemo(() => {
    const n: Record<Timeframe, number> = { "30D": 30, "90D": 90, "1Y": 365, "ALL": Infinity };
    return n[timeframe] === Infinity ? allPoints : allPoints.slice(-n[timeframe]);
  }, [allPoints, timeframe]);

  const { w, h } = dims;
  const padL = 46;
  const padR = 8;
  const padT = 10;
  const padB = 24;
  const cw = Math.max(0, w - padL - padR);
  const ch = Math.max(0, h - padT - padB);

  const series: SeriesItem[] = useMemo(() => {
    if (mode === "portfolio") return [
      { key: "portfolio", label: t.chart.seriesPortfolioValue, color: "rgb(249,115,22)", fill: "rgba(249,115,22,0.12)", dash: undefined, zero: false, values: data.map((d) => d.portfolioValue) },
      { key: "invested", label: t.chart.seriesInvested, color: "var(--foreground)", dash: "4 4", fill: undefined, zero: false, values: data.map((d) => d.invested) },
    ];
    if (mode === "pnl") return [
      { key: "unrealized", label: t.chart.seriesUnrealizedPnl, color: "rgb(249,115,22)", fill: "rgba(249,115,22,0.12)", dash: undefined, zero: true, values: data.map((d) => d.unrealized) },
    ];
    if (mode === "sats") return [
      { key: "sats", label: t.chart.seriesCumulativeSatoshi, color: "rgb(249,115,22)", fill: "rgba(249,115,22,0.12)", dash: undefined, zero: false, values: data.map((d) => d.cumSat) },
    ];
    if (mode === "entries") return [
      { key: "price", label: t.chart.seriesBtcPrice, color: "var(--muted-foreground)", fill: undefined, dash: undefined, zero: false, values: data.map((d) => d.price) },
    ];
    return [
      { key: "market", label: t.chart.seriesMarketPrice, color: "rgb(249,115,22)", fill: undefined, dash: undefined, zero: false, values: data.map((d) => d.price) },
      { key: "cost", label: t.chart.seriesAvgCostBasis, color: "var(--foreground)", dash: "4 4", fill: undefined, zero: false, values: data.map((d) => d.cumFiat / (d.cumSat / 1e8)) },
    ];
  }, [data, mode, t]);

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

  const x = (i: number) => padL + (data.length <= 1 ? 0 : (i / (data.length - 1)) * cw);
  const y = (v: number) => padT + ch - ((v - yMin) / (yMax - yMin)) * ch;

  const grid = Array.from({ length: 5 }, (_, i) => {
    const v = yMin + ((yMax - yMin) / 4) * i;
    return { v, y: y(v) };
  });
  const zeroY = yMin < 0 && yMax > 0 ? y(0) : null;

  function buildPath(values: number[], withArea: boolean): string {
    if (values.length === 0) return "";
    let d = `M ${x(0)} ${y(values[0]!)}`;
    for (let i = 1; i < values.length; i++) d += ` L ${x(i)} ${y(values[i]!)}`;
    if (withArea) {
      const baseY = zeroY !== null ? zeroY : padT + ch;
      d += ` L ${x(values.length - 1)} ${baseY} L ${x(0)} ${baseY} Z`;
    }
    return d;
  }

  const xTickCount = Math.min(6, data.length);
  const xTicks = Array.from({ length: xTickCount }, (_, i) => {
    const idx = Math.round((i / (xTickCount - 1 || 1)) * (data.length - 1));
    return { idx, x: x(idx), date: data[idx]?.date };
  });

  const onMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    if (mx < padL) { setHoverIdx(null); return; }
    const rel = (mx - padL) / cw;
    setHoverIdx(Math.max(0, Math.min(data.length - 1, Math.round(rel * (data.length - 1)))));
  }, [cw, data.length]);

  const onLeave = useCallback(() => setHoverIdx(null), []);
  const hovered = hoverIdx !== null ? (data[hoverIdx] ?? null) : null;

  const tooltipRows: { lbl: string; val: string }[] = [];
  if (hovered) {
    if (mode === "portfolio") {
      tooltipRows.push({ lbl: t.chart.tooltipPortfolio, val: fmtTHBFull(hovered.portfolioValue) + " ฿" }, { lbl: t.chart.tooltipInvested, val: fmtTHBFull(hovered.invested) + " ฿" }, { lbl: t.chart.tooltipUnrealized, val: (hovered.unrealized >= 0 ? "+" : "") + fmtTHBFull(hovered.unrealized) + " ฿" });
    } else if (mode === "pnl") {
      tooltipRows.push({ lbl: t.chart.tooltipUnrealized, val: (hovered.unrealized >= 0 ? "+" : "") + fmtTHBFull(hovered.unrealized) + " ฿" }, { lbl: t.chart.tooltipPercent, val: hovered.pctUnrealized.toFixed(2) + "%" });
    } else if (mode === "sats") {
      tooltipRows.push({ lbl: t.chart.tooltipCumulative, val: hovered.cumSat.toLocaleString("en-US") + " sat" }, { lbl: t.chart.tooltipTodaysBuy, val: hovered.satoshi.toLocaleString("en-US") + " sat" });
    } else if (mode === "entries") {
      tooltipRows.push({ lbl: t.chart.tooltipBtcPrice, val: fmtTHBFull(hovered.price) + " ฿" }, { lbl: t.chart.tooltipBought, val: hovered.satoshi.toLocaleString("en-US") + " sat" });
    } else {
      const costBasis = hovered.cumFiat / (hovered.cumSat / 1e8);
      tooltipRows.push({ lbl: t.chart.tooltipMarket, val: fmtTHBFull(hovered.price) + " ฿" }, { lbl: t.chart.tooltipAvgCost, val: fmtTHBFull(costBasis) + " ฿" });
    }
  }

  return (
    <div id="dca-chart-card" className="bg-card border-border flex h-full w-full flex-col overflow-hidden rounded-lg border">
      {/* Header tabs + timeframe */}
      <div className="border-border flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2.5 sm:px-5 sm:py-3.5">
        <div className="flex flex-wrap gap-0.5">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={`rounded px-2 py-1.5 text-[11px] font-medium sm:px-3 sm:text-xs ${
                mode === tab.key
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              onClick={() => setMode(tab.key)}
            >
              <span className="sm:hidden">{tab.shortLabel}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
        <Popover open={timeframeOpen} onOpenChange={setTimeframeOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="bg-card border-border text-foreground min-w-[72px] rounded border px-2 py-1 font-mono text-xs"
            >
              {timeframe}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[88px] p-1">
            <div className="flex flex-col gap-0.5">
              {TIMEFRAMES.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setTimeframe(value);
                    setTimeframeOpen(false);
                  }}
                  className={`rounded px-2 py-1.5 text-left font-mono text-xs ${
                    timeframe === value
                      ? "bg-foreground text-background"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {data.length === 0 ? (
        <div className="text-muted-foreground flex h-[200px] items-center justify-center text-sm sm:h-[300px]">
          {t.chart.addFirstBuy}
        </div>
      ) : (
        <>
          {/* Legend */}
          <div className="text-muted-foreground flex gap-4 px-5 pt-2 font-mono text-[11px]">
            {series.map((s) => (
              <span key={s.key} className="inline-flex items-center gap-1.5">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-sm"
                  style={{
                    background: s.dash ? "transparent" : s.color,
                    border: s.dash ? `2px dashed ${s.color}` : "none",
                    height: s.dash ? 0 : 10,
                  }}
                />
                {s.label}
              </span>
            ))}
          </div>

          {/* Chart area */}
          <div className="relative min-h-[220px] flex-1 px-2 pb-2 sm:min-h-[320px] sm:px-3 sm:pb-3">
            <div ref={chartAreaRef} className="relative h-full w-full">
              <svg width={w} height={h} className="block" onMouseMove={onMove} onMouseLeave={onLeave}>
                {grid.map((g, i) => (
                  <g key={i}>
                    <line x1={padL} x2={w - padR} y1={g.y} y2={g.y} stroke="var(--border)" strokeWidth="1" />
                    <text x={padL - 8} y={g.y + 3} textAnchor="end" fontSize="10" fontFamily="var(--font-mono)" fill="var(--muted-foreground)">
                      {mode === "sats" ? fmtSat(g.v) : fmtTHB(g.v)}
                    </text>
                  </g>
                ))}
                {zeroY !== null && <line x1={padL} x2={w - padR} y1={zeroY} y2={zeroY} stroke="var(--muted-foreground)" strokeWidth="1" strokeDasharray="2 3" opacity="0.6" />}
                {xTicks.map((t, i) => (
                  <text key={i} x={t.x} y={h - 8} textAnchor={i === 0 ? "start" : i === xTicks.length - 1 ? "end" : "middle"} fontSize="10" fontFamily="var(--font-mono)" fill="var(--muted-foreground)">
                    {t.date ? fmtDateShort(new Date(t.date + "T00:00:00")) : ""}
                  </text>
                ))}
                {series.map((s) => s.fill && <path key={s.key + "-a"} d={buildPath(s.values, true)} fill={s.fill} stroke="none" />)}
                {series.map((s) => <path key={s.key + "-l"} d={buildPath(s.values, false)} fill="none" stroke={s.color} strokeWidth="1.75" strokeDasharray={s.dash ?? "none"} strokeLinejoin="round" strokeLinecap="round" />)}
                {mode === "entries" && data.map((d, i) => <circle key={i} cx={x(i)} cy={y(d.price)} r="3.5" fill="rgb(249,115,22)" opacity="0.75" />)}
                {hoverIdx !== null && (
                  <g>
                    <line x1={x(hoverIdx)} x2={x(hoverIdx)} y1={padT} y2={padT + ch} stroke="var(--foreground)" strokeWidth="1" strokeDasharray="2 3" opacity="0.5" />
                    {series.map((s) => <circle key={s.key} cx={x(hoverIdx)} cy={y(s.values[hoverIdx] ?? 0)} r="4" fill="var(--card)" stroke={s.color} strokeWidth="2" />)}
                  </g>
                )}
              </svg>
              {hovered && hoverIdx !== null && (
                <div
                  className="dca-tooltip dca-tooltip-visible font-mono"
                  style={{
                    left: x(hoverIdx), top: 0,
                    transform: x(hoverIdx) > padL + cw * 0.65 ? "translate(-100%, -100%)" : "translate(-50%, -100%)",
                  }}
                >
                  <div className="border-border mb-1 border-b pb-1">
                    {fmtDate(new Date(hovered.date + "T00:00:00"))}
                  </div>
                  {tooltipRows.map((r, i) => (
                    <div className="flex justify-between gap-4" key={i}>
                      <span className="opacity-50">{r.lbl}</span>
                      <span>{r.val}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
