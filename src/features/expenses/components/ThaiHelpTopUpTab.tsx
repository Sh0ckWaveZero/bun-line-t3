import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CO_PAY_USER_SHARE } from "@/features/expenses/helpers/coPayment";
import { Check, Copy, RotateCcw } from "lucide-react";

interface ThaiHelpTopUpTabProps {
  desiredSubsidy: string;
  onDesiredSubsidyChange: (value: string) => void;
  topUpNeeded: number;
  purchaseValue: number;
  numericSubsidy: number;
  copied: boolean;
  onCopy: () => void;
}

/** Tab ต้องเติมเท่าไหร่: คำนวณยอดเติม G-Wallet จากสิทธิ์ที่ต้องการใช้ */
export function ThaiHelpTopUpTab({
  desiredSubsidy,
  onDesiredSubsidyChange,
  topUpNeeded,
  purchaseValue,
  numericSubsidy,
  copied,
  onCopy,
}: ThaiHelpTopUpTabProps) {
  return (
    <>
      <div className="space-y-2">
        <Label
          htmlFor="desired-subsidy-input"
          className="text-foreground text-sm font-semibold"
        >
          ยอดเงินสนับสนุนของรัฐที่ต้องการใช้วันนี้ (บาท)
        </Label>
        <div className="relative">
          <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 font-semibold">
            ฿
          </span>
          <Input
            id="desired-subsidy-input"
            type="number"
            pattern="[0-9]*"
            inputMode="decimal"
            placeholder="เช่น 150 (ไม่เกิน 200)"
            value={desiredSubsidy}
            onChange={(e) => onDesiredSubsidyChange(e.target.value)}
            className="h-11 pl-7 text-base font-bold tabular-nums"
          />
          {desiredSubsidy && (
            <button
              onClick={() => onDesiredSubsidyChange("")}
              aria-label="ล้างจำนวนเงินสนับสนุน"
              className="text-muted-foreground hover:bg-muted hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1"
            >
              <RotateCcw size={14} />
            </button>
          )}
        </div>
        <p className="text-muted-foreground text-xs leading-tight">
          ป้อนยอดเงินรัฐที่คุณต้องการสแกนใช้ เพื่อดูว่ากระเป๋าเป๋าตัง (G-Wallet)
          ของคุณต้องมีเงินอยู่อีกเท่าไหร่
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="border-border/20 rounded-xl border bg-emerald-500/5 p-3">
          <span className="text-muted-foreground text-xs font-semibold tracking-wide">
            เติมใน เป๋าตัง ({(CO_PAY_USER_SHARE * 100).toFixed(0)}%)
          </span>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-lg font-extrabold text-emerald-600 tabular-nums dark:text-emerald-400">
              ฿{topUpNeeded.toFixed(2)}
            </p>
            {numericSubsidy > 0 && (
              <button
                onClick={() => onCopy()}
                className="text-muted-foreground hover:text-foreground rounded p-0.5 transition-colors"
                title="คัดลอก"
              >
                {copied ? (
                  <Check size={13} className="text-emerald-600" />
                ) : (
                  <Copy size={13} />
                )}
              </button>
            )}
          </div>
        </div>
        <div className="border-border/20 bg-muted/20 rounded-xl border p-3">
          <span className="text-muted-foreground text-xs font-semibold tracking-wide">
            ซื้อสินค้าได้รวม
          </span>
          <p className="text-foreground mt-1 text-lg font-extrabold tabular-nums">
            ฿{purchaseValue.toFixed(2)}
          </p>
        </div>
      </div>
    </>
  );
}
