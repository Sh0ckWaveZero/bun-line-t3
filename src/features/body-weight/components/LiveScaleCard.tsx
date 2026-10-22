"use client";

import {
  getLiveStatus,
  LIVE_STATUS,
  type LiveStatus,
} from "@/features/body-weight/helpers/live-scale";
import { findReferenceMeasurement } from "@/features/body-weight/helpers/weigh-in-stats";
import type {
  LiveScaleState,
  ScaleMeasurementDto,
} from "@/features/body-weight/types";

const STATUS_TEXT: Record<LiveStatus, string> = {
  idle: "ขึ้นตาชั่งได้เลย",
  measuring: "กำลังชั่ง…",
  waitingImpedance: "น้ำหนักนิ่งแล้ว · กำลังวัดสัดส่วนร่างกาย ยืนต่ออีกนิด",
  complete: "ชั่งเสร็จแล้ว",
  steppedOff: "ลงจากตาชั่งแล้ว",
};

const bangkokDateTimeFormatter = new Intl.DateTimeFormat("th-TH", {
  day: "2-digit",
  month: "short",
  year: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Bangkok",
});

/** ข้อความใต้ผลล่าสุด เช่น "SAM · −0.03 กก. จาก 21 ต.ค. 69 07:15" */
const describeLatest = (
  latest: ScaleMeasurementDto,
  measurements: ScaleMeasurementDto[],
) => {
  const name = latest.profileName ?? "ไม่ระบุตัวตน";
  const reference = findReferenceMeasurement(measurements, latest, 0);
  if (!reference || !latest.profileId) {
    return `${name} · ${bangkokDateTimeFormatter.format(new Date(latest.measuredAt))}`;
  }
  const delta = latest.weightKg - reference.weightKg;
  return `${name} · ${delta >= 0 ? "+" : "−"}${Math.abs(delta).toFixed(2)} กก. จาก ${bangkokDateTimeFormatter.format(new Date(reference.measuredAt))}`;
};

/**
 * การ์ด "ตาชั่ง" (การ์ด SCALE ของ miscale-dashboard): น้ำหนักสดระหว่างยืนชั่ง
 * และค้างผลการชั่งล่าสุดไว้เมื่อไม่มีคนยืน
 */
export function LiveScaleCard({
  reading,
  measurements,
}: {
  reading: LiveScaleState["reading"];
  /** ทั้งหมด เรียงใหม่ → เก่า */
  measurements: ScaleMeasurementDto[];
}) {
  const status = getLiveStatus(reading);
  const isLive = status !== LIVE_STATUS.idle && reading !== null;
  const isMeasuring = status === LIVE_STATUS.measuring;
  const latest = measurements[0];

  const weightKg = isLive ? reading.weightKg : (latest?.weightKg ?? null);
  const caption = isLive
    ? STATUS_TEXT[status]
    : latest
      ? latest.impedance
        ? "ชั่งเสร็จแล้ว"
        : "ชั่งล่าสุด (ไม่มีค่า impedance)"
      : STATUS_TEXT.idle;

  return (
    <div className="bg-card border-border flex h-full min-h-[200px] flex-col items-center justify-center rounded-lg border p-6 text-center">
      <p className="text-muted-foreground font-mono text-[11px] font-medium tracking-[0.2em]">
        ตาชั่ง
      </p>
      <p
        aria-live="polite"
        className={`mt-4 font-mono text-5xl font-semibold tracking-tight tabular-nums transition-colors ${
          weightKg === null
            ? "text-muted-foreground"
            : isMeasuring
              ? "text-muted-foreground"
              : "text-(--brand)"
        }`}
      >
        {weightKg === null ? "--.--" : weightKg.toFixed(2)}
        <span className="text-muted-foreground ml-1 text-xl font-normal">
          กก.
        </span>
      </p>
      <p className="text-muted-foreground mt-3 flex items-center gap-2 text-sm">
        {isMeasuring && (
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-(--brand) opacity-60 motion-reduce:animate-none" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-(--brand)" />
          </span>
        )}
        {caption}
      </p>
      {!isLive && latest ? (
        <p className="text-muted-foreground mt-1 text-xs">
          {describeLatest(latest, measurements)}
        </p>
      ) : isLive && reading.impedance ? (
        <p className="text-muted-foreground mt-1 font-mono text-xs">
          impedance {reading.impedance} Ω
        </p>
      ) : null}
    </div>
  );
}
