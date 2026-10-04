import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TIMEFRAMES } from "@/features/dca/constants/dca-chart";
import type {
  ChartMode,
  ChartTab,
  Timeframe,
} from "@/features/dca/types/chart";

interface DcaChartHeaderProps {
  tabs: ChartTab[];
  mode: ChartMode;
  onModeChange: (mode: ChartMode) => void;
  timeframe: Timeframe;
  onTimeframeChange: (timeframe: Timeframe) => void;
}

/** ส่วนหัวของกราฟ: แท็บเลือกโหมด + dropdown เลือกช่วงเวลา */
export const DcaChartHeader = ({
  tabs,
  mode,
  onModeChange,
  timeframe,
  onTimeframeChange,
}: DcaChartHeaderProps) => {
  const [timeframeOpen, setTimeframeOpen] = useState(false);

  return (
    <div className="border-border relative z-10 flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2.5 sm:px-5 sm:py-3.5">
      <div className="flex flex-wrap gap-0.5">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`rounded px-2 py-1.5 text-[11px] font-medium sm:px-3 sm:text-xs ${
              mode === tab.key
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
            onClick={() => onModeChange(tab.key)}
          >
            <span className="sm:hidden">{tab.shortLabel}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>
      <Popover open={timeframeOpen} onOpenChange={setTimeframeOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="bg-card border-border text-foreground min-w-[72px] rounded border px-2 py-1 text-xs"
          >
            {timeframe}
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-[88px] p-1">
          <div className="flex flex-col gap-0.5">
            {TIMEFRAMES.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  onTimeframeChange(value);
                  setTimeframeOpen(false);
                }}
                className={`rounded px-2 py-1.5 text-left text-xs ${
                  timeframe === value
                    ? "bg-foreground text-background"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
