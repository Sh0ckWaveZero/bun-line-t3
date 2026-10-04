/**
 * Helper functions สำหรับจัดการข้อมูลสมาชิก
 */

/** แปลง tags (comma-separated) เป็นรายการ tag พร้อม key ที่ไม่ซ้ำกัน */
export function getMemberTags(memberId: string, tags: string) {
  const occurrences = new Map<string, number>();

  return tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((label) => {
      const occurrence = occurrences.get(label) ?? 0;
      occurrences.set(label, occurrence + 1);

      return { key: `${memberId}:${label}:${occurrence}`, label };
    });
}
