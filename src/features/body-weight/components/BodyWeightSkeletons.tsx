function Bar({ className }: { className: string }) {
  return <div className={`skel-bar rounded-md ${className}`} />;
}

export function WeightStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-hidden="true">
      {Array.from({ length: 4 }, (_, index) => (
        <div
          key={index}
          className="bg-card border-border flex min-h-[104px] flex-col justify-center gap-2 rounded-lg border p-4"
        >
          <Bar className="h-3 w-20 max-w-full" />
          <Bar className="h-7 w-28 max-w-full" />
          <Bar className="h-3 w-24 max-w-full" />
        </div>
      ))}
    </div>
  );
}

const chartBarHeights = [
  42, 55, 48, 66, 58, 74, 63, 80, 68, 88, 76, 92, 84, 96,
];

export function WeightChartSkeleton() {
  return (
    <div
      className="bg-card border-border flex h-full min-h-[270px] flex-col overflow-hidden rounded-lg border sm:min-h-[410px]"
      aria-hidden="true"
    >
      <div className="border-border flex items-center justify-between border-b px-3 py-3 sm:px-5">
        <Bar className="h-3 w-36" />
        <Bar className="h-3 w-16" />
      </div>
      <div className="flex flex-1 flex-col justify-end p-3 sm:p-4">
        <div className="flex h-full min-h-[190px] items-end gap-2 sm:min-h-[300px]">
          {chartBarHeights.map((height, index) => (
            <div key={index} className="flex h-full flex-1 items-end">
              <div
                className="skel-bar w-full rounded-md"
                style={{ height: `${height}%` }}
              />
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-between">
          <Bar className="h-3 w-10" />
          <Bar className="h-3 w-12" />
          <Bar className="h-3 w-10" />
          <Bar className="h-3 w-12" />
        </div>
      </div>
    </div>
  );
}

export function WeightTableSkeleton() {
  return (
    <div
      className="bg-card border-border overflow-hidden rounded-lg border"
      aria-hidden="true"
    >
      <div className="hidden sm:block">
        {Array.from({ length: 8 }, (_, rowIndex) => (
          <div
            key={rowIndex}
            className="border-border grid grid-cols-7 items-center gap-3 border-b px-4 py-3 last:border-b-0"
          >
            <Bar className="h-3 w-24 max-w-full" />
            <Bar className="h-3 w-14 max-w-full" />
            <Bar className="h-3 w-12 max-w-full" />
            <Bar className="h-3 w-12 max-w-full" />
            <Bar className="h-3 w-14 max-w-full" />
            <Bar className="h-3 w-10 max-w-full" />
            <Bar className="h-3 w-16 max-w-full" />
          </div>
        ))}
      </div>
      <div className="divide-border divide-y sm:hidden">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="space-y-3 px-3 py-3">
            <div className="flex justify-between">
              <Bar className="h-4 w-28" />
              <Bar className="h-4 w-16" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Bar className="h-8 w-full" />
              <Bar className="h-8 w-full" />
              <Bar className="h-8 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function WeightProfileSkeleton() {
  return (
    <div className="bg-card border-border rounded-lg border" aria-hidden="true">
      {Array.from({ length: 2 }, (_, index) => (
        <div
          key={index}
          className="border-border space-y-3 border-b p-4 last:border-b-0"
        >
          <div className="flex items-center justify-between">
            <Bar className="h-4 w-24" />
            <Bar className="h-7 w-16" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Bar className="h-8 w-full" />
            <Bar className="h-8 w-full" />
            <Bar className="h-8 w-full" />
            <Bar className="h-8 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
