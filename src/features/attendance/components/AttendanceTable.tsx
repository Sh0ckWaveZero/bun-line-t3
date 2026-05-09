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

const EmptyTableMessage = () => (
  <div className="py-8 text-center text-muted-foreground">
    ไม่มีข้อมูลการเข้างานในเดือนนี้
  </div>
);

export const AttendanceTable: React.FC<AttendanceTableProps> = ({
  records,
  onEditRecord,
}) => {
  const getStatusColor = (status: AttendanceStatusType) => {
    switch (status) {
      case AttendanceStatusType.CHECKED_IN_ON_TIME:
        return "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800";
      case AttendanceStatusType.CHECKED_IN_LATE:
        return "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800";
      case AttendanceStatusType.CHECKED_OUT:
        return "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800";
      case AttendanceStatusType.AUTO_CHECKOUT_MIDNIGHT:
        return "bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800";
      case AttendanceStatusType.LEAVE:
        return "bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800";
      default:
        return "bg-muted text-muted-foreground border border-border";
    }
  };

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

  const sortedRecords = [...records].sort(
    (a, b) => new Date(b.workDate).getTime() - new Date(a.workDate).getTime(),
  );

  const today = new Date().toISOString().split("T")[0];
  const todayFormatted = new Date().toISOString();

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          รายละเอียดการเข้างาน
        </h2>
        <p className="text-xs text-muted-foreground">
          {dateFormatters.fullDate(todayFormatted)} · {sortedRecords.length} รายการ
        </p>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="min-w-full">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              <th className="sticky left-0 z-10 bg-muted/50 px-4 py-3 text-left text-xs font-semibold tracking-wide text-muted-foreground">
                วันที่
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-muted-foreground">
                เวลาเข้า
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-muted-foreground">
                เวลาออก
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-muted-foreground">
                ชั่วโมง
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-muted-foreground">
                สถานะ
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-muted-foreground">
                จัดการ
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sortedRecords.map((record) => {
              const isToday = record.workDate === today;
              return (
                <tr
                  key={record.id}
                  className={`transition-colors hover:bg-muted/30 ${
                    isToday ? "bg-primary/5" : ""
                  }`}
                >
                  <td
                    className={`sticky left-0 z-10 whitespace-nowrap bg-card px-4 py-3 text-sm ${
                      isToday ? "font-semibold text-foreground" : "text-foreground"
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
                        <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                          วันนี้
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-sm text-foreground">
                    {record.status === AttendanceStatusType.LEAVE
                      ? record.checkInTime
                        ? dateFormatters.time24(record.checkInTime)
                        : "08:00"
                      : dateFormatters.time24(record.checkInTime)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-sm text-foreground">
                    {record.status === AttendanceStatusType.LEAVE
                      ? record.checkOutTime
                        ? dateFormatters.time24(record.checkOutTime)
                        : "17:00"
                      : record.checkOutTime
                        ? dateFormatters.time24(record.checkOutTime)
                        : "-"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-sm text-foreground">
                    {record.status === AttendanceStatusType.LEAVE
                      ? record.hoursWorked
                        ? formatHoursSafe(record.hoursWorked)
                        : "9.00"
                      : formatHoursSafe(record.hoursWorked)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
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
                  <td className="whitespace-nowrap px-4 py-3">
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
      onClick={() => !isLeaveDay && onEdit(record)}
      disabled={isLeaveDay}
      className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 ${
        isLeaveDay
          ? "cursor-not-allowed text-muted-foreground opacity-50"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
      aria-label={
        isLeaveDay
          ? `ไม่สามารถแก้ไขข้อมูลวันลาได้ วันที่ ${dateFormatters.shortDate(record.workDate)}`
          : `แก้ไขข้อมูลการเข้างานวันที่ ${dateFormatters.shortDate(record.workDate)}`
      }
    >
      <svg
        className="mr-1 h-3 w-3"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
        />
      </svg>
      แก้ไข
    </button>
  );
};
