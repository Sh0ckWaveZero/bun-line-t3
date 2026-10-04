/**
 * ApprovalTabs
 * แถบ tab กรองตามสถานะคำขอ (ทั้งหมด / รออนุมัติ / อนุมัติแล้ว / ปฏิเสธแล้ว)
 */
import { tabConfig } from "@/features/line/constants/approvalDisplay.constants";
import type { ApprovalTab } from "@/features/line/helpers/approvalDisplay.helpers";

interface ApprovalTabsProps {
  activeTab: ApprovalTab;
  onTabChange: (tab: ApprovalTab) => void;
  getTabCount: (tab: ApprovalTab) => number;
}

export function ApprovalTabs({
  activeTab,
  onTabChange,
  getTabCount,
}: ApprovalTabsProps) {
  return (
    <div
      className="mb-6 flex gap-2 overflow-x-auto border-b border-slate-200 dark:border-white/10"
      role="tablist"
      aria-label="สถานะคำขอ LINE Approval"
    >
      {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((tab) => (
        <button
          key={tab}
          type="button"
          role="tab"
          aria-selected={activeTab === tab}
          onClick={() => onTabChange(tab)}
          className={`-mb-px inline-flex h-12 shrink-0 cursor-pointer items-center gap-2 border-b-2 px-4 text-sm font-medium transition-colors ${
            activeTab === tab
              ? "border-green-600 text-slate-950 dark:border-green-400 dark:text-slate-50"
              : "border-transparent text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-slate-100"
          }`}
        >
          <span className="inline-flex items-center gap-1.5">
            {tabConfig[tab].icon}
            {tabConfig[tab].label}
          </span>
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-200 px-1.5 text-[11px] leading-none font-bold text-slate-700 tabular-nums dark:bg-white/10 dark:text-slate-300">
            {getTabCount(tab)}
          </span>
        </button>
      ))}
    </div>
  );
}
