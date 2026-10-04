/**
 * Helper functions สำหรับการนำทาง billing month (YYYY-MM)
 */

export function prevMonth(billingMonth: string): string {
  const [y, m] = billingMonth.split("-").map(Number) as [number, number];
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function nextMonth(billingMonth: string): string {
  const [y, m] = billingMonth.split("-").map(Number) as [number, number];
  const d = new Date(y, m, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
