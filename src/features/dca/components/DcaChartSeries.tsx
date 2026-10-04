import type { ChartGeometry } from "@/features/dca/helpers/dca-chart-geometry";
import type {
  ChartMode,
  EnrichedPoint,
  SeriesItem,
} from "@/features/dca/types/chart";

interface DcaChartSeriesProps {
  geometry: ChartGeometry;
  series: SeriesItem[];
  mode: ChartMode;
  data: EnrichedPoint[];
}

/** เส้นกราฟหลัก: พื้นที่ fill, เส้น data และวงกลมจุดเข้าซื้อ (โหมด entries) */
export const DcaChartSeries = ({
  geometry,
  series,
  mode,
  data,
}: DcaChartSeriesProps) => {
  const { x, y, buildPath } = geometry;
  return (
    <>
      {series.map(
        (s) =>
          s.fill && (
            <path
              key={s.key + "-a"}
              d={buildPath(s.values, true)}
              fill={s.fill}
              stroke="none"
            />
          ),
      )}
      {series.map((s) => (
        <path
          key={s.key + "-l"}
          d={buildPath(s.values, false)}
          fill="none"
          stroke={s.color}
          strokeWidth="1.75"
          strokeDasharray={s.dash ?? "none"}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ))}
      {mode === "entries" &&
        data.map((d, i) => (
          <circle
            key={d.id}
            cx={x(i)}
            cy={y(d.price)}
            r="3.5"
            fill="rgb(249,115,22)"
            opacity="0.75"
          />
        ))}
    </>
  );
};
