"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { areaY, defineChart, lineY } from "@tanstack/charts";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { scalePoint } from "@tanstack/charts/scales/point";
import { Chart } from "@tanstack/charts/react/tooltip";
import { tooltip } from "@tanstack/charts/tooltip";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import type { DcaOrder } from "@/features/dca/types";
import { useDcaLocale } from "@/features/dca/lib/dca-locale-context";
import { useChartTheme } from "@/hooks/useChartTheme";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type ChartMode = "portfolio" | "pnl" | "cost" | "sats" | "entries";
type Timeframe = "30D" | "90D" | "1Y" | "ALL";

interface DcaChartCardProps {
  orders: DcaOrder[];
  currentPrice: number | null;
}

interface EnrichedPoint {
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

interface ChartPoint extends EnrichedPoint {
  index: number;
  value: number;
}

interface SeriesItem {
  key: string;
  label: string;
  color: string;
  fill: boolean;
  dash?: string;
  baseline?: "zero";
  values: number[];
}

const TIMEFRAMES: Timeframe[] = ["30D", "90D", "1Y", "ALL"];
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

const formatDateParts = (value: string) => {
  const [year, month, day] = value.slice(0, 10).split("-");
  const date = new Date(`${year}-${month}-${day}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

const formatShortDate = (value: string): string => {
  const date = formatDateParts(value);
  return date
    ? new Intl.DateTimeFormat("en", { day: "numeric", month: "short" }).format(
        date,
      )
    : "—";
};

const formatDate = (value: string): string => {
  const date = formatDateParts(value);
  return date
    ? new Intl.DateTimeFormat("en", {
        day: "numeric",
        month: "short",
        year: "2-digit",
      }).format(date)
    : "—";
};

const formatThb = (value: number, decimals = 0): string => {
  if (!Number.isFinite(value)) return "—";
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  return value.toLocaleString("en-US", { maximumFractionDigits: decimals });
};

const formatThbFull = (value: number): string =>
  Number.isFinite(value)
    ? value.toLocaleString("en-US", {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
      })
    : "—";

const formatSatoshi = (value: number): string => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
  return value.toLocaleString("en-US");
};

export const DcaChartCard = ({ orders, currentPrice }: DcaChartCardProps) => {
  const { t } = useDcaLocale();
  const { chartTheme } = useChartTheme();
  const chartInstanceId = useId().replace(/:/g, "");
  const [mode, setMode] = useState<ChartMode>("portfolio");
  const [timeframe, setTimeframe] = useState<Timeframe>("ALL");
  const [timeframeOpen, setTimeframeOpen] = useState(false);
  const tabsListRef = useRef<HTMLDivElement>(null);
  const tabsPillRef = useRef<HTMLSpanElement>(null);
  const hasPositionedPill = useRef(false);

  const tabs: { key: ChartMode; label: string; shortLabel: string }[] = [
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

  const moveTabPill = useCallback((animate: boolean) => {
    const tabsList = tabsListRef.current;
    const pill = tabsPillRef.current;
    const activeTab = tabsList?.querySelector<HTMLButtonElement>(
      '[role="tab"][aria-selected="true"]',
    );
    if (!tabsList || !pill || !activeTab) return;

    const transform = `translateX(${activeTab.offsetLeft}px)`;
    const width = `${activeTab.offsetWidth}px`;
    if (animate) {
      pill.style.transform = transform;
      pill.style.width = width;
    } else {
      const previousTransition = pill.style.transition;
      pill.style.transition = "none";
      pill.style.transform = transform;
      pill.style.width = width;
      void pill.offsetWidth;
      pill.style.transition = previousTransition;
    }

    tabsList.dataset.pillPositioned = "true";
  }, []);

  useIsomorphicLayoutEffect(() => {
    moveTabPill(hasPositionedPill.current);
    hasPositionedPill.current = true;
  }, [mode, moveTabPill]);

  useEffect(() => {
    const tabsList = tabsListRef.current;
    if (!tabsList) return;

    const handleResize = () => moveTabPill(false);
    window.addEventListener("resize", handleResize);
    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(handleResize);
    observer?.observe(tabsList);

    return () => {
      window.removeEventListener("resize", handleResize);
      observer?.disconnect();
    };
  }, [moveTabPill]);

  const allPoints = useMemo<EnrichedPoint[]>(() => {
    if (!currentPrice || orders.length === 0) return [];
    const sorted = [...orders].sort(
      (left, right) =>
        new Date(left.executedAt).getTime() -
        new Date(right.executedAt).getTime(),
    );
    let cumSat = 0;
    let cumFiat = 0;

    return sorted.map((order) => {
      const satoshi = Math.round(order.coinReceived * 1e8);
      cumSat += satoshi;
      cumFiat += order.amountTHB;
      const portfolioValue = (cumSat / 1e8) * order.pricePerCoin;
      const unrealized = portfolioValue - cumFiat;

      return {
        id: order.id,
        date: new Date(order.executedAt).toISOString().slice(0, 10),
        fiat: order.amountTHB,
        satoshi,
        price: order.pricePerCoin,
        cumSat,
        cumFiat,
        portfolioValue,
        invested: cumFiat,
        unrealized,
        pctUnrealized: cumFiat > 0 ? (unrealized / cumFiat) * 100 : 0,
      };
    });
  }, [orders, currentPrice]);

  const data = useMemo(() => {
    const count: Record<Timeframe, number> = {
      "30D": 30,
      "90D": 90,
      "1Y": 365,
      ALL: Number.POSITIVE_INFINITY,
    };
    return Number.isFinite(count[timeframe])
      ? allPoints.slice(-count[timeframe])
      : allPoints;
  }, [allPoints, timeframe]);

  const series = useMemo<SeriesItem[]>(() => {
    const foreground = chartTheme.foreground ?? "currentColor";
    const orange = "#f97316";
    if (mode === "portfolio") {
      return [
        {
          key: "portfolio",
          label: t.chart.seriesPortfolioValue,
          color: orange,
          fill: true,
          values: data.map((point) => point.portfolioValue),
        },
        {
          key: "invested",
          label: t.chart.seriesInvested,
          color: foreground,
          fill: false,
          dash: "4 4",
          values: data.map((point) => point.invested),
        },
      ];
    }
    if (mode === "pnl") {
      return [
        {
          key: "unrealized",
          label: t.chart.seriesUnrealizedPnl,
          color: orange,
          fill: true,
          baseline: "zero",
          values: data.map((point) => point.unrealized),
        },
      ];
    }
    if (mode === "sats") {
      return [
        {
          key: "sats",
          label: t.chart.seriesCumulativeSatoshi,
          color: orange,
          fill: true,
          values: data.map((point) => point.cumSat),
        },
      ];
    }
    if (mode === "entries") {
      return [
        {
          key: "price",
          label: t.chart.seriesBtcPrice,
          color: chartTheme.muted ?? "#64748b",
          fill: false,
          values: data.map((point) => point.price),
        },
      ];
    }
    return [
      {
        key: "market",
        label: t.chart.seriesMarketPrice,
        color: orange,
        fill: false,
        values: data.map((point) => point.price),
      },
      {
        key: "cost",
        label: t.chart.seriesAvgCostBasis,
        color: foreground,
        fill: false,
        dash: "4 4",
        values: data.map((point) => point.cumFiat / (point.cumSat / 1e8)),
      },
    ];
  }, [chartTheme, data, mode, t]);

  const definition = useMemo(() => {
    if (data.length === 0) return null;

    const values = series
      .flatMap((item) => item.values)
      .filter(Number.isFinite);
    let yMin = values.length ? Math.min(...values) : 0;
    let yMax = values.length ? Math.max(...values) : 1;
    const range = yMax - yMin || Math.abs(yMax) * 0.02 || 1;
    const hasZeroBaseline = series.some((item) => item.baseline === "zero");
    if (hasZeroBaseline) {
      yMin = Math.min(0, yMin) - range * 0.06;
      yMax = Math.max(0, yMax) + range * 0.06;
    } else {
      yMin = Math.max(0, yMin - range * 0.02);
      yMax += range * 0.04;
    }

    const tickCount = Math.min(6, data.length);
    const tickIndices = Array.from({ length: tickCount }, (_, index) =>
      Math.round((index / Math.max(1, tickCount - 1)) * (data.length - 1)),
    );
    const formatValue = (value: number) =>
      mode === "sats" ? formatSatoshi(value) : formatThb(value);
    const chartPoints = series.map((item) =>
      data.map((point, index): ChartPoint => ({
        ...point,
        index,
        value: item.values[index] ?? 0,
      })),
    );

    const marks = series.flatMap((item, index) => {
      const points = chartPoints[index];
      if (!points) return [];
      return [
        ...(item.fill
          ? [
              areaY(points, {
                x: "index",
                y: "value",
                y1: item.baseline === "zero" ? 0 : yMin,
                y2: "value",
                fill: `url(#dca-area-${chartInstanceId}-${item.key})`,
              }),
            ]
          : []),
        lineY(points, {
          x: "index",
          y: "value",
          stroke: item.color,
          strokeWidth: 1.75,
          strokeDasharray: item.dash,
          points: mode === "entries",
        }),
      ];
    });

    return defineChart({
      theme: chartTheme,
      margin: { top: 12, right: 12, bottom: 30, left: 56 },
      marks,
      scales: {
        x: {
          scale: scalePoint<number>().domain(data.map((_, index) => index)),
          axis: {
            line: false,
            ticks: {
              values: tickIndices,
              line: false,
              format: (index) => {
                const date = data[index]?.date;
                return date ? formatShortDate(date) : "";
              },
            },
            tickLabels: { fontSize: 10, thin: false },
          },
        },
        y: {
          scale: scaleLinear().domain([yMin, yMax]),
          grid: true,
          axis: {
            line: false,
            ticks: { count: 5, line: false, format: formatValue },
            tickLabels: { fontSize: 10 },
          },
        },
      },
      focus: "group-x",
      tooltip: {
        use: tooltip,
        format: (point) => formatDate(point.datum.date),
      },
      gradients: series
        .filter((item) => item.fill)
        .map((item) => ({
          id: `dca-area-${chartInstanceId}-${item.key}`,
          x1: 0,
          y1: 1,
          x2: 0,
          y2: 0,
          stops: [
            { offset: 0, color: item.color, opacity: 0.14 },
            { offset: 0.52, color: item.color, opacity: 0.4 },
            { offset: 1, color: item.color, opacity: 0.68 },
          ],
        })),
    });
  }, [chartInstanceId, chartTheme, data, mode, series]);

  const renderTooltip = ({
    points,
  }: {
    points: readonly { datum: ChartPoint }[];
  }) => {
    const point = points[0]?.datum;
    if (!point) return null;

    const rows: { label: string; value: string }[] = [];
    if (mode === "portfolio") {
      rows.push(
        {
          label: t.chart.tooltipPortfolio,
          value: `${formatThbFull(point.portfolioValue)} ฿`,
        },
        {
          label: t.chart.tooltipInvested,
          value: `${formatThbFull(point.invested)} ฿`,
        },
        {
          label: t.chart.tooltipUnrealized,
          value: `${point.unrealized >= 0 ? "+" : ""}${formatThbFull(point.unrealized)} ฿`,
        },
      );
    } else if (mode === "pnl") {
      rows.push(
        {
          label: t.chart.tooltipUnrealized,
          value: `${point.unrealized >= 0 ? "+" : ""}${formatThbFull(point.unrealized)} ฿`,
        },
        {
          label: t.chart.tooltipPercent,
          value: `${point.pctUnrealized.toFixed(2)}%`,
        },
      );
    } else if (mode === "sats") {
      rows.push(
        {
          label: t.chart.tooltipCumulative,
          value: `${point.cumSat.toLocaleString("en-US")} sat`,
        },
        {
          label: t.chart.tooltipTodaysBuy,
          value: `${point.satoshi.toLocaleString("en-US")} sat`,
        },
      );
    } else if (mode === "entries") {
      rows.push(
        {
          label: t.chart.tooltipBtcPrice,
          value: `${formatThbFull(point.price)} ฿`,
        },
        {
          label: t.chart.tooltipBought,
          value: `${point.satoshi.toLocaleString("en-US")} sat`,
        },
      );
    } else {
      rows.push(
        {
          label: t.chart.tooltipMarket,
          value: `${formatThbFull(point.price)} ฿`,
        },
        {
          label: t.chart.tooltipAvgCost,
          value: `${formatThbFull(point.cumFiat / (point.cumSat / 1e8))} ฿`,
        },
      );
    }

    return (
      <div className="bg-card border-border text-foreground min-w-40 rounded-md border px-2.5 py-2 text-xs shadow-lg">
        <div className="border-border mb-1 border-b pb-1 font-medium">
          {formatDate(point.date)}
        </div>
        {rows.map((row) => (
          <div className="flex justify-between gap-4" key={row.label}>
            <span className="text-muted-foreground">{row.label}</span>
            <span className="font-mono tabular-nums">{row.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <TabsPrimitive.Root
      id="dca-chart-card"
      value={mode}
      onValueChange={(value) => {
        if (tabs.some((tab) => tab.key === value)) {
          setMode(value as ChartMode);
        }
      }}
      className="bg-card border-border flex h-full w-full flex-col overflow-hidden rounded-lg border"
    >
      <div className="border-border relative z-10 flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2.5 sm:px-5 sm:py-3.5">
        <TabsPrimitive.List
          ref={tabsListRef}
          aria-label="มุมมองกราฟ DCA"
          className="t-tabs dca-chart-tabs"
        >
          <span
            ref={tabsPillRef}
            className="t-tabs-pill"
            aria-hidden="true"
          />
          {tabs.map((tab) => (
            <TabsPrimitive.Trigger
              key={tab.key}
              value={tab.key}
              className="t-tab focus-visible:ring-ring focus-visible:z-20 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <span className="sm:hidden">{tab.shortLabel}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsPrimitive.Trigger>
          ))}
        </TabsPrimitive.List>
        <Popover open={timeframeOpen} onOpenChange={setTimeframeOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="bg-card border-border text-foreground min-w-[72px] cursor-pointer rounded border px-2 py-1 text-xs"
              aria-label="Chart timeframe"
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
                  aria-pressed={timeframe === value}
                  onClick={() => {
                    setTimeframe(value);
                    setTimeframeOpen(false);
                  }}
                  className={`cursor-pointer rounded px-2 py-1.5 text-left text-xs ${
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

      <TabsPrimitive.Content
        value={mode}
        className="flex min-h-0 flex-1 flex-col outline-none"
      >
        {data.length === 0 ? (
          <div className="text-muted-foreground flex h-[200px] items-center justify-center text-sm sm:h-[300px]">
            {t.chart.addFirstBuy}
          </div>
        ) : (
          <>
            <div className="text-muted-foreground flex gap-4 px-5 pt-2 text-[11px]">
              {series.map((item) => (
                <span
                  key={item.key}
                  className="inline-flex items-center gap-1.5"
                >
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-sm"
                    aria-hidden="true"
                    style={{
                      background: item.dash ? "transparent" : item.color,
                      border: item.dash ? `2px dashed ${item.color}` : "none",
                      height: item.dash ? 0 : 10,
                    }}
                  />
                  {item.label}
                </span>
              ))}
            </div>

            <div className="relative z-0 min-h-[220px] flex-1 overflow-hidden px-2 pb-2 sm:min-h-[320px] sm:px-3 sm:pb-3">
              <div className="relative h-full min-h-[220px] w-full sm:min-h-[320px]">
                {definition && (
                  <Chart
                    definition={definition}
                    idPrefix={`dca-chart-${chartInstanceId}`}
                    ariaLabel={`${tabs.find((tab) => tab.key === mode)?.label ?? mode} BTC DCA chart`}
                    ariaDescription="Use the arrow keys to inspect chart values."
                    className="absolute inset-0"
                    style={{ width: "100%", height: "100%" }}
                    renderTooltipBody={renderTooltip}
                  />
                )}
              </div>
            </div>
          </>
        )}
      </TabsPrimitive.Content>
    </TabsPrimitive.Root>
  );
};
