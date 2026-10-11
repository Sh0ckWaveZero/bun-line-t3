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

interface ToastItem extends ToastData {
  id: number;
  open: boolean;
}

interface ToastContextProps {
  showToast: (data: ToastData) => void;
}

/** stack ลึกสูงสุด 3 ชั้น (depth 0–2) — ตัวที่เกินถูกปัดออกแบบ is-leaving ตาม recipe */
const MAX_VISIBLE_TOASTS = 3;
/** ลบออกจาก state หลัง exit transition (--stack-close 250ms) จบ + buffer */
const REMOVE_DELAY_MS = 310;
/** = --stack-spread-gap ใน input.css */
const SPREAD_GAP_PX = 8;

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
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);
  const toastsRef = React.useRef<ToastItem[]>([]);
  const toastIdRef = React.useRef(0);
  const removalTimersRef = React.useRef(
    new Map<number, ReturnType<typeof setTimeout>>(),
  );
  const viewportRef = React.useRef<HTMLOListElement | null>(null);
  const isSpreadRef = React.useRef(false);

  // write path เดียวให้ toastsRef ตรงกับ state เสมอ — showToast ต้องอ่านสถานะล่าสุดเพื่อหา overflow
  const writeToasts = React.useCallback(
    (updater: (current: ToastItem[]) => ToastItem[]) => {
      const next = updater(toastsRef.current);
      toastsRef.current = next;
      setToasts(next);
    },
    [],
  );

  const scheduleRemoval = React.useCallback(
    (id: number) => {
      const timers = removalTimersRef.current;
      const existingTimer = timers.get(id);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }
      timers.set(
        id,
        setTimeout(() => {
          timers.delete(id);
          writeToasts((current) =>
            current.filter((toast) => toast.id !== id),
          );
        }, REMOVE_DELAY_MS),
      );
    },
    [writeToasts],
  );

  const closeToast = React.useCallback(
    (id: number) => {
      writeToasts((current) =>
        current.map((toast) =>
          toast.id === id ? { ...toast, open: false } : toast,
        ),
      );
      scheduleRemoval(id);
    },
    [writeToasts, scheduleRemoval],
  );

  const showToast = React.useCallback(
    (data: ToastData) => {
      const id = ++toastIdRef.current;
      // เติมหน้า list → toast ใหม่อยู่หน้าสุดของ stack (depth 0)
      writeToasts((current) => [{ ...data, id, open: true }, ...current]);
      // เกิน 3 ชั้น → ตัวเก่าสุดออกแบบ is-leaving (open=false → data-state=closed)
      const overflow = toastsRef.current
        .filter((toast) => toast.open)
        .slice(MAX_VISIBLE_TOASTS);
      for (const toast of overflow) {
        closeToast(toast.id);
      }
    },
    [writeToasts, closeToast],
  );

  // banner-stacking: hover กาง stack ออกเป็นลิสต์ — เป็น geometry check ไม่ใช่ :hover
  // เพราะช่องว่างระหว่างการ์ดที่กางแล้วไม่ใช่ hover target ของ element ใด
  React.useEffect(() => {
    const applySpread = (spread: boolean) => {
      isSpreadRef.current = spread;
      viewportRef.current?.classList.toggle("is-spread", spread);
    };

    const handlePointerMove = (event: PointerEvent) => {
      const viewport = viewportRef.current;
      if (!viewport) return;
      const frontToast = viewport.querySelector<HTMLElement>(
        ".toast-depth-0",
      );
      const backToast = viewport.querySelector<HTMLElement>(".toast-depth-1");
      if (!frontToast) {
        if (isSpreadRef.current) applySpread(false);
        return;
      }
      const rect = frontToast.getBoundingClientRect();
      const reachBelow = backToast ? (rect.height + SPREAD_GAP_PX) * 2 : 0;
      const isWithin =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom + reachBelow;
      if (isSpreadRef.current !== isWithin) {
        applySpread(isWithin);
      }
    };

    const handlePointerLeave = () => {
      if (isSpreadRef.current) applySpread(false);
    };

    document.addEventListener("pointermove", handlePointerMove);
    document.documentElement.addEventListener(
      "pointerleave",
      handlePointerLeave,
    );
    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.documentElement.removeEventListener(
        "pointerleave",
        handlePointerLeave,
      );
    };
  }, []);

  React.useEffect(() => {
    const timers = removalTimersRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const contextValue = React.useMemo(() => ({ showToast }), [showToast]);

  // depth นับจากลำดับ toast ที่ยัง open (array เรียงใหม่สุดก่อน)
  const depthByToastId = new Map<number, number>();
  {
    let depth = 0;
    for (const toast of toasts) {
      if (toast.open) {
        depthByToastId.set(toast.id, depth);
        depth += 1;
      }
    }
  }

  return (
    <ToastContext.Provider value={contextValue}>
      <ToastPrimitive.Provider swipeDirection="right">
        {children}
        {toasts.map((toast) => {
          const toastType = toast.type ?? "info";
          const toastMeta = TOAST_META[toastType];
          const ToastIcon = toastMeta.icon;
          const depth = depthByToastId.get(toast.id);

          return (
            <ToastPrimitive.Root
              key={toast.id}
              open={toast.open}
              onOpenChange={(open) => {
                if (!open) closeToast(toast.id);
              }}
              duration={
                toast.duration ?? (toast.type === "error" ? Infinity : 3500)
              }
              className={cn(
                "toast-stack-item pointer-events-auto overflow-hidden rounded-2xl border px-4 py-3.5 pr-11 shadow-xl backdrop-blur-xl",
                depth !== undefined && `toast-depth-${depth}`,
                toastMeta.surfaceClass,
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-xl",
                    toastMeta.iconClass,
                  )}
                  aria-hidden="true"
                >
                  <ToastIcon className="size-4" strokeWidth={2.25} />
                </span>
                <div className="min-w-0">
                  <ToastPrimitive.Title className="text-sm leading-5 font-semibold tracking-tight">
                    {toast.title}
                  </ToastPrimitive.Title>
                  {toast.description && (
                    <ToastPrimitive.Description className="mt-1 text-xs leading-5 opacity-75">
                      {toast.description}
                    </ToastPrimitive.Description>
                  )}
                </div>
              </div>
              <ToastPrimitive.Close
                type="button"
                aria-label="ปิดการแจ้งเตือน"
                className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer rounded-lg p-1 text-current/70 transition-colors hover:bg-black/5 hover:text-current focus-visible:ring-2 focus-visible:ring-current focus-visible:outline-none dark:hover:bg-white/10"
              >
                <X className="size-4" aria-hidden="true" />
              </ToastPrimitive.Close>
            </ToastPrimitive.Root>
          );
        })}
        <ToastPrimitive.Viewport
          ref={viewportRef}
          aria-label="การแจ้งเตือน"
          className="toast-stack pointer-events-none fixed top-0 right-0 z-[9999] w-full max-w-sm outline-none"
        />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
};

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast ต้องใช้ภายใน <ToastProvider>");
  return ctx;
}
