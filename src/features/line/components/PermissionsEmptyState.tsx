import { Users } from "lucide-react";

export function EmptyPermissionsState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 text-slate-500 dark:border-white/[0.1] dark:bg-white/[0.06]">
        <Users className="size-5" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-slate-800 dark:text-slate-100">
        {hasFilters ? "ไม่พบผู้ใช้ที่ตรงกับตัวกรอง" : "ยังไม่มีผู้ใช้ขออนุมัติ"}
      </h3>
      <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500 dark:text-slate-400">
        {hasFilters
          ? "ลองเปลี่ยนคำค้นหาหรือสถานะ แล้วค้นหาอีกครั้ง"
          : "เมื่อมีผู้ใช้ขออนุมัติผ่าน LINE จะแสดงรายการในหน้านี้"}
      </p>
    </div>
  );
}
