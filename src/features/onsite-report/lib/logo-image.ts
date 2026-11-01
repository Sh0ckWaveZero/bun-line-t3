/**
 * ตรวจไฟล์โลโก้บริษัท (isomorphic — ใช้ทั้งฝั่ง API และ test)
 * ไม่เชื่อ Content-Type ที่ client ส่งมา: อ่าน magic bytes + ขนาดจากเนื้อไฟล์จริง
 */
/** ขนาดไฟล์สูงสุด 512KB — โลโก้ควรเล็ก และเก็บใน Postgres ตรง ๆ */
export const ONSITE_REPORT_LOGO_MAX_BYTES = 512 * 1024;

/** ด้านยาวสุดของรูป (px) — กันรูปใหญ่ผิดปกติ */
export const ONSITE_REPORT_LOGO_MAX_DIMENSION = 4000;

export const ONSITE_REPORT_LOGO_MIME_TYPES = [
  "image/png",
  "image/jpeg",
] as const;

export type OnsiteReportLogoMimeType =
  (typeof ONSITE_REPORT_LOGO_MIME_TYPES)[number];

export interface DetectedLogoImage {
  mimeType: OnsiteReportLogoMimeType;
  width: number;
  height: number;
}

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

const startsWith = (bytes: Uint8Array, signature: number[]): boolean =>
  signature.every((value, index) => bytes[index] === value);

const readUint32 = (bytes: Uint8Array, offset: number): number =>
  ((bytes[offset] ?? 0) * 2 ** 24) +
  ((bytes[offset + 1] ?? 0) << 16) +
  ((bytes[offset + 2] ?? 0) << 8) +
  (bytes[offset + 3] ?? 0);

const readUint16 = (bytes: Uint8Array, offset: number): number =>
  ((bytes[offset] ?? 0) << 8) + (bytes[offset + 1] ?? 0);

/** PNG: IHDR ต้องมาเป็น chunk แรก (offset 8) — กว้าง/สูงที่ offset 16/20 */
const detectPng = (bytes: Uint8Array): DetectedLogoImage | null => {
  if (!startsWith(bytes, PNG_SIGNATURE) || bytes.length < 24) return null;
  const isIhdr =
    bytes[12] === 0x49 &&
    bytes[13] === 0x48 &&
    bytes[14] === 0x44 &&
    bytes[15] === 0x52;
  if (!isIhdr) return null;
  return {
    mimeType: "image/png",
    width: readUint32(bytes, 16),
    height: readUint32(bytes, 20),
  };
};

/** JPEG: ไล่ marker หา SOFn (ยกเว้น DHT/JPG/DAC) เพื่ออ่านกว้าง/สูง */
const detectJpeg = (bytes: Uint8Array): DetectedLogoImage | null => {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = bytes[offset + 1] ?? 0;
    if (marker === 0xff) {
      offset += 1;
      continue;
    }
    // marker ที่ไม่มี payload
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2;
      continue;
    }
    const segmentLength = readUint16(bytes, offset + 2);
    const isStartOfFrame =
      marker >= 0xc0 &&
      marker <= 0xcf &&
      marker !== 0xc4 &&
      marker !== 0xc8 &&
      marker !== 0xcc;
    if (isStartOfFrame) {
      return {
        mimeType: "image/jpeg",
        height: readUint16(bytes, offset + 5),
        width: readUint16(bytes, offset + 7),
      };
    }
    if (segmentLength < 2) return null;
    offset += 2 + segmentLength;
  }
  return null;
};

export type LogoValidationResult =
  | { ok: true; image: DetectedLogoImage }
  | { ok: false; error: string };

/** ตรวจชนิด ขนาดไฟล์ (maxBytes) และมิติของรูป — ใช้กับโลโก้และลายเซ็น คืนข้อความภาษาไทยเมื่อไม่ผ่าน */
export const validateLogoImage = (
  bytes: Uint8Array,
  maxBytes: number = ONSITE_REPORT_LOGO_MAX_BYTES,
): LogoValidationResult => {
  if (bytes.length === 0) {
    return { ok: false, error: "ไฟล์ว่างเปล่า" };
  }
  if (bytes.length > maxBytes) {
    return { ok: false, error: `ไฟล์ใหญ่เกิน ${maxBytes / 1024}KB` };
  }
  const image = detectPng(bytes) ?? detectJpeg(bytes);
  if (!image) {
    return { ok: false, error: "รองรับเฉพาะไฟล์ PNG หรือ JPEG" };
  }
  if (image.width <= 0 || image.height <= 0) {
    return { ok: false, error: "อ่านขนาดรูปไม่ได้" };
  }
  if (
    image.width > ONSITE_REPORT_LOGO_MAX_DIMENSION ||
    image.height > ONSITE_REPORT_LOGO_MAX_DIMENSION
  ) {
    return {
      ok: false,
      error: `รูปใหญ่เกิน ${ONSITE_REPORT_LOGO_MAX_DIMENSION}px`,
    };
  }
  return { ok: true, image };
};
