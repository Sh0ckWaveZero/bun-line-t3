import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { CoPayCategory } from "@/features/expenses/helpers/coPayStats";
import { AlertCircle, Plus } from "lucide-react";

interface ThaiHelpSaveFlowProps {
  categories: CoPayCategory[];
  selectedCategoryId: string;
  onSelectCategory: (categoryId: string) => void;
  onSaveExpense: () => void;
  isSaving: boolean;
  userPaid40: number;
  saveError: boolean;
}

/** ส่วนเลือกหมวดหมู่ + บันทึกรายจ่าย (พร้อม inline retry เมื่อบันทึกไม่สำเร็จ) */
export function ThaiHelpSaveFlow({
  categories,
  selectedCategoryId,
  onSelectCategory,
  onSaveExpense,
  isSaving,
  userPaid40,
  saveError,
}: ThaiHelpSaveFlowProps) {
  return (
    <div
      id="thai-help-save-flow"
      className="space-y-3 rounded-xl border border-violet-500/15 bg-violet-500/5 p-4"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label
            htmlFor="tct-category-select"
            className="text-muted-foreground text-xs font-semibold tracking-wide"
          >
            หมวดหมู่รายจ่าย
          </Label>
          <select
            id="tct-category-select"
            value={selectedCategoryId}
            onChange={(e) => onSelectCategory(e.target.value)}
            className="font-noto-sans-thai bg-card border-border/40 text-foreground h-9 w-full rounded-md border px-2 text-xs font-medium focus:ring-1 focus:ring-violet-500 focus:outline-none"
          >
            {categories
              .filter((c) => c.isActive)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon ? `${c.icon} ` : ""}
                  {c.name}
                </option>
              ))}
          </select>
        </div>
        <div className="flex items-end">
          <Button
            onClick={() => onSaveExpense()}
            disabled={isSaving}
            className="h-9 w-full gap-1.5 bg-violet-600 text-xs font-bold text-white hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600"
          >
            {isSaving ? "กำลังบันทึก..." : <Plus size={14} />}
            บันทึกรายจ่าย ฿{userPaid40.toFixed(2)}
          </Button>
        </div>
      </div>

      {saveError && (
        <div className="flex items-center justify-between gap-2 rounded-md border border-red-500/20 bg-red-500/5 px-3 py-2">
          <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
            <AlertCircle size={13} className="shrink-0" />
            <span>บันทึกไม่สำเร็จ</span>
          </div>
          <button
            onClick={() => onSaveExpense()}
            disabled={isSaving}
            className="text-xs font-semibold text-red-600 underline underline-offset-2 hover:text-red-700 dark:text-red-400"
          >
            ลองใหม่
          </button>
        </div>
      )}
    </div>
  );
}
