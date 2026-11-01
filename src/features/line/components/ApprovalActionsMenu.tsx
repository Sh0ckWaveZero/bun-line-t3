import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type RefObject,
} from "react";
import {
  CircleCheck,
  CircleX,
  MoreHorizontal,
  RefreshCw,
  ShieldCheck,
  ShieldPlus,
} from "lucide-react";
import type { ApprovalItem } from "@/features/line/line-utils/approvals";

export interface OpenApprovalMenu {
  item: ApprovalItem;
  trigger: HTMLElement;
  rect: DOMRect;
  /** ขนาด viewport ณ ตอนเปิดเมนู — จับจาก event handler เพื่อไม่อ่าน window ตอน render */
  viewport: { width: number; height: number };
}

const MORPH_TRIGGER_SIZE = 32;

/** เลื่อนโฟกัสรายการเมนูด้วยลูกศร และปิดเมนูด้วย Escape/Tab (helper นอก component) */
function moveMenuFocus(
  event: KeyboardEvent,
  box: HTMLElement,
  onClose: () => void,
): void {
  if (event.key === "Escape" || event.key === "Tab") {
    event.preventDefault();
    onClose();
    return;
  }
  if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;

  const menuItems = Array.from(
    box.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])'),
  );
  if (menuItems.length === 0) return;
  event.preventDefault();
  const currentIndex = menuItems.indexOf(
    document.activeElement as HTMLElement,
  );
  const nextIndex =
    event.key === "ArrowDown"
      ? (currentIndex + 1) % menuItems.length
      : (currentIndex - 1 + menuItems.length) % menuItems.length;
  menuItems[nextIndex]?.focus();
}

/**
 * เมนูจัดการแบบ plus-menu-morph (transitions.dev) — กล่องเดียว morph จากวงกลมปุ่ม
 * … กลายเป็นแผงเมนู โดย CSS (input.css .t-morph) คุม animation และ React คุม state:
 * เปิด/ปิดผ่าน data-open บน DOM (ตาม orchestration ของ recipe) ส่วนความสูงฝั่งเปิด
 * วัดจากเนื้อหาจริงแล้ว set เป็น inline style เพื่อให้ height tween ได้
 */
