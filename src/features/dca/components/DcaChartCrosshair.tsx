import type { ChartGeometry } from "@/features/dca/helpers/dca-chart-geometry";
import type { SeriesItem } from "@/features/dca/types/chart";

interface DcaChartCrosshairProps {
  geometry: ChartGeometry;
  series: SeriesItem[];
  activeIdx: number | null;
}

/** เส้น crosshair แนวตั้ง + วงกลม markers บนทุกเส้น ณ index ที่ชี้อยู่ */
export const DcaChartCrosshair = ({
  geometry,
  series,
  activeIdx,
}: DcaChartCrosshairProps) => {
  const { x, y, padT, ch } = geometry;
  if (activeIdx === null) return null;
  return (
    <g>
      <line
        x1={x(activeIdx)}
        x2={x(activeIdx)}
        y1={padT}
        y2={padT + ch}
        stroke="var(--foreground)"
        strokeWidth="1"
        strokeDasharray="2 3"
        opacity="0.5"
      />
      {series.map((s) => (
        <circle
          key={s.key}
          cx={x(activeIdx)}
          cy={y(s.values[activeIdx] ?? 0)}
          r="4"
          fill="var(--card)"
          stroke={s.color}
          strokeWidth="2"
        />
      ))}
    </g>
  );
};
