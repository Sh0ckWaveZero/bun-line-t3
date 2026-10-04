import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface HolidayFieldLabelProps {
  htmlFor: string;
  label: ReactNode;
}

function HolidayFieldLabel({ htmlFor, label }: HolidayFieldLabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className="text-foreground mb-1 block text-sm font-medium"
    >
      {label}
    </label>
  );
}

interface HolidayTextFieldProps {
  id: string;
  label: ReactNode;
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  description: string;
  describedById: string;
}

export function HolidayTextField({
  id,
  label,
  value,
  onValueChange,
  placeholder,
  description,
  describedById,
}: HolidayTextFieldProps) {
  return (
    <div>
      <HolidayFieldLabel htmlFor={id} label={label} />
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full rounded-lg border px-3 py-2",
          "border-input bg-background text-foreground",
          "focus:ring-ring focus:ring-2 focus:outline-none",
        )}
        required
        aria-describedby={describedById}
      />
      <p id={describedById} className="text-muted-foreground mt-1 text-xs">
        {description}
      </p>
    </div>
  );
}

interface HolidayYearFieldProps {
  year: number | "";
  onValueChange: (year: number | "") => void;
}

export function HolidayYearField({
  year,
  onValueChange,
}: HolidayYearFieldProps) {
  return (
    <>
      <div>
        <HolidayFieldLabel
          htmlFor="holiday-year"
          label={
            <>
              ปี ค.ศ. <span className="text-red-500">*</span>
            </>
          }
        />
        <input
          id="holiday-year"
          type="number"
          inputMode="numeric"
          aria-label="ปี ค.ศ."
          value={year}
          onChange={(e) => {
            const value = e.target.value;
            onValueChange(value === "" ? "" : Number.parseInt(value, 10));
          }}
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
            {typeof year === "number" ? year + 543 : "—"}
          </span>
        </div>
      </div>
    </>
  );
}

interface HolidayTypeFieldProps {
  value: string;
  onValueChange: (value: string) => void;
}

export function HolidayTypeField({
  value,
  onValueChange,
}: HolidayTypeFieldProps) {
  return (
    <div>
      <HolidayFieldLabel
        htmlFor="holiday-type"
        label={
          <>
            ประเภท <span className="text-red-500">*</span>
          </>
        }
      />
      <select
        id="holiday-type"
        aria-label="ประเภท"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
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
  );
}

interface HolidayDescriptionFieldProps {
  value: string;
  onValueChange: (value: string) => void;
}

export function HolidayDescriptionField({
  value,
  onValueChange,
}: HolidayDescriptionFieldProps) {
  return (
    <div>
      <HolidayFieldLabel
        htmlFor="holiday-description"
        label="รายละเอียด (ถ้ามี)"
      />
      <textarea
        id="holiday-description"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
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
  );
}
