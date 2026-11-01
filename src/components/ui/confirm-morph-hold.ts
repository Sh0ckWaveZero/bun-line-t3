import { useCallback, useEffect, useRef, useState } from "react";

export type ConfirmMorphState = "idle" | "confirming" | "pending" | "done" | "error";
export type HoldSource = "pointer" | "keyboard";

export const HOLD_TO_CONFIRM_DURATION_MS = 1_200;
export const VIEWPORT_PADDING_PX = 8;
/** ระยะเว้นระหว่าง pill กับปุ่มต้นทาง */
export const PILL_GAP_PX = 6;
/** sticky header (h-14) — เพดานบนตอน pill ถูกตรึง เพื่อไม่ทับ header */
export const HEADER_SAFE_ZONE_PX = 64;

/** ปิด pill ซ้ำซ้อน: เปิดอันใหม่ = ปิดอันเก่าทุกตัว (pill ลอยทับเนื้อหา อยู่พร้อมกัน 2 ตัวไม่ได้) */
export const confirmCloseRegistry = new Set<() => void>();

interface UseConfirmHoldOptions {
  isActive: boolean;
  isSubmitting: () => boolean;
  /** เรียกเมื่อกดค้างครบเวลา — ปกติคือเริ่ม confirm */
  onHoldComplete: () => void;
}

/**
 * state machine ของการกดค้างยืนยัน (pointer + keyboard) — แยกออกจาก ConfirmMorph
 * เพื่อให้ตัว component จบเรื่อง layout/JSX และ logic กดค้างอยู่ในที่เดียว
 */
export const useConfirmHold = ({
  isActive,
  isSubmitting,
  onHoldComplete,
}: UseConfirmHoldOptions) => {
  const [isHolding, setIsHolding] = useState(false);
  const [isHoldComplete, setIsHoldComplete] = useState(false);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdSourceRef = useRef<HoldSource | null>(null);
  const holdStartedAtRef = useRef<number | null>(null);
  const holdCompleteRef = useRef(false);

  // timer ค้างตอน unmount — hook เป็นเจ้าของเอง
  useEffect(
    () => () => {
      if (holdTimerRef.current !== null) clearTimeout(holdTimerRef.current);
    },
    [],
  );

  const resetHold = useCallback((source?: HoldSource) => {
    if (source && holdSourceRef.current !== source) return;
    if (holdTimerRef.current !== null) clearTimeout(holdTimerRef.current);
    holdTimerRef.current = null;
    holdSourceRef.current = null;
    holdStartedAtRef.current = null;
    holdCompleteRef.current = false;
    setIsHolding(false);
    setIsHoldComplete(false);
  }, []);

  const startHold = useCallback(
    (source: HoldSource) => {
      if (!isActive || isSubmitting() || holdSourceRef.current !== null) return;

      holdSourceRef.current = source;
      holdStartedAtRef.current = Date.now();
      holdCompleteRef.current = false;
      setIsHolding(true);
      setIsHoldComplete(false);
      holdTimerRef.current = setTimeout(() => {
        holdTimerRef.current = null;
        holdCompleteRef.current = true;
        setIsHoldComplete(true);
      }, HOLD_TO_CONFIRM_DURATION_MS);
    },
    [isActive, isSubmitting],
  );

  const finishHold = useCallback(
    (source: HoldSource) => {
      if (holdSourceRef.current !== source) return;

      const startedAt = holdStartedAtRef.current;
      const didComplete =
        holdCompleteRef.current ||
        (startedAt !== null &&
          Date.now() - startedAt >= HOLD_TO_CONFIRM_DURATION_MS);
      resetHold(source);
      if (didComplete) onHoldComplete();
    },
    [onHoldComplete, resetHold],
  );

  return {
    isHolding,
    isHoldComplete,
    resetHold,
    startHold,
    finishHold,
    holdSourceRef,
  };
};
