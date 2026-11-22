import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface VoteDeckProps {
  deck: readonly string[];
  selected: string | null;
  disabled?: boolean;
  /** id ของหัวข้อที่อธิบายกลุ่มปุ่มนี้ (ให้โปรแกรมอ่านหน้าจอประกาศชื่อกลุ่ม) */
  labelledBy: string;
  onSelect: (value: string | null) => void;
}

/** ค่าพิเศษในเดคที่คนทั่วไปอาจไม่คุ้น — โชว์เป็น tooltip + เสริมเข้า aria-label
 *  (ค่าตัวเลขทั่วไปคือ story point อ่านออกเองจึงไม่มี hint) */
const SPECIAL_VALUE_HINTS: Record<string, string> = {
  "0": "Zero points — no work needed",
  "½": "Half a point (0.5)",
  "?": "Can't estimate — the story is unclear",
  "☕": "Coffee break — discuss or split the story",
};

// ใช้ปุ่ม + aria-pressed (toggle) แทน radiogroup: Tab ไปทีละใบได้ กด Enter/Space เลือก/ยกเลิก
// โดยไม่ต้องทำ roving tabindex + ลูกศรเอง และยกเลิกคะแนนได้ด้วยการกดซ้ำ
// TooltipProvider ในตัว — เดคไม่ได้อยู่ใต้ provider ของหัวข้อ (ใช้แยกหน้าได้ทุกที่)
export const VoteDeck = ({
  deck,
  selected,
  disabled = false,
  labelledBy,
  onSelect,
}: VoteDeckProps) => (
  <TooltipProvider delayDuration={180}>
    <div
      id="poker-vote-deck"
      role="group"
      aria-labelledby={labelledBy}
      className="flex flex-wrap justify-center gap-2 sm:gap-3"
    >
      {deck.map((value, index) => {
        const isSelected = value === selected;
        const hint = SPECIAL_VALUE_HINTS[value];
        const card = (
          <button
            key={value}
            id={`poker-vote-${index}`}
            type="button"
            aria-pressed={isSelected}
            disabled={disabled}
            aria-label={hint ? `${value} — ${hint}` : undefined}
            onClick={() => onSelect(isSelected ? null : value)}
            className={cn(
              "focus-visible:ring-ring flex h-20 w-14 cursor-pointer items-center justify-center rounded-lg border-2 text-xl font-bold transition-all duration-200 ease-out focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transform-none motion-reduce:transition-none sm:h-24 sm:w-16",
              isSelected
                ? "border-primary bg-primary text-primary-foreground -translate-y-2 shadow-md"
                : "bg-card hover:border-primary hover:-translate-y-1",
            )}
          >
            {value}
          </button>
        );
        return hint ? (
          <Tooltip key={value}>
            <TooltipTrigger asChild>{card}</TooltipTrigger>
            <TooltipContent side="top" className="poker-tooltip-soft">
              {hint}
            </TooltipContent>
          </Tooltip>
        ) : (
          card
        );
      })}
    </div>
  </TooltipProvider>
);
