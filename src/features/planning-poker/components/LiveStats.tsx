import { useQuery } from "@tanstack/react-query";
import { PixelMonitor } from "@/features/planning-poker/components/pixel-icons";
import { parseJson } from "../lib/api";
import type { PokerStats } from "../types";

const STATS_REFRESH_MS = 10_000;

const fetchStats = async (): Promise<PokerStats> =>
  parseJson<PokerStats>(await fetch("/api/poker/stats", { cache: "no-store" }));

const formatCount = (value: number): string => value.toLocaleString("th-TH");

const StatItem = ({ label, value }: { label: string; value: number }) => (
  // dt ต้องมาก่อน dd ตามโครงสร้าง <dl> แต่แสดงตัวเลขไว้บนด้วย flex-col-reverse
  <div className="flex flex-col-reverse text-center">
    <dt className="text-muted-foreground text-xs">{label}</dt>
    <dd className="text-xl font-bold tabular-nums">{formatCount(value)}</dd>
  </div>
);

export const LiveStats = () => {
  const { data } = useQuery({
    queryKey: ["poker-stats"],
    queryFn: fetchStats,
    refetchInterval: STATS_REFRESH_MS,
  });

  return (
    <section
      id="poker-live-stats"
      aria-label="Live usage stats"
      className="bg-muted/40 rounded-lg border p-4"
    >
      <h2 className="text-muted-foreground mb-3 flex items-center justify-center gap-1.5 text-xs font-semibold">
        <PixelMonitor className="h-3.5 w-3.5" aria-hidden="true" />
        Teams active right now
      </h2>
      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatItem label="Poker rooms" value={data?.pokerRooms ?? 0} />
        <StatItem label="Poker players" value={data?.pokerPlayers ?? 0} />
        <StatItem label="Total votes cast" value={data?.totalVotes ?? 0} />
      </dl>
    </section>
  );
};
