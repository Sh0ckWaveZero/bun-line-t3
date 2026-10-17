// เกณฑ์เตือนเงินทุน DCA: เงินบาทใน Bitkub ต่ำกว่าค่านี้ถือว่าต้องเติม
export const DCA_FUNDING_THRESHOLD_THB = 108;

export const isDcaFundingLow = (
  thbAvailable: number,
  threshold: number = DCA_FUNDING_THRESHOLD_THB,
): boolean => thbAvailable < threshold;
