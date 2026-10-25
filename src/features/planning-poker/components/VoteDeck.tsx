import { cn } from "@/lib/utils";

interface VoteDeckProps {
  deck: readonly string[];
  selected: string | null;
  disabled?: boolean;
  /** id ของหัวข้อที่อธิบายกลุ่มปุ่มนี้ (ให้โปรแกรมอ่านหน้าจอประกาศชื่อกลุ่ม) */
  labelledBy: string;
  onSelect: (value: string | null) => void;
}

// ใช้ปุ่ม + aria-pressed (toggle) แทน radiogroup: Tab ไปทีละใบได้ กด Enter/Space เลือก/ยกเลิก
// โดยไม่ต้องทำ roving tabindex + ลูกศรเอง และยกเลิกคะแนนได้ด้วยการกดซ้ำ
export const VoteDeck = ({
  deck,
  selected,
  disabled = false,
  labelledBy,
  onSelect,
}: VoteDeckProps) => (
  <div
    role="group"
    aria-labelledby={labelledBy}
    className="flex flex-wrap justify-center gap-2 sm:gap-3"
  >
    {deck.map((value, index) => {
      const isSelected = value === selected;
      return (
        <button
          key={value}
          id={`poker-vote-${index}`}
          type="button"
          aria-pressed={isSelected}
          disabled={disabled}
          onClick={() => onSelect(isSelected ? null : value)}
          className={cn(
            "focus-visible:ring-ring flex h-20 w-14 cursor-pointer items-center justify-center rounded-lg border-2 text-xl font-bold transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transform-none motion-reduce:transition-none sm:h-24 sm:w-16",
            isSelected
              ? "border-primary bg-primary text-primary-foreground -translate-y-2 shadow-md"
              : "bg-card hover:border-primary hover:-translate-y-1",
          )}
        >
          {value}
        </button>
      );
    })}
  </div>
);
