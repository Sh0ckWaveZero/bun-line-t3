import {
  generateFormattedThaiID,
  generateMultipleThaiIDs,
  validateThaiID,
  formatThaiID,
} from "@/lib/utils/thai-id-generator";
import { flexMessage } from "@/lib/utils/line-message-utils";
import { bubbleTemplate } from "@/lib/validation/line";
import { sendMessage } from "@/lib/utils/line-utils";

/**
 * Thai ID Card Generator Command Handler
 *
 * Commands:
 * - สุ่มเลขบัตร, สุ่มบัตรประชาชน, random id, generate id
 * - สุ่มเลขบัตร 5 (สำหรับสร้างหลายๆ เลข)
 * - ตรวจสอบบัตร [เลขบัตร] (สำหรับตรวจสอบความถูกต้อง)
 */

export async function handleIdGenerator(req: any): Promise<void> {
  console.log(
    "🎯 handleIdGenerator called with req:",
    JSON.stringify(req, null, 2),
  );

  // Check if req has proper structure
  const event = req?.body?.events?.[0];
  if (!event) {
    console.log("❌ Invalid request structure - no event found");
    return;
  }

  if (event.type !== "message" || event.message?.type !== "text") {
    console.log("❌ Invalid event type or message type");
    return;
  }

  const text = event.message.text?.toLowerCase().trim();
  if (!text) {
    console.log("❌ No text message found");
    return;
  }

  console.log("📝 Processing text:", text);

  // ตรวจสอบว่ามี postback action หรือไม่
  if (event.type === "postback") {
    await handlePostbackAction(req, event);
    return;
  }

  // ตรวจสอบว่าเป็นคำสั่งสุ่มเลขบัตรหรือไม่
  const generateKeywords = [
    "สุ่ม",
    "random",
    "generate",
    "create",
    "new",
    "make",
  ];
  const validateKeywords = [
    "ตรวจสอบ",
    "เช็ค",
    "validate",
    "check",
    "verify",
    "valid",
  ];

  const isGenerateCommand = generateKeywords.some((keyword) =>
    text.includes(keyword),
  );
  const isValidateCommand = validateKeywords.some((keyword) =>
    text.includes(keyword),
  );

  if (isGenerateCommand) {
    await handleGenerateId(req, event, text);
    return;
  }

  if (isValidateCommand) {
    await handleValidateId(req, event, text);
    return;
  }

  // ถ้าไม่ใช่คำสั่งที่รู้จัก ให้แสดงเมนูหลัก
  console.log("❓ Thai ID command not recognized, showing main menu:", text);
  try {
    const mainMenuMessage = flexMessage([bubbleTemplate.thaiIdMainMenu()]);
    await sendMessage(req, mainMenuMessage);
    console.log("✅ Main menu message sent successfully");
  } catch (error) {
    console.error("❌ Error sending main menu message:", error);
  }
}

/**
 * จัดการการสุ่มเลขบัตรประชาชนแบบ Interactive
 */
async function handleInteractiveGenerate(
  req: any,
  event: any,
  count: number = 1,
): Promise<void> {
  try {
    if (count === 1) {
      const singleId = generateFormattedThaiID();
      console.log("🎲 Generated single ID:", singleId);
      try {
        await sendMessage(
          req,
          flexMessage([bubbleTemplate.thaiIdCard(singleId, true)]),
        );
        console.log("✅ Single ID message sent successfully");
      } catch (error) {
        console.error("❌ Failed to send single ID message:", error);
      }
    } else {
      const multipleIds = generateMultipleThaiIDs(count);
      console.log(`🎲 Generated ${count} IDs:`, multipleIds);
      try {
        await sendMessage(
          req,
          flexMessage([bubbleTemplate.thaiIdMultipleCards(multipleIds)]),
        );
        console.log("✅ Multiple IDs message sent successfully");
      } catch (error) {
        console.error("❌ Failed to send multiple IDs message:", error);
      }
    }
  } catch (error) {
    console.error("❌ Error generating Thai ID:", error);
    try {
      await sendMessage(
        req,
        flexMessage([
          bubbleTemplate.workError(
            "เกิดข้อผิดพลาดในการสุ่มเลขบัตรประชาชน กรุณาลองใหม่อีกครั้ง",
          ),
        ]),
      );
      console.log("✅ Error message for generation sent successfully");
    } catch (sendError) {
      console.error("❌ Failed to send error message:", sendError);
    }
  }
}

/**
 * จัดการการสุ่มเลขบัตรประชาชน
 */
