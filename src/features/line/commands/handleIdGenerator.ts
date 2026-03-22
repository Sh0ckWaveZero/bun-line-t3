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
  // Check if req has proper structure
  const event = req?.body?.events?.[0];
  if (!event) {
    return;
  }

  if (event.type !== "message" || event.message?.type !== "text") {
    return;
  }

  const text = event.message.text?.toLowerCase().trim();
  if (!text) {
    return;
  }

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
  try {
    const mainMenuMessage = flexMessage([bubbleTemplate.thaiIdMainMenu()]);
    await sendMessage(req, mainMenuMessage);
  } catch {
    // Silently fail
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
      try {
        await sendMessage(
          req,
          flexMessage([bubbleTemplate.thaiIdCard(singleId, true)]),
        );
      } catch {
        // Silently fail
      }
    } else {
      const multipleIds = generateMultipleThaiIDs(count);
      try {
        await sendMessage(
          req,
          flexMessage([bubbleTemplate.thaiIdMultipleCards(multipleIds)]),
        );
      } catch {
        // Silently fail
      }
    }
  } catch {
    try {
      await sendMessage(
        req,
        flexMessage([
          bubbleTemplate.workError(
            "เกิดข้อผิดพลาดในการสุ่มเลขบัตรประชาชน กรุณาลองใหม่อีกครั้ง",
          ),
        ]),
      );
    } catch {
      // Silently fail
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
      try {
        await sendMessage(
          req,
          flexMessage([bubbleTemplate.thaiIdCard(singleId, true)]),
        );
      } catch {
        // Silently fail
      }
    } else {
      const multipleIds = generateMultipleThaiIDs(actualCount);
      try {
        await sendMessage(
          req,
          flexMessage([bubbleTemplate.thaiIdMultipleCards(multipleIds)]),
        );
      } catch {
        // Silently fail
      }
    }
  } catch {
    try {
      await sendMessage(
        req,
        flexMessage([
          bubbleTemplate.workError(
            "เกิดข้อผิดพลาดในการสุ่มเลขบัตรประชาชน กรุณาลองใหม่อีกครั้ง",
          ),
        ]),
      );
    } catch {
      // Silently fail
    }
  }
}

/**
 * จัดการ postback actions
 */
async function handlePostbackAction(req: any, event: any): Promise<void> {
  const postbackData = event.postback?.data;

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
        break;
      case "thai_id_help":
        await sendMessage(req, flexMessage([bubbleTemplate.thaiIdHelp()]));
        break;
      case "thai_id_menu":
        await sendMessage(req, flexMessage([bubbleTemplate.thaiIdMainMenu()]));
        break;
      default:
        await sendMessage(req, flexMessage([bubbleTemplate.thaiIdMainMenu()]));
    }
  } else {
    await sendMessage(req, flexMessage([bubbleTemplate.thaiIdMainMenu()]));
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
      try {
        await sendMessage(
          req,
          flexMessage([
            bubbleTemplate.workError(
              "กรุณาระบุเลขบัตรประชาชนที่ต้องการตรวจสอบ\n\nตัวอย่าง: ตรวจสอบบัตร 1-2345-67890-12-1",
            ),
          ]),
        );
      } catch {
        // Silently fail
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
    } catch {
      // Silently fail
    }
  } catch {
    try {
      await sendMessage(
        req,
        flexMessage([
          bubbleTemplate.workError(
            "เกิดข้อผิดพลาดในการตรวจสอบเลขบัตรประชาชน กรุณาลองใหม่อีกครั้ง",
          ),
        ]),
      );
    } catch {
      // Silently fail
    }
  }
}
