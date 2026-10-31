import { PixelGift } from "@/features/planning-poker/components/pixel-icons";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { RoundSummary } from "../types";

const formatNumber = (value: number | null): string =>
  value === null ? "-" : String(value);

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="text-center">
    <dt className="text-muted-foreground text-xs">{label}</dt>
    <dd className="text-2xl font-bold tabular-nums">{value}</dd>
  </div>
);

export const ResultsPanel = ({ summary }: { summary: RoundSummary }) => {
  const maxCount = Math.max(
    1,
    ...summary.distribution.map((item) => item.count),
  );

  return (
    <Card>
      <section id="poker-results" aria-labelledby="poker-results-heading">
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <h2 id="poker-results-heading" className="text-base font-semibold">
            Vote results
          </h2>
          {summary.isConsensus ? (
            <Badge className="gap-1">
              <PixelGift className="h-3.5 w-3.5" aria-hidden="true" />
              Unanimous
            </Badge>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">
          {summary.voteCount === 0 ? (
            <p className="text-muted-foreground text-sm">
              No votes in this round yet
            </p>
          ) : (
            <>
              <dl className="grid grid-cols-3 gap-2">
                <Stat label="Average" value={formatNumber(summary.average)} />
                <Stat label="Median" value={formatNumber(summary.median)} />
                <Stat label="Votes" value={String(summary.voteCount)} />
              </dl>
              <ul className="space-y-3" aria-label="Votes per score">
                {summary.distribution.map((item) => (
                  <li key={item.value} className="space-y-1">
                    <div className="flex items-center gap-3 text-sm">
                      <span className="w-8 shrink-0 text-center font-bold">
                        {item.value}
                      </span>
                      <div
                        aria-hidden="true"
                        className="bg-muted h-3 flex-1 overflow-hidden rounded-full"
                      >
                        <div
                          className="bg-primary h-full rounded-full transition-all motion-reduce:transition-none"
                          style={{ width: `${(item.count / maxCount) * 100}%` }}
                        />
                      </div>
                      <span className="text-foreground w-14 shrink-0 text-right tabular-nums">
                        {item.count} players
                      </span>
                    </div>
                    {item.voters.length > 0 ? (
                      /* ชื่อผู้โหวตคะแนนนี้ — เยื้องตรงกับแถบ (ข้ามช่องคะแนน) */
                      <p className="text-muted-foreground pl-11 text-xs leading-relaxed">
                        {item.voters.join(" · ")}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </>
          )}
        </CardContent>
      </section>
    </Card>
  );
};
