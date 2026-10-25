import { PixelChevronDown, PixelList } from "@/features/planning-poker/components/pixel-icons";
import { Badge } from "@/components/ui/badge";
import type { RoundRecord } from "../types";

const formatNumber = (value: number | null): string =>
  value === null ? "-" : String(value);

export const RoundHistory = ({ history }: { history: RoundRecord[] }) => {
  if (history.length === 0) return null;

  // รอบล่าสุดอยู่บนสุด
  const rounds = [...history].reverse();

  return (
    <details id="poker-round-history" open className="group bg-card rounded-lg border shadow-sm">
      <summary className="focus-visible:ring-ring flex cursor-pointer list-none items-center justify-between gap-2 rounded-lg px-6 py-4 focus-visible:ring-2 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <PixelList className="h-4 w-4" aria-hidden="true" />
          Vote history ({history.length} rounds)
        </h2>
        <PixelChevronDown
          className="h-4 w-4 transition-transform group-open:rotate-180 motion-reduce:transition-none"
          aria-hidden="true"
        />
      </summary>
      <ul className="divide-y px-6 pb-4">
        {rounds.map((record) => (
          <li
            key={record.round}
            className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">
                {record.story || `Round ${record.round}`}
              </p>
              <p className="text-muted-foreground text-xs">
                {record.votes
                  .map((entry) => `${entry.name}: ${entry.vote}`)
                  .join(" · ") || "No scores"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {record.summary.isConsensus ? (
                <Badge variant="secondary">Matched</Badge>
              ) : null}
              <span className="tabular-nums">
                Avg {formatNumber(record.summary.average)}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </details>
  );
};
