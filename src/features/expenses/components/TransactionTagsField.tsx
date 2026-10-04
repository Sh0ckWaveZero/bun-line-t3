import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TransactionTagsFieldProps {
  value: string;
  onChange: (value: string) => void;
}

/** ช่องกรอกแท็ก พร้อม preview chips */
export function TransactionTagsField({
  value,
  onChange,
}: TransactionTagsFieldProps) {
  return (
    <div id="transaction-tags-group" className="space-y-2">
      <Label
        htmlFor="transaction-tags-input"
        id="transaction-tags-label"
        className="text-foreground text-sm font-semibold"
      >
        แท็ก
      </Label>
      <Input
        id="transaction-tags-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="แท็ก เช่น lunch,office (ถ้ามี)"
        className="border-border bg-background placeholder:text-muted-foreground/60 focus-visible:ring-foreground/30 h-12 rounded-lg px-4 text-base font-medium"
        maxLength={200}
      />
      {value && (
        <div id="transaction-tags-preview" className="flex flex-wrap gap-1">
          {value
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
            .map((tag, index) => (
              <span
                key={`${tag}-${index}`}
                id={`transaction-tag-chip-${index}`}
                className="bg-primary/10 text-primary inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
              >
                @{tag}
              </span>
            ))}
        </div>
      )}
    </div>
  );
}
