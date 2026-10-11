"use client";

import React from "react";

import { AttendanceStatusType } from "@/features/attendance/types/attendance-status";
import {
  dateFormatters,
  formatHoursSafe,
  formatDateSafe,
} from "@/lib/utils/date-formatting";
import { AttendanceRecord, AttendanceTableProps } from "@/lib/types/attendance";
import { LeaveStatusBadge } from "@/components/ui/LeaveStatusBadge";
import { Pencil } from "lucide-react";

const EmptyTableMessage = () => (
  <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
    ไม่มีข้อมูลการเข้างานในเดือนนี้
  </div>
);

const STATUS_BADGE_CLASSES: Record<AttendanceStatusType, string> = {
  [AttendanceStatusType.CHECKED_IN_ON_TIME]:
    "border border-emerald-400/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  [AttendanceStatusType.CHECKED_IN_LATE]:
    "border border-amber-400/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  [AttendanceStatusType.CHECKED_OUT]:
    "border border-blue-400/25 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  [AttendanceStatusType.AUTO_CHECKOUT_MIDNIGHT]:
    "border border-orange-400/25 bg-orange-500/10 text-orange-700 dark:text-orange-300",
  [AttendanceStatusType.LEAVE]:
    "border border-purple-400/25 bg-purple-500/10 text-purple-700 dark:text-purple-300",
};

const getStatusColor = (status: AttendanceStatusType): string =>
  STATUS_BADGE_CLASSES[status] ??
  "border border-slate-200 bg-slate-100/70 text-slate-500 dark:border-white/[0.1] dark:bg-white/[0.06] dark:text-slate-400";

const getStatusText = (status: AttendanceStatusType) => {
  switch (status) {
    case AttendanceStatusType.CHECKED_IN_ON_TIME:
      return "เข้างานตรงเวลา";
    case AttendanceStatusType.CHECKED_IN_LATE:
      return "เข้างานสาย";
    case AttendanceStatusType.CHECKED_OUT:
      return "ออกงานแล้ว";
    case AttendanceStatusType.AUTO_CHECKOUT_MIDNIGHT:
      return "ออกงานอัตโนมัติ";
    case AttendanceStatusType.LEAVE:
      return "ลา";
    default:
      return status;
  }
};

const TABLE_HEAD_CLASS =
  "text-[11px] font-semibold tracking-wide text-slate-500 dark:text-slate-400";
const ROW_CLASS =
  "border-b border-slate-200/80 transition-colors last:border-b-0 hover:bg-slate-50/60 dark:border-white/[0.07] dark:hover:bg-white/[0.02]";

export const AttendanceTable: React.FC<AttendanceTableProps> = ({
  records,
  onEditRecord,
}) => {
  const sortedRecords = [...records].sort(
    (a, b) => new Date(b.workDate).getTime() - new Date(a.workDate).getTime(),
  );

  const today = new Date().toISOString().split("T")[0];
  const todayFormatted = new Date().toISOString();

  return (
    <div>
      <div className="flex items-baseline justify-between px-5 pt-5 sm:px-6">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">
          รายละเอียดการเข้างาน
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {dateFormatters.fullDate(todayFormatted)} · {sortedRecords.length}{" "}
          รายการ
        </p>
      </div>
      <div className="overflow-x-auto px-5 pt-3 pb-5 sm:px-6">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <caption className="sr-only">
            รายการลงเวลาเข้า-ออกงานรายวันของเดือนที่เลือก
          </caption>
          <thead className="bg-slate-50/80 dark:bg-white/[0.02]">
            <tr className={TABLE_HEAD_CLASS}>
              <th
                scope="col"
                className="sticky left-0 z-10 min-w-[130px] bg-slate-50/80 px-3 py-3 text-left dark:bg-[#1b1e21]"
              >
                วันที่
              </th>
              <th scope="col" className="min-w-[90px] px-3 py-3 text-left">
                เวลาเข้า
              </th>
              <th scope="col" className="min-w-[90px] px-3 py-3 text-left">
                เวลาออก
              </th>
              <th scope="col" className="min-w-[80px] px-3 py-3 text-left">
                ชั่วโมง
              </th>
              <th scope="col" className="min-w-[130px] px-3 py-3 text-left">
                สถานะ
              </th>
              <th scope="col" className="min-w-[80px] px-3 py-3 text-left">
                จัดการ
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/80 dark:divide-white/[0.07]">
            {sortedRecords.map((record) => {
              const isToday = record.workDate === today;
              return (
                <tr key={record.id} className={ROW_CLASS}>
                  <td
                    className={`sticky left-0 z-10 bg-white px-3 py-3 text-sm whitespace-nowrap dark:bg-[#151719] ${
                      isToday
                        ? "font-semibold text-slate-900 dark:text-white"
                        : "text-slate-700 dark:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>
                        {formatDateSafe(record.workDate, {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          calendar: "buddhist",
                        })}
                      </span>
                      {isToday && (
                        <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                          วันนี้
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3 font-mono text-sm whitespace-nowrap text-slate-600 dark:text-slate-300">
                    {record.status === AttendanceStatusType.LEAVE
                      ? record.checkInTime
                        ? dateFormatters.time24(record.checkInTime)
                        : "08:00"
                      : dateFormatters.time24(record.checkInTime)}
                  </td>
                  <td className="px-3 py-3 font-mono text-sm whitespace-nowrap text-slate-600 dark:text-slate-300">
                    {record.status === AttendanceStatusType.LEAVE
                      ? record.checkOutTime
                        ? dateFormatters.time24(record.checkOutTime)
                        : "17:00"
                      : record.checkOutTime
                        ? dateFormatters.time24(record.checkOutTime)
                        : "-"}
                  </td>
                  <td className="px-3 py-3 font-mono text-sm whitespace-nowrap text-slate-600 dark:text-slate-300">
                    {record.status === AttendanceStatusType.LEAVE
                      ? record.hoursWorked
                        ? formatHoursSafe(record.hoursWorked)
                        : "9.00"
                      : formatHoursSafe(record.hoursWorked)}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    {record.status === AttendanceStatusType.LEAVE &&
                    record.leaveInfo ? (
                      <LeaveStatusBadge
                        record={record}
                        statusText={getStatusText(record.status)}
                        statusColor={getStatusColor(record.status)}
                        recordId={record.id}
                      />
                    ) : (
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(record.status)}`}
                      >
                        {getStatusText(record.status)}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <EditButton record={record} onEdit={onEditRecord} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {sortedRecords.length === 0 && <EmptyTableMessage />}
      </div>
    </div>
  );
};

const EditButton: React.FC<{
  record: AttendanceRecord;
  onEdit: (record: AttendanceRecord) => void;
}> = ({ record, onEdit }) => {
  const isLeaveDay = record.status === AttendanceStatusType.LEAVE;

  return (
    <button
      type="button"
      onClick={() => !isLeaveDay && onEdit(record)}
      disabled={isLeaveDay}
      className={`inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 ${
        isLeaveDay
          ? "text-slate-400 dark:text-slate-500"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/[0.08] dark:hover:text-slate-200"
      }`}
      aria-label={
        isLeaveDay
          ? `ไม่สามารถแก้ไขข้อมูลวันลาได้ วันที่ ${dateFormatters.shortDate(record.workDate)}`
          : `แก้ไขข้อมูลการเข้างานวันที่ ${dateFormatters.shortDate(record.workDate)}`
      }
    >
      <Pencil className="size-3" aria-hidden="true" />
      แก้ไข
    </button>
  );
};
