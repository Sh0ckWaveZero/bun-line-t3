import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PopoverDatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { useState } from "react";

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
    selectedDate ? new Date(selectedDate) : undefined,
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
      onSubmit({
        date: date.toISOString().substring(0, 10), // Format as YYYY-MM-DD
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="holiday-modal-title"
    >
      <Card className="bg-card border-border max-h-[90vh] w-full max-w-lg overflow-auto p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon
              className="text-destructive h-5 w-5"
              aria-hidden="true"
            />
            <h2
              id="holiday-modal-title"
              className="text-foreground text-xl font-bold"
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
              className="text-foreground mb-1 block text-sm font-medium"
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
                "w-full [appearance:textfield] rounded-lg border px-3 py-2 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
                "border-input bg-background text-foreground",
                "focus:ring-ring focus:ring-2 focus:outline-none",
              )}
              min={2000}
              max={2100}
              required
              aria-describedby="holiday-year-description"
            />
            <p
              id="holiday-year-description"
              className="text-muted-foreground mt-1 text-xs"
            >
              ปีคริสต์ศักราช (ค.ศ.) - ถูกตั้งค่าจากวันที่โดยอัตโนมัติ
            </p>
          </div>

          {/* Buddhist Year Display (Read-only) */}
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">ปี พ.ศ.</span>
              <span className="text-foreground text-lg font-bold">
                {year + 543}
              </span>
            </div>
          </div>

          {/* Name Thai */}
          <div>
            <label
              htmlFor="holiday-name-thai"
              className="text-foreground mb-1 block text-sm font-medium"
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
                "w-full rounded-lg border px-3 py-2",
                "border-input bg-background text-foreground",
                "focus:ring-ring focus:ring-2 focus:outline-none",
              )}
              required
              aria-describedby="holiday-name-thai-description"
            />
            <p
              id="holiday-name-thai-description"
              className="text-muted-foreground mt-1 text-xs"
            >
              ชื่อวันหยุดภาษาไทย
            </p>
          </div>

          {/* Name English */}
          <div>
            <label
              htmlFor="holiday-name-english"
              className="text-foreground mb-1 block text-sm font-medium"
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
                "w-full rounded-lg border px-3 py-2",
                "border-input bg-background text-foreground",
                "focus:ring-ring focus:ring-2 focus:outline-none",
              )}
              required
              aria-describedby="holiday-name-english-description"
            />
            <p
              id="holiday-name-english-description"
              className="text-muted-foreground mt-1 text-xs"
            >
              ชื่อวันหยุดภาษาอังกฤษ
            </p>
          </div>

          {/* Type */}
          <div>
            <label
              htmlFor="holiday-type"
              className="text-foreground mb-1 block text-sm font-medium"
            >
              ประเภท <span className="text-red-500">*</span>
            </label>
            <select
              id="holiday-type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className={cn(
                "w-full rounded-lg border px-3 py-2",
                "border-input bg-background text-foreground",
                "focus:ring-ring focus:ring-2 focus:outline-none",
              )}
              required
              aria-describedby="holiday-type-description"
            >
              <option value="national">วันหยุดราชการ</option>
              <option value="royal">วันหยุดเกี่ยวกับราชวงศ์</option>
              <option value="religious">วันหยุดศาสนาจาร</option>
              <option value="special">วันหยุดพิเศษ</option>
            </select>
            <p
              id="holiday-type-description"
              className="text-muted-foreground mt-1 text-xs"
            >
              เลือกประเภทของวันหยุด
            </p>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="holiday-description"
              className="text-foreground mb-1 block text-sm font-medium"
            >
              รายละเอียด (ถ้ามี)
            </label>
            <textarea
              id="holiday-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ระบุรายละเอียดเพิ่มเติม..."
              className={cn(
                "min-h-20 w-full rounded-lg border px-3 py-2",
                "border-input bg-background text-foreground",
                "focus:ring-ring focus:ring-2 focus:outline-none",
                "resize-none",
              )}
              aria-describedby="holiday-description-description"
            />
            <p
              id="holiday-description-description"
              className="text-muted-foreground mt-1 text-xs"
            >
              ระบุรายละเอียดเพิ่มเติม (ไม่บังคับ)
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
              aria-label="ยกเลิก"
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              aria-label={loading ? "กำลังบันทึก..." : "บันทึกวันหยุด"}
            >
              {loading ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
          </div>

          {/* Help Text */}
          <div
            className="text-muted-foreground space-y-1 text-xs"
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
