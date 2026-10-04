import type { ChartGeometry } from "@/features/dca/helpers/dca-chart-geometry";
import {
  fmtSat,
  fmtTHB,
  fmtDateShort,
} from "@/features/dca/helpers/dca-chart-format";
import type { ChartMode, EnrichedPoint } from "@/features/dca/types/chart";

interface DcaChartGridProps {
  geometry: ChartGeometry;
  mode: ChartMode;
  data: EnrichedPoint[];
}

/** เส้น grid แนวนอน + ป้ายตัวเลขแกน Y + เส้น zero baseline + ป้ายวันที่แกน X */
export const DcaChartGrid = ({ geometry, mode, data }: DcaChartGridProps) => {
  const { w, h, padL, padR, grid, zeroY, xTicks } = geometry;
  return (
    <>
      {grid.map((g) => (
        <g key={g.v}>
          <line
            x1={padL}
            x2={w - padR}
            y1={g.y}
            y2={g.y}
            stroke="var(--border)"
            strokeWidth="1"
          />
          <text
            x={padL - 8}
            y={g.y + 3}
            textAnchor="end"
            fontSize="10"
            fill="var(--muted-foreground)"
          >
            {mode === "sats" ? fmtSat(g.v) : fmtTHB(g.v)}
          </text>
        </g>
      ))}
      {zeroY !== null && (
        <line
          x1={padL}
          x2={w - padR}
          y1={zeroY}
          y2={zeroY}
          stroke="var(--muted-foreground)"
          strokeWidth="1"
          strokeDasharray="2 3"
          opacity="0.6"
        />
      )}
      {xTicks.map((t, i) => (
        <text
          key={data[t.idx]?.id ?? t.idx}
          x={t.x}
          y={h - 8}
          textAnchor={
            i === 0 ? "start" : i === xTicks.length - 1 ? "end" : "middle"
          }
          fontSize="10"
          fill="var(--muted-foreground)"
        >
          {t.date ? fmtDateShort(t.date) : ""}
        </text>
      ))}
    </>
  );
};
