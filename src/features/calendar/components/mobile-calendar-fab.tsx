import { CalendarPlus, Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileCalendarFabProps {
  onLeaveClick: () => void;
  onHolidayClick: () => void;
  onExportClick: () => void;
}

export function MobileCalendarFab({
  onLeaveClick,
  onHolidayClick,
  onExportClick,
}: MobileCalendarFabProps) {
  return (
    <nav
      id="mobile-calendar-fab"
      className="border-border bg-card fixed inset-x-3 bottom-3 z-50 grid grid-cols-3 gap-2 rounded-xl border p-2"
      aria-label="ปุ่มดำเนินการด่วน"
    >
      <Button
        id="mobile-fab-leave"
        size="sm"
        className="h-11 rounded-lg text-xs font-bold"
        onClick={onLeaveClick}
        aria-label="แจ้งลางาน"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        ลางาน
      </Button>
      <Button
        id="mobile-fab-holiday"
        size="sm"
        variant="outline"
        className="h-11 rounded-lg text-xs font-bold"
        onClick={onHolidayClick}
        aria-label="เพิ่มวันหยุด"
      >
        <CalendarPlus className="h-4 w-4" aria-hidden="true" />
        วันหยุด
      </Button>
      <Button
        id="mobile-fab-export"
        size="sm"
        variant="outline"
        className="h-11 rounded-lg text-xs font-bold"
        onClick={onExportClick}
        aria-label="ส่งออกข้อมูลวันหยุด"
      >
        <Download className="h-4 w-4" aria-hidden="true" />
        ส่งออก
      </Button>
    </nav>
  );
}
