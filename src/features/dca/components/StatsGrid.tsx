"use client";

import { useMemo } from "react";
import type { DcaOrder, DcaSummary } from "@/features/dca/types";
import { Sparkline } from "./Sparkline";
import { useDcaLocale } from "@/features/dca/lib/dca-locale-context";

interface StatsGridProps {
  summary: DcaSummary | undefined;
  orders: DcaOrder[];
}

interface StatCell {
  lbl: string;
  val: string;
  sub: string;
  foot: string;
  spark: number[] | null;
  colorClass: string;
  /** raw CSS color for sparkline stroke */
  sparkColor: string;
}

const fmtInt = (n: number): string => Math.round(n).toLocaleString("en-US");
const fmtThb = (n: number, d = 2): string =>
  n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

const EMPTY_CELLS: StatCell[] = [
  { lbl: "Spend Fiat", val: "—", sub: "฿", foot: "0 days", spark: null, colorClass: "text-muted-foreground", sparkColor: "" },
  { lbl: "Total Satoshi", val: "—", sub: "sat", foot: "—", spark: null, colorClass: "text-muted-foreground", sparkColor: "" },
  { lbl: "Current BTC Price", val: "—", sub: "฿", foot: "Bitkub · spot", spark: null, colorClass: "text-muted-foreground", sparkColor: "" },
  { lbl: "Market Value", val: "—", sub: "฿", foot: "Your portfolio in THB", spark: null, colorClass: "text-muted-foreground", sparkColor: "" },
  { lbl: "Average Cost", val: "—", sub: "sat/฿", foot: "Across all buys", spark: null, colorClass: "text-muted-foreground", sparkColor: "" },
  { lbl: "Today sat/THB", val: "—", sub: "sat/฿", foot: "—", spark: null, colorClass: "text-muted-foreground", sparkColor: "" },
  { lbl: "Max Drawdown", val: "—", sub: "%", foot: "Peak-to-trough", spark: null, colorClass: "text-muted-foreground", sparkColor: "" },
  { lbl: "% Profit / Loss", val: "—", sub: "%", foot: "—", spark: null, colorClass: "text-muted-foreground", sparkColor: "" },
  { lbl: "Worst Single Buy", val: "—", sub: "%", foot: "—", spark: null, colorClass: "text-muted-foreground", sparkColor: "" },
  { lbl: "Best Single Buy", val: "—", sub: "%", foot: "—", spark: null, colorClass: "text-muted-foreground", sparkColor: "" },
];

const POS_CLASS = "text-green-600 dark:text-green-400";
const NEG_CLASS = "text-red-600 dark:text-red-400";
const ACCENT_CLASS = "text-orange-500";
const FG_CLASS = "text-foreground";

