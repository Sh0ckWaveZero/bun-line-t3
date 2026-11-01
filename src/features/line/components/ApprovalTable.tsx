import { Users } from "lucide-react";
import type { ApprovalItem } from "@/features/line/line-utils/approvals";
import type { ApprovalItemView } from "@/features/line/line-utils/approval-views";
import { ApprovalRow } from "./ApprovalTableRow";

function EmptyApprovalsState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 text-slate-500 dark:border-white/[0.1] dark:bg-white/[0.06]">
        <Users className="size-5" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-slate-800 dark:text-slate-100">
        {hasFilters
          ? "ไม่พบบัญชีที่ตรงกับตัวกรอง"
          : "ยังไม่มีบัญชี LINE ในระบบ"}
      </h3>
      <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500 dark:text-slate-400">
        {hasFilters
          ? "ลองเปลี่ยนคำค้นหาหรือสถานะ แล้วค้นหาอีกครั้ง"
          : "เมื่อผู้ใช้เพิ่มเพื่อนกับ LINE Bot จะแสดงรายการในหน้านี้"}
      </p>
    </div>
  );
}

export function ApprovalTable({
  rows,
  onOpenActions,
  hasFilters,
}: {
  rows: ApprovalItemView[];
  onOpenActions: (item: ApprovalItem, trigger: HTMLElement) => void;
  hasFilters: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] border-collapse text-left">
        <caption className="sr-only">
          รายชื่อ LINE users และสถานะการอนุมัติ
        </caption>
        <thead className="bg-slate-50/80 dark:bg-white/[0.02]">
          <tr className="text-[11px] font-semibold tracking-wide text-slate-500 dark:text-slate-400">
            <th scope="col" className="min-w-[280px] px-3 py-3">
              ผู้ใช้
            </th>
            <th scope="col" className="min-w-[170px] px-3 py-3">
              สถานะ
            </th>
            <th scope="col" className="w-28 px-3 py-3 text-center">
              สิทธิ์
            </th>
            <th scope="col" className="min-w-[140px] px-3 py-3">
              ขอเมื่อ
            </th>
            <th scope="col" className="w-12 px-2 py-3" />
          </tr>
        </thead>
        <tbody>
          {rows.map((item) => (
            <ApprovalRow key={item.id} item={item} onOpenActions={onOpenActions} />
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <EmptyApprovalsState hasFilters={hasFilters} />}
    </div>
  );
}
