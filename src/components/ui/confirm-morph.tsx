import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import type { CSSProperties } from "react";
import { createPortal } from "react-dom";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  confirmCloseRegistry,
  HOLD_TO_CONFIRM_DURATION_MS,
  useConfirmHold,
  type ConfirmMorphState,
} from "./confirm-morph-hold";
import { useConfirmPillPosition } from "./confirm-morph-position";
import {
  ConfirmingPill,
  DonePill,
  ErrorPill,
  PendingPill,
} from "./confirm-morph-status";

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
  const [errorMessage, setErrorMessage] = useState("");
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const retryRef = useRef<HTMLButtonElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const isSubmittingRef = useRef(false);
  const shouldReturnFocusRef = useRef(false);

  const handleConfirm = useCallback(async () => {
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
  }, [onConfirm, errorLabel]);

  const { isHolding, isHoldComplete, resetHold, startHold, finishHold, holdSourceRef } =
    useConfirmHold({
      isActive: state === "confirming",
      isSubmitting: () => isSubmittingRef.current,
      onHoldComplete: () => void handleConfirm(),
    });

  const closeSilently = useCallback(() => {
    resetHold();
    setErrorMessage("");
    setState("idle");
  }, [resetHold]);

  const popoverPosition = useConfirmPillPosition({
    inline,
    active: state !== "idle",
    triggerRef,
    popoverRef,
  });

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

  const holdStyle = {
    "--confirm-hold-duration": `${HOLD_TO_CONFIRM_DURATION_MS}ms`,
  } as CSSProperties;

  const statusContent = (
    <>
      {state === "confirming" && (
        <ConfirmingPill
          id={id}
          prompt={prompt}
          description={description}
          cancelLabel={cancelLabel}
          confirmLabel={confirmLabel}
          holdLabel={holdLabel}
          holdReleaseLabel={holdReleaseLabel}
          holdInstruction={holdInstruction}
          holdCompleteLabel={holdCompleteLabel}
          isHolding={isHolding}
          isHoldComplete={isHoldComplete}
          holdStyle={holdStyle}
          cancelRef={cancelRef}
          onReturnToIdle={returnToIdle}
          onStartHold={startHold}
          onFinishHold={finishHold}
          onResetHold={resetHold}
          holdSourceRef={holdSourceRef}
        />
      )}

      {state === "pending" && <PendingPill statusRef={statusRef} label={pendingLabel} />}

      {state === "done" && (
        <DonePill
          statusRef={statusRef}
          label={doneLabel}
          description={doneDescription}
        />
      )}

      {state === "error" && (
        <ErrorPill
          message={errorMessage}
          errorLabel={errorLabel}
          retryLabel={retryLabel}
          cancelLabel={cancelLabel}
          retryRef={retryRef}
          onRetry={() => void handleConfirm()}
          onReturnToIdle={returnToIdle}
        />
      )}
    </>
  );

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
