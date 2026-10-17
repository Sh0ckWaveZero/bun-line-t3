// เกณฑ์เตือนเงินทุน DCA: เงินบาทใน Bitkub ต่ำกว่าค่านี้ถือว่าต้องเติม
export const DCA_FUNDING_THRESHOLD_THB = 108;

export const isDcaFundingLow = (
  thbAvailable: number,
  threshold: number = DCA_FUNDING_THRESHOLD_THB,
): boolean => thbAvailable < threshold;

const formatThb = (value: number): string =>
  new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

export function buildDcaFundingAlertMessage(
  thbAvailable: number,
  threshold: number = DCA_FUNDING_THRESHOLD_THB,
): string {
  return [
    "💰 แจ้งเตือนเงินทุน DCA",
    `ยอดเงินบาทใน Bitkub ต่ำกว่า ${formatThb(threshold)} บาท`,
    `คงเหลือใช้ได้: ${formatThb(thbAvailable)} บาท`,
    "",
    "เติมเงินเพื่อรอบซื้อถัดไปได้แล้ว 🙏",
  ].join("\n");
}
