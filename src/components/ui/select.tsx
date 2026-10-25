import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  contentClassName?: string;
}

/**
 * Non-native select — dropdown list วาดด้วย Popover แทน native UI ของ OS
 * จึงอยู่ในธีม dark/light ของแอปทั้ง popup และ trigger
 * คีย์บอร์ด: ArrowUp/Down/Home/End เลื่อน, Enter/Space เลือก, Esc ปิด (Radix)
 */
export function Select({
  value,
  onValueChange,
  options,
  id,
  placeholder = "เลือก",
  disabled,
  className,
  contentClassName,
}: SelectProps) {
  const contentId = React.useId();
  const [open, setOpen] = React.useState(false);
  const [highlighted, setHighlighted] = React.useState(0);
  const optionRefs = React.useRef<Array<HTMLDivElement | null>>([]);

  const selectedIndex = options.findIndex((option) => option.value === value);
  const selectedOption =
    selectedIndex >= 0 ? options[selectedIndex] : undefined;

  const scrollToOption = (index: number) => {
    optionRefs.current[index]?.scrollIntoView({ block: "nearest" });
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setHighlighted(selectedIndex >= 0 ? selectedIndex : 0);
    }
  };

  const move = (delta: number | "first" | "last") => {
    const next =
      delta === "first"
        ? 0
        : delta === "last"
          ? options.length - 1
          : Math.max(0, Math.min(options.length - 1, highlighted + delta));
    setHighlighted(next);
    scrollToOption(next);
  };

  const select = (option: SelectOption | undefined) => {
    if (!option) return;
    onValueChange(option.value);
    setOpen(false);
  };

  const handleListKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      move(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      move(-1);
    } else if (event.key === "Home") {
      event.preventDefault();
      move("first");
    } else if (event.key === "End") {
      event.preventDefault();
      move("last");
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      select(options[highlighted]);
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls={open ? contentId : undefined}
          disabled={disabled}
          className={cn(
            "flex h-10 w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm",
            "border-input bg-background text-foreground",
            // โฟกัสชี้ด้วย ring ชัด (เดิมเปลี่ยนสี border อย่างเดียว — จางเกินกว่า WCAG 2.4.7)
            "focus:border-ring focus:outline-none focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
          onKeyDown={(event) => {
            if (
              !open &&
              (event.key === "ArrowDown" || event.key === "ArrowUp")
            ) {
              event.preventDefault();
              handleOpenChange(true);
            }
          }}
        >
          <span
            className={cn(
              "truncate",
              !selectedOption && "text-muted-foreground",
            )}
          >
            {selectedOption?.label ?? placeholder}
          </span>
          <ChevronDown
            className="h-4 w-4 shrink-0 opacity-50"
            aria-hidden="true"
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        id={contentId}
        role="listbox"
        aria-activedescendant={`${contentId}-option-${highlighted}`}
        align="start"
        sideOffset={4}
        className={cn(
          "w-[var(--radix-popover-trigger-width)] p-1",
          contentClassName,
        )}
        onKeyDown={handleListKeyDown}
      >
        {options.map((option, index) => {
          const isSelected = option.value === value;
          return (
            <div
              key={option.value}
              ref={(el) => {
                optionRefs.current[index] = el;
              }}
              id={`${contentId}-option-${index}`}
              role="option"
              aria-selected={isSelected}
              tabIndex={-1}
              onClick={() => select(option)}
              onMouseEnter={() => setHighlighted(index)}
              className={cn(
                "flex min-h-9 cursor-pointer items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-sm",
                "text-foreground",
                highlighted === index && "bg-accent text-accent-foreground",
                isSelected && "font-medium",
              )}
            >
              <span className="truncate">{option.label}</span>
              {isSelected && (
                <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
              )}
            </div>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}
