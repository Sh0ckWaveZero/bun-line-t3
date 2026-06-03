import { Card, CardContent } from "@/components/ui/card";

export function SummaryCardSkeleton() {
  return (
    <div className="border-border/30 bg-card dark:bg-card/80 rounded-xl border px-5 py-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="bg-muted h-4 w-12 animate-pulse rounded" />
        <div className="bg-muted h-7 w-7 animate-pulse rounded-full" />
      </div>
      <div className="bg-muted h-8 w-24 animate-pulse rounded" />
    </div>
  );
}

export function BudgetOverviewSkeleton() {
  return (
    <Card className="border-border/70 bg-card/85 dark:bg-card/70">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center gap-2">
          <div className="bg-muted h-6 w-32 animate-pulse rounded" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-muted/50 h-10 animate-pulse rounded-md"
            />
          ))}
        </div>
        <div className="space-y-2.5 pt-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-muted/30 h-20 animate-pulse rounded-lg"
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function ThaiHelpCalculatorSkeleton() {
  return (
    <div className="border-border/30 bg-card dark:bg-card/85 mb-6 overflow-hidden rounded-xl border shadow-sm">
      {/* Flag strip */}
      <div className="h-1 w-full bg-gradient-to-r from-red-600 via-white to-blue-800 opacity-40" />
      {/* Header row */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="bg-muted h-10 w-10 animate-pulse rounded-xl" />
          <div className="space-y-2">
            <div className="bg-muted h-4 w-52 animate-pulse rounded" />
            <div className="bg-muted h-3 w-36 animate-pulse rounded" />
          </div>
        </div>
        <div className="bg-muted h-6 w-24 animate-pulse rounded-full" />
      </div>
    </div>
  );
}

export function ChartSkeleton({ height = 200 }: { height?: number }) {
  return (
    <Card className="border-border/70 bg-card/85 dark:bg-card/70">
      <CardContent
        className="flex items-center justify-center"
        style={{ minHeight: height }}
      >
        <div className="bg-muted/30 h-32 w-full animate-pulse rounded" />
      </CardContent>
    </Card>
  );
}
