/**
 * ApprovalRequestList
 * การ์ดรายการคำขอทั้งหมด (header + สถานะโหลด/ว่างเปล่า + แถวรายการ + pagination)
 */
import { MessageSquare, RefreshCw } from "lucide-react";
import { Pagination } from "@/components/common/Pagination";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { tabConfig } from "@/features/line/constants/approvalDisplay.constants";
import { ApprovalRequestRow } from "@/features/line/components/ApprovalRequestRow";
import type {
  ApprovalRequest,
  ApprovalTab,
  ListResponse,
} from "@/features/line/helpers/approvalDisplay.helpers";

interface ApprovalRequestListProps {
  isLoading: boolean;
  listData: ListResponse | null;
  activeTab: ApprovalTab;
  page: number;
  actionLoading: string | null;
  onApprove: (id: string) => void;
  onSetAdmin: (req: ApprovalRequest, isAdmin: boolean) => void;
  onUnlock: (req: ApprovalRequest) => void;
  onReject: (req: ApprovalRequest) => void;
  onPageChange: (page: number) => void;
}

export function ApprovalRequestList({
  isLoading,
  listData,
  activeTab,
  page,
  actionLoading,
  onApprove,
  onSetAdmin,
  onUnlock,
  onReject,
  onPageChange,
}: ApprovalRequestListProps) {
  return (
    <Card className="border-border bg-card text-card-foreground shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-base text-slate-950 dark:text-slate-50">
          รายการคำขอ — {tabConfig[activeTab].label}
        </CardTitle>
        <CardDescription className="text-slate-600 dark:text-slate-400">
          {listData ? `พบ ${listData.total} รายการ` : "กำลังโหลด..."}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading || !listData ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="h-6 w-6 animate-spin text-slate-500 dark:text-slate-400" />
          </div>
        ) : !listData.data.length ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <MessageSquare className="mb-3 h-12 w-12 text-slate-300 dark:text-slate-600" />
            <p className="font-medium text-slate-600 dark:text-slate-400">
              ไม่มีรายการ{tabConfig[activeTab].label}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-white/10">
            {listData.data.map((req) => (
              <ApprovalRequestRow
                key={req.id}
                req={req}
                actionLoading={actionLoading}
                onApprove={onApprove}
                onSetAdmin={onSetAdmin}
                onUnlock={onUnlock}
                onReject={onReject}
              />
            ))}
          </div>
        )}

        {listData && listData.total > 0 && (
          <div className="border-t border-slate-200 px-4 dark:border-white/10">
            <Pagination
              currentPage={page}
              totalPages={listData.totalPages}
              onPageChange={onPageChange}
              idPrefix="line-approval-pagination"
              classNames={{
                info: "text-slate-600 dark:text-slate-400",
                button:
                  "border-border bg-card text-foreground hover:bg-muted/50",
                activeButton:
                  "bg-green-600 text-white hover:bg-green-700 dark:bg-green-500 dark:text-slate-950 dark:hover:bg-green-400",
                mobileCurrent:
                  "bg-slate-200 text-slate-800 dark:bg-white/10 dark:text-slate-100",
                ellipsis: "text-slate-500 dark:text-slate-400",
                input:
                  "border-border bg-card text-foreground placeholder:text-muted-foreground",
                cancelButton:
                  "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10",
              }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
