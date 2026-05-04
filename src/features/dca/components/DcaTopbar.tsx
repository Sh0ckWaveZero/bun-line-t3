"use client";

import { useEffect, useState } from "react";
import { Plus, RefreshCw, Upload, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDcaLocale } from "@/features/dca/lib/dca-locale-context";

interface DcaTopbarProps {
  onAdd: () => void;
  onImport: () => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export const DcaTopbar = ({ onAdd, onImport, onRefresh, isLoading }: DcaTopbarProps) => {
  const [time, setTime] = useState<string>("");
  const { locale, setLocale, t } = useDcaLocale();

  useEffect(() => {
    const tick = () =>
      setTime(
        new Date().toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  const toggleLocale = () => {
    setLocale(locale === "th" ? "en" : "th");
  };

  return (
    <header id="dca-topbar" className="border-border flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between sm:pb-5">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="grid h-7 w-7 place-items-center rounded-md bg-orange-500 font-mono text-[15px] font-bold text-white">
          &#8383;
        </div>
        <div>
          <div className="text-foreground text-sm font-semibold tracking-tight">
            {t.topbar.title}
          </div>
          <div className="text-muted-foreground font-mono text-xs">
            {t.topbar.subtitle}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        {time && (
          <span className="text-muted-foreground mr-2 hidden font-mono text-[11px] sm:inline">
            {t.topbar.lastSync} &middot; {time}
          </span>
        )}

        <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading} className="gap-1.5 text-xs">
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">{t.topbar.refresh}</span>
        </Button>

        <Button variant="outline" size="sm" onClick={onImport} className="gap-1.5 text-xs">
          <Upload className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{t.topbar.import}</span>
        </Button>

        <Button variant="outline" size="sm" onClick={toggleLocale} className="gap-1.5 text-xs" title="Switch language">
          <Languages className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{locale === "th" ? "EN" : "TH"}</span>
        </Button>

        <Button size="sm" onClick={onAdd} className="gap-1.5 bg-orange-500 text-xs text-white hover:bg-orange-600">
          <Plus className="h-3.5 w-3.5" />
          {t.topbar.addDca}
        </Button>
      </div>
    </header>
  );
};
