/**
 * ApprovalStatsGrid
 * แถวการ์ดสถิติ 4 ใบ (รออนุมัติ / อนุมัติแล้ว / ปฏิเสธแล้ว / ทั้งหมด)
 */
import { CheckCircle, Clock, Users, XCircle } from "lucide-react";
import { ApprovalStatsCard } from "@/features/line/components/ApprovalStatsCard";
import type { ApprovalStats } from "@/features/line/helpers/approvalDisplay.helpers";

interface ApprovalStatsGridProps {
  stats: ApprovalStats | null;
}

export function ApprovalStatsGrid({ stats }: ApprovalStatsGridProps) {
  return (
    <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <ApprovalStatsCard
        label="รอการอนุมัติ"
        value={stats?.pending ?? 0}
        icon={<Clock className="h-5 w-5 text-amber-700 dark:text-amber-400" />}
        color="bg-amber-100 ring-1 ring-amber-200 dark:bg-amber-900/30 dark:ring-amber-700/50"
      />
      <ApprovalStatsCard
        label="อนุมัติแล้ว"
        value={stats?.approved ?? 0}
        icon={
          <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        }
        color="bg-emerald-100 ring-1 ring-emerald-200 dark:bg-emerald-900/30 dark:ring-emerald-700/50"
      />
      <ApprovalStatsCard
        label="ปฏิเสธแล้ว"
        value={stats?.rejected ?? 0}
        icon={<XCircle className="h-5 w-5 text-red-700 dark:text-red-400" />}
        color="bg-red-100 ring-1 ring-red-200 dark:bg-red-900/30 dark:ring-red-700/50"
      />
      <ApprovalStatsCard
        label="ทั้งหมด"
        value={stats?.accountsTotal ?? stats?.total ?? 0}
        icon={<Users className="h-5 w-5 text-blue-700 dark:text-blue-400" />}
        color="bg-blue-100 ring-1 ring-blue-200 dark:bg-blue-900/30 dark:ring-blue-700/50"
      />
    </div>
  );
}
