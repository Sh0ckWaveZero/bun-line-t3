// src/features/attendance/components/LeaveHistoryCard.tsx
"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Loader2,
} from "lucide-react";
import { LeaveHistoryItem } from "@/features/attendance/components/LeaveHistoryItem";
import { getThaiMonthLabel } from "@/features/attendance/helpers/leave-date";
import type { LeaveRecord } from "@/features/attendance/types/leave";

interface LeaveHistoryCardProps {
  leaves: LeaveRecord[];
  historyMonth: string;
  historyLoading: boolean;
  currentMonthStr: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

/** การ์ดประวัติการลา พร้อม navigation เดือน */
export const LeaveHistoryCard = ({
  leaves,
  historyMonth,
  historyLoading,
  currentMonthStr,
  onPrevMonth,
  onNextMonth,
}: LeaveHistoryCardProps) => {
  return (
    <Card id="leave-history" className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle
            id="leave-history-title"
            className="flex items-center gap-2 text-base"
          >
            <ClipboardList
              className="text-primary h-4 w-4"
              aria-hidden="true"
            />
            ประวัติการลา
          </CardTitle>

          {/* Month navigation */}
          <nav
            id="leave-history-nav"
            aria-label="นำทางเดือน"
            className="flex items-center gap-0.5"
          >
            <button
              id="leave-history-prev"
              type="button"
              onClick={onPrevMonth}
              aria-label="เดือนก่อนหน้า"
              className="hover:bg-accent focus-visible:ring-ring flex h-7 w-7 items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>

            <span
              id="leave-history-month"
              aria-live="polite"
              aria-atomic="true"
              className="min-w-[112px] text-center text-sm font-medium tabular-nums"
            >
              {getThaiMonthLabel(historyMonth)}
            </span>

            <button
              id="leave-history-next"
              type="button"
              onClick={onNextMonth}
              disabled={historyMonth >= currentMonthStr}
              aria-label="เดือนถัดไป"
              aria-disabled={historyMonth >= currentMonthStr}
              className="hover:bg-accent focus-visible:ring-ring flex h-7 w-7 items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </nav>
        </div>
      </CardHeader>

      <CardContent>
        {historyLoading ? (
          <div
            id="leave-history-loading"
            role="status"
            aria-label="กำลังโหลดข้อมูลการลา"
            className="flex justify-center py-8"
          >
            <Loader2
              className="text-muted-foreground h-5 w-5 animate-spin"
              aria-hidden="true"
            />
          </div>
        ) : leaves.length === 0 ? (
          <div
            id="leave-history-empty"
            className="flex flex-col items-center gap-2 py-8"
          >
            <CalendarIcon
              className="text-muted-foreground/40 h-8 w-8"
              aria-hidden="true"
            />
            <p className="text-muted-foreground text-sm">
              ไม่มีข้อมูลการลาในเดือนนี้
            </p>
          </div>
        ) : (
          <ul
            id="leave-history-list"
            aria-label="รายการวันลา"
            className="space-y-2"
          >
            {leaves.map((leave) => (
              <LeaveHistoryItem key={leave.id} leave={leave} />
            ))}
          </ul>
        )}

        {/* Summary footer */}
        {!historyLoading && leaves.length > 0 && (
          <p
            id="leave-history-summary"
            className="text-muted-foreground mt-3 text-right text-xs"
          >
            รวม {leaves.length} วัน
          </p>
        )}
      </CardContent>
    </Card>
  );
};
