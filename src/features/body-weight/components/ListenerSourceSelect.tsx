"use client";

import { useMemo } from "react";
import { Radio } from "lucide-react";
import { Select } from "@/components/ui/select";
import { useScaleListeners } from "@/features/body-weight/hooks/useScaleListeners";
import { LISTENER_MODE } from "@/features/body-weight/types";

/** listener check-in ทุก 10 วิ — ขาดเกินนี้ถือว่าออฟไลน์ */
const ONLINE_WITHIN_MS = 30_000;

/**
 * เลือกเครื่องที่รับสัญญาณตาชั่ง — สลับไปเครื่อง dev ตอนพัฒนา แล้วกลับมา Pi
 * เครื่องที่ไม่ได้เลือกจะหยุดสแกน และ webhook ทิ้ง packet จากเครื่องนั้น
 */
export function ListenerSourceSelect({
  onError,
}: {
  onError: (message: string) => void;
}) {
  const { overview, setActive, isSaving } = useScaleListeners();

  const options = useMemo(() => {
    if (!overview) return [];
    const seen = new Map(
      overview.listeners.map((l) => [l.name, l.lastSeenAgoMs]),
    );
    // เครื่องที่ถูกเลือกไว้แต่ยังไม่ check-in (เช่นแอปเพิ่ง restart) ต้องยังเลือกได้
    const names = new Set(seen.keys());
    if (
      overview.active !== LISTENER_MODE.all &&
      overview.active !== LISTENER_MODE.off
    ) {
      names.add(overview.active);
    }
    return [
      { value: LISTENER_MODE.all, label: "รับจากทุกเครื่อง" },
      ...[...names].sort().map((name) => {
        const ago = seen.get(name);
        const isOnline = ago !== undefined && ago < ONLINE_WITHIN_MS;
        return {
          value: name,
          label: isOnline ? `รับจาก ${name}` : `รับจาก ${name} (ออฟไลน์)`,
        };
      }),
      { value: LISTENER_MODE.off, label: "ปิดการรับสัญญาณ" },
    ];
  }, [overview]);

  if (!overview) return null;

  const handleChange = (value: string) => {
    if (value === overview.active) return;
    setActive(value).catch((error: unknown) =>
      onError(
        error instanceof Error
          ? error.message
          : "ไม่สามารถเปลี่ยนเครื่องรับสัญญาณได้",
      ),
    );
  };

  return (
    <div className="flex items-center gap-2">
      <Radio
        className={`h-4 w-4 shrink-0 ${
          overview.active === LISTENER_MODE.off
            ? "text-muted-foreground"
            : "text-(--brand)"
        }`}
        aria-hidden="true"
      />
      <label htmlFor="scale-listener-source" className="sr-only">
        เครื่องที่รับสัญญาณตาชั่ง
      </label>
      <div className="w-56 max-w-[calc(100vw-4rem)]">
        <Select
          id="scale-listener-source"
          value={overview.active}
          options={options}
          disabled={isSaving}
          className="h-9 text-xs"
          contentClassName="min-w-72"
          onValueChange={handleChange}
        />
      </div>
    </div>
  );
}
