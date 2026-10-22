"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Check, Footprints } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { METRIC_DEFINITIONS } from "@/features/body-weight/constants/metrics";
import {
  getLiveStatus,
  LIVE_STATUS,
} from "@/features/body-weight/helpers/live-scale";
import {
  compareMetric,
  findReferenceMeasurement,
  type MetricTrendResult,
} from "@/features/body-weight/helpers/weigh-in-stats";
import type {
  LiveScaleState,
  ScaleMeasurementDto,
} from "@/features/body-weight/types";

/** ชั่งเสร็จแล้วปิดเองหลังเวลานี้ — แตะหน้าจอเพื่อค้างไว้ */
const COMPLETE_CLOSE_MS = 20_000;
/** นิ่งแล้วแต่ impedance ไม่มา (ใส่ถุงเท้า/ลงเร็ว) — ปิดเองช้ากว่า */
const STABLE_CLOSE_MS = 40_000;
/** ลงจากตาชั่งแล้วแต่ไม่มี impedance — impedance ไม่มาแล้ว ปิดเร็ว */
const STEPPED_OFF_CLOSE_MS = 6_000;

const PHASE = { weight: 0, stable: 1, composition: 2 } as const;
type Phase = (typeof PHASE)[keyof typeof PHASE];

const STEPS = ["น้ำหนัก", "นิ่งแล้ว", "สัดส่วนร่างกาย"] as const;

const PHASE_TEXT: Record<Phase, string> = {
  [PHASE.weight]: "กำลังอ่านค่าตาชั่ง…",
  [PHASE.stable]:
    "น้ำหนักนิ่งแล้ว · กำลังวัดสัดส่วนร่างกาย ยืนเท้าเปล่าต่ออีกนิด…",
  [PHASE.composition]: "ชั่งเสร็จแล้ว",
};

const bangkokDateTimeFormatter = new Intl.DateTimeFormat("th-TH", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Bangkok",
});

