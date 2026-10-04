import { Label } from "@/components/ui/label";
import type { TransactionType } from "@/features/expenses/types";
import { TrendingDown, TrendingUp } from "lucide-react";

interface TransactionTypeFieldProps {
  value: TransactionType;
  onChange: (type: TransactionType) => void;
}

/** ปุ่มเลือกประเภทรายการ (รายรับ/รายจ่าย) */
export function TransactionTypeField({
  value,
  onChange,
}: TransactionTypeFieldProps) {
  return (
    <div id="transaction-type-section" className="space-y-2">
      <Label
        id="transaction-type-label"
        className="text-foreground text-sm font-semibold"
      >
        ประเภทรายการ
      </Label>
      <div
        id="transaction-type-group"
        className="bg-muted/50 grid grid-cols-2 gap-2 rounded-xl p-1"
      >
        {(["EXPENSE", "INCOME"] as const).map((t) => {
          const isSelected = value === t;
          const activeClass =
            t === "EXPENSE"
              ? "bg-red-500 text-white shadow-sm"
              : "bg-emerald-500 text-white shadow-sm";
          const inactiveClass =
            "text-muted-foreground hover:text-foreground hover:bg-muted";
          return (
            <button
              key={t}
              id={`transaction-type-${t.toLowerCase()}-btn`}
              type="button"
              aria-label={`เลือกประเภทรายการ${t === "INCOME" ? "รายรับ" : "รายจ่าย"}`}
              className={`flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors ${
                isSelected ? activeClass : inactiveClass
              }`}
              onClick={() => onChange(t)}
            >
              {t === "INCOME" ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              {t === "INCOME" ? "รายรับ" : "รายจ่าย"}
            </button>
          );
        })}
      </div>
    </div>
  );
}
