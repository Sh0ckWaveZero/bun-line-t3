/**
 * Thai National ID Card Number Generator and Validator
 *
 * วิธีการคำนวณเพื่อตรวจสอบเลขบัตรประชาชนไทย:
 * 1. นำเลข 12 หลักแรกมาคูณกับเลขประจำตำแหน่ง (13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2)
 * 2. รวมผลคูณทั้งหมด แล้วหารเอาเศษด้วย 11
 * 3. เอา 11 ลบด้วยเศษที่ได้ = Check Digit (ถ้าได้ 10 ให้เอาหลักหน่วย = 0, ถ้าได้ 11 ให้ใช้ 1)
 */

/**
 * คำนวณ Check Digit สำหรับเลขบัตรประชาชนไทย
 */
export function calculateCheckDigit(first12Digits: string): number {
  if (first12Digits.length !== 12) {
    throw new Error('First 12 digits must be exactly 12 characters');
  }

  const multipliers = [13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2];

  // คูณแต่ละหลักกับตัวคูณ
  const sum = first12Digits
    .split('')
    .map(Number)
    .reduce((total, digit, index) => total + (digit * (multipliers[index] || 0)), 0);

  // หารเอาเศษด้วย 11
  const remainder = sum % 11;

  // คำนวณ Check Digit
  const checkDigit = 11 - remainder;

  // Algorithm มาตรฐาน Thai ID:
  // ถ้าได้ 0 ให้ใช้ 0, ถ้าได้ 1 ให้ใช้ 1, ถ้าได้ 2 ให้ใช้ 2, ... ถ้าได้ 10 ให้ใช้ 0, ถ้าได้ 11 ให้ใช้ 1
  if (checkDigit === 10) return 0;
  if (checkDigit === 11) return 1;

  return checkDigit;
}

/**
 * ตรวจสอบความถูกต้องของเลขบัตรประชาชนไทย
 */
export function validateThaiID(idNumber: string): boolean {
  // ลบ dash และ space ออก
  const cleanId = idNumber.replace(/[-\s]/g, '');

  // ตรวจสอบความยาว
  if (cleanId.length !== 13) {
    return false;
  }

  // ตรวจสอบว่าเป็นตัวเลขทั้งหมด
  if (!/^\d{13}$/.test(cleanId)) {
    return false;
  }

  const first12 = cleanId.substring(0, 12);
  const lastDigit = parseInt(cleanId.charAt(12));
  const expectedCheckDigit = calculateCheckDigit(first12);

  return lastDigit === expectedCheckDigit;
}

/**
 * สร้างเลขบัตรประชาชนไทยแบบสุ่ม
 */
export function generateRandomThaiID(): string {
  // สร้างเลข 12 หลักแรกแบบสุ่ม
  // หลักแรกไม่ควรเป็น 0
  const firstDigit = Math.floor(Math.random() * 9) + 1;
  const remaining11Digits = Array.from({ length: 11 }, () =>
    Math.floor(Math.random() * 10)
  ).join('');

  const first12 = firstDigit + remaining11Digits;
  const checkDigit = calculateCheckDigit(first12);

  return `${first12}${checkDigit}`;
}

/**
 * สร้างเลขบัตรประชาชนไทยในรูปแบบที่มี dash
 */
export function generateFormattedThaiID(): string {
  const idNumber = generateRandomThaiID();
  return formatThaiID(idNumber);
}

/**
 * จัดรูปแบบเลขบัตรประชาชนให้มี dash
 */
export function formatThaiID(idNumber: string): string {
  const cleanId = idNumber.replace(/[-\s]/g, '');

  if (cleanId.length !== 13) {
    throw new Error('Thai ID must be 13 digits');
  }

  // รูปแบบ: X-XXXX-XXXXX-XX-X
  return `${cleanId.substring(0, 1)}-${cleanId.substring(1, 5)}-${cleanId.substring(5, 10)}-${cleanId.substring(10, 12)}-${cleanId.substring(12, 13)}`;
}

/**
 * สร้างเลขบัตรประชาชนไทยหลายๆ เลข
 */
export function generateMultipleThaiIDs(count: number = 5): string[] {
  if (count < 1 || count > 20) {
    throw new Error('Count must be between 1 and 20');
  }

  return Array.from({ length: count }, () => generateFormattedThaiID());
}

/**
 * ตัวอย่างการใช้งาน
 */
export function exampleUsage() {
  console.log('=== ตัวอย่างการใช้งาน ===');

  // สร้างเลขบัตรประชาชนแบบสุ่ม
  const randomId = generateFormattedThaiID();
  console.log('เลขบัตรประชาชนที่สร้างขึ้น:', randomId);

  // ตรวจสอบความถูกต้อง
  const isValid = validateThaiID(randomId);
  console.log('ความถูกต้อง:', isValid ? 'ถูกต้อง' : 'ไม่ถูกต้อง');

  // สร้างหลายๆ เลข
  const multipleIds = generateMultipleThaiIDs(3);
  console.log('เลขบัตรประชาชนหลายๆ เลข:');
  multipleIds.forEach((id, index) => {
    console.log(`${index + 1}. ${id} (ถูกต้อง: ${validateThaiID(id) ? 'ใช่' : 'ไม่'})`);
  });
}