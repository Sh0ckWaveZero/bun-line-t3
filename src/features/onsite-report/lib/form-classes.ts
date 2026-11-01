import { cn } from "@/lib/utils";

/** class ของ input/textarea ในฟอร์มรายงาน */
export const inputClass = cn(
  "w-full rounded-md border px-3 py-2",
  "border-input bg-background text-foreground",
  // text-entry fields: เปลี่ยนสีขอบตอน focus พอ ไม่ใส่ ring ให้ขอบหนาทึบ
  "focus:border-ring focus:outline-none",
);

/** ปุ่มลบแถวในตาราง Next Action / Attendees */
export const ROW_REMOVE_CLASS =
  "mt-[30px] flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-rose-500/10 hover:text-rose-600 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none dark:hover:text-rose-300";
