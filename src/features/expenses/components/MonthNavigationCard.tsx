import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatMonthThai, getCurrentMonth } from "@/features/expenses/helpers";
import { forwardRef, CSSProperties, RefObject } from "react";

interface MonthNavigationCardProps {
  currentMonth: string;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  swipeTransform?: number;
  isSwiping?: boolean;
  className?: string;
}

/**
 * MonthNavigationCard Component
 *
 * แสดง navigation card สำหรับเลือกเดือน พร้อมรองรับ:
 * - ปุ่มเดือนก่อนหน้า/ถัดไป
 * - Touch swipe (บน mobile)
 * - Tooltip อธิบายการใช้งาน
 * - Animation feedback
 *
 * @example
 * ```tsx
 * <MonthNavigationCard
 *   currentMonth="2026-05"
 *   onPreviousMonth={handlePrevMonth}
 *   onNextMonth={handleNextMonth}
 *   swipeTransform={swipeTransform}
 *   isSwiping={isSwiping}
 * />
 * ```
 */
export const MonthNavigationCard = forwardRef<
  HTMLDivElement,
  MonthNavigationCardProps
>(
  (
    {
      currentMonth,
      onPreviousMonth,
      onNextMonth,
      swipeTransform = 0,
      isSwiping = false,
      className,
    },
    forwardedRef,
  ) => {
    const canGoNext = currentMonth < getCurrentMonth();

    const cardStyle: CSSProperties = {
      transform: `translateX(${swipeTransform}px)`,
      transition: isSwiping ? "none" : "transform 0.3s ease-out",
      willChange: isSwiping ? "transform" : "auto",
    };

    return (
      <Card
        id="month-nav-card"
        className="group hover:border-primary/30 border-border/70 bg-card/85 dark:bg-card/70 relative mb-4 border transition-all duration-300 hover:shadow-md sm:mb-6"
      >
        <CardContent
          ref={forwardedRef}
          id="month-nav-content"
          className="pointer-events-auto flex touch-pan-x items-center justify-between p-3 select-none sm:p-4"
          style={cardStyle}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                id="btn-prev-month"
                variant="ghost"
                size="sm"
                onClick={onPreviousMonth}
                aria-label="เดือนก่อน"
                className="hover:bg-muted h-8 w-8 rounded-lg transition-all hover:scale-105 active:scale-95 sm:h-9 sm:w-9"
              >
                <ChevronLeft size={18} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>เดือนก่อนหน้า (หรือ swipe ขวา)</p>
            </TooltipContent>
          </Tooltip>

          <span
            id="month-label"
            className="text-foreground text-sm font-semibold sm:text-base"
          >
            {formatMonthThai(currentMonth)}
          </span>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                id="btn-next-month"
                variant="ghost"
                size="sm"
                onClick={onNextMonth}
                disabled={!canGoNext}
                aria-label="เดือนหน้า"
                className="hover:bg-muted h-8 w-8 rounded-lg transition-all hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 sm:h-9 sm:w-9"
              >
                <ChevronRight size={18} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>เดือนถัดไป (หรือ swipe ซ้าย)</p>
            </TooltipContent>
          </Tooltip>
        </CardContent>
      </Card>
    );
  },
);

MonthNavigationCard.displayName = "MonthNavigationCard";
