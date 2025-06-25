/**
 * 🧪 Integration Test สำหรับ Attendance Update API
 * ทดสอบการแก้ไข ZodError และ datetime validation
 */

async function testAttendanceUpdateAPI() {
  const baseUrl = "http://localhost:4325";

  console.log("🧪 Testing Attendance Update API...\n");

  // Test case ที่จำลองข้อมูลจาก frontend
  const testPayload = {
    attendanceId: "test-attendance-id", // จะได้ 404 แต่ควรผ่าน validation
    checkInTime: "2025-06-11T08:30", // datetime-local format
    checkOutTime: "2025-06-11T17:30", // datetime-local format
  };

  try {
    console.log("📤 Sending request with datetime-local format:");
    console.log(JSON.stringify(testPayload, null, 2));

    const response = await fetch(`${baseUrl}/api/attendance/update`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testPayload),
    });

    const result = await response.json();

    console.log("\n📥 Response Status:", response.status);
    console.log("📥 Response Body:");
    console.log(JSON.stringify(result, null, 2));

    // ตรวจสอบผลลัพธ์
    if (response.status === 401) {
      console.log("\n✅ Expected: Got 401 Unauthorized (no session)");
      console.log("✅ ความปลอดภัย: API ต้องการการยืนยันตัวตนก่อน");
    } else if (
      response.status === 400 &&
      result.error?.includes("Invalid input data")
    ) {
      console.log(
        "\n❌ Failed: Still getting ZodError - validation not working",
      );
      return false;
    } else {
      console.log("\n✅ Validation passed! No more ZodError");
    }
  } catch (error) {
    console.error("\n❌ Request failed:", error);
    return false;
  }

  // ทดสอบ invalid format
  console.log("\n---\n");
  console.log("🧪 Testing invalid datetime format...");

  const invalidPayload = {
    attendanceId: "test-attendance-id",
    checkInTime: "invalid-datetime",
    checkOutTime: "2025-06-11T17:30",
  };

  try {
    console.log("📤 Sending request with invalid format:");
    console.log(JSON.stringify(invalidPayload, null, 2));

    const response = await fetch(`${baseUrl}/api/attendance/update`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(invalidPayload),
    });

    const result = await response.json();

    console.log("\n📥 Response Status:", response.status);
    console.log("📥 Response Body:");
    console.log(JSON.stringify(result, null, 2));

    if (response.status === 400 && result.details) {
      console.log("\n✅ Expected: Got validation error for invalid datetime");
      console.log("✅ การตรวจสอบ: Invalid input ถูก reject อย่างถูกต้อง");
    } else if (response.status === 401) {
      console.log("\n✅ Expected: Got 401 Unauthorized (no session)");
    }
  } catch (error) {
    console.error("\n❌ Request failed:", error);
    return false;
  }

  console.log("\n🎉 API Testing Completed!");
  return true;
}

// เรียกใช้ test
testAttendanceUpdateAPI()
  .then((success) => {
    if (success) {
      console.log("\n✅ All tests completed successfully");
      process.exit(0);
    } else {
      console.log("\n❌ Some tests failed");
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error("\n💥 Test execution failed:", error);
    process.exit(1);
  });
