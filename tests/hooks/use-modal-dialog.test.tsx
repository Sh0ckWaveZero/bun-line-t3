import { describe, it, expect, beforeEach, afterEach } from "bun:test";
// setup.ts ติดตั้ง happy-dom globals + matchers ใน beforeAll (bunfig preload ไม่ได้โหลดมัน)
import "../setup";
import { cleanup, render } from "@testing-library/react";
import { useModalDialog } from "@/hooks/use-modal-dialog";

/**
 * Harness component จำลองรูปแบบที่ call sites ใช้จริง: mount <dialog> เมื่อ
 * isOpen แล้วผูก ref จาก hook
 */
function DialogHarness({
  isOpen,
  onClose,
  onCancel,
  blockEscape,
}: {
  isOpen: boolean;
  onClose?: () => void;
  onCancel?: () => void;
  blockEscape?: boolean;
}) {
  const dialogRef = useModalDialog({
    isOpen,
    onClose: onClose ?? (() => {}),
    onCancel,
    blockEscape,
  });
  return isOpen ? (
    <dialog ref={dialogRef}>
      <button type="button">ปิด</button>
    </dialog>
  ) : null;
}

const findByDialog = (): HTMLDialogElement => {
  const dialog = document.querySelector("dialog");
  // happy-dom ใน setup.ts ไม่ได้ expose HTMLDialogElement เป็น global — เช็ค tag แทน
  if (!dialog || dialog.tagName !== "DIALOG")
    throw new Error("dialog ไม่ถูก render");
  return dialog as HTMLDialogElement;
};

// happy-dom ต้องใช้ Event คลาสของ window ตัวเอง (global Event = ของ Node)
const fireCancel = (dialog: HTMLDialogElement) => {
  const event = new window.Event("cancel", { cancelable: true });
  dialog.dispatchEvent(event);
  return event;
};

const fireClose = (dialog: HTMLDialogElement) => {
  dialog.dispatchEvent(new window.Event("close"));
};

describe("useModalDialog", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
  });

  it("isOpen=true → เรียก showModal ให้ dialog เปิดจริง", () => {
    const { rerender } = render(<DialogHarness isOpen={false} />);
    expect(document.querySelector("dialog")).toBeNull();

    rerender(<DialogHarness isOpen={true} />);
    expect(findByDialog().open).toBe(true);
  });

  it("close event → เรียก onClose ให้ (พาธ Esc/ปิด native)", () => {
    let closed = 0;
    render(<DialogHarness isOpen={true} onClose={() => void closed++} />);
    const dialog = findByDialog();

    fireClose(dialog);
    expect(closed).toBe(1);
  });

  it("ไม่มี onCancel/blockEscape → cancel event ปล่อยผ่าน (browser ปิดเอง)", () => {
    render(<DialogHarness isOpen={true} />);
    const event = fireCancel(findByDialog());
    expect(event.defaultPrevented).toBe(false);
  });

  it("มี onCancel → preventDefault + ส่งต่อ (เล่น exit animation ก่อนปิด)", () => {
    let cancelled = 0;
    let closed = 0;
    render(
      <DialogHarness
        isOpen={true}
        onCancel={() => void cancelled++}
        onClose={() => void closed++}
      />,
    );
    const event = fireCancel(findByDialog());

    expect(event.defaultPrevented).toBe(true);
    expect(cancelled).toBe(1);
    // ปิดจริงเป็นหน้าที่ของผู้เรียก (requestClose) — hook ไม่ยิง onClose เอง
    expect(closed).toBe(0);
  });

  it("blockEscape → preventDefault โดยไม่ส่งต่อ onCancel (modal บังคับ flow)", () => {
    let cancelled = 0;
    render(
      <DialogHarness
        isOpen={true}
        blockEscape
        onCancel={() => void cancelled++}
      />,
    );
    const event = fireCancel(findByDialog());

    expect(event.defaultPrevented).toBe(true);
    expect(cancelled).toBe(0);
  });

  it("callback อัปเดตทุก render (useEffectEvent) — onClose ตัวใหม่ถูกเรียก", () => {
    const calls: string[] = [];
    const { rerender } = render(
      <DialogHarness isOpen={true} onClose={() => void calls.push("เก่า")} />,
    );
    rerender(
      <DialogHarness isOpen={true} onClose={() => void calls.push("ใหม่")} />,
    );

    fireClose(findByDialog());
    expect(calls).toEqual(["ใหม่"]);
  });
});
