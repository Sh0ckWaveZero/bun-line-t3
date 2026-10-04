/** นามสกุลไฟล์ที่รองรับสำหรับนำเข้าประวัติ Auto DCA */
export const ACCEPTED_EXTS = [".csv", ".json", ".xlsx"] as const;

/** MIME types ที่รองรับสำหรับ input file */
export const ACCEPTED_MIME = [
  "text/csv",
  "application/json",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
].join(",");
