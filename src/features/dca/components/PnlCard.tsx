import type { DcaSummary } from "@/features/dca/types";
import { useDcaLocale } from "@/features/dca/lib/dca-locale-context";

interface PnlCardProps {
  summary: DcaSummary | undefined;
}

const fmtThb = (n: number, d = 2): string =>
  n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

const fmtInt = (n: number): string => Math.round(n).toLocaleString("en-US");

const fmtPct = (n: number): string =>
  (n >= 0 ? "+" : "") + n.toFixed(2) + "%";

export const PnlCard = ({ summary }: PnlCardProps) => {
  const { t } = useDcaLocale();

  if (!summary) {
    return (
      <div id="dca-pnl-card" className="bg-card border-border flex flex-col gap-4 rounded-lg border p-5">
        <div className="text-muted-foreground flex items-center justify-between text-[11px] font-medium uppercase tracking-wider">
          <span>{t.pnl.unrealizedPnl}</span>
          <span className="flex items-center gap-1.5 font-mono text-[10px] normal-case tracking-normal text-green-600 dark:text-green-400">
            <span className="dca-live-dot bg-muted" />
            {t.pnl.live}
          </span>
        </div>
        <div>
          <div className="text-muted-foreground font-mono text-[32px] font-medium leading-none tracking-tighter sm:text-[40px]">
            &mdash;
          </div>
          <div className="text-muted-foreground mt-1 font-mono text-[11px]">
            {t.pnl.noPurchases}
          </div>
        </div>
        <div className="border-border grid grid-cols-2 border-t pt-3.5">
          <div className="pr-3">
            <div className="text-muted-foreground mb-1 text-[11px] font-medium uppercase tracking-wider">{t.pnl.marketValue}</div>
            <div className="text-muted-foreground font-mono text-base font-medium">&mdash;</div>
          </div>
          <div className="border-border border-l pl-4">
            <div className="text-muted-foreground mb-1 text-[11px] font-medium uppercase tracking-wider">{t.pnl.invested}</div>
            <div className="text-muted-foreground font-mono text-base font-medium">&mdash;</div>
          </div>
        </div>
      </div>
    );
  }

  const marketValue = summary.currentPrice
    ? summary.currentPrice * summary.totalBTC
    : 0;
  const pnlValue = summary.pnlValue ?? 0;
  const pnlPercent = summary.pnlPercent ?? 0;
  const isProfit = pnlValue >= 0;
  const hasPrice = summary.currentPrice !== null;

  return (
    <div id="dca-pnl-card" className="bg-card border-border flex flex-col gap-4 rounded-lg border p-5">
      {/* Header */}
      <div className="text-muted-foreground flex items-center justify-between text-[11px] font-medium uppercase tracking-wider">
        <span>{t.pnl.unrealizedPnl}</span>
        <span className="flex items-center gap-1.5 font-mono text-[10px] normal-case tracking-normal text-green-600 dark:text-green-400">
          <span
            className="dca-live-dot"
            style={{ background: hasPrice ? undefined : "var(--muted-foreground)" }}
          />
          {t.pnl.live}
        </span>
      </div>

      {/* Value */}
      <div>
        <div className="text-foreground font-mono text-[32px] font-medium leading-none tracking-tighter sm:text-[40px]">
          <span className="text-muted-foreground mr-1.5 text-lg font-normal">&#3647;</span>
          {hasPrice ? fmtThb(pnlValue) : "—"}
        </div>
        <div className="mt-1.5 inline-flex items-center gap-2">
          {hasPrice ? (
            <>
              <span
                className={`rounded px-2 py-0.5 font-mono text-xs font-medium ${
                  isProfit
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                }`}
              >
                {fmtPct(pnlPercent)}
              </span>
              <span className="text-muted-foreground font-mono text-[11px]">
                {t.pnl.allTimeDays(summary.totalRounds)}
              </span>
            </>
          ) : (
            <span className="text-muted-foreground font-mono text-[11px]">
              {t.pnl.loadingPrice}
            </span>
          )}
        </div>
      </div>

      {/* Split: Market Value / Invested */}
      <div className="border-border grid grid-cols-2 border-t pt-3.5">
        <div className="pr-3">
          <div className="text-muted-foreground mb-1 text-[11px] font-medium uppercase tracking-wider">
            {t.pnl.marketValue}
          </div>
          <div className="text-foreground font-mono text-base font-medium tracking-tight">
            &#3647;{hasPrice ? fmtThb(marketValue) : "—"}
          </div>
        </div>
        <div className="border-border border-l pl-4">
          <div className="text-muted-foreground mb-1 text-[11px] font-medium uppercase tracking-wider">
            {t.pnl.invested}
          </div>
          <div className="text-foreground font-mono text-base font-medium tracking-tight">
            &#3647;{fmtInt(summary.totalSpentTHB)}
          </div>
        </div>
      </div>
    </div>
  );
};
