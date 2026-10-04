import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Download, Eye, EyeOff, Loader2, RefreshCw, Tag } from "lucide-react";

interface ExpensesHeaderProps {
  hideAmounts: boolean;
  onToggleHideAmounts: () => void;
  exporting: boolean;
  onExport: () => void;
  hasTransactions: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  onManageCategories: () => void;
}

/** ส่วนหัวของหน้ารายรับรายจ่าย (title + ปุ่ม actions) */
export function ExpensesHeader({
  hideAmounts,
  onToggleHideAmounts,
  exporting,
  onExport,
  hasTransactions,
  isRefreshing,
  onRefresh,
  onManageCategories,
}: ExpensesHeaderProps) {
  return (
    <div
      id="expenses-header"
      className="border-border/70 bg-card/80 dark:bg-card/65 mb-6 overflow-hidden rounded-xl border p-4 sm:mb-8 sm:p-5"
    >
      <div
        id="expenses-header-inner"
        className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
      >
        <div id="expenses-header-title">
          <h1
            id="expenses-title"
            className="text-foreground text-2xl font-bold sm:text-3xl"
          >
            รายรับรายจ่าย
          </h1>
          <p
            id="expenses-subtitle"
            className="text-muted-foreground mt-1 max-w-2xl text-sm"
          >
            บันทึกและติดตามการเงินของคุณ
          </p>
        </div>
        <div
          id="expenses-header-actions"
          className="flex flex-wrap items-center gap-2"
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                id="btn-toggle-amounts"
                variant="outline"
                size="sm"
                onClick={onToggleHideAmounts}
                aria-label={hideAmounts ? "แสดงจำนวนเงิน" : "ซ่อนจำนวนเงิน"}
                className="hover:bg-muted transition-colors"
              >
                {hideAmounts ? <EyeOff size={14} /> : <Eye size={14} />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{hideAmounts ? "แสดงจำนวนเงิน" : "ซ่อนจำนวนเงิน"}</p>
            </TooltipContent>
          </Tooltip>
          <Button
            id="btn-export"
            variant="outline"
            size="sm"
            disabled={exporting || !hasTransactions}
            onClick={onExport}
            className="hover:bg-muted gap-2 transition-colors"
          >
            {exporting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Download size={14} />
            )}
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Button
            id="btn-category-manager"
            variant="outline"
            size="sm"
            onClick={() => onManageCategories()}
            className="hover:bg-muted gap-2 transition-colors"
          >
            <Tag size={14} />
            <span className="hidden sm:inline">หมวดหมู่</span>
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                id="btn-refresh"
                variant="outline"
                size="sm"
                onClick={() => void onRefresh()}
                disabled={isRefreshing}
                aria-label="รีเฟรชข้อมูล"
                className="hover:bg-muted transition-colors"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>รีเฟรชข้อมูล</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
