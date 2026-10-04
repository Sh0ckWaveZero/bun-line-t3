"use client";
import * as React from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToastData {
  title: string;
  description?: string;
  type?: "success" | "error" | "info" | "warning";
  duration?: number;
}

interface ToastContextProps {
  showToast: (data: ToastData) => void;
}

const TOAST_META = {
  success: {
    icon: CheckCircle2,
    iconClass: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    surfaceClass:
      "border-emerald-200/80 bg-emerald-50/95 text-emerald-950 shadow-emerald-950/10 dark:border-emerald-400/25 dark:bg-emerald-950/90 dark:text-emerald-50",
  },
  error: {
    icon: XCircle,
    iconClass: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
    surfaceClass:
      "border-rose-200/80 bg-rose-50/95 text-rose-950 shadow-rose-950/10 dark:border-rose-400/25 dark:bg-rose-950/90 dark:text-rose-50",
  },
  info: {
    icon: Info,
    iconClass: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
    surfaceClass:
      "border-sky-200/80 bg-sky-50/95 text-sky-950 shadow-sky-950/10 dark:border-sky-400/25 dark:bg-sky-950/90 dark:text-sky-50",
  },
  warning: {
    icon: AlertTriangle,
    iconClass: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    surfaceClass:
      "border-amber-200/80 bg-amber-50/95 text-amber-950 shadow-amber-950/10 dark:border-amber-400/25 dark:bg-amber-950/90 dark:text-amber-50",
  },
} satisfies Record<
  NonNullable<ToastData["type"]>,
  {
    icon: typeof CheckCircle2;
    iconClass: string;
    surfaceClass: string;
  }
>;

const ToastContext = React.createContext<ToastContextProps | undefined>(
  undefined,
);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [open, setOpen] = React.useState(false);
  const [toast, setToast] = React.useState<ToastData | null>(null);
  // เปลี่ยน key ทุกครั้งเพื่อ force remount Root → Radix เริ่ม duration timer ใหม่เสมอ
  // รูปแบบเดิม (setOpen(false) → reopen หลัง 10ms) ไปแกะ controlled open ทำให้
  // duration timer ไม่ทำงาน → toast ค้าง ไม่ auto-dismiss
  const [toastKey, setToastKey] = React.useState(0);

  const showToast = React.useCallback((data: ToastData) => {
    setToast(data);
    setToastKey((k) => k + 1);
    setOpen(true);
  }, []);
  const contextValue = React.useMemo(() => ({ showToast }), [showToast]);
  const toastType = toast?.type ?? "info";
  const toastMeta = TOAST_META[toastType];
  const ToastIcon = toastMeta.icon;

  return (
    <ToastContext.Provider value={contextValue}>
      <ToastPrimitive.Provider swipeDirection="right">
        {children}
        <ToastPrimitive.Root
          key={toastKey}
          open={open}
          onOpenChange={setOpen}
          duration={toast?.duration ?? 3500}
          className={cn(
            "pointer-events-auto relative w-full overflow-hidden rounded-2xl border px-4 py-3.5 pr-11 shadow-xl backdrop-blur-xl",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-2 data-[state=open]:zoom-in-95",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-right-2 data-[state=closed]:zoom-out-95",
            "duration-300 ease-out motion-reduce:animate-none motion-reduce:transition-none",
            toastMeta.surfaceClass,
          )}
        >
          <div className="flex items-start gap-3">
            <span
              className={cn(
                "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl",
                toastMeta.iconClass,
              )}
              aria-hidden="true"
            >
              <ToastIcon className="size-4" strokeWidth={2.25} />
            </span>
            <div className="min-w-0 pt-0.5">
              <ToastPrimitive.Title className="text-sm leading-5 font-semibold tracking-tight">
                {toast?.title}
              </ToastPrimitive.Title>
              {toast?.description && (
                <ToastPrimitive.Description className="mt-1 text-xs leading-5 opacity-75">
                  {toast.description}
                </ToastPrimitive.Description>
              )}
            </div>
          </div>
          <ToastPrimitive.Close
            type="button"
            aria-label="ปิดการแจ้งเตือน"
            className="absolute top-3 right-3 rounded-lg p-1 text-current/55 transition-colors hover:bg-black/5 hover:text-current focus-visible:ring-2 focus-visible:ring-current focus-visible:outline-none dark:hover:bg-white/10"
          >
            <X className="size-4" aria-hidden="true" />
          </ToastPrimitive.Close>
        </ToastPrimitive.Root>
        <ToastPrimitive.Viewport className="pointer-events-none fixed top-0 right-0 z-[9999] flex w-full max-w-sm flex-col gap-3 p-4 outline-none sm:w-[min(100%,24rem)]" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
};

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast ต้องใช้ภายใน <ToastProvider>");
  return ctx;
}
