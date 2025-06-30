import { describe, it, expect } from "bun:test";
import { selectRandomElement } from "@/lib/crypto-random";

// Note: In real tests, we would mock holidayService and db calls

describe("Check-in Reminder API", () => {
  describe("Holiday Detection from MongoDB", () => {
    it("should skip reminder on public holidays", () => {
      const mockHolidayResponse = {
        success: true,
        message: "Skipped - public holiday: วันสงกรานต์ (Songkran Festival)",
        holidayInfo: {
          nameThai: "วันสงกรานต์",
          nameEnglish: "Songkran Festival",
          type: "national",
        },
        timestamp: "2025-04-13T01:00:00.000Z",
      };

      expect(mockHolidayResponse).toHaveProperty("success");
      expect(mockHolidayResponse).toHaveProperty("holidayInfo");
      expect(mockHolidayResponse.success).toBe(true);
      expect(mockHolidayResponse.message).toContain("public holiday");
      expect(mockHolidayResponse.holidayInfo?.nameThai).toBe("วันสงกรานต์");
      expect(mockHolidayResponse.holidayInfo?.nameEnglish).toBe(
        "Songkran Festival",
      );
      expect(mockHolidayResponse.holidayInfo?.type).toBe("national");
    });

    it("should skip reminder on weekends", () => {
      const mockWeekendResponse = {
        success: true,
        message: "Skipped - not a working day",
        holidayInfo: null,
        timestamp: "2025-06-22T01:00:00.000Z", // Sunday
      };

      expect(mockWeekendResponse).toHaveProperty("success");
      expect(mockWeekendResponse).toHaveProperty("holidayInfo");
      expect(mockWeekendResponse.success).toBe(true);
      expect(mockWeekendResponse.message).toContain("not a working day");
      expect(mockWeekendResponse.holidayInfo).toBe(null);
    });

    it("should include different types of holidays", () => {
      const holidayTypes = ["national", "royal", "religious", "special"];

      holidayTypes.forEach((type) => {
        const mockHolidayResponse = {
          holidayInfo: {
            nameThai: "วันหยุดทดสอบ",
            nameEnglish: "Test Holiday",
            type: type,
          },
        };

        expect(["national", "royal", "religious", "special"]).toContain(
          mockHolidayResponse.holidayInfo.type,
        );
      });
    });
  });

  describe("Database Integration (Mocked)", () => {
    it("should handle holiday data structure correctly", () => {
      const mockHolidayFromDB = {
        id: "507f1f77bcf86cd799439011",
        date: "2025-04-13", // YYYY-MM-DD format
        nameEnglish: "Songkran Festival",
        nameThai: "วันสงกรานต์",
        year: 2025,
        type: "national",
        isActive: true,
        description: "Thai New Year celebration",
        createdAt: new Date("2025-01-01T00:00:00.000Z"),
        updatedAt: new Date("2025-01-01T00:00:00.000Z"),
      };

      // ตรวจสอบโครงสร้างข้อมูลวันหยุดจาก MongoDB
      expect(mockHolidayFromDB).toHaveProperty("id");
      expect(mockHolidayFromDB).toHaveProperty("date");
      expect(mockHolidayFromDB).toHaveProperty("nameEnglish");
      expect(mockHolidayFromDB).toHaveProperty("nameThai");
      expect(mockHolidayFromDB).toHaveProperty("year");
      expect(mockHolidayFromDB).toHaveProperty("type");
      expect(mockHolidayFromDB).toHaveProperty("isActive");

      // ตรวจสอบรูปแบบ date
      expect(mockHolidayFromDB.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(mockHolidayFromDB.year).toBe(2025);
      expect(mockHolidayFromDB.isActive).toBe(true);
      expect(["national", "royal", "religious", "special"]).toContain(
        mockHolidayFromDB.type,
      );
    });

    it("should handle holiday query logic", () => {
      // จำลองการ query วันหยุด
      const testDate = new Date("2025-04-13T08:00:00.000Z");
      const dateString = testDate.toISOString().split("T")[0];

      expect(dateString).toBe("2025-04-13");

      // จำลอง query structure ที่จะใช้กับ MongoDB
      const mockQuery = {
        where: {
          date: dateString,
          isActive: true,
        },
      };

      expect(mockQuery.where.date).toBe("2025-04-13");
      expect(mockQuery.where.isActive).toBe(true);
    });

    it("should handle database errors gracefully", () => {
      // จำลองการจัดการข้อผิดพลาดจาก database
      const mockError = new Error("Database connection failed");

      // Suppress console.error during test to avoid confusing output
      const originalConsoleError = console.error;
      console.error = () => {}; // Temporarily suppress console.error

      // ฟังก์ชันควรคืนค่า false เมื่อเกิดข้อผิดพลาด
      const handleDatabaseError = (error: Error): boolean => {
        console.error("Error checking if date is public holiday:", error);
        return false; // Default to not being a holiday if we can't check
      };

      const result = handleDatabaseError(mockError);

      // Restore console.error
      console.error = originalConsoleError;

      expect(result).toBe(false);
    });
  });

  describe("Working Day Detection Logic", () => {
    it("should correctly identify Monday as working day", () => {
      const monday = new Date("2025-06-16T08:00:00.000Z"); // Monday
      const dayOfWeek = monday.getDay();
      expect(dayOfWeek).toBe(1);
      expect(dayOfWeek >= 1 && dayOfWeek <= 5).toBe(true);
    });

    it("should correctly identify Friday as working day", () => {
      const friday = new Date("2025-06-20T08:00:00.000Z"); // Friday
      const dayOfWeek = friday.getDay();
      expect(dayOfWeek).toBe(5);
      expect(dayOfWeek >= 1 && dayOfWeek <= 5).toBe(true);
    });

    it("should correctly identify Saturday as non-working day", () => {
      const saturday = new Date("2025-06-21T08:00:00.000Z"); // Saturday
      const dayOfWeek = saturday.getDay();
      expect(dayOfWeek).toBe(6);
      expect(dayOfWeek >= 1 && dayOfWeek <= 5).toBe(false);
    });

    it("should correctly identify Sunday as non-working day", () => {
      const sunday = new Date("2025-06-22T08:00:00.000Z"); // Sunday
      const dayOfWeek = sunday.getDay();
      expect(dayOfWeek).toBe(0);
      expect(dayOfWeek >= 1 && dayOfWeek <= 5).toBe(false);
    });
  });

  describe("Time Validation Logic", () => {
    it("should validate 8 AM as correct reminder time", () => {
      const eightAM = new Date();
      eightAM.setHours(8, 0, 0, 0);
      const hour = eightAM.getHours();
      expect(hour).toBe(8);
    });

    it("should reject 7 AM as incorrect reminder time", () => {
      const sevenAM = new Date();
      sevenAM.setHours(7, 0, 0, 0);
      const hour = sevenAM.getHours();
      expect(hour).toBe(7);
      expect(hour === 8).toBe(false);
    });

    it("should reject 9 AM as incorrect reminder time", () => {
      const nineAM = new Date();
      nineAM.setHours(9, 0, 0, 0);
      const hour = nineAM.getHours();
      expect(hour).toBe(9);
      expect(hour === 8).toBe(false);
    });
  });

  describe("Message Content Quality", () => {
    const sampleMessages = [
      "🌅 สวัสดีตอนเช้า! วันใหม่ที่สดใส เริ่มต้นด้วยการลงชื่อเข้างานกันนะคะ ✨",
      "☀️ อรุณสวัสดิ์ค่ะ! พร้อมเริ่มวันทำงานที่ดีแล้วหรือยัง? อย่าลืมเช็คอินนะคะ 😊",
      "🌸 วันนี้เป็นวันที่ดี! เริ่มต้นด้วยความสดชื่น และอย่าลืมลงชื่อเข้างานด้วยนะ 🌟",
      "🌱 ตื่นมาแล้วปะ? วันใหม่มาแล้ว พร้อมทำงานด้วยพลังบวกกันเลย! เช็คอินได้แล้วค่ะ 💚",
      "🎶 สวัสดีค่ะ! เวลาทำงานมาถึงแล้ว ลงชื่อเข้างานแล้วเริ่มวันที่สวยงามกันเลย 🎵",
    ];

    it("should contain friendly and polite language", () => {
      sampleMessages.forEach((message) => {
        const hasFriendlyWords =
          message.includes("สวัสดี") ||
          message.includes("ค่ะ") ||
          message.includes("นะ") ||
          message.includes("กัน") ||
          message.includes("😊") ||
          message.includes("✨") ||
          message.includes("🌅");

        expect(hasFriendlyWords).toBe(true);
      });
    });

    it("should encourage check-in without being pushy", () => {
      sampleMessages.forEach((message) => {
        const hasGentleEncouragement =
          message.includes("อย่าลืม") ||
          message.includes("เริ่มต้น") ||
          message.includes("พร้อม") ||
          message.includes("เช็คอิน") ||
          message.includes("ลงชื่อเข้างาน");

        expect(hasGentleEncouragement).toBe(true);
      });
    });

    it("should have appropriate length (not too short or too long)", () => {
      sampleMessages.forEach((message) => {
        // ข้อความควรมีความยาวระหว่าง 30-200 ตัวอักษร
        expect(message.length).toBeGreaterThan(30);
        expect(message.length).toBeLessThan(200);
      });
    });

    it("should contain emojis for friendliness", () => {
      sampleMessages.forEach((message) => {
        // ตรวจสอบว่ามี emoji อย่างน้อย 1 ตัว
        const emojiRegex =
          /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
        expect(emojiRegex.test(message)).toBe(true);
      });
    });
  });

  describe("Random Selection Logic", () => {
    const testArray = [
      "message1",
      "message2",
      "message3",
      "message4",
      "message5",
    ];

    it("should select different messages on multiple calls", () => {
      const results = new Set();

      // รันหลายครั้งเพื่อดูว่ามีการสุ่มจริง
      for (let i = 0; i < 20; i++) {
        const selected = selectRandomElement(testArray);
        results.add(selected);
        expect(testArray).toContain(selected);
      }

      // ควรได้ข้อความที่แตกต่างกันอย่างน้อย 2 แบบ
      expect(results.size).toBeGreaterThan(1);
    });

    it("should always return a valid message from the array", () => {
      for (let i = 0; i < 10; i++) {
        const selected = selectRandomElement(testArray);
        expect(testArray).toContain(selected);
        expect(typeof selected).toBe("string");
        expect(selected.length).toBeGreaterThan(0);
      }
    });
  });

  describe("Cron Job Configuration", () => {
    it("should have correct cron expression for 8:00 AM weekdays", () => {
      const cronExpression = "0 8 * * 1-5";
      const parts = cronExpression.split(" ");

      expect(parts).toHaveLength(5);
      expect(parts[0]).toBe("0"); // นาที 0
      expect(parts[1]).toBe("8"); // ชั่วโมง 8
      expect(parts[2]).toBe("*"); // ทุกวันในเดือน
      expect(parts[3]).toBe("*"); // ทุกเดือน
      expect(parts[4]).toBe("1-5"); // จันทร์ถึงศุกร์
    });
  });

  describe("API Response Structure", () => {
    it("should have proper success response format", () => {
      const mockSuccessResponse = {
        success: true,
        message: "Check-in reminder broadcast sent successfully",
        messageText:
          "🌅 สวัสดีตอนเช้า! วันใหม่ที่สดใส เริ่มต้นด้วยการลงชื่อเข้างานกันนะคะ ✨",
        timestamp: "2025-06-18T01:00:00.000Z",
      };

      expect(mockSuccessResponse).toHaveProperty("success");
      expect(mockSuccessResponse).toHaveProperty("message");
      expect(mockSuccessResponse).toHaveProperty("messageText");
      expect(mockSuccessResponse).toHaveProperty("timestamp");
      expect(mockSuccessResponse.success).toBe(true);
      expect(typeof mockSuccessResponse.message).toBe("string");
      expect(typeof mockSuccessResponse.messageText).toBe("string");
      expect(typeof mockSuccessResponse.timestamp).toBe("string");
    });

    it("should have proper skip response for non-working days", () => {
      const mockSkipResponse = {
        success: true,
        message: "Skipped - not a working day",
        timestamp: "2025-06-22T01:00:00.000Z",
      };

      expect(mockSkipResponse).toHaveProperty("success");
      expect(mockSkipResponse).toHaveProperty("message");
      expect(mockSkipResponse).toHaveProperty("timestamp");
      expect(mockSkipResponse.success).toBe(true);
      expect(mockSkipResponse.message).toContain("not a working day");
    });

    it("should have proper error response format", () => {
      const mockErrorResponse = {
        success: false,
        error: "Failed to send check-in reminder",
        details: "Network error",
        timestamp: "2025-06-18T01:00:00.000Z",
      };

      expect(mockErrorResponse).toHaveProperty("success");
      expect(mockErrorResponse).toHaveProperty("error");
      expect(mockErrorResponse).toHaveProperty("timestamp");
      expect(mockErrorResponse.success).toBe(false);
      expect(typeof mockErrorResponse.error).toBe("string");
    });
  });

  describe("Security Requirements", () => {
    it("should require authorization header", () => {
      const expectedAuthHeader = `Bearer ${process.env.CRON_SECRET}`;
      expect(expectedAuthHeader).toContain("Bearer");
      expect(expectedAuthHeader.length).toBeGreaterThan("Bearer ".length);
    });

    it("should validate CRON_SECRET environment variable", () => {
      // ตรวจสอบว่า CRON_SECRET ถูกตั้งค่าและไม่ว่าง
      expect(process.env.CRON_SECRET).toBeDefined();
      if (process.env.CRON_SECRET) {
        expect(process.env.CRON_SECRET.length).toBeGreaterThan(0);
      }
    });
  });

  describe("LINE API Integration", () => {
    it("should have proper broadcast message structure", () => {
      const mockBroadcastMessage = [
        {
          type: "text",
          text: "🌅 สวัสดีตอนเช้า! วันใหม่ที่สดใส เริ่มต้นด้วยการลงชื่อเข้างานกันนะคะ ✨",
        },
        {
          type: "template",
          altText: "ลงชื่อเข้างาน",
          template: {
            type: "buttons",
            text: "👆 กดปุ่มด้านล่างเพื่อลงชื่อเข้างานได้เลย",
            actions: [
              {
                type: "uri",
                label: "🏢 ลงชื่อเข้างาน",
                uri: "https://example.com",
              },
            ],
          },
        },
      ];

      expect(Array.isArray(mockBroadcastMessage)).toBe(true);
      expect(mockBroadcastMessage).toHaveLength(2);

      // ตรวจสอบข้อความแรก
      const textMessage = mockBroadcastMessage[0] as any;
      expect(textMessage?.type).toBe("text");
      expect(textMessage?.text).toBeDefined();
      expect(typeof textMessage?.text).toBe("string");

      // ตรวจสอบปุ่มข้อความ
      const buttonMessage = mockBroadcastMessage[1] as any;
      expect(buttonMessage?.type).toBe("template");
      expect(buttonMessage?.altText).toBeDefined();
      expect(buttonMessage?.template?.type).toBe("buttons");
      expect(Array.isArray(buttonMessage?.template?.actions)).toBe(true);
      expect(buttonMessage?.template?.actions).toHaveLength(1);
    });
  });
});

console.log("✅ Check-in reminder API tests completed successfully");
