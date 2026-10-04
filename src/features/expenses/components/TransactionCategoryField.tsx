import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CategoryCombobox } from "@/features/expenses/components/CategoryCombobox";
import type { ExpenseCategory } from "@/features/expenses/types";
import { Tag } from "lucide-react";

interface TransactionCategoryFieldProps {
  categories: ExpenseCategory[];
  value: string;
  onChange: (categoryId: string) => void;
  onManageCategories: () => void;
}

/** เลือกหมวดหมู่ของรายการ (combobox + ปุ่มจัดการหมวดหมู่) */
export function TransactionCategoryField({
  categories,
  value,
  onChange,
  onManageCategories,
}: TransactionCategoryFieldProps) {
  const filtered = categories.filter((c) => c.isActive);

  return (
    <div id="transaction-category-group" className="space-y-2">
      <div
        id="transaction-category-header"
        className="flex items-center justify-between"
      >
        <Label
          id="transaction-category-label"
          className="text-foreground text-sm font-semibold"
        >
          หมวดหมู่
        </Label>
        <Button
          id="manage-categories-btn"
          type="button"
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground h-8 gap-2 px-2 text-sm"
          onClick={() => onManageCategories()}
        >
          <Tag id="manage-categories-icon" size={16} />
          <span id="manage-categories-text">จัดการ</span>
        </Button>
      </div>
      {filtered.length === 0 && (
        <p
          id="no-categories-msg"
          className="border-border bg-muted/25 text-muted-foreground rounded-lg border px-4 py-3 text-center text-sm"
        >
          ยังไม่มีหมวดหมู่
        </p>
      )}
      {filtered.length > 0 && (
        <CategoryCombobox
          categories={filtered}
          value={value}
          onChange={onChange}
          required
          placeholder="เลือกหมวดหมู่"
        />
      )}
    </div>
  );
}
