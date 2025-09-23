import type { MessageEvent } from '@line/bot-sdk';
import {
  generateFormattedThaiID,
  generateMultipleThaiIDs,
  validateThaiID,
  formatThaiID
} from '@/lib/utils/thai-id-generator';

/**
 * Thai ID Card Generator Command Handler
 *
 * Commands:
 * - สุ่มเลขบัตร, สุ่มบัตรประชาชน, random id
 * - สุ่มเลขบัตร 5 (สำหรับสร้างหลายๆ เลข)
 * - ตรวจสอบบัตร [เลขบัตร] (สำหรับตรวจสอบความถูกต้อง)
 */

export async function handleIdGenerator(event: MessageEvent): Promise<string> {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return '';
  }

  const text = event.message.text.toLowerCase().trim();

  // คำสั่งสำหรับสุ่มเลขบัตรประชาชน
  const generateCommands = [
    'สุ่มเลขบัตร',
    'สุ่มบัตรประชาชน',
    'random id',
    'เลขบัตรประชาชน',
    'บัตรประชาชน'
  ];

  // คำสั่งสำหรับตรวจสอบเลขบัตร
  const validateCommands = [
    'ตรวจสอบบัตร',
    'เช็คบัตร',
    'validate id',
    'check id'
  ];

  // ตรวจสอบว่าเป็นคำสั่งสุ่มเลขบัตรหรือไม่
  const isGenerateCommand = generateCommands.some(cmd => text.includes(cmd));
  const isValidateCommand = validateCommands.some(cmd => text.includes(cmd));

  if (isGenerateCommand) {
    return handleGenerateId(text);
  }

  if (isValidateCommand) {
    return handleValidateId(text);
  }

  return '';
}

/**
 * จัดการการสุ่มเลขบัตรประชาชน
 */
function handleGenerateId(text: string): string {
  try {
    // ตรวจสอบว่ามีการระบุจำนวนหรือไม่
    const countMatch = text.match(/(\d+)/);
    const count = countMatch ? parseInt(countMatch[1]) : 1;

    // จำกัดจำนวนไม่เกิน 10 เพื่อไม่ให้ข้อความยาวเกินไป
    const actualCount = Math.min(Math.max(count, 1), 10);

    if (actualCount === 1) {
      const singleId = generateFormattedThaiID();
      return `🎲 เลขบัตรประชาชนที่สุ่มได้:\n\n📋 ${singleId}\n\n⚠️ หมายเหตุ: เลขนี้ถูกสร้างขึ้นเพื่อการทดสอบเท่านั้น ห้ามนำไปใช้ในการปลอมแปลงหรือกระทำผิดกฎหมาย`;
    } else {
      const multipleIds = generateMultipleThaiIDs(actualCount);
      const idList = multipleIds
        .map((id, index) => `${index + 1}. ${id}`)
        .join('\n');

      return `🎲 เลขบัตรประชาชนที่สุ่มได้ (${actualCount} เลข):\n\n📋 ${idList}\n\n⚠️ หมายเหตุ: เลขเหล่านี้ถูกสร้างขึ้นเพื่อการทดสอบเท่านั้น ห้ามนำไปใช้ในการปลอมแปลงหรือกระทำผิดกฎหมาย`;
    }
  } catch (error) {
    console.error('Error generating Thai ID:', error);
    return '❌ เกิดข้อผิดพลาดในการสุ่มเลขบัตรประชาชน กรุณาลองใหม่อีกครั้ง';
  }
}

/**
 * จัดการการตรวจสอบเลขบัตรประชาชน
 */
function handleValidateId(text: string): string {
  try {
    // ดึงเลขบัตรประชาชนจากข้อความ
    const idMatch = text.match(/[\d\-\s]{13,17}/);

    if (!idMatch) {
      return '❓ กรุณาระบุเลขบัตรประชาชนที่ต้องการตรวจสอบ\n\nตัวอย่าง: ตรวจสอบบัตร 1-2345-67890-12-1';
    }

    const idNumber = idMatch[0].trim();
    const isValid = validateThaiID(idNumber);

    // จัดรูปแบบเลขบัตร
    let formattedId: string;
    try {
      const cleanId = idNumber.replace(/[-\s]/g, '');
      if (cleanId.length === 13) {
        formattedId = formatThaiID(cleanId);
      } else {
        formattedId = idNumber;
      }
    } catch {
      formattedId = idNumber;
    }

    if (isValid) {
      return `✅ เลขบัตรประชาชนถูกต้อง\n\n📋 ${formattedId}\n\n🔍 ผลการตรวจสอب: ถูกต้องตาม Check Digit Algorithm`;
    } else {
      return `❌ เลขบัตรประชาชนไม่ถูกต้อง\n\n📋 ${formattedId}\n\n🔍 ผลการตรวจสอบ: ไม่ถูกต้องตาม Check Digit Algorithm\n\n💡 เลขบัตรประชาชนไทยต้องมี 13 หลัก และผ่านการตรวจสอบ Check Digit`;
    }
  } catch (error) {
    console.error('Error validating Thai ID:', error);
    return '❌ เกิดข้อผิดพลาดในการตรวจสอบเลขบัตรประชาชน กรุณาลองใหม่อีกครั้ง';
  }
}

/**
 * แสดงคำแนะนำการใช้งาน
 */
export function getIdGeneratorHelp(): string {
  return `🆔 คำสั่งเลขบัตรประชาชนไทย\n\n` +
    `📝 คำสั่งที่ใช้ได้:\n` +
    `• สุ่มเลขบัตร - สุ่มเลขบัตรประชาชน 1 เลข\n` +
    `• สุ่มเลขบัตร 5 - สุ่มเลขบัตรประชาชน 5 เลข\n` +
    `• ตรวจสอบบัตร [เลขบัตร] - ตรวจสอบความถูกต้อง\n\n` +
    `📋 ตัวอย่าง:\n` +
    `• สุ่มบัตรประชาชน\n` +
    `• สุ่มเลขบัตร 3\n` +
    `• ตรวจสอบบัตร 1-2345-67890-12-1\n\n` +
    `⚠️ หมายเหตุ: ใช้เพื่อการทดสอบเท่านั้น`;
}
