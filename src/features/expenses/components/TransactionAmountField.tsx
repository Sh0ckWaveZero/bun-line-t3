import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TransactionAmountFieldProps {
  value: string;
  onChange: (value: string) => void;
  isCoPayTx: boolean;
}

/** ช่องกรอกจำนวนเงิน (hook จัดรูปแบบ formatAmountInput ให้แล้ว) */
export function TransactionAmountField({
  value,
  onChange,
  isCoPayTx,
}: TransactionAmountFieldProps) {
  return (
    <div id="transaction-amount-group" className="space-y-2">
      <Label
        htmlFor="transaction-amount-input"
        id="transaction-amount-label"
        className="text-foreground text-sm font-semibold"
      >
        {isCoPayTx ? "ยอดเต็ม (ไทยช่วยไทย 60/40)" : "จำนวนเงิน"}
      </Label>
      <Input
        id="transaction-amount-input"
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        placeholder={
          isCoPayTx ? "ยอดรวมก่อนหักส่วนลด (บาท)" : "จำนวนเงิน (บาท)"
        }
        className="border-border bg-background placeholder:text-muted-foreground/60 focus-visible:ring-foreground/30 h-12 rounded-lg px-4 text-base font-medium"
      />
      {isCoPayTx && (
        <p className="text-muted-foreground text-xs">
          ระบุยอดเต็ม — ระบบจะคำนวณส่วนลด 60% ให้อัตโนมัติ
        </p>
      )}
    </div>
  );
}
