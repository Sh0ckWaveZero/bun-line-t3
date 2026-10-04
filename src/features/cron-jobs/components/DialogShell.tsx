import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DialogShellProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}

export function DialogShell({
  open,
  title,
  description,
  onClose,
  children,
  wide = false,
}: DialogShellProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    const dialog = dialogRef.current;
    if (!dialog) return;

    const previousActiveElement =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const focusableSelector =
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const getFocusableElements = () =>
      Array.from(
        dialog.querySelectorAll<HTMLElement>(focusableSelector),
      ).filter(
        (element) =>
          !element.hasAttribute("hidden") &&
          element.getAttribute("aria-hidden") !== "true",
      );

    const initialElement =
      getFocusableElements().find(
        (element) => !element.hasAttribute("data-dialog-close"),
      ) ?? dialog;
    initialElement.focus();

    const handleDialogKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab") return;

      const focusableElements = getFocusableElements();
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (!firstElement || !lastElement) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    dialog.addEventListener("keydown", handleDialogKeyDown);

    return () => {
      dialog.removeEventListener("keydown", handleDialogKeyDown);

      if (previousActiveElement && document.contains(previousActiveElement)) {
        requestAnimationFrame(() => {
          if (document.contains(previousActiveElement)) {
            previousActiveElement.focus();
          }
        });
      }
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <dialog
        open
        ref={dialogRef}
        tabIndex={-1}
        className={cn(
          "relative m-0 max-h-[90vh] w-full max-w-none overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 text-inherit shadow-2xl dark:border-white/[0.1] dark:bg-[#17191c]",
          wide ? "max-w-3xl" : "max-w-lg",
        )}
        aria-modal="true"
        aria-labelledby="cron-dialog-title"
        aria-describedby={description ? "cron-dialog-description" : undefined}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="cron-dialog-title"
              className="text-lg font-semibold text-slate-900 dark:text-white"
            >
              {title}
            </h2>
            {description && (
              <p
                id="cron-dialog-description"
                className="mt-1 text-xs leading-5 text-slate-500"
              >
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่าง"
            data-dialog-close
            className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none dark:hover:bg-white/[0.08] dark:hover:text-slate-200"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </dialog>
    </div>
  );
}
