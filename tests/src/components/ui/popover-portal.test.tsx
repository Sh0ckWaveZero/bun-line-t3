import { describe, it, expect, beforeEach, afterEach } from "bun:test";
// setup.ts ติดตั้ง happy-dom globals + matchers ใน beforeAll (bunfig preload ไม่ได้โหลดมัน)
import "../../../setup";
import type { ReactNode } from "react";
import { cleanup, render } from "@testing-library/react";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import {
  getPortalContainer,
  usePopoverPortalContainer,
} from "@/components/ui/popover-portal";
import { useModalDialog } from "@/hooks/use-modal-dialog";

/**
 * Regression ของ "เลือกประเภทวันลาไม่ได้" ใน DayEventModal — modal <dialog> (showModal)
 * อยู่ใน top layer ของ browser และทำให้ทุกอย่างนอก element เป็น inert dropdown ของ
 * Select/DatePicker ที่ portal ไป <body> จึงกดไม่ติด ต้อง portal เข้าไปใน dialog เอง
 *
 * หมายเหตุ: assert จาก container ที่ PopoverContent เลือก ไม่ใช่การ render เนื้อหา popover
 * — Radix ตรวจ globalThis.document ตอน import (ก่อน beforeAll ของ setup.ts) แล้วตัด
 * useLayoutEffect เป็น no-op เนื้อหาที่เปิดหลัง mount จึงไม่ถูก render ใน happy-dom
 */

/** Harness จำลอง modal จริง — <dialog> ที่เปิดด้วย showModal() ผ่าน useModalDialog (โครงเดียวกับ DayEventModal) */
function Modal({ id, children }: { id: string; children: ReactNode }) {
  const dialogRef = useModalDialog({ isOpen: true, onClose: () => {} });
  return (
    <dialog ref={dialogRef} id={id}>
      {children}
    </dialog>
  );
}

/** อ่าน container ที่ PopoverContent จะใช้ แล้วโชว์เป็น id ของ dialog หรือ "body" */
function Probe() {
  const container = usePopoverPortalContainer();
  return <output>{container?.id || "body"}</output>;
}

function TrackedPopover({
  withTrigger = true,
  children,
}: {
  withTrigger?: boolean;
  children?: ReactNode;
}) {
  return (
    <Popover>
      {withTrigger && (
        <PopoverTrigger asChild>
          <button type="button">เปิดรายการ</button>
        </PopoverTrigger>
      )}
      {children}
    </Popover>
  );
}

const readProbe = (scope: string) =>
  document.querySelector(`${scope} output`)?.textContent;

describe("getPortalContainer", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("อยู่ใน <dialog> → คืน dialog ที่ครอบใกล้สุด", () => {
    const outer = document.createElement("dialog");
    const inner = document.createElement("dialog");
    const trigger = document.createElement("button");
    inner.appendChild(trigger);
    outer.appendChild(inner);
    document.body.appendChild(outer);

    expect(getPortalContainer(trigger)).toBe(inner);
  });

  it("ไม่ได้อยู่ใน dialog หรือไม่มี trigger → undefined (Radix ใช้ <body>)", () => {
    const trigger = document.createElement("button");
    document.body.appendChild(trigger);

    expect(getPortalContainer(trigger)).toBeUndefined();
    expect(getPortalContainer(null)).toBeUndefined();
  });
});

describe("container ของ PopoverContent", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  afterEach(cleanup);

  it("trigger อยู่ใน modal dialog → container คือ dialog นั้น / อยู่นอก dialog → body แยกกันตาม Popover ของตัวเอง", () => {
    render(
      <>
        <div id="outside">
          <TrackedPopover>
            <Probe />
          </TrackedPopover>
        </div>
        <Modal id="dlg">
          <TrackedPopover>
            <Probe />
          </TrackedPopover>
        </Modal>
      </>,
    );

    expect(readProbe("#outside")).toBe("body");
    expect(readProbe("#dlg")).toBe("dlg");
  });

  it("trigger ถูกถอดออก → ไม่เหลือ element เก่าค้างใน context", () => {
    const ui = (withTrigger: boolean) => (
      <Modal id="dlg">
        <TrackedPopover withTrigger={withTrigger}>
          <Probe />
        </TrackedPopover>
      </Modal>
    );
    const { rerender } = render(ui(true));
    expect(readProbe("#dlg")).toBe("dlg");

    rerender(ui(false));
    expect(readProbe("#dlg")).toBe("body");
  });
});
