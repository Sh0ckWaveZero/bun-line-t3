import type { SeriesItem } from "@/features/dca/types/chart";

interface DcaChartLegendProps {
  series: SeriesItem[];
}

/** คำอธิบายสัญลักษณ์ของเส้นในกราฟ */
export const DcaChartLegend = ({ series }: DcaChartLegendProps) => (
  <div className="text-muted-foreground flex gap-4 px-5 pt-2 text-[11px]">
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
);