const formatNumber = (value: number, decimals: number) =>
  value.toLocaleString("th-TH", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

/**
 * พื้นม่วง --brand (สี "T3" ในโลโก้) ผสมดำให้ตัวอักษรขาวผ่าน contrast
 * — ผสม 75% ได้ 5.04:1 ตรงกลาง แล้วเข้มขึ้นไปทางขอบ
 */
const OVERLAY_BACKGROUND: CSSProperties = {
  backgroundImage:
    "radial-gradient(ellipse at center, color-mix(in oklch, var(--brand) 75%, black) 0%, color-mix(in oklch, var(--brand) 60%, black) 55%, color-mix(in oklch, var(--brand) 45%, black) 100%)",
};

/** พื้นเข้ม — ใช้สีโทนอ่อนให้ contrast ผ่าน (เขียว/แดง = ดี/แย่ คงความหมายเดิม) */
const TONE_CLASS: Record<MetricTrendResult["tone"], string> = {
  good: "text-emerald-200",
  bad: "text-rose-200",
  neutral: "text-white/70",
};

const metricTiles = METRIC_DEFINITIONS.filter((d) => d.key !== "weight");

/** avatar ตรงกลาง — วงแหวนหมุนระหว่างรอ, check mark เมื่อเสร็จ */
const PhaseAvatar = ({
  phase,
  name,
}: {
  phase: Phase;
  name: string | null;
}) => (
  <div className="relative flex h-28 w-28 items-center justify-center">
    {phase !== PHASE.composition && (
      <svg
        aria-hidden="true"
        viewBox="0 0 100 100"
        className="weigh-in-spinner absolute inset-0 h-full w-full"
      >
        <circle
          cx="50"
          cy="50"
          r="46"
          fill="none"
          stroke="rgb(255 255 255 / 0.18)"
          strokeWidth="4"
        />
        <circle
          cx="50"
          cy="50"
          r="46"
          fill="none"
          stroke="white"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={phase === PHASE.weight ? "72 217" : "180 109"}
          className="transition-[stroke-dasharray] duration-700"
        />
      </svg>
    )}
    <div
      className={`flex h-[88px] w-[88px] items-center justify-center rounded-full bg-white/15 text-4xl font-semibold transition-colors ${
        phase === PHASE.composition ? "border-4 border-white/90" : ""
      }`}
    >
      {phase === PHASE.weight || !name ? (
        <Footprints className="h-9 w-9 text-white/85" aria-hidden="true" />
      ) : (
        <span className="weigh-in-enter">{name.slice(0, 1).toUpperCase()}</span>
      )}
    </div>
    {phase === PHASE.composition && (
      <span className="weigh-in-pop absolute right-1 bottom-1 flex h-8 w-8 items-center justify-center rounded-full bg-white text-[color-mix(in_oklch,var(--brand)_60%,black)] shadow">
        <Check className="h-5 w-5" strokeWidth={3} aria-hidden="true" />
      </span>
    )}
  </div>
);

const Stepper = ({ phase }: { phase: Phase }) => (
  <ol aria-label="ขั้นตอนการชั่ง" className="mt-6 flex items-start">
    {STEPS.map((label, index) => {
      const isReached = index <= phase;
      return (
        <li key={label} className="flex items-start">
          {index > 0 && (
            <span
              aria-hidden="true"
              className={`mt-[7px] h-0.5 w-14 transition-colors duration-500 sm:w-24 ${
                isReached ? "bg-white" : "bg-white/30"
              }`}
            />
          )}
          <span className="flex w-16 flex-col items-center gap-1.5 sm:w-20">
            <span
              className={`h-4 w-4 rounded-full border-2 transition-colors duration-500 ${
                isReached ? "border-white bg-white" : "border-white/50"
              }`}
            />
            <span
              className={`text-xs whitespace-nowrap ${isReached ? "text-white" : "text-white/55"}`}
              aria-current={index === phase ? "step" : undefined}
            >
              {label}
            </span>
          </span>
        </li>
      );
    })}
  </ol>
);

/**
 * หน้าชั่งเต็มจอ (weigh-in.gif ของ miscale-dashboard): เปิดตั้งแต่เริ่มเหยียบ
 * แล้วไล่ น้ำหนักสด → นิ่งแล้ว (รู้เจ้าของ) → สัดส่วนร่างกายครบ แล้วปิดเอง
 */
export function WeighInOverlay({
  isOpen,
  measurement,
  pending,
  reading,
  measurements,
  onClose,
}: {
  isOpen: boolean;
  /** การชั่งที่บันทึกแล้ว (ครบ impedance) — null ก่อนชั่งเสร็จ */
  measurement: ScaleMeasurementDto | null;
  /** น้ำหนักนิ่งแล้ว รอ impedance — ยังไม่บันทึก */
  pending: LiveScaleState["pending"];
  reading: LiveScaleState["reading"];
  /** ทั้งหมด เรียงใหม่ → เก่า — ใช้หาครั้งก่อนของเจ้าของเดียวกัน */
  measurements: ScaleMeasurementDto[];
  onClose: () => void;
}) {
  const [isPinned, setIsPinned] = useState(false);

  // ขั้น "นิ่งแล้ว" มาจาก pending (ยังไม่บันทึก) — บันทึกเกิดเมื่อได้ impedance ครบเท่านั้น
  const phase: Phase = measurement
    ? measurement.impedance
      ? PHASE.composition
      : PHASE.stable
    : pending
      ? PHASE.stable
      : PHASE.weight;
  const liveStatus = getLiveStatus(reading);
  const hasSteppedOff =
    liveStatus === LIVE_STATUS.steppedOff || liveStatus === LIVE_STATUS.idle;
  // ลงก่อนวัดเสร็จ = การชั่งไม่ครบ ไม่ถูกบันทึก
  const isAbandoned = phase !== PHASE.composition && hasSteppedOff;
  const closeAfterMs =
    phase === PHASE.composition
      ? COMPLETE_CLOSE_MS
      : isAbandoned
        ? STEPPED_OFF_CLOSE_MS
        : phase === PHASE.stable
          ? STABLE_CLOSE_MS
          : null;
  const willAutoClose = isOpen && !isPinned && closeAfterMs !== null;

  // เก็บ onClose ใน ref — timer ต้องนับต่อเนื่อง ไม่รีเซ็ตเมื่อ parent re-render (poll ทุก 1 วิ)
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const handleClose = useCallback(() => {
    setIsPinned(false);
    onCloseRef.current();
  }, []);

  useEffect(() => {
    if (!willAutoClose || closeAfterMs === null) return;
    const timer = setTimeout(handleClose, closeAfterMs);
    return () => clearTimeout(timer);
  }, [willAutoClose, closeAfterMs, handleClose]);

  const weightKg =
    measurement?.weightKg ?? pending?.weightKg ?? reading?.weightKg ?? null;
  const profileName = measurement?.profileName ?? pending?.profileName ?? null;
  const hasOwnerInfo = measurement !== null || pending !== null;
  const reference = measurement
    ? findReferenceMeasurement(measurements, measurement, 0)
    : pending?.profileId
      ? (measurements.find((m) => m.profileId === pending.profileId) ?? null)
      : null;
  const deltaKg =
    weightKg !== null && reference ? weightKg - reference.weightKg : null;
  const hasMetrics = measurement?.metrics.bmi !== undefined;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        onPointerDown={() => setIsPinned(true)}
        style={OVERLAY_BACKGROUND}
        className="inset-0 h-auto max-h-none w-auto max-w-none translate-x-0 translate-y-0 gap-0 overflow-hidden border-0 p-0 text-white sm:rounded-none [&>button]:top-5 [&>button]:right-5 [&>button]:flex [&>button]:h-10 [&>button]:w-10 [&>button]:items-center [&>button]:justify-center [&>button]:rounded-full [&>button]:bg-white/15 [&>button]:text-white [&>button]:opacity-100"
      >
        <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
          <span className="weigh-in-ripple" />
          <span className="weigh-in-ripple" />
          <span className="weigh-in-ripple" />
        </div>

        <div className="relative flex h-full flex-col items-center justify-center overflow-y-auto px-4 py-10">
          <PhaseAvatar phase={phase} name={profileName} />

          <DialogTitle className="mt-3 min-h-7 text-xl font-semibold text-white">
            {phase === PHASE.weight ? "" : (profileName ?? "ไม่ระบุตัวตน")}
          </DialogTitle>

          <p
            aria-live="polite"
            className={`font-mono font-bold tracking-tight tabular-nums transition-all duration-500 ${
              phase === PHASE.composition
                ? "text-6xl sm:text-7xl"
                : "text-7xl sm:text-9xl"
            } ${phase === PHASE.weight ? "text-white/80" : "text-white"}`}
          >
            {weightKg === null ? "--.--" : weightKg.toFixed(2)}
            <span className="ml-1 text-2xl font-normal text-white/75 sm:text-4xl">
              กก.
            </span>
          </p>

          <DialogDescription className="mt-2 min-h-6 text-base text-white/85">
            {hasOwnerInfo
              ? deltaKg !== null && reference
                ? `${deltaKg >= 0 ? "+" : "−"}${Math.abs(deltaKg).toFixed(2)} กก. จาก ${bangkokDateTimeFormatter.format(new Date(reference.measuredAt))}`
                : "การชั่งครั้งแรก"
              : ""}
          </DialogDescription>

          <p
            key={isAbandoned ? "abandoned" : phase}
            className="weigh-in-enter mt-3 max-w-md text-center text-lg"
          >
            {isAbandoned
              ? "ลงจากตาชั่งก่อนวัดเสร็จ · ไม่ได้บันทึก (ยืนเท้าเปล่าจนวัดสัดส่วนร่างกายเสร็จ)"
              : PHASE_TEXT[phase]}
          </p>

          {phase === PHASE.composition ? (
            hasMetrics && measurement ? (
              <div className="mt-6 grid w-full max-w-4xl grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {metricTiles.map((definition, index) => {
                  const value = definition.read(measurement);
                  const trend = compareMetric(
                    value,
                    reference ? definition.read(reference) : null,
                    definition.decimals,
                    definition.trend,
                  );
                  return (
                    <div
                      key={definition.key}
                      className="weigh-in-enter rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 backdrop-blur-sm"
                      style={{ animationDelay: `${index * 45}ms` }}
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-mono text-lg font-semibold">
                          {value === null
                            ? "—"
                            : `${formatNumber(value, definition.decimals)}${definition.unit ? ` ${definition.unit}` : ""}`}
                        </span>
                        {trend && (
                          <span
                            className={`font-mono text-xs font-semibold ${TONE_CLASS[trend.tone]}`}
                          >
                            {trend.direction === "same"
                              ? "="
                              : `${trend.direction === "up" ? "▲" : "▼"} ${formatNumber(trend.amount, definition.decimals)}`}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-white/75">
                        <definition.icon
                          className="h-3.5 w-3.5 shrink-0"
                          aria-hidden="true"
                        />
                        {definition.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="mt-6 max-w-md text-center text-sm text-white/80">
                {measurement?.profileId
                  ? "เติมส่วนสูง/วันเกิดในโปรไฟล์เพื่อคำนวณสัดส่วนร่างกาย"
                  : "ยังไม่รู้ว่าเป็นของใคร — กำหนดเจ้าของได้ในประวัติการชั่ง"}
              </p>
            )
          ) : (
            <Stepper phase={phase} />
          )}

          {closeAfterMs !== null && (
            <p className="mt-8 text-xs text-white/70">
              {isPinned
                ? "ค้างหน้าจอไว้แล้ว · กด Esc หรือ ✕ เพื่อปิด"
                : "ปิดเองในอีกสักครู่ · แตะเพื่อค้างไว้"}
            </p>
          )}
        </div>

        {willAutoClose && closeAfterMs !== null && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-white/15">
            <div
              key={phase}
              className="weigh-in-countdown h-full bg-white/80"
              style={
                {
                  "--weigh-in-close-ms": `${closeAfterMs}ms`,
                } as CSSProperties
              }
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
