/** ดาวน์โหลด PDF ของรายงาน (client) — ผ่าน <a> เพื่อไม่โดน popup blocker */
export const downloadOnsiteReportPdf = (id: string): void => {
  const anchor = document.createElement("a");
  anchor.href = `/api/onsite-reports/${encodeURIComponent(id)}/pdf`;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
};
