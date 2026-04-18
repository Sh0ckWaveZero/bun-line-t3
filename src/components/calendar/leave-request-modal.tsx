import { useState } from "react";
import { X, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PopoverDatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";

interface LeaveRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { date: string; type: string; reason?: string }) => void;
  selectedDate?: string;
}

function parseDateStr(str: string): Date | undefined {
  if (!str) return undefined;
  const [yearStr, monthStr, dayStr] = str.split("-");
  const year = parseInt(yearStr ?? "", 10);
  const month = parseInt(monthStr ?? "", 10);
  const day = parseInt(dayStr ?? "", 10);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
}

function formatDateToStr(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function LeaveRequestModal({
  isOpen,
  onClose,
  onSubmit,
  selectedDate,
}: LeaveRequestModalProps) {
  const [date, setDate] = useState<Date | undefined>(
    selectedDate ? parseDateStr(selectedDate) : undefined,
  );
  const [type, setType] = useState("personal");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validate
    if (!date) {
      setError("กรุณาระบุวันที่");
      setLoading(false);
      return;
    }

    try {
      await onSubmit({
        date: formatDateToStr(date),
        type,
        reason: reason || undefined,
      });
      onClose();
      // Reset form
      setDate(undefined);
      setType("personal");
      setReason("");
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="leave-modal-title"
    >
      <Card className="bg-card border-border max-h-[90vh] w-full max-w-md overflow-auto p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="text-primary h-5 w-5" aria-hidden="true" />
            <h2 id="leave-modal-title" className="text-xl font-bold">
              {selectedDate ? "แจ้งลาวันที่เลือก" : "แจ้งลางาน"}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="ปิดหน้าต่าง"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date Selection with DatePicker */}
          <PopoverDatePicker
            id="leave-date"
            label="วันที่ลา"
            value={date}
            onChange={setDate}
            placeholder="เลือกวันที่ที่ต้องการลา"
            minDate={new Date()}
            required={true}
          />

          {/* Leave Type */}
          <div>
            <label
              htmlFor="leave-type"
              className="mb-1 block text-sm font-medium"
            >
              ประเภทวันลา <span className="text-destructive">*</span>
            </label>
            <select
              id="leave-type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className={cn(
                "w-full rounded-md border px-3 py-2",
                "border-input bg-background text-foreground",
                "focus:ring-ring focus:ring-2 focus:outline-none",
              )}
              required
              aria-describedby="leave-type-description"
            >
              <option value="personal">ลากิจ</option>
              <option value="sick">ลาป่วย</option>
              <option value="vacation">ลาพักผ่อน</option>
            </select>
            <p
              id="leave-type-description"
              className="text-muted-foreground mt-1 text-xs"
            >
              เลือกประเภทของการลางาน
            </p>
          </div>

          {/* Reason */}
          <div>
            <label
              htmlFor="leave-reason"
              className="mb-1 block text-sm font-medium"
            >
              เหตุผล (ถ้ามี)
            </label>
            <textarea
              id="leave-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="ระบุเหตุผลการลางาน..."
              className={cn(
                "min-h-24 w-full rounded-md border px-3 py-2",
                "border-input bg-background text-foreground",
                "focus:ring-ring focus:ring-2 focus:outline-none",
                "resize-none",
              )}
              aria-describedby="leave-reason-description"
            />
            <p
              id="leave-reason-description"
              className="text-muted-foreground mt-1 text-xs"
            >
              ระบุเหตุผลเพิ่มเติม (ไม่บังคับ)
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              role="alert"
              aria-live="assertive"
              className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm"
            >
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              aria-label="ยกเลิกการแจ้งลา"
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              aria-label={loading ? "กำลังบันทึก..." : "บันทึกการแจ้งลา"}
            >
              {loading ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
          </div>

          {/* Help Text */}
          <div
            className="text-muted-foreground text-xs"
            role="note"
            aria-label="คำแนะนำ"
          >
            💡 วันลาจะแสดงในปฏิทินหลังจากบันทึกเรียบร้อย
          </div>
        </form>
      </Card>
    </div>
  );
}
