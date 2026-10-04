/** จัดรูปแบบจำนวนเต็มพร้อมเครื่องหมายคั่นหลัก */
export const fmtInt = (n: number): string =>
  Math.round(n).toLocaleString("en-US");

/** จัดรูปแบบตัวเลข THB แบบคงที่ 2 ตำแหน่ง */
export const fmtThb = (n: number, d = 2): string =>
  n.toLocaleString("en-US", {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });

/** จัดรูปแบบวันที่แบบสั้นตามเวลาประเทศไทย เช่น "05 Jan 2025" */
export const fmtDateShort = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Bangkok",
  });
};
