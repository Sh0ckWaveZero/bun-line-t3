import { CalendarPlus, Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CalendarMobileActionsProps {
  onShowLeaveModal: () => void;
  onShowHolidayModal: () => void;
  onShowImportModal: () => void;
}

export function CalendarMobileActions({
  onShowLeaveModal,
  onShowHolidayModal,
  onShowImportModal,
}: CalendarMobileActionsProps) {
  return (
    <div
      id="calendar-mobile-actions"
      className="mt-4 flex justify-center gap-2 sm:hidden"
    >
      <Button
        id="calendar-mobile-leave-btn"
        size="sm"
        className="flex-1"
        onClick={onShowLeaveModal}
      >
        <Plus className="mr-1.5 h-3.5 w-3.5" />
        แจ้งลา
      </Button>
      <Button
        id="calendar-mobile-holiday-btn"
        variant="outline"
        size="sm"
        className="flex-1"
        onClick={onShowHolidayModal}
      >
        <CalendarPlus className="mr-1.5 h-3.5 w-3.5" />
        เพิ่มวันหยุด
      </Button>
      <Button
        id="calendar-mobile-import-btn"
        variant="outline"
        size="sm"
        className="flex-1"
        onClick={onShowImportModal}
      >
        <Upload className="mr-1.5 h-3.5 w-3.5" />
        นำเข้า
      </Button>
    </div>
  );
}
