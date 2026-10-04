import { Button } from "@/components/ui/button";
import type { RefObject } from "react";
import { Plus } from "lucide-react";

interface ExpensesFabProps {
  wrapperRef: RefObject<HTMLDivElement | null>;
  onAdd: () => void;
}

/** ปุ่ม FAB เพิ่มรายการ พร้อม glow ring (glow animation มาจาก useFabGlow) */
export function ExpensesFab({ wrapperRef, onAdd }: ExpensesFabProps) {
  return (
    <div
      id="fab-wrapper"
      ref={wrapperRef}
      className="glow-fab-wrapper fixed right-4 bottom-6 z-40 sm:right-8 sm:bottom-8"
    >
      <div id="fab-glow-ring" className="glow-fab-ring" />
      <Button
        id="fab-add-btn"
        onClick={onAdd}
        aria-label="เพิ่มรายการ"
        className="group/btn bg-primary/40 text-primary-foreground relative h-14 w-14 overflow-hidden rounded-full p-0 shadow-lg"
      >
        <span
          id="fab-hover-layer"
          className="bg-primary pointer-events-none absolute inset-0 transition-[clip-path] duration-500 ease-in-out [clip-path:circle(0%)] group-hover/btn:[clip-path:circle(100%)] group-active/btn:[clip-path:circle(100%)]"
        />
        <Plus id="fab-icon" size={24} className="relative z-10" />
      </Button>
    </div>
  );
}
