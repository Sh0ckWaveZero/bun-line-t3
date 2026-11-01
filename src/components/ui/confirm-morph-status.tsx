import type { CSSProperties, RefObject } from "react";
import { Check, LoaderCircle, RotateCw, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { HoldSource } from "./confirm-morph-hold";

interface ConfirmingPillProps {
  id: string;
  prompt: string;
  description: string;
  cancelLabel: string;
  confirmLabel: string;
  holdLabel: string;
  holdReleaseLabel: string;
  holdInstruction: string;
  holdCompleteLabel: string;
  isHolding: boolean;
  isHoldComplete: boolean;
  holdStyle: CSSProperties;
  cancelRef: RefObject<HTMLButtonElement | null>;
  onReturnToIdle: () => void;
  onStartHold: (source: HoldSource) => void;
  onFinishHold: (source: HoldSource) => void;
  onResetHold: (source?: HoldSource) => void;
  holdSourceRef: RefObject<HoldSource | null>;
}

/** pill สถานะยืนยัน — ปุ่มกดค้างพร้อม fill animation */
export const ConfirmingPill = ({
  id,
  prompt,
  description,
  cancelLabel,
  confirmLabel,
  holdLabel,
  holdReleaseLabel,
  holdInstruction,
  holdCompleteLabel,
  isHolding,
  isHoldComplete,
  holdStyle,
  cancelRef,
  onReturnToIdle,
  onStartHold,
  onFinishHold,
  onResetHold,
  holdSourceRef,
}: ConfirmingPillProps) => (
  <div
    className="border-border bg-card inline-flex w-max max-w-full items-center gap-1 rounded-full border p-1 text-left shadow-lg"
    role="group"
    aria-labelledby={`${id}-prompt`}
    aria-describedby={`${id}-description`}
  >
    <div className="min-w-0 px-2 text-left">
      <span id={`${id}-prompt`} className="text-foreground text-xs sm:text-sm">
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
      onClick={onReturnToIdle}
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
        onStartHold("pointer");
      }}
      onPointerMove={(event) => {
        if (holdSourceRef.current !== "pointer") return;
        const bounds = event.currentTarget.getBoundingClientRect();
        const isInside =
          event.clientX >= bounds.left &&
          event.clientX <= bounds.right &&
          event.clientY >= bounds.top &&
          event.clientY <= bounds.bottom;
        if (!isInside) onResetHold("pointer");
      }}
      onPointerUp={() => onFinishHold("pointer")}
      onPointerCancel={() => onResetHold("pointer")}
      onPointerLeave={() => onResetHold("pointer")}
      onContextMenu={(event) => {
        if (holdSourceRef.current === "pointer") {
          event.preventDefault();
        }
      }}
      onKeyDown={(event) => {
        if (event.key !== " " && event.key !== "Enter") return;
        event.preventDefault();
        if (!event.repeat) onStartHold("keyboard");
      }}
      onKeyUp={(event) => {
        if (event.key !== " " && event.key !== "Enter") return;
        event.preventDefault();
        onFinishHold("keyboard");
      }}
      onBlur={() => onResetHold()}
    >
      <span aria-hidden="true" className="confirm-morph-hold-fill" />
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
      {isHoldComplete ? holdCompleteLabel : isHolding ? holdInstruction : ""}
    </span>
  </div>
);

interface StatusPillProps {
  statusRef: RefObject<HTMLDivElement | null>;
  label: string;
}

/** pill สถานะกำลังบันทึก */
export const PendingPill = ({ statusRef, label }: StatusPillProps) => (
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
    {label}
  </div>
);

/** pill สถานะสำเร็จ */
export const DonePill = ({
  statusRef,
  label,
  description,
}: StatusPillProps & { description: string }) => (
  <div
    ref={statusRef}
    className="border-border bg-card inline-flex min-h-8 w-max items-center gap-2 rounded-full border px-3 text-xs text-green-700 shadow-lg sm:min-h-9 dark:text-green-300"
    role="status"
    aria-live="polite"
    tabIndex={-1}
  >
    <Check aria-hidden="true" className="h-4 w-4 shrink-0" />
    <span>{label}</span>
    <span className="sr-only">{description}</span>
  </div>
);

interface ErrorPillProps {
  message: string;
  errorLabel: string;
  retryLabel: string;
  cancelLabel: string;
  retryRef: RefObject<HTMLButtonElement | null>;
  onRetry: () => void;
  onReturnToIdle: () => void;
}

/** กล่อง error พร้อมปุ่ม retry */
export const ErrorPill = ({
  message,
  errorLabel,
  retryLabel,
  cancelLabel,
  retryRef,
  onRetry,
  onReturnToIdle,
}: ErrorPillProps) => (
  <div
    className="inline-flex w-max max-w-full items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-2 text-left shadow-lg dark:border-red-900/70 dark:bg-red-950/40"
    role="alert"
    aria-live="assertive"
  >
    <span className="max-w-36 px-1 text-xs whitespace-normal text-red-700 dark:text-red-300">
      {message || errorLabel}
    </span>
    <Button
      ref={retryRef}
      type="button"
      variant="ghost"
      size="sm"
      className="min-h-8 shrink-0 cursor-pointer px-2 text-xs"
      onClick={onRetry}
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
      onClick={onReturnToIdle}
    >
      <X aria-hidden="true" className="h-3.5 w-3.5" />
    </Button>
  </div>
);
