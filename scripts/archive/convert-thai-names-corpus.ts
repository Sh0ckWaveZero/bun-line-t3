#!/usr/bin/env bun
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

function readNamesFromFile(filename: string): string[] {
  try {
    const content = readFileSync(filename, "utf-8");
    return content
      .split("\n")
      .map((name) => name.trim())
      .filter((name) => name.length > 0)
      .sort();
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    return [];
  }
}

function generateTypescriptFile() {
  console.log("🔄 Reading Thai names corpus files...");

  const maleNames = readNamesFromFile("male-names.txt");
  const femaleNames = readNamesFromFile("female-names.txt");
  const familyNames = readNamesFromFile("family-names.txt");

  console.log(`✅ Loaded ${maleNames.length} male names`);
  console.log(`✅ Loaded ${femaleNames.length} female names`);
  console.log(`✅ Loaded ${familyNames.length} family names`);

  // สร้างชื่อเล่นไทยเพิ่มเติม
  const commonNicknames = [
    "กิ๊บ",
    "กิ๊ฟ",
    "กิ๊ก",
    "กิ๊น",
    "เก็บ",
    "เก่ง",
    "เก้า",
    "เกม",
    "ข้าว",
    "ขิง",
    "ข้น",
    "เข็ม",
    "แข",
    "โข่",
    "ไข่",
    "ไขมุก",
    "ก้อง",
    "กบ",
    "กิ่ง",
    "เกียร์",
    "แกง",
    "โก้",
    "ไก่",
    "ชาย",
    "ชาม",
    "ช้อน",
    "ชิน",
    "ชิม",
    "ชิค",
    "ชิต",
    "ช็อค",
    "เจ",
    "เจ๊",
    "เจี๋ย",
    "เจมส์",
    "เจน",
    "เจสซี่",
    "เจนนี่",
    "ใจ",
    "ใจดี",
    "ไจ",
    "ไจ๊",
    "ใหญ่",
    "ใหม่",
    "ไหม",
    "ญาญ่า",
    "ญิ๋ง",
    "ญาดา",
    "หญิง",
    "หญ้า",
    "ดาว",
    "ดิว",
    "ดิง",
    "ดอง",
    "ดอน",
    "ดั๊ก",
    "ดัง",
    "ตั๊ก",
    "ติ๊ก",
    "ตูน",
    "ตุ๊ย",
    "ตุ๋ม",
    "ตู่",
    "ต้อม",
    "ต้น",
    "เต้",
    "โต",
    "ต่อ",
    "ต้อย",
    "ตุ้ม",
    "ตู",
    "เต็ด",
    "เต็ม",
    "นก",
    "หนู",
    "น้ำ",
    "น้ำหวาน",
    "เน็ต",
    "เนม",
    "นิ่ม",
    "บอม",
    "บิ๊บ",
    "บิ๊ก",
    "บีม",
    "บี",
    "เบล",
    "โบว์",
    "เบอร์",
    "ปลา",
    "ปู",
    "ป๊อบ",
    "ป๊อป",
    "ปิง",
    "ปิน",
    "ปิ่น",
    "ปิกกี้",
    "ผึ้ง",
    "ผัด",
    "ผม",
    "ฝน",
    "ฝ้าย",
    "ฝิง",
    "ฝุ่น",
    "แฝด",
    "พี่",
    "พุง",
    "พลอย",
    "พิม",
    "พิน",
    "พิช",
    "พิก",
    "พิต",
    "ฟิล์ม",
    "ฟ้า",
    "ฟาง",
    "ฟิน",
    "ฟิ๊ก",
    "ฟ้อง",
    "ฟอง",
    "ฟิต",
    "ภู",
    "ภูมิ",
    "ภพ",
    "มด",
    "มิ๊ก",
    "มิ๊กซ์",
    "มิ้นท์",
    "มู",
    "มิว",
    "ยิ้ม",
    "ยู",
    "ย่า",
    "ยาย",
    "ยู่",
    "ยูน",
    "เยาว์",
    "โย",
    "รัก",
    "ร่า",
    "รุ้ง",
    "รีบ",
    "รีด",
    "เรียม",
    "เร",
    "โร",
    "ลิง",
    "ลูก",
    "ลุง",
    "ลิ้ม",
    "ลิป",
    "ล่าม",
    "เลน",
    "เลม",
    "วิน",
    "วัด",
    "เว็บ",
    "โว",
    "วอน",
    "วีน",
    "ไว",
    "ไวท์",
    "ศิษ",
    "ศิลป์",
    "ศีล",
    "เศรษฐ์",
    "เศี่ยง",
    "สิง",
    "สี",
    "สุก",
    "ส้ม",
    "หนึ่ง",
    "หิน",
    "หอม",
    "หมู",
    "หิว",
    "หัว",
    "โห",
    "ไฮ",
    "ออย",
    "อ้อม",
    "อิ๋ม",
    "อุ๋ง",
    "อึ่ง",
    "อ่าง",
    "โอ",
    "ไอซ์",
    "กบ",
    "กิ๊ฟฟี่",
    "กิ้ม",
    "กอล์ฟ",
    "แก้ม",
    "ใข่",
    "โข้ง",
    "จิ๊บ",
    "จิ๋ว",
    "จูน",
    "โจ",
    "ไจ๋",
    "เชอร์รี่",
    "ช้อย",
    "เด็ก",
    "ดีเจ",
    "โดนัท",
    "ตาล",
    "โต๊ะ",
    "เท่ง",
    "น้อง",
    "บิง",
    "บู",
    "เบียร์",
    "ปอน",
    "ผัด",
    "พิซซ่า",
    "ฟิตซ์",
    "มะปราง",
    "มิกกี้",
    "เมล์",
    "ย้อม",
    "รูธ",
    "ลิซ่า",
    "วิค",
    "โซดา",
    "แฮม",
    "ออร์",
    "ไฮดี้",
    "โคโค่",
    "ปังปอนด์",
  ];

  const tsContent = `/**
 * Thai Names Corpus Dataset
 *
 * Data sourced from: https://github.com/korkeatw/thai-names-corpus
 * Original author: Korkeat Wannapat
 * License: Creative Commons Attribution-ShareAlike 4.0 International Public License
 *
 * Dataset contains:
 * - Male names: ${maleNames.length.toLocaleString()} entries
 * - Female names: ${femaleNames.length.toLocaleString()} entries
 * - Family names: ${familyNames.length.toLocaleString()} entries
 * - Common nicknames: ${commonNicknames.length.toLocaleString()} entries
 *
 * Total: ${(maleNames.length + femaleNames.length + familyNames.length + commonNicknames.length).toLocaleString()} entries
 */

export interface ThaiNamesData {
  firstNames: {
    male: string[];
    female: string[];
  };
  surnames: string[];
  nicknames: string[];
}

export const thaiNamesData: ThaiNamesData = {
  firstNames: {
    male: ${JSON.stringify(maleNames, null, 6)},
    female: ${JSON.stringify(femaleNames, null, 6)},
  },
  surnames: ${JSON.stringify(familyNames, null, 4)},
  nicknames: ${JSON.stringify(commonNicknames, null, 4)},
};

/**
 * Get random Thai name by type and gender
 * @param type - Type of name to generate
 * @param gender - Gender for first names (ignored for surnames/nicknames)
 */
export function getRandomThaiName(
  type: 'firstName' | 'surname' | 'nickname',
  gender?: 'male' | 'female'
): string {
  switch (type) {
    case 'firstName':
      const pool = gender === 'female'
        ? thaiNamesData.firstNames.female
        : thaiNamesData.firstNames.male;
      return pool[Math.floor(Math.random() * pool.length)] || '';
    case 'surname':
      return thaiNamesData.surnames[Math.floor(Math.random() * thaiNamesData.surnames.length)] || '';
    case 'nickname':
      return thaiNamesData.nicknames[Math.floor(Math.random() * thaiNamesData.nicknames.length)] || '';
    default:
      return '';
  }
}

/**
 * Generate full Thai name with multiple components
 * @param options - Generation options
 */
export function generateThaiName(options: {
  includeFirstName?: boolean;
  includeSurname?: boolean;
  includeNickname?: boolean;
  gender?: 'male' | 'female';
}) {
  const {
    includeFirstName = true,
    includeSurname = true,
    includeNickname = false,
    gender = Math.random() < 0.5 ? 'male' : 'female'
  } = options;

  const result: {
    firstName?: string;
    surname?: string;
    nickname?: string;
    fullName?: string;
  } = {};

  if (includeFirstName) {
    result.firstName = getRandomThaiName('firstName', gender);
  }

  if (includeSurname) {
    result.surname = getRandomThaiName('surname');
  }

  if (includeNickname) {
    result.nickname = getRandomThaiName('nickname');
  }

  // Generate full name if we have first name or surname
  if (result.firstName || result.surname) {
    result.fullName = [result.firstName, result.surname]
      .filter(Boolean)
      .join(' ');
  }

  return result;
}
`;

  // Write to the data file
  const outputPath = join("src", "lib", "data", "thai-names.ts");
  writeFileSync(outputPath, tsContent);

  console.log(`✅ Generated ${outputPath}`);
  console.log(
    `📊 Total names: ${(maleNames.length + femaleNames.length + familyNames.length + commonNicknames.length).toLocaleString()}`,
  );
}

// Run the script
generateTypescriptFile();

export {};
