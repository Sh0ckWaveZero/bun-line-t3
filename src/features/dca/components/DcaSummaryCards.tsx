import { Bitcoin, Coins, TrendingUp } from "lucide-react";
import { DcaPnlCard } from "@/features/dca/components/DcaPnlCard";
import { DcaSummaryStatCard } from "@/features/dca/components/DcaSummaryStatCard";
import type { DcaSummary } from "@/features/dca/types";
import { formatCoin, formatTHB } from "@/features/dca/utils/format";

interface DcaSummaryCardsProps {
  summary: DcaSummary;
}

export const DcaSummaryCards = ({ summary }: DcaSummaryCardsProps) => (
  <div
    id="dca-summary-section"
    className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
  >
    <DcaSummaryStatCard
      idBase="total-spent"
      icon={TrendingUp}
      iconBoxClassName="bg-green-500/10"
      iconClassName="text-green-500"
      label="ลงทุนรวมทั้งหมด"
      value={formatTHB(summary.totalSpentTHB)}
      unit="บาท"
    />

    <DcaSummaryStatCard
      idBase="total-btc"
      icon={Bitcoin}
      iconBoxClassName="bg-orange-500/10"
      iconClassName="text-orange-500"
      label="BTC สะสม"
      value={formatCoin(summary.totalBTC)}
      unit="BTC"
    />

    <DcaSummaryStatCard
      idBase="total-rounds"
      icon={Coins}
      iconBoxClassName="bg-blue-500/10"
      iconClassName="text-blue-500"
      label="จำนวนรอบทั้งหมด"
      value={String(summary.totalRounds)}
      unit="รอบ"
    />

    <DcaPnlCard summary={summary} />
  </div>
);
