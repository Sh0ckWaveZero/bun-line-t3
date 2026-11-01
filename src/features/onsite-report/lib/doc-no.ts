/**
 * เดาเลข Doc No ถัดไปจาก Project Code
 * แพทเทิร์นจากชีตจริง: Project "PRJ-ABC-24-01" → Doc "PRJ-ABC-24-01-1002"
 * เลขรันเริ่มที่ 1001 และไล่จากเลขสูงสุดของ doc ที่มี prefix เดียวกัน
 */
export const suggestDocNo = (
  projectCode: string,
  existingDocNos: readonly string[],
): string => {
  const base = projectCode.trim();
  if (!base) return "";

  const prefix = `${base}-`;
  let maxSeq = 1000;
  for (const docNo of existingDocNos) {
    if (!docNo.startsWith(prefix)) continue;
    const seq = Number.parseInt(docNo.slice(prefix.length), 10);
    if (Number.isFinite(seq) && seq > maxSeq) maxSeq = seq;
  }
  return `${prefix}${maxSeq + 1}`;
};
