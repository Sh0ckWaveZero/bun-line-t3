import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CoPayCategory } from "@/features/expenses/helpers/coPayStats";
import { ThaiHelpSaveFlow } from "@/features/expenses/components/ThaiHelpSaveFlow";
import {
  CO_PAY_STATE_SHARE,
  CO_PAY_USER_SHARE,
} from "@/features/expenses/helpers/coPayment";
import { AlertCircle, RotateCcw } from "lucide-react";

interface ThaiHelpSplitTabProps {
  totalBill: string;
  onTotalBillChange: (value: string) => void;
  subsidy60: number;
  userPaid40: number;
  monthlyQuotaExceeded: boolean;
  numericBill: number;
  remainingSubsidy: number;
  categories: CoPayCategory[];
  selectedCategoryId: string;
  onSelectCategory: (categoryId: string) => void;
  onSaveExpense: () => void;
  isSaving: boolean;
  saveError: boolean;
}

/** Tab แยกบิล 60/40: ช่องกรอกยอด + ผลแบ่งเงิน + เตือนโควตา + บันทึกรายจ่าย */
export function ThaiHelpSplitTab({
  totalBill,
  onTotalBillChange,
  subsidy60,
  userPaid40,
  monthlyQuotaExceeded,
  numericBill,
  remainingSubsidy,
  categories,
  selectedCategoryId,
  onSelectCategory,
  onSaveExpense,
  isSaving,
  saveError,
}: ThaiHelpSplitTabProps) {
  return (
    <>
      <div className="space-y-2">
        <Label
          htmlFor="total-bill-input"
          className="text-foreground text-sm font-semibold"
        >
          ยอดราคาสินค้าทั้งหมด (บาท)
        </Label>
        <div className="relative">
          <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 font-semibold">
            ฿
          </span>
          <Input
            id="total-bill-input"
            type="number"
            pattern="[0-9]*"
            inputMode="decimal"
            placeholder="ระบุยอดซื้อทั้งหมด เช่น 150"
            value={totalBill}
            onChange={(e) => onTotalBillChange(e.target.value)}
            className="h-11 pl-7 text-base font-bold tabular-nums"
          />
          {totalBill && (
            <button
              onClick={() => onTotalBillChange("")}
              aria-label="ล้างยอดซื้อทั้งหมด"
              className="text-muted-foreground hover:bg-muted hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1"
            >
              <RotateCcw size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="border-border/20 bg-muted/20 rounded-xl border p-3">
          <span className="text-muted-foreground text-xs font-semibold tracking-wide">
            รัฐช่วยจ่าย ({(CO_PAY_STATE_SHARE * 100).toFixed(0)}%)
          </span>
          <p className="mt-1 text-lg font-extrabold text-blue-600 tabular-nums dark:text-blue-400">
            ฿{subsidy60.toFixed(2)}
          </p>
        </div>
        <div className="border-border/20 rounded-xl border bg-emerald-500/5 p-3">
          <span className="text-muted-foreground text-xs font-semibold tracking-wide">
            คุณจ่ายจริง ({(CO_PAY_USER_SHARE * 100).toFixed(0)}%)
          </span>
          <p className="mt-1 text-lg font-extrabold text-emerald-600 tabular-nums dark:text-emerald-400">
            ฿{userPaid40.toFixed(2)}
          </p>
        </div>
      </div>

      {monthlyQuotaExceeded && numericBill > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/25 bg-amber-500/5 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
          <AlertCircle size={13} className="mt-0.5 shrink-0" />
          <span>
            สิทธิ์เดือนนี้เหลือ{" "}
            <strong className="tabular-nums">
              ฿{remainingSubsidy.toFixed(0)}
            </strong>{" "}
            รัฐช่วยได้แค่{" "}
            <strong className="tabular-nums">฿{subsidy60.toFixed(2)}</strong>{" "}
            ส่วนที่เหลือคุณจ่ายเอง
          </span>
        </div>
      )}

      {numericBill > 0 && (
        <ThaiHelpSaveFlow
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={onSelectCategory}
          onSaveExpense={onSaveExpense}
          isSaving={isSaving}
          userPaid40={userPaid40}
          saveError={saveError}
        />
      )}
    </>
  );
}
