/**
 * ApprovalStatsCard
 * การ์ดแสดงสถิติหนึ่งหน่วย (label + ตัวเลข + icon)
 */
import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface ApprovalStatsCardProps {
  label: string;
  value: number;
  icon: ReactNode;
  color: string;
}

export function ApprovalStatsCard({
  label,
  value,
  icon,
  color,
}: ApprovalStatsCardProps) {
  return (
    <Card className="border-border bg-card text-card-foreground shadow-sm">
      <CardContent className="p-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className={`shrink-0 rounded-lg p-2.5 ${color}`}>{icon}</div>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-slate-600 dark:text-slate-400">
              {label}
            </p>
            <p className="text-2xl leading-tight font-bold tabular-nums">
              {value}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