async function handleGenerateId(
  req: any,
  event: any,
  text: string,
): Promise<void> {
  try {
    // ตรวจสอบว่ามีการระบุจำนวนหรือไม่
    const countMatch = text.match(/(\d+)/);
    const count = countMatch && countMatch[1] ? parseInt(countMatch[1]) : 1;

    // จำกัดจำนวนไม่เกิน 10 เพื่อไม่ให้ข้อความยาวเกินไป
    const actualCount = Math.min(Math.max(count, 1), 10);

    if (actualCount === 1) {
      const singleId = generateFormattedThaiID();
      console.log("🎲 Generated single ID:", singleId);
      try {
        await sendMessage(
          req,
          flexMessage([bubbleTemplate.thaiIdCard(singleId, true)]),
        );
      } catch (error) {
        console.error("❌ Failed to send single ID message:", error);
      }
    } else {
      const multipleIds = generateMultipleThaiIDs(actualCount);
      console.log(`🎲 Generated ${actualCount} IDs:`, multipleIds);
      try {
        await sendMessage(
          req,
          flexMessage([bubbleTemplate.thaiIdMultipleCards(multipleIds)]),
        );
      } catch (error) {
        console.error("❌ Failed to send multiple IDs message:", error);
      }
    }
  } catch (error) {
    console.error("❌ Error generating Thai ID:", error);
    try {
      await sendMessage(
        req,
        flexMessage([
          bubbleTemplate.workError(
            "เกิดข้อผิดพลาดในการสุ่มเลขบัตรประชาชน กรุณาลองใหม่อีกครั้ง",
          ),
        ]),
      );
    } catch (sendError) {
      console.error("❌ Failed to send error message:", sendError);
    }
  }
}

/**
 * จัดการ postback actions
 */
async function handlePostbackAction(req: any, event: any): Promise<void> {
  const postbackData = event.postback?.data;

  console.log("📋 Postback action received:", postbackData);

  if (postbackData?.startsWith("action=")) {
    const action = postbackData.replace("action=", "");

    switch (action) {
      case "thai_id_generate_1":
        await handleInteractiveGenerate(req, event, 1);
        break;
      case "thai_id_generate_5":
        await handleInteractiveGenerate(req, event, 5);
        break;
      case "thai_id_validate":
        await sendMessage(
          req,
          flexMessage([bubbleTemplate.thaiIdValidateInput()]),
        );
        console.log("✅ Validation input sent successfully");
        break;
      case "thai_id_help":
        await sendMessage(req, flexMessage([bubbleTemplate.thaiIdHelp()]));
        console.log("✅ Help message sent successfully");
        break;
      case "thai_id_menu":
        await sendMessage(req, flexMessage([bubbleTemplate.thaiIdMainMenu()]));
        console.log("✅ Main menu sent successfully");
        break;
      default:
        await sendMessage(req, flexMessage([bubbleTemplate.thaiIdMainMenu()]));
        console.log("✅ Default main menu sent successfully");
    }
  } else {
    await sendMessage(req, flexMessage([bubbleTemplate.thaiIdMainMenu()]));
    console.log("✅ Default main menu sent successfully");
  }
}

/**
 * จัดการการตรวจสอบเลขบัตรประชาชน
 */
async function handleValidateId(
  req: any,
  event: any,
  text: string,
): Promise<void> {
  try {
    // ดึงเลขบัตรประชาชนจากข้อความ
    const idMatch = text.match(/[\d\-\s]{13,17}/);

    if (!idMatch || !idMatch[0]) {
      console.log("❌ No ID number found in message");
      try {
        await sendMessage(
          req,
          flexMessage([
            bubbleTemplate.workError(
              "กรุณาระบุเลขบัตรประชาชนที่ต้องการตรวจสอบ\n\nตัวอย่าง: ตรวจสอบบัตร 1-2345-67890-12-1",
            ),
          ]),
        );
      } catch (error) {
        console.error("❌ Failed to send error message:", error);
      }
      return;
    }

    const idNumber = idMatch[0].trim();
    const isValid = validateThaiID(idNumber);

    // จัดรูปแบบเลขบัตร
    let formattedId: string;
    try {
      const cleanId = idNumber.replace(/[-\s]/g, "");
      if (cleanId.length === 13) {
        formattedId = formatThaiID(cleanId);
      } else {
        formattedId = idNumber;
      }
    } catch {
      formattedId = idNumber;
    }

    try {
      await sendMessage(
        req,
        flexMessage([
          bubbleTemplate.thaiIdValidationResult(formattedId, isValid),
        ]),
      );
    } catch (error) {
      console.error("❌ Failed to send validation result:", error);
    }
  } catch (error) {
    console.error("❌ Error validating Thai ID:", error);
    try {
      await sendMessage(
        req,
        flexMessage([
          bubbleTemplate.workError(
            "เกิดข้อผิดพลาดในการตรวจสอบเลขบัตรประชาชน กรุณาลองใหม่อีกครั้ง",
          ),
        ]),
      );
    } catch (sendError) {
      console.error("❌ Failed to send error message:", sendError);
    }
  }
}
