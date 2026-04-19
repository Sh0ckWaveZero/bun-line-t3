import { useState } from "react";
import { X, Calendar as CalendarIcon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PopoverDatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";

interface HolidayManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    date: string;
    nameEnglish: string;
    nameThai: string;
    year: number;
    type: string;
    description?: string;
  }) => void;
  selectedDate?: string;
}

export function HolidayManageModal({
  isOpen,
  onClose,
  onSubmit,
  selectedDate,
}: HolidayManageModalProps) {
  const [date, setDate] = useState<Date | undefined>(
    selectedDate ? new Date(selectedDate) : undefined
  );
  const [nameEnglish, setNameEnglish] = useState("");
  const [nameThai, setNameThai] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [type, setType] = useState("national");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-update year when date is selected
  const handleDateChange = (newDate: Date | undefined) => {
    setDate(newDate);
    if (newDate) {
      setYear(newDate.getFullYear());
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validate
    if (!date || !nameEnglish || !nameThai || !year) {
      setError("กรุณาระบุข้อมูลให้ครบถ้วน");
      setLoading(false);
      return;
    }

    try {
      await onSubmit({
        date: date.toISOString().split('T')[0], // Format as YYYY-MM-DD
        nameEnglish,
        nameThai,
        year,
        type,
        description: description || undefined,
      });
      onClose();
      // Reset form
      setDate(undefined);
      setNameEnglish("");
      setNameThai("");
      setYear(new Date().getFullYear());
      setType("national");
      setDescription("");
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 dark:bg-black/70"
      role="dialog"
      aria-modal="true"
      aria-labelledby="holiday-modal-title"
    >
      <Card className="w-full max-w-lg max-h-[90vh] overflow-auto p-6 dark:bg-gray-900 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-red-500" aria-hidden="true" />
            <h2
              id="holiday-modal-title"
              className="text-xl font-bold dark:text-gray-100"
            >
              {selectedDate ? "แก้ไขวันหยุด" : "เพิ่มวันหยุดใหม่"}
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
            id="holiday-date"
            label="วันที่"
            value={date}
            onChange={handleDateChange}
            placeholder="เลือกวันที่วันหยุด"
            required={true}
          />

          {/* Year - Auto-filled from date but editable */}
          <div>
            <label
              htmlFor="holiday-year"
              className="block text-sm font-medium mb-1 dark:text-gray-200"
            >
              ปี ค.ศ. <span className="text-red-500">*</span>
            </label>
            <input
              id="holiday-year"
              type="number"
              inputMode="numeric"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className={cn(
                "w-full px-3 py-2 border rounded-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                "bg-background dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100",
                "focus:outline-none focus:ring-2 focus:ring-red-500"
              )}
              min={2000}
              max={2100}
              required
              aria-describedby="holiday-year-description"
            />
            <p
              id="holiday-year-description"
              className="text-xs text-muted-foreground dark:text-gray-400 mt-1"
            >
              ปีคริสต์ศักราช (ค.ศ.) - ถูกตั้งค่าจากวันที่โดยอัตโนมัติ
            </p>
          </div>

          {/* Buddhist Year Display (Read-only) */}
          <div className="bg-muted/50 p-3 rounded-lg dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground dark:text-gray-400">
                ปี พ.ศ.
              </span>
              <span className="text-lg font-bold dark:text-gray-100">
                {year + 543}
              </span>
            </div>
          </div>

          {/* Name Thai */}
          <div>
            <label
              htmlFor="holiday-name-thai"
              className="block text-sm font-medium mb-1 dark:text-gray-200"
            >
              ชื่อวันหยุด (ไทย) <span className="text-red-500">*</span>
            </label>
            <input
              id="holiday-name-thai"
              type="text"
              value={nameThai}
              onChange={(e) => setNameThai(e.target.value)}
              placeholder="เช่น: วันขึ้นปีใหม่"
              className={cn(
                "w-full px-3 py-2 border rounded-lg",
                "bg-background dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100",
                "focus:outline-none focus:ring-2 focus:ring-red-500"
              )}
              required
              aria-describedby="holiday-name-thai-description"
            />
            <p
              id="holiday-name-thai-description"
              className="text-xs text-muted-foreground dark:text-gray-400 mt-1"
            >
              ชื่อวันหยุดภาษาไทย
            </p>
          </div>

          {/* Name English */}
          <div>
            <label
              htmlFor="holiday-name-english"
              className="block text-sm font-medium mb-1 dark:text-gray-200"
            >
              ชื่อวันหยุด (อังกฤษ) <span className="text-red-500">*</span>
            </label>
            <input
              id="holiday-name-english"
              type="text"
              value={nameEnglish}
              onChange={(e) => setNameEnglish(e.target.value)}
              placeholder="E.g.: New Year's Day"
              className={cn(
                "w-full px-3 py-2 border rounded-lg",
                "bg-background dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100",
                "focus:outline-none focus:ring-2 focus:ring-red-500"
              )}
              required
              aria-describedby="holiday-name-english-description"
            />
            <p
              id="holiday-name-english-description"
              className="text-xs text-muted-foreground dark:text-gray-400 mt-1"
            >
              ชื่อวันหยุดภาษาอังกฤษ
            </p>
          </div>

          {/* Type */}
          <div>
            <label
              htmlFor="holiday-type"
              className="block text-sm font-medium mb-1 dark:text-gray-200"
            >
              ประเภท <span className="text-red-500">*</span>
            </label>
            <select
              id="holiday-type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className={cn(
                "w-full px-3 py-2 border rounded-lg",
                "bg-background dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100",
                "focus:outline-none focus:ring-2 focus:ring-red-500"
              )}
              required
              aria-describedby="holiday-type-description"
            >
              <option value="national">วันหยุดราชการ (National)</option>
              <option value="royal">วันหยุดเกี่ยวกับราชวงศ์ (Royal)</option>
              <option value="religious">วันหยุดศาสนาจาร (Religious)</option>
              <option value="special">วันหยุดพิเศษ (Special)</option>
            </select>
            <p
              id="holiday-type-description"
              className="text-xs text-muted-foreground dark:text-gray-400 mt-1"
            >
              เลือกประเภทของวันหยุด
            </p>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="holiday-description"
              className="block text-sm font-medium mb-1 dark:text-gray-200"
            >
              รายละเอียด (ถ้ามี)
            </label>
            <textarea
              id="holiday-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ระบุรายละเอียดเพิ่มเติม..."
              className={cn(
                "w-full px-3 py-2 border rounded-lg min-h-20",
                "bg-background dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100",
                "focus:outline-none focus:ring-2 focus:ring-red-500",
                "resize-none"
              )}
              aria-describedby="holiday-description-description"
            />
            <p
              id="holiday-description-description"
              className="text-xs text-muted-foreground dark:text-gray-400 mt-1"
            >
              ระบุรายละเอียดเพิ่มเติม (ไม่บังคับ)
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              role="alert"
              aria-live="assertive"
              className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm dark:bg-red-950/30 dark:text-red-400"
            >
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              aria-label="ยกเลิก"
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
              aria-label={loading ? "กำลังบันทึก..." : "บันทึกวันหยุด"}
            >
              {loading ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
          </div>

          {/* Help Text */}
          <div
            className="text-xs text-muted-foreground dark:text-gray-400 space-y-1"
            role="note"
            aria-label="คำแนะนำ"
          >
            <p>💡 วันหยุดจะแสดงในปฏิทินของทุกคน</p>
            <p>📅 วันที่จะถูกจัดรูปแบบเป็น YYYY-MM-DD</p>
          </div>
        </form>
      </Card>
    </div>
  );
}
