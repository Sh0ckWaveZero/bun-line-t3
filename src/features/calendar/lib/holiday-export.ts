/**
 * ดาวน์โหลดไฟล์ export วันหยุด (json/csv) จาก API แล้ว trigger save-as ในเบราว์เซอร์
 * ล้มเหลวเมื่อไหร่ก็เงียบไว้ (ผู้ใช้ไม่ได้รับผลกระทบอย่างอื่น)
 */
export async function downloadHolidaysExport(
  year: number,
  exportFormat: "json" | "csv",
): Promise<void> {
  try {
    const response = await fetch(
      `/api/holidays?year=${year}&export=${exportFormat}`,
    );
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `holidays-${year}.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  } catch {
    // ส่งออกไม่สำเร็จ: ไม่ต้องทำอะไรเพิ่ม
  }
}
