import { Search } from "lucide-react";

interface EmptyJobsStateProps {
  hasFilters: boolean;
  isLoading?: boolean;
}

export function EmptyJobsState({
  hasFilters,
  isLoading = false,
}: EmptyJobsStateProps) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 text-slate-500 dark:border-white/[0.1] dark:bg-white/[0.06]">
        <Search className="size-5" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-slate-800 dark:text-slate-100">
        {isLoading
          ? "กำลังโหลด Cron Jobs"
          : hasFilters
            ? "ไม่พบงานที่ตรงกับตัวกรอง"
            : "ยังไม่มี Cron job"}
      </h3>
      <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
        {isLoading
          ? "กำลังอ่านรายการจาก scheduler จริง"
          : hasFilters
            ? "ลองเปลี่ยนคำค้นหา สถานะ หรือเป้าหมาย แล้วค้นหาอีกครั้ง"
            : "เพิ่มงานแรกเพื่อให้ dispatcher เริ่มจัดการตามตารางเวลา"}
      </p>
    </div>
  );
}
