import { useCallback, useMemo, useState } from "react";
import {
  buildChartTabs,
  buildEnrichedPoints,
  buildSeries,
  buildTooltipRows,
  filterPointsByTimeframe,
  pickIndexByClientX,
} from "@/features/dca/helpers/dca-chart-data";
import {
  computeTooltipLayout,
  createChartGeometry,
} from "@/features/dca/helpers/dca-chart-geometry";
import type {
  ChartGeometry,
  TooltipLayout,
} from "@/features/dca/helpers/dca-chart-geometry";
import { useDcaLocale } from "@/features/dca/lib/dca-locale-context";
import type { DcaLocaleStrings } from "@/features/dca/lib/locale";
import type { DcaOrder } from "@/features/dca/types";
import type {
  ChartMode,
  ChartTab,
  ChartTooltipRow,
  EnrichedPoint,
  Timeframe,
} from "@/features/dca/types/chart";
import { useDcaChartDimensions } from "@/features/dca/hooks/useDcaChartDimensions";
import { useDcaIsTouchDevice } from "@/features/dca/hooks/useDcaIsTouchDevice";
import { useDcaTooltipSize } from "@/features/dca/hooks/useDcaTooltipSize";

interface UseDcaChartParams {
  orders: DcaOrder[];
  currentPrice: number | null;
}

interface UseDcaChartResult {
  t: DcaLocaleStrings;
  tabs: ChartTab[];
  mode: ChartMode;
  handleModeChange: (mode: ChartMode) => void;
  timeframe: Timeframe;
  handleTimeframeChange: (timeframe: Timeframe) => void;
  data: EnrichedPoint[];
  series: ReturnType<typeof buildSeries>;
  geometry: ChartGeometry;
  isTouchDevice: boolean;
  chartAreaRef: React.RefObject<HTMLDivElement | null>;
  tooltipRef: React.RefObject<HTMLDivElement | null>;
  activeIdx: number | null;
  hovered: EnrichedPoint | null;
  tooltipRows: ChartTooltipRow[];
  tooltipLayout: TooltipLayout;
  handleMouseMove: (e: React.MouseEvent<SVGSVGElement>) => void;
  handleMouseLeave: () => void;
  handlePointerInspect: (e: React.PointerEvent<SVGSVGElement>) => void;
}

/** View-model ทั้งหมดของกราฟ DCA (state, ข้อมูล, เรขาคณิต, tooltip) */
export const useDcaChart = ({
  orders,
  currentPrice,
}: UseDcaChartParams): UseDcaChartResult => {
  const { t } = useDcaLocale();

  const [mode, setMode] = useState<ChartMode>("portfolio");
  const [timeframe, setTimeframe] = useState<Timeframe>("ALL");
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [touchIdx, setTouchIdx] = useState<number | null>(null);
  const isTouchDevice = useDcaIsTouchDevice();
  const { ref: chartAreaRef, dims } = useDcaChartDimensions();
  const { ref: tooltipRef, size: tooltipSize } = useDcaTooltipSize({
    touchIdx,
    hoverIdx,
    mode,
    timeframe,
    ordersCount: orders.length,
  });

  const tabs = useMemo(() => buildChartTabs(t), [t]);

  const allPoints = useMemo(
    () => buildEnrichedPoints(orders, currentPrice),
    [orders, currentPrice],
  );

  const data = useMemo(
    () => filterPointsByTimeframe(allPoints, timeframe),
    [allPoints, timeframe],
  );

  const series = useMemo(() => buildSeries(mode, data, t), [data, mode, t]);

  const geometry = useMemo(
    () => createChartGeometry(data, dims, series),
    [data, dims, series],
  );

  const { w, h, padL, padR, padT, cw, x } = geometry;

  const handleModeChange = useCallback(
    (nextMode: ChartMode) => setMode(nextMode),
    [],
  );

  const handleTimeframeChange = useCallback(
    (nextTimeframe: Timeframe) => setTimeframe(nextTimeframe),
    [],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      if (mx < padL) {
        setHoverIdx(null);
        return;
      }
      const rel = (mx - padL) / cw;
      setHoverIdx(
        Math.max(
          0,
          Math.min(data.length - 1, Math.round(rel * (data.length - 1))),
        ),
      );
    },
    [padL, cw, data.length],
  );

  const handleMouseLeave = useCallback(() => setHoverIdx(null), []);

  const handlePointerInspect = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const isTouchLikePointer =
        e.pointerType === "touch" || e.pointerType === "pen" || isTouchDevice;
      if (!isTouchLikePointer) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const idx = pickIndexByClientX(
        e.clientX,
        rect.left,
        padL,
        cw,
        data.length,
      );
      if (idx === null) {
        setTouchIdx(null);
        return;
      }
      setTouchIdx(idx);
    },
    [padL, cw, data.length, isTouchDevice],
  );

  const activeIdx = touchIdx ?? hoverIdx;
  const hovered = activeIdx !== null ? (data[activeIdx] ?? null) : null;

  const tooltipRows: ChartTooltipRow[] = hovered
    ? buildTooltipRows(mode, hovered, t)
    : [];

  const tooltipLayout = computeTooltipLayout({
    activeIdx,
    xAt: x,
    w,
    h,
    padL,
    padR,
    padT,
    tooltipSize,
  });

  return {
    t,
    tabs,
    mode,
    handleModeChange,
    timeframe,
    handleTimeframeChange,
    data,
    series,
    geometry,
    isTouchDevice,
    chartAreaRef,
    tooltipRef,
    activeIdx,
    hovered,
    tooltipRows,
    tooltipLayout,
    handleMouseMove,
    handleMouseLeave,
    handlePointerInspect,
  };
};
