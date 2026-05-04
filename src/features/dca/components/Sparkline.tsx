interface SparklineProps {
  values: number[];
  color: string;
}

export const Sparkline = ({ values, color }: SparklineProps) => {
  if (values.length < 2) return null;

  const w = 56;
  const h = 18;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      className="pointer-events-none absolute right-2 top-2 z-0 opacity-45 sm:right-3.5 sm:top-3.5"
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden="true"
    >
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.3" />
    </svg>
  );
};
