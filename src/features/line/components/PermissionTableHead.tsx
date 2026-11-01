import { Bell, CalendarCheck, UserCheck } from "lucide-react";

export function PermissionTableHead() {
  return (
    <thead className="bg-slate-50/80 dark:bg-white/[0.02]">
      <tr className="text-[11px] font-semibold tracking-wide text-slate-500 dark:text-slate-400">
        <th
          scope="col"
          className="min-w-[260px] px-3 py-3 text-left"
        >
          User
        </th>
        <th
          scope="col"
          className="min-w-[130px] px-3 py-3 text-left"
        >
          สถานะ
        </th>
        <th
          scope="col"
          className="min-w-[120px] px-3 py-3 text-center"
        >
          <span className="inline-flex items-center gap-1.5">
            <CalendarCheck
              className="size-3.5"
              aria-hidden="true"
            />
            รายงานเข้างาน
          </span>
        </th>
        <th
          scope="col"
          className="min-w-[120px] px-3 py-3 text-center"
        >
          <span className="inline-flex items-center gap-1.5">
            <UserCheck className="size-3.5" aria-hidden="true" />
            ขอลา
          </span>
        </th>
        <th
          scope="col"
          className="min-w-[120px] px-3 py-3 text-center"
        >
          <span className="inline-flex items-center gap-1.5">
            <Bell className="size-3.5" aria-hidden="true" />
            แจ้งเตือน
          </span>
        </th>
        <th
          scope="col"
          className="min-w-[120px] px-3 py-3 text-center"
        >
          บันทึก DCA อัตโนมัติ
        </th>
        <th
          scope="col"
          className="min-w-[120px] px-3 py-3 text-center"
        >
          Onsite Report
        </th>
      </tr>
    </thead>
  );
}
