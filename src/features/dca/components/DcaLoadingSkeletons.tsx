function Bar({ className }: { className: string }) {
  return <div className={`skel-bar rounded-md ${className}`} />;
}

const chartBarHeights = [
  38, 54, 46, 63, 50, 72, 60, 78, 56, 85, 67, 92, 73, 88, 78, 100,
];

export function DcaPnlSkeleton() {
  return (
    <div className="bg-card border-border flex h-full min-h-[270px] flex-col gap-4 rounded-lg border p-5 sm:min-h-[410px]">
      <div className="flex items-center justify-between">
        <Bar className="h-3 w-28" />
        <Bar className="h-3 w-16" />
      </div>
      <div className="space-y-2">
        <Bar className="h-10 w-40" />
        <Bar className="h-4 w-28" />
      </div>
      <div className="border-border mt-auto grid grid-cols-2 gap-4 border-t pt-3.5">
        <div className="space-y-2">
          <Bar className="h-3 w-24" />
          <Bar className="h-5 w-28" />
        </div>
        <div className="border-border space-y-2 border-l pl-4">
          <Bar className="h-3 w-16" />
          <Bar className="h-5 w-28" />
        </div>
      </div>
    </div>
  );
}

export function DcaChartSkeleton() {
  return (
    <div className="bg-card border-border flex h-full min-h-[270px] flex-col overflow-hidden rounded-lg border sm:min-h-[410px]">
      <div className="border-border flex items-center justify-between gap-3 border-b px-3 py-3 sm:px-5">
        <div className="flex gap-2">
          {Array.from({ length: 5 }, (_, index) => (
            <Bar key={index} className="h-7 w-12 sm:w-16" />
          ))}
        </div>
        <Bar className="h-7 w-16" />
      </div>
      <div className="flex flex-1 flex-col justify-end px-4 py-4 sm:px-6">
        <div className="flex h-full min-h-[190px] items-end gap-2 sm:min-h-[300px]">
          {chartBarHeights.map((height, index) => (
            <div
              key={index}
              className="flex h-full flex-1 items-end"
              aria-hidden="true"
            >
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

export function DcaStatsSkeleton() {
  return (
    <div
      className="dca-stats-grid border-border grid grid-cols-2 overflow-hidden rounded-lg border sm:grid-cols-3 lg:grid-cols-5"
      aria-hidden="true"
    >
      {Array.from({ length: 10 }, (_, index) => (
        <div
          key={index}
          className="bg-card flex min-h-[86px] flex-col justify-center gap-2 p-3 sm:p-4"
        >
          <Bar className="h-3 w-24 max-w-full" />
          <Bar className="h-6 w-28 max-w-full" />
          <Bar className="h-3 w-20 max-w-full" />
        </div>
      ))}
    </div>
  );
}

export function DcaGoalsSkeleton() {
  return (
    <div
      className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2"
      aria-hidden="true"
    >
      {[0, 1].map((item) => (
        <div
          key={item}
          className="bg-card border-border/80 flex min-h-[108px] flex-col justify-between rounded-lg border p-4 shadow-sm sm:p-5"
        >
          <div className="flex items-center justify-between gap-3">
            <Bar className="h-3 w-36 max-w-full" />
            <Bar className="h-6 w-12" />
          </div>
          <Bar className="h-2.5 w-full" />
          <div className="flex justify-between gap-3">
            <Bar className="h-3 w-20" />
            <Bar className="h-3 w-28 max-w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DcaRecordsSkeleton() {
  return (
    <div
      className="bg-card border-border overflow-hidden rounded-lg border"
      aria-hidden="true"
    >
      <div className="border-border flex h-12 items-center justify-between border-b px-3 sm:px-4">
        <div className="flex items-center gap-3">
          <Bar className="h-7 w-40 sm:w-52" />
          <Bar className="h-3 w-20" />
        </div>
        <Bar className="h-7 w-12" />
      </div>
      <div className="divide-border divide-y sm:hidden">
        {Array.from({ length: 10 }, (_, index) => (
          <div key={index} className="space-y-3 px-3 py-3">
            <div className="flex justify-between">
              <Bar className="h-4 w-28" />
              <Bar className="h-4 w-20" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Bar className="h-8 w-full" />
              <Bar className="h-8 w-full" />
              <Bar className="h-8 w-full" />
            </div>
          </div>
        ))}
      </div>
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {Array.from({ length: 9 }, (_, index) => (
                <th key={index} className="border-border border-b p-3">
                  <Bar className="ml-auto h-3 w-16" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 10 }, (_, rowIndex) => (
              <tr key={rowIndex}>
                {Array.from({ length: 9 }, (_, cellIndex) => (
                  <td
                    key={cellIndex}
                    className="border-border border-b px-3 py-2"
                  >
                    <Bar
                      className={`ml-auto h-3 ${cellIndex % 3 === 0 ? "w-16" : "w-20"}`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-border flex h-12 items-center justify-between border-t px-3 sm:px-4">
        <Bar className="h-3 w-32" />
        <div className="flex gap-1">
          <Bar className="h-7 w-8" />
          <Bar className="h-7 w-8" />
          <Bar className="h-7 w-8" />
        </div>
      </div>
    </div>
  );
}

export function BitkubHistorySkeleton() {
  return (
    <div className="space-y-2" aria-hidden="true">
      <div className="hidden overflow-hidden rounded-md border sm:block">
        <div className="grid grid-cols-[0.5fr_2fr_1.5fr_1fr_1fr] gap-3 border-b px-3 py-3">
          {Array.from({ length: 5 }, (_, index) => (
            <Bar key={index} className="h-3 w-16 max-w-full" />
          ))}
        </div>
        {Array.from({ length: 10 }, (_, rowIndex) => (
          <div
            key={rowIndex}
            className="grid grid-cols-[0.5fr_2fr_1.5fr_1fr_1fr] items-center gap-3 border-b px-3 py-4 last:border-b-0"
          >
            <Bar className="mx-auto h-4 w-4" />
            <div className="space-y-2">
              <Bar className="h-3 w-32 max-w-full" />
              <Bar className="h-3 w-40 max-w-full" />
            </div>
            <Bar className="h-3 w-20 max-w-full" />
            <Bar className="h-3 w-24 max-w-full" />
            <Bar className="h-6 w-20 max-w-full rounded-full" />
          </div>
        ))}
      </div>
      <div className="space-y-2 sm:hidden">
        {Array.from({ length: 10 }, (_, index) => (
          <div key={index} className="space-y-3 rounded-md border p-3">
            <Bar className="h-3 w-36 max-w-full" />
            <Bar className="h-3 w-44 max-w-full" />
            <div className="flex justify-between">
              <Bar className="h-3 w-20" />
              <Bar className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