export function ApprovalActionsMenu({
  menu,
  isBusy,
  onClose,
  onApprove,
  onReject,
  onUnlock,
  onToggleAdmin,
}: {
  menu: OpenApprovalMenu;
  isBusy: boolean;
  onClose: () => void;
  onApprove: (item: ApprovalItem) => void;
  onReject: (item: ApprovalItem, reason: string) => void;
  onUnlock: (item: ApprovalItem) => void;
  onToggleAdmin: (item: ApprovalItem) => void;
}) {
  const [confirmReject, setConfirmReject] = useState(false);
  const [reason, setReason] = useState("");
  // data-open เป็นของ React state — ทน re-render และไม่พึ่งจังหวะ rAF
  const [isOpen, setIsOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<number | null>(null);
  const closedRef = useRef(false);
  const { item, trigger, rect, viewport } = menu;

  // พื้นที่ข้างล่างไม่พอ (แถวล่าง ๆ ของตาราง) → เปิดขึ้นบนแทน
  const flipUp = rect.bottom + 240 > viewport.height;
  const maxHeight = flipUp ? rect.top - 8 : viewport.height - rect.bottom - 8;

  // เมานต์แบบปิด (32px) → เฟรมถัดไปค่อยเปิด เพื่อให้ browser เห็นสถานะเริ่มต้นแล้ว transition ยิง
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (!closedRef.current) setIsOpen(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  // ความสูงฝั่งเปิด: รอ paint ของสถานะ 32px ก่อน แล้ว tween ตามเนื้อหาจริง + โฟกัสรายการแรก
  useEffect(() => {
    if (!isOpen) return;
    const frame = requestAnimationFrame(() => {
      const box = boxRef.current;
      if (!box) return;
      box.style.height = `${Math.max(
        MORPH_TRIGGER_SIZE,
        Math.min(
          contentRef.current?.scrollHeight ?? MORPH_TRIGGER_SIZE,
          maxHeight,
        ),
      )}px`;
      contentRef.current
        ?.querySelector<HTMLElement>('[role="menuitem"]:not([disabled])')
        ?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [isOpen, maxHeight]);

  const finishClose = useCallback(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    trigger.focus();
    onClose();
  }, [trigger, onClose]);

  const startClose = useCallback(() => {
    if (closedRef.current) return;
    closedRef.current = true;
    const box = boxRef.current;
    if (box) {
      box.style.height = `${MORPH_TRIGGER_SIZE}px`;
    }
    setIsOpen(false);
    // fallback กรณี transition ไม่ยิง (เช่น prefers-reduced-motion)
    closeTimerRef.current = window.setTimeout(finishClose, 280);
  }, [finishClose]);

  // startClose ล่าสุดผ่าน ref — ผูก listener ครั้งเดียวต่อการเปิด ไม่ re-subscribe ทุก render
  const startCloseRef = useRef(startClose);
  useEffect(() => {
    startCloseRef.current = startClose;
  });

  useEffect(() => {
    if (!isOpen) return;
    const box = boxRef.current;
    if (!box) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      moveMenuFocus(event, box, startCloseRef.current);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // scroll/resize ทำ rect เก่า → ปิดเมนู (ผูกหลัง open animation จบ กัน scroll
  // ที่เกิดจากการ focus รายการแรกทำให้เมนูปิดทันที)
  useEffect(() => {
    if (!isOpen) return;
    let isArmed = false;
    const timer = window.setTimeout(() => {
      isArmed = true;
    }, 400);
    const handleViewportChange = () => {
      if (isArmed) startCloseRef.current();
    };
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [isOpen]);

  const runAction = useCallback(
    (action: () => void) => {
      action();
      startClose();
    },
    [startClose],
  );

  // พับ/ขยายฟอร์มเหตุผล → ความสูงกล่องต้อง tween ตาม
  const handleToggleConfirmReject = useCallback(() => {
    setConfirmReject((current) => !current);
    requestAnimationFrame(() => {
      const box = boxRef.current;
      if (!box || !isOpen) return;
      void box.offsetWidth;
      box.style.height = `${Math.max(
        MORPH_TRIGGER_SIZE,
        Math.min(
          contentRef.current?.scrollHeight ?? MORPH_TRIGGER_SIZE,
          maxHeight,
        ),
      )}px`;
    });
  }, [isOpen, maxHeight]);

  const canUnlock = item.status === "REJECTED" && Boolean(item.approvalId);
  const canReject = item.status !== "APPROVED" && !canUnlock;

  return (
    <div
      className="fixed inset-0 z-50"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) startClose();
      }}
    >
      <div
        ref={boxRef}
        data-open={isOpen ? "true" : "false"}
        data-flip={flipUp ? "true" : "false"}
        className="t-morph"
        style={{
          top: flipUp ? undefined : rect.top,
          bottom: flipUp ? viewport.height - rect.bottom : undefined,
          right: viewport.width - rect.right,
          maxHeight,
        }}
        onTransitionEnd={(event) => {
          if (
            event.target === boxRef.current &&
            event.propertyName === "width" &&
            closedRef.current
          ) {
            finishClose();
          }
        }}
      >
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          className="t-morph-plus"
        >
          <MoreHorizontal className="size-4" aria-hidden="true" />
        </button>

        <ApprovalMenuContent
          contentRef={contentRef}
          item={item}
          isBusy={isBusy}
          confirmReject={confirmReject}
          reason={reason}
          canUnlock={canUnlock}
          canReject={canReject}
          runAction={runAction}
          onToggleConfirmReject={handleToggleConfirmReject}
          onReasonChange={(event) => setReason(event.target.value)}
          onConfirmReject={() => {
            onReject(item, reason.trim());
            startClose();
          }}
          onApprove={onApprove}
          onUnlock={onUnlock}
          onToggleAdmin={onToggleAdmin}
        />
      </div>
    </div>
  );
}

/** เนื้อหาเมนู (รายการ action + ฟอร์มเหตุผลการปฏิเสธ) — subcomponent ของ ApprovalActionsMenu */
function ApprovalMenuContent({
  contentRef,
  item,
  isBusy,
  confirmReject,
  reason,
  canUnlock,
  canReject,
  runAction,
  onToggleConfirmReject,
  onReasonChange,
  onConfirmReject,
  onApprove,
  onUnlock,
  onToggleAdmin,
}: {
  contentRef: RefObject<HTMLDivElement | null>;
  item: ApprovalItem;
  isBusy: boolean;
  confirmReject: boolean;
  reason: string;
  canUnlock: boolean;
  canReject: boolean;
  runAction: (action: () => void) => void;
  onToggleConfirmReject: () => void;
  onReasonChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  onConfirmReject: () => void;
  onApprove: (item: ApprovalItem) => void;
  onUnlock: (item: ApprovalItem) => void;
  onToggleAdmin: (item: ApprovalItem) => void;
}) {
  return (
    <div
      ref={contentRef}
      role="menu"
      aria-label={`จัดการ ${item.displayName ?? item.lineUserId}`}
      className="p-1.5"
    >
      <p className="truncate px-2 pt-1 pb-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
        {item.displayName ?? "ไม่ระบุชื่อ"}
      </p>

      {item.status === "PENDING" && (
        <button
          type="button"
          role="menuitem"
          disabled={isBusy || !item.approvalId}
          onClick={() => runAction(() => onApprove(item))}
          className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-emerald-700 transition-colors hover:bg-emerald-500/10 focus-visible:bg-emerald-500/10 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:text-emerald-300"
        >
          <CircleCheck className="size-4 shrink-0" aria-hidden="true" />
          อนุมัติผู้ใช้
        </button>
      )}

      {canUnlock && (
        <button
          type="button"
          role="menuitem"
          disabled={isBusy}
          onClick={() => runAction(() => onUnlock(item))}
          className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-sky-700 transition-colors hover:bg-sky-500/10 focus-visible:bg-sky-500/10 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:text-sky-300"
        >
          <RefreshCw className="size-4 shrink-0" aria-hidden="true" />
          ปลดล็อคให้ขอใหม่
        </button>
      )}

      <button
        type="button"
        role="menuitem"
        disabled={isBusy}
        onClick={() => runAction(() => onToggleAdmin(item))}
        className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-100 focus-visible:bg-slate-100 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-200 dark:hover:bg-white/[0.08] dark:focus-visible:bg-white/[0.08]"
      >
        {item.isAdmin ? (
          <ShieldCheck className="size-4 shrink-0" aria-hidden="true" />
        ) : (
          <ShieldPlus className="size-4 shrink-0" aria-hidden="true" />
        )}
        {item.isAdmin ? "ยกเลิกสิทธิ์ Admin" : "ตั้งเป็น Admin"}
      </button>

      {canReject && (
        <>
          <div className="mx-2 my-1 border-t border-slate-200 dark:border-white/[0.08]" />
          {!confirmReject ? (
            <button
              type="button"
              role="menuitem"
              disabled={isBusy}
              onClick={onToggleConfirmReject}
              className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-rose-700 transition-colors hover:bg-rose-500/10 focus-visible:bg-rose-500/10 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:text-rose-300"
            >
              <CircleX className="size-4 shrink-0" aria-hidden="true" />
              ปฏิเสธคำขอ
            </button>
          ) : (
            <div className="px-1 pb-1">
              <label
                htmlFor="menu-rejection-reason"
                className="block text-[11px] font-medium text-slate-600 dark:text-slate-300"
              >
                เหตุผล (ไม่บังคับ)
                <textarea
                  id="menu-rejection-reason"
                  rows={3}
                  maxLength={500}
                  value={reason}
                  onChange={onReasonChange}
                  placeholder="เช่น ไม่ผ่านเกณฑ์การใช้งาน, ข้อมูลไม่ครบ…"
                  className="mt-1 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-800 transition-colors outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-slate-100 dark:placeholder:text-slate-600"
                />
              </label>
              <div className="mt-1.5 flex items-center justify-between gap-2">
                <span className="text-[10px] text-slate-400 tabular-nums">
                  {reason.length}/500
                </span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={onToggleConfirmReject}
                    className="h-7 cursor-pointer rounded-lg px-2 text-xs font-medium text-slate-600 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none dark:text-slate-300 dark:hover:bg-white/[0.08]"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={onConfirmReject}
                    className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-lg bg-rose-600 px-2.5 text-xs font-semibold text-white transition-colors hover:bg-rose-700 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <CircleX className="size-3.5" aria-hidden="true" />
                    ยืนยัน
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
