"use client";

import React, { useState } from "react";
import * as Tooltip from "@radix-ui/react-tooltip";
import * as Popover from "@radix-ui/react-popover";
import { AttendanceRecord } from "@/lib/types/attendance";
import { formatDateSafe } from "@/lib/utils/date-formatting";

interface LeaveStatusBadgeProps {
  record: AttendanceRecord;
  statusText: string;
  statusColor: string;
  recordId: string;
}

const getLeaveTypeText = (type: string) => {
  switch (type) {
    case "personal":
      return "ลากิจ";
    case "sick":
      return "ลาป่วย";
    case "vacation":
      return "ลาพักร้อน";
    default:
      return type;
  }
};

const LeaveTooltipContent: React.FC<{ record: AttendanceRecord }> = ({
  record,
}) => {
  if (!record.leaveInfo) return null;

  return (
    <div className="text-left">
      <div className="mb-1 font-semibold">ข้อมูลการลา</div>
      <div className="space-y-1 text-xs">
        <div>ประเภท: {getLeaveTypeText(record.leaveInfo.type)}</div>
        {record.leaveInfo.reason && (
          <div>เหตุผล: {record.leaveInfo.reason}</div>
        )}
        <div>
          วันที่สร้าง:{" "}
          {formatDateSafe(record.leaveInfo.createdAt, {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            calendar: "buddhist",
          })}
        </div>
      </div>
    </div>
  );
};

export const LeaveStatusBadge: React.FC<LeaveStatusBadgeProps> = ({
  record,
  statusText,
  statusColor,
  recordId,
}) => {
  const [isMobilePopoverOpen, setIsMobilePopoverOpen] = useState(false);

  const badgeElement = (
    <span
      id={`status-badge-${recordId}`}
      className={`inline-flex cursor-help rounded-xl px-2 py-1 text-xs font-semibold ${statusColor}`}
    >
      {statusText}
    </span>
  );

  return (
    <>
      {/* Desktop: Tooltip */}
      <div className="hidden sm:block">
        <Tooltip.Provider>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>{badgeElement}</Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                className="z-50 max-w-xs rounded-lg bg-gray-900 px-3 py-2 text-sm text-white
                  shadow-lg dark:bg-gray-800 dark:text-gray-200"
                sideOffset={5}
                align="center"
              >
                <LeaveTooltipContent record={record} />
                <Tooltip.Arrow className="fill-gray-900 dark:fill-gray-800" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>
      </div>

      {/* Mobile: Popover */}
      <div className="block sm:hidden">
        <Popover.Root
          open={isMobilePopoverOpen}
          onOpenChange={setIsMobilePopoverOpen}
        >
          <Popover.Trigger asChild>
            <button
              className="focus:outline-none"
              onClick={() => setIsMobilePopoverOpen(!isMobilePopoverOpen)}
            >
              {badgeElement}
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              className="animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 z-50 max-w-xs
                rounded-lg bg-gray-900 px-3
                py-2 text-sm text-white shadow-lg 
                dark:bg-gray-800 dark:text-gray-200"
              sideOffset={5}
              align="center"
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <LeaveTooltipContent record={record} />
              <Popover.Arrow className="fill-gray-900 dark:fill-gray-800" />
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </div>
    </>
  );
};
