/** ดึงนามสกุลไฟล์ (ตัวพิมพ์เล็ก) จากชื่อไฟล์ เช่น "data.csv" → "csv" */
export const getFileExtension = (name: string): string | undefined =>
  name.split(".").pop()?.toLowerCase();
