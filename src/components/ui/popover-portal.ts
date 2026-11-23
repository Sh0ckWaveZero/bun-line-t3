import * as React from "react";

/**
 * element ของ trigger ภายใต้ <Popover> ตัวเดียวกัน — PopoverContent ใช้หา container ของ
 * Portal (Radix ไม่เปิด context ของตัวเองให้อ่าน) เป็น null จนกว่า trigger จะ mount
 */
export const PopoverTriggerContext = React.createContext<HTMLElement | null>(
  null,
);
export const SetPopoverTriggerContext = React.createContext<
  React.Dispatch<React.SetStateAction<HTMLElement | null>>
>(() => {});

/**
 * container ของ Portal สำหรับ trigger ที่กำหนด — <dialog> ที่ครอบอยู่ถ้ามี ไม่งั้น undefined
 * (Radix ใช้ <body> ตามปกติ)
 *
 * modal <dialog> (showModal) อยู่ใน top layer ของ browser และทำให้ทุกอย่างนอก element เป็น
 * inert — dropdown ที่ portal ไป <body> จะถูกวาดใต้ฉากหลังและกดไม่ติด ต้อง portal เข้าไปใน
 * dialog เอง (เช่น Select ประเภทวันลา / DatePicker ใน DayEventModal ของปฏิทิน)
 */
export function getPortalContainer(trigger: HTMLElement | null) {
  return trigger?.closest("dialog") ?? undefined;
}

/** container ที่ PopoverContent ควร portal เข้าไป — ดูจาก trigger ของ <Popover> เดียวกัน */
export function usePopoverPortalContainer() {
  const trigger = React.useContext(PopoverTriggerContext);
  return getPortalContainer(trigger);
}
