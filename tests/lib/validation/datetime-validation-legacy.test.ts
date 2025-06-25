// Test datetime validation functionality
import { z } from "zod";

// Custom datetime transformer ที่รองรับทั้ง datetime-local และ ISO 8601
const datetimeTransformer = z.string().transform((val, ctx) => {
  console.log("Input value:", val);

  // รองรับ datetime-local format (YYYY-MM-DDTHH:MM)
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(val)) {
    console.log("Detected datetime-local format");
    val = `${val}:00.000Z`; // แปลงเป็น ISO 8601 พร้อม timezone
    console.log("Converted to:", val);
  }

  // ตรวจสอบว่าเป็น valid date หรือไม่
  const date = new Date(val);
  if (isNaN(date.getTime())) {
    console.log("Invalid date detected");
    ctx.addIssue({
      code: z.ZodIssueCode.invalid_date,
      message: "Invalid datetime format",
    });
    return z.NEVER;
  }

  console.log("Valid date:", date.toISOString());
  return val;
});

// Schema สำหรับ validation ข้อมูล
const UpdateAttendanceSchema = z.object({
  attendanceId: z.string().min(1, "Attendance ID is required"),
  checkInTime: datetimeTransformer,
  checkOutTime: datetimeTransformer.optional().nullable(),
});

// Test function
function testDatetimeValidation() {
  console.log("=== Testing Datetime Validation ===\n");

  // Test cases
  const testCases = [
    {
      name: "Datetime-local format (from frontend)",
      data: {
        attendanceId: "test-123",
        checkInTime: "2025-06-11T08:30",
        checkOutTime: "2025-06-11T17:30",
      },
    },
    {
      name: "ISO 8601 format",
      data: {
        attendanceId: "test-123",
        checkInTime: "2025-06-11T08:30:00.000Z",
        checkOutTime: "2025-06-11T17:30:00.000Z",
      },
    },
    {
      name: "With null checkOutTime",
      data: {
        attendanceId: "test-123",
        checkInTime: "2025-06-11T08:30",
        checkOutTime: null,
      },
    },
    {
      name: "Invalid format",
      data: {
        attendanceId: "test-123",
        checkInTime: "invalid-date",
        checkOutTime: "2025-06-11T17:30",
      },
    },
  ];

  testCases.forEach((testCase, index) => {
    console.log(`Test ${index + 1}: ${testCase.name}`);
    console.log("Input:", JSON.stringify(testCase.data, null, 2));

    try {
      const result = UpdateAttendanceSchema.parse(testCase.data);
      console.log("✅ Validation passed");
      console.log("Result:", JSON.stringify(result, null, 2));
    } catch (error) {
      console.log("❌ Validation failed");
      if (error.errors) {
        error.errors.forEach((err) => {
          console.log(`  - ${err.path.join(".")}: ${err.message}`);
        });
      } else {
        console.log("  Error:", error.message);
      }
    }
    console.log("---\n");
  });
}

// Test timezone parsing
function testTimezoneHandling() {
  console.log("=== Testing Timezone Handling ===\n");

  const parseDateTime = (dateString) => {
    console.log("Parsing:", dateString);

    // ถ้าเป็น datetime-local format (ไม่มี timezone) ให้ถือว่าเป็นเวลาไทย
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(dateString)) {
      console.log("Detected datetime-local, adding Thailand timezone");
      const withTimezone = `${dateString}:00+07:00`;
      const date = new Date(withTimezone);
      console.log("Result:", date.toISOString(), "(UTC)");
      console.log(
        "Thailand time:",
        date.toLocaleString("th-TH", { timeZone: "Asia/Bangkok" }),
      );
      return date;
    }

    // ถ้าเป็น ISO format แล้ว ใช้โดยตรง
    const date = new Date(dateString);
    console.log("Result:", date.toISOString(), "(UTC)");
    console.log(
      "Thailand time:",
      date.toLocaleString("th-TH", { timeZone: "Asia/Bangkok" }),
    );
    return date;
  };

  const testDates = [
    "2025-06-11T08:30", // datetime-local
    "2025-06-11T08:30:00+07:00", // with Thailand timezone
    "2025-06-11T01:30:00.000Z", // UTC (should be 08:30 Thailand time)
  ];

  testDates.forEach((dateStr, index) => {
    console.log(`Test ${index + 1}:`);
    parseDateTime(dateStr);
    console.log("---\n");
  });
}

// Run tests
testDatetimeValidation();
testTimezoneHandling();
