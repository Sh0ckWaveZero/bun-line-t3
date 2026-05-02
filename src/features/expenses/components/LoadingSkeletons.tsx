import { Card, CardContent } from "@/components/ui/card";

export function SummaryCardSkeleton() {
  return (
    <div className="rounded-xl border border-border/30 bg-card px-5 py-4 shadow-sm dark:bg-card/80">
      <div className="mb-3 flex items-center justify-between">
        <div className="h-4 w-12 animate-pulse rounded bg-muted" />
        <div className="h-7 w-7 animate-pulse rounded-full bg-muted" />
      </div>
      <div className="h-8 w-24 animate-pulse rounded bg-muted" />
    </div>
  );
}

export function BudgetOverviewSkeleton() {
  return (
    <Card className="border-border/70 bg-card/85 dark:bg-card/70">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center gap-2">
          <div className="h-6 w-32 animate-pulse rounded bg-muted" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded-md bg-muted/50" />
          ))}
        </div>
        <div className="space-y-2.5 pt-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-muted/30" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function ChartSkeleton({ height = 200 }: { height?: number }) {
  return (
    <Card className="border-border/70 bg-card/85 dark:bg-card/70">
      <CardContent className="flex items-center justify-center" style={{ minHeight: height }}>
        <div className="h-32 w-full animate-pulse rounded bg-muted/30" />
      </CardContent>
    </Card>
  );
}
