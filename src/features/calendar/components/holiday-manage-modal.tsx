import { Calendar as CalendarIcon, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PopoverDatePicker } from "@/components/ui/date-picker";
import {
  HolidayDescriptionField,
  HolidayTextField,
  HolidayTypeField,
  HolidayYearField,
} from "@/features/calendar/components/holiday-form-fields";

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
  const [date, setDate] = useState<Date | undefined>(() =>
    selectedDate ? new Date(selectedDate) : undefined,
  );
  const [nameEnglish, setNameEnglish] = useState("");
  const [nameThai, setNameThai] = useState("");
  const [year, setYear] = useState<number | "">(() => new Date().getFullYear());
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
    if (!date || !nameEnglish || !nameThai || typeof year !== "number") {
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
    <dialog
      open
      className="fixed inset-0 z-50 m-0 flex max-h-none max-w-none items-center justify-center border-0 bg-black/50 p-4 text-inherit shadow-none"
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
          <HolidayYearField year={year} onValueChange={setYear} />

          {/* Name Thai */}
          <HolidayTextField
            id="holiday-name-thai"
            label={
              <>
                ชื่อวันหยุด (ไทย) <span className="text-red-500">*</span>
              </>
            }
            value={nameThai}
            onValueChange={setNameThai}
            placeholder="เช่น: วันขึ้นปีใหม่"
            description="ชื่อวันหยุดภาษาไทย"
            describedById="holiday-name-thai-description"
          />

          {/* Name English */}
          <HolidayTextField
            id="holiday-name-english"
            label={
              <>
                ชื่อวันหยุด (อังกฤษ) <span className="text-red-500">*</span>
              </>
            }
            value={nameEnglish}
            onValueChange={setNameEnglish}
            placeholder="E.g.: New Year's Day"
            description="ชื่อวันหยุดภาษาอังกฤษ"
            describedById="holiday-name-english-description"
          />

          {/* Type */}
          <HolidayTypeField value={type} onValueChange={setType} />

          {/* Description */}
          <HolidayDescriptionField
            value={description}
            onValueChange={setDescription}
          />

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
    </dialog>
  );
}
