import type { PageNumItem } from "@/features/dca/types/records-table";

/** สร้างรายการเลขหน้าพร้อมจุดไข่ปลาตามหน้าปัจจุบัน */
const computePageNums = (
  totalPages: number,
  curPage: number,
): Array<number | "..."> => {
  if (totalPages <= 7)
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  if (curPage <= 4) return [1, 2, 3, 4, 5, "...", totalPages];
  if (curPage >= totalPages - 3)
    return [
      1,
      "...",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  return [1, "...", curPage - 1, curPage, curPage + 1, "...", totalPages];
};

/** สร้างรายการเลขหน้าพร้อม key ที่ไม่ซ้ำสำหรับตัวแบ่งหน้า */
export const computePageItems = (
  totalPages: number,
  curPage: number,
): PageNumItem[] => {
  let ellipsisNumber = 0;

  return computePageNums(totalPages, curPage).map((page) => ({
    key: page === "..." ? `ellipsis-${ellipsisNumber++}` : `page-${page}`,
    page,
  }));
};
