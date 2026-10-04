/**
 * Format helper สำหรับ input จำนวนเงิน (ใช้ใน AddTransactionModal)
 * รับค่า raw จาก input แล้วคืนเป็นรูปแบบ "1,234.56"
 */

export function formatAmountInput(value: string): string {
  const stripped = value.replace(/[^0-9.]/g, "");
  if (!stripped) return "";
  const dotIndex = stripped.indexOf(".");
  const hasDot = dotIndex !== -1;
  const intPart = hasDot ? stripped.slice(0, dotIndex) : stripped;
  const decPart = hasDot
    ? stripped
        .slice(dotIndex + 1)
        .replace(/\./g, "")
        .slice(0, 2)
    : undefined;
  const formattedInt = intPart
    ? intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    : "0";
  return decPart !== undefined ? `${formattedInt}.${decPart}` : formattedInt;
}
