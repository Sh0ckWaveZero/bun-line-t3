import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { CSSProperties } from "react";
import { createPortal } from "react-dom";
import { Check, LoaderCircle, RotateCw, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type ConfirmMorphState = "idle" | "confirming" | "pending" | "done" | "error";
type HoldSource = "pointer" | "keyboard";

const HOLD_TO_CONFIRM_DURATION_MS = 1_200;
const VIEWPORT_PADDING_PX = 8;
/** ระยะเว้นระหว่าง pill กับปุ่มต้นทาง */
const PILL_GAP_PX = 6;
/** sticky header (h-14) — เพดานบนตอน pill ถูกตรึง เพื่อไม่ทับ header */
const HEADER_SAFE_ZONE_PX = 64;

/** ปิด pill ซ้ำซ้อน: เปิดอันใหม่ = ปิดอันเก่าทุกตัว (pill ลอยทับเนื้อหา อยู่พร้อมกัน 2 ตัวไม่ได้) */
const confirmCloseRegistry = new Set<() => void>();
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

interface ConfirmMorphProps {
  label: string;
  ariaLabel: string;
  prompt: string;
  description: string;
  confirmLabel: string;
  holdLabel: string;
  holdReleaseLabel: string;
  holdInstruction: string;
  holdCompleteLabel: string;
  cancelLabel: string;
  pendingLabel: string;
  doneLabel: string;
  doneDescription: string;
  errorLabel: string;
  retryLabel: string;
  onConfirm: () => Promise<void>;
  showIdleLabel?: boolean;
  /** เรนเดอร์ pill แบบ inline ในแถว (การ์ดมือถือ) — ไม่ใช่จะลอย fixed ตามปุ่ม (ตาราง desktop) */
  inline?: boolean;
}

export const ConfirmMorph = ({
  label,
  ariaLabel,
  prompt,
  description,
  confirmLabel,
  holdLabel,
  holdReleaseLabel,
  holdInstruction,
  holdCompleteLabel,
  cancelLabel,
  pendingLabel,
  doneLabel,
  doneDescription,
  errorLabel,
  retryLabel,
  onConfirm,
  showIdleLabel = false,
  inline = false,
}: ConfirmMorphProps) => {
  const [state, setState] = useState<ConfirmMorphState>("idle");
  const [popoverPosition, setPopoverPosition] = useState<{
    left: number;
    top: number;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isHolding, setIsHolding] = useState(false);
  const [isHoldComplete, setIsHoldComplete] = useState(false);
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const retryRef = useRef<HTMLButtonElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const isSubmittingRef = useRef(false);
  const shouldReturnFocusRef = useRef(false);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdSourceRef = useRef<HoldSource | null>(null);
  const holdStartedAtRef = useRef<number | null>(null);
  const holdCompleteRef = useRef(false);
  const holdStyle = {
    "--confirm-hold-duration": `${HOLD_TO_CONFIRM_DURATION_MS}ms`,
  } as CSSProperties;

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

  /** ปิดโดยไม่ดึงโฟกัสกลับ — ใช้ตอนปิดแทนที่ (เปิดอันใหม่ / แถวเลื่อนหลุดจอ) เพื่อไม่ให้หน้ากระโดด */
  const closeSilently = useCallback(() => {
    resetHold();
    setErrorMessage("");
    setState("idle");
  }, [resetHold]);

  useEffect(
    () => () => {
      if (holdTimerRef.current !== null) clearTimeout(holdTimerRef.current);
    },
    [],
  );

  useIsomorphicLayoutEffect(() => {
    // โหมด inline วางใน flow ของแถวเอง ไม่ต้องคำนวณตำแหน่ง fixed
    if (inline) return;
    if (state === "idle") {
      setPopoverPosition(null);
      return;
    }

    const updatePosition = () => {
      const anchor = triggerRef.current?.getBoundingClientRect();
      const popover = popoverRef.current?.getBoundingClientRect();
      if (!anchor || !popover || popover.width === 0 || popover.height === 0) {
        return;
      }

      // ชิดขอบขวาตามปุ่มต้นทาง (action อยู่แถวขวาเสมอ) กันล้นขอบจอ
      const left = Math.max(
        VIEWPORT_PADDING_PX,
        Math.min(
          anchor.right - popover.width,
          window.innerWidth - popover.width - VIEWPORT_PADDING_PX,
        ),
      );
      // ปกติปักใต้ปุ่มต้นทาง (ไม่ทับแถว) — พื้นที่ไม่พอค่อยพับขึ้นเหนือปุ่ม
      // แต่ถ้าปุ่มเลื่อนพ้นจอไปแล้ว ตรึง pill ไว้ใต้ sticky header
      // เพื่อให้ผู้ใช้กด Cancel / กดค้างยืนยันต่อได้ pill ไม่หายไปพร้อมแถว
      const topBelow = anchor.bottom + PILL_GAP_PX;
      const fitsBelow =
        topBelow >= HEADER_SAFE_ZONE_PX &&
        topBelow + popover.height <=
          window.innerHeight - VIEWPORT_PADDING_PX;
      const topAbove = anchor.top - PILL_GAP_PX - popover.height;
      let top: number;
      if (fitsBelow) {
        top = topBelow;
      } else if (topAbove >= HEADER_SAFE_ZONE_PX) {
        top = Math.min(
          topAbove,
          window.innerHeight - popover.height - VIEWPORT_PADDING_PX,
        );
      } else {
        top = Math.min(
          Math.max(HEADER_SAFE_ZONE_PX, topBelow),
          window.innerHeight - popover.height - VIEWPORT_PADDING_PX,
        );
      }

      setPopoverPosition((current) =>
        current?.left === left && current.top === top ? current : { left, top },
      );
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(updatePosition);
    if (triggerRef.current) resizeObserver?.observe(triggerRef.current);
    if (popoverRef.current) resizeObserver?.observe(popoverRef.current);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      resizeObserver?.disconnect();
    };
  }, [closeSilently, inline, state]);

  // ลงทะเบียน closer ตอน pill เปิด — instance อื่นที่เพิ่งเปิดจะได้เรียกปิดตัวนี้ก่อน
  const isOverlayOpen = state !== "idle";
  useEffect(() => {
    if (!isOverlayOpen) return;
    confirmCloseRegistry.add(closeSilently);
    return () => {
      confirmCloseRegistry.delete(closeSilently);
    };
  }, [closeSilently, isOverlayOpen]);

  useEffect(() => {
    if (state === "idle" && shouldReturnFocusRef.current) {
      triggerRef.current?.focus();
      shouldReturnFocusRef.current = false;
      return;
    }

    if (state === "confirming") cancelRef.current?.focus();
    if (state === "pending" || state === "done") statusRef.current?.focus();
    if (state === "error") retryRef.current?.focus();
  }, [state]);

  const returnToIdle = () => {
    resetHold();
    shouldReturnFocusRef.current = true;
    setErrorMessage("");
    setState("idle");
  };

  const handleConfirm = async () => {
    if (isSubmittingRef.current) return;

    isSubmittingRef.current = true;
    setErrorMessage("");
    setState("pending");

    try {
      await onConfirm();
      // ถ้าโดนปิดแทนที่ระหว่างรอ (เปิด pill อื่น / เลื่อนหลุดจอ) อย่าปลุก pill กลับมา
      setState((current) => (current === "pending" ? "done" : current));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : errorLabel);
      setState((current) => (current === "pending" ? "error" : current));
    } finally {
      isSubmittingRef.current = false;
    }
  };

  const startHold = (source: HoldSource) => {
    if (
      state !== "confirming" ||
      isSubmittingRef.current ||
      holdSourceRef.current !== null
    ) {
      return;
    }

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
  };

  const finishHold = (source: HoldSource) => {
    if (holdSourceRef.current !== source) return;

    const startedAt = holdStartedAtRef.current;
    const didComplete =
      holdCompleteRef.current ||
      (startedAt !== null &&
        Date.now() - startedAt >= HOLD_TO_CONFIRM_DURATION_MS);
    resetHold(source);
    if (didComplete) void handleConfirm();
  };

  const renderTrigger = () => (
    <Button
      ref={triggerRef}
      type="button"
      variant="ghost"
      size="sm"
      className={`min-h-9 min-w-9 cursor-pointer px-2 text-red-700 hover:text-red-800 dark:text-red-300 ${state === "idle" ? "" : "opacity-50"}`}
      aria-label={ariaLabel}
      aria-hidden={state !== "idle"}
      tabIndex={state === "idle" ? undefined : -1}
      onClick={() => {
        confirmCloseRegistry.forEach((close) => close());
        setState("confirming");
      }}
    >
      <Trash2 aria-hidden="true" className="h-4 w-4 shrink-0" />
      <span className={showIdleLabel ? "ml-1.5" : "sr-only"}>{label}</span>
    </Button>
  );

  const statusContent = (
    <>
      {state === "confirming" && (
        <div
          className="border-border bg-card inline-flex w-max max-w-full items-center gap-1 rounded-full border p-1 text-left shadow-lg"
          role="group"
          aria-labelledby={`${id}-prompt`}
          aria-describedby={`${id}-description`}
        >
          <div className="min-w-0 px-2 text-left">
            <span
              id={`${id}-prompt`}
              className="text-foreground text-xs sm:text-sm"
            >
              {prompt}
            </span>
            <span id={`${id}-description`} className="sr-only">
              {description}
            </span>
          </div>
          <Button
            ref={cancelRef}
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground min-h-8 shrink-0 cursor-pointer rounded-full px-2.5 text-xs sm:min-h-9 sm:px-3 sm:text-sm"
            onClick={returnToIdle}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            size="sm"
            className="relative isolate min-h-8 shrink-0 cursor-pointer touch-none overflow-hidden rounded-full bg-red-600 px-3 text-xs text-white select-none hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 sm:min-h-9 sm:min-w-40 sm:px-4 sm:text-sm dark:bg-red-950 dark:text-red-300 dark:hover:bg-red-900 dark:focus-visible:ring-red-400"
            aria-describedby={`${id}-hold-instruction`}
            data-holding={isHolding}
            data-hold-complete={isHoldComplete}
            style={holdStyle}
            onPointerDown={(event) => {
              if (!event.isPrimary || event.button !== 0) return;
              startHold("pointer");
            }}
            onPointerMove={(event) => {
              if (holdSourceRef.current !== "pointer") return;
              const bounds = event.currentTarget.getBoundingClientRect();
              const isInside =
                event.clientX >= bounds.left &&
                event.clientX <= bounds.right &&
                event.clientY >= bounds.top &&
                event.clientY <= bounds.bottom;
              if (!isInside) resetHold("pointer");
            }}
            onPointerUp={() => finishHold("pointer")}
            onPointerCancel={() => resetHold("pointer")}
            onPointerLeave={() => resetHold("pointer")}
            onContextMenu={(event) => {
              if (holdSourceRef.current === "pointer") {
                event.preventDefault();
              }
            }}
            onKeyDown={(event) => {
              if (event.key !== " " && event.key !== "Enter") return;
              event.preventDefault();
              if (!event.repeat) startHold("keyboard");
            }}
            onKeyUp={(event) => {
              if (event.key !== " " && event.key !== "Enter") return;
              event.preventDefault();
              finishHold("keyboard");
            }}
            onBlur={() => resetHold()}
          >
            <span
              aria-hidden="true"
              className="confirm-morph-hold-fill"
            />
            <span className="relative z-10 inline-flex items-center gap-2">
              <Trash2 aria-hidden="true" className="h-4 w-4" />
              <span>{confirmLabel}</span>
              <span className="border-l border-white/30 pl-2 text-xs font-medium">
                {isHoldComplete ? holdReleaseLabel : holdLabel}
              </span>
            </span>
          </Button>
          <span id={`${id}-hold-instruction`} className="sr-only">
            {holdInstruction}
          </span>
          <span
            className="sr-only"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {isHoldComplete
              ? holdCompleteLabel
              : isHolding
                ? holdInstruction
                : ""}
          </span>
        </div>
      )}

      {state === "pending" && (
        <div
          ref={statusRef}
          className="border-border bg-card text-muted-foreground inline-flex min-h-8 w-max items-center gap-2 rounded-full border px-3 text-xs shadow-lg sm:min-h-9"
          role="status"
          aria-live="polite"
          aria-busy="true"
          tabIndex={-1}
        >
          <LoaderCircle
            aria-hidden="true"
            className="h-4 w-4 animate-spin motion-reduce:animate-none"
          />
          {pendingLabel}
        </div>
      )}

      {state === "done" && (
        <div
          ref={statusRef}
          className="border-border bg-card inline-flex min-h-8 w-max items-center gap-2 rounded-full border px-3 text-xs text-green-700 shadow-lg sm:min-h-9 dark:text-green-300"
          role="status"
          aria-live="polite"
          tabIndex={-1}
        >
          <Check aria-hidden="true" className="h-4 w-4 shrink-0" />
          <span>{doneLabel}</span>
          <span className="sr-only">{doneDescription}</span>
        </div>
      )}

      {state === "error" && (
        <div
          className="inline-flex w-max max-w-full items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-2 text-left shadow-lg dark:border-red-900/70 dark:bg-red-950/40"
          role="alert"
          aria-live="assertive"
        >
          <span className="max-w-36 px-1 text-xs whitespace-normal text-red-700 dark:text-red-300">
            {errorMessage || errorLabel}
          </span>
          <Button
            ref={retryRef}
            type="button"
            variant="ghost"
            size="sm"
            className="min-h-8 shrink-0 cursor-pointer px-2 text-xs"
            onClick={() => void handleConfirm()}
          >
            <RotateCw aria-hidden="true" className="mr-1 h-3.5 w-3.5" />
            {retryLabel}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground min-h-8 shrink-0 cursor-pointer px-1.5 text-xs"
            aria-label={cancelLabel}
            onClick={returnToIdle}
          >
            <X aria-hidden="true" className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </>
  );

  return (
    <span
      className={`inline-flex align-middle ${inline ? "relative" : ""}`}
      onKeyDown={(event) => {
        if (
          event.key === "Escape" &&
          (state === "confirming" || state === "error")
        ) {
          event.preventDefault();
          returnToIdle();
        }
      }}
    >
      {inline ? (
        // โหมด inline: pill ลอยซ้อน "ด้านหน้า" UI อื่นในแถวเดียวกัน (absolute ทับแถว action)
        // ปุ่มเดิมคงตำแหน่งใน layout ไว้ใต้ pill — แถวไม่ถูกดัน ไม่มีอะไรหลุดออกนอกแถว
        <>
          {renderTrigger()}
          {state !== "idle" && (
            <div
              ref={popoverRef}
              className="pointer-events-auto absolute top-1/2 right-0 z-20 -translate-y-1/2"
            >
              {statusContent}
            </div>
          )}
        </>
      ) : (
        <>
          {renderTrigger()}
          {state !== "idle" &&
            typeof document !== "undefined" &&
            createPortal(
              <div
                ref={popoverRef}
                className="pointer-events-auto fixed z-50"
                style={{
                  left: popoverPosition?.left ?? 0,
                  top: popoverPosition?.top ?? 0,
                  visibility: popoverPosition ? "visible" : "hidden",
                }}
              >
                {statusContent}
              </div>,
              document.body,
            )}
        </>
      )}
    </span>
  );
};
