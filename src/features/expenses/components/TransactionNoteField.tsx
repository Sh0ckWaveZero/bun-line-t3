import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TransactionNoteFieldProps {
  value: string;
  onChange: (value: string) => void;
}

/** ช่องกรอกหมายเหตุ */
export function TransactionNoteField({
  value,
  onChange,
}: TransactionNoteFieldProps) {
  return (
    <div id="transaction-note-group" className="space-y-2">
      <Label
        htmlFor="transaction-note-input"
        id="transaction-note-label"
        className="text-foreground text-sm font-semibold"
      >
        หมายเหตุ
      </Label>
      <Input
        id="transaction-note-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="หมายเหตุ (ถ้ามี)"
        className="border-border bg-background placeholder:text-muted-foreground/60 focus-visible:ring-foreground/30 h-12 rounded-lg px-4 text-base font-medium"
        maxLength={500}
      />
    </div>
  );
}