function buildCells(summary: DcaSummary, orders: DcaOrder[], t: ReturnType<typeof useDcaLocale>["t"]): StatCell[] {
  const currentPrice = summary.currentPrice ?? 0;
  const totalSatoshi = Math.round(summary.totalBTC * 1e8);
  const marketValue = currentPrice * summary.totalBTC;
  const pnlPercent = summary.pnlPercent ?? 0;
  const pnlValue = summary.pnlValue ?? 0;

  const sorted = [...orders].sort(
    (a, b) => new Date(a.executedAt).getTime() - new Date(b.executedAt).getTime()
  );
  const last30 = sorted.slice(-30);

  const investedSeries: number[] = [];
  const priceSeries = last30.map((o) => o.pricePerCoin);
  let cumFiat = 0;
  const beforeLast30 = sorted.slice(0, -30);
  for (const o of beforeLast30) cumFiat += o.amountTHB;
  for (const o of last30) { cumFiat += o.amountTHB; investedSeries.push(cumFiat); }

  const cumSatSeries: number[] = [];
  let runningSat = 0;
  for (const o of beforeLast30) runningSat += Math.round(o.coinReceived * 1e8);
  for (const o of last30) { runningSat += Math.round(o.coinReceived * 1e8); cumSatSeries.push(runningSat); }

  const portfolioSeries = cumSatSeries.map((sat) => (sat / 1e8) * currentPrice);

  const todaySatPerTHB = currentPrice > 0 ? 1e8 / currentPrice : 0;
  const avgCostSatPerTHB = summary.totalSpentTHB > 0 ? totalSatoshi / summary.totalSpentTHB : 0;

  let worstPct = 0, worstDate = "", bestPct = 0, bestDate = "";
  if (currentPrice > 0) {
    for (const order of sorted) {
      const pct = ((currentPrice - order.pricePerCoin) / order.pricePerCoin) * 100;
      if (pct < worstPct) { worstPct = pct; worstDate = new Date(order.executedAt).toISOString().split("T")[0] ?? ""; }
      if (pct > bestPct) { bestPct = pct; bestDate = new Date(order.executedAt).toISOString().split("T")[0] ?? ""; }
    }
  }

  let maxDrawdown = 0;
  if (sorted.length > 0 && currentPrice > 0) {
    let peak = 0, runSat = 0;
    for (const o of sorted) {
      runSat += Math.round(o.coinReceived * 1e8);
      const portVal = (runSat / 1e8) * currentPrice;
      if (portVal > peak) peak = portVal;
      const dd = peak > 0 ? ((portVal - peak) / peak) * 100 : 0;
      if (dd < maxDrawdown) maxDrawdown = dd;
    }
  }

  const satPerTHBSeries = last30.map((o) => o.pricePerCoin > 0 ? 1e8 / o.pricePerCoin : 0);

  return [
    { lbl: t.stats.spendFiat, val: fmtInt(summary.totalSpentTHB), sub: "฿", foot: t.stats.footDaysPerDay(summary.totalRounds, summary.totalRounds > 0 ? Math.round(summary.totalSpentTHB / summary.totalRounds) : 0), spark: investedSeries.length >= 2 ? investedSeries : null, colorClass: FG_CLASS, sparkColor: "var(--foreground)" },
    { lbl: t.stats.totalSatoshi, val: fmtInt(totalSatoshi), sub: "sat", foot: t.stats.footBtc((totalSatoshi / 1e8).toFixed(8)), spark: cumSatSeries.length >= 2 ? cumSatSeries : null, colorClass: ACCENT_CLASS, sparkColor: "rgb(249,115,22)" },
    { lbl: t.stats.currentBtcPrice, val: currentPrice > 0 ? fmtInt(currentPrice) : "—", sub: "฿", foot: t.stats.footBitkubSpot, spark: priceSeries.length >= 2 ? priceSeries : null, colorClass: ACCENT_CLASS, sparkColor: "rgb(249,115,22)" },
    { lbl: t.stats.marketValue, val: currentPrice > 0 ? fmtThb(marketValue) : "—", sub: "฿", foot: t.stats.footPortfolioValue, spark: portfolioSeries.length >= 2 ? portfolioSeries : null, colorClass: pnlPercent >= 0 ? POS_CLASS : NEG_CLASS, sparkColor: pnlPercent >= 0 ? "rgb(22,163,74)" : "rgb(220,38,38)" },
    { lbl: t.stats.averageCost, val: avgCostSatPerTHB > 0 ? avgCostSatPerTHB.toFixed(2) : "—", sub: "sat/฿", foot: t.stats.footAcrossAllBuys, spark: null, colorClass: FG_CLASS, sparkColor: "" },
    { lbl: t.stats.todaySatPerThb, val: todaySatPerTHB > 0 ? todaySatPerTHB.toFixed(2) : "—", sub: "sat/฿", foot: t.stats.footVsAvg((todaySatPerTHB - avgCostSatPerTHB).toFixed(2)), spark: satPerTHBSeries.length >= 2 ? satPerTHBSeries : null, colorClass: todaySatPerTHB > avgCostSatPerTHB ? POS_CLASS : NEG_CLASS, sparkColor: todaySatPerTHB > avgCostSatPerTHB ? "rgb(22,163,74)" : "rgb(220,38,38)" },
    { lbl: t.stats.maxDrawdown, val: maxDrawdown.toFixed(2), sub: "%", foot: t.stats.footPeakToTrough, spark: null, colorClass: NEG_CLASS, sparkColor: "" },
    { lbl: t.stats.profitLoss, val: (pnlPercent >= 0 ? "+" : "") + pnlPercent.toFixed(2), sub: "%", foot: t.stats.footUnrealized(fmtThb(pnlValue)), spark: null, colorClass: pnlPercent >= 0 ? POS_CLASS : NEG_CLASS, sparkColor: "" },
    { lbl: t.stats.worstSingleBuy, val: worstPct !== 0 ? worstPct.toFixed(2) : "—", sub: "%", foot: worstDate || t.stats.footNoLosingEntries, spark: null, colorClass: worstPct < 0 ? NEG_CLASS : POS_CLASS, sparkColor: "" },
    { lbl: t.stats.bestSingleBuy, val: bestPct > 0 ? "+" + bestPct.toFixed(2) : "—", sub: "%", foot: bestDate || t.stats.footNoDate, spark: null, colorClass: POS_CLASS, sparkColor: "" },
  ];
}

export const StatsGrid = ({ summary, orders }: StatsGridProps) => {
  const { t } = useDcaLocale();

  const cells = useMemo(
    () => (summary && orders.length > 0 ? buildCells(summary, orders, t) : EMPTY_CELLS),
    [summary, orders, t]
  );

  return (
    <div id="dca-stats-grid" className="dca-stats-grid border-border grid grid-cols-2 overflow-hidden rounded-lg border sm:grid-cols-3 lg:grid-cols-5"
      style={{ background: "var(--border)" }}
    >
      {cells.map((s, i) => (
        <div className="bg-card relative flex flex-col gap-1.5 p-3 sm:p-4" key={i}>
          <div className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider sm:text-[11px]">
            {s.lbl}
          </div>
          <div className={`font-mono text-lg font-medium leading-tight tracking-tight sm:text-[22px] ${s.colorClass}`}>
            {s.val}
            <span className="text-muted-foreground ml-1 text-[11px] font-normal sm:text-xs">{s.sub}</span>
          </div>
          <div className="text-muted-foreground font-mono text-[10px] sm:text-[11px]">
            {s.foot}
          </div>
          {s.spark && s.spark.length >= 2 && <Sparkline values={s.spark} color={s.sparkColor} />}
        </div>
      ))}
    </div>
  );
};
