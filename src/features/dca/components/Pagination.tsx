import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) => {
  const [jumpInput, setJumpInput] = useState("");
  const [showJumpInput, setShowJumpInput] = useState(false);

  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    pages.push(1);
    if (currentPage > 3) pages.push("...");

    for (
      let i = Math.max(2, currentPage - 1);
      i <= Math.min(totalPages - 1, currentPage + 1);
      i++
    ) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
    return pages;
  };

  const handleJumpToPage = () => {
    const page = parseInt(jumpInput);
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
      setShowJumpInput(false);
      setJumpInput("");
    }
  };

  return (
    <div
      id="dca-pagination"
      className="flex w-full flex-col items-stretch gap-3 py-4 sm:items-center"
    >
      <div
        id="dca-pagination-info"
        className="text-muted-foreground text-center text-sm"
      >
        หน้า {currentPage} จาก {totalPages} (ทั้งหมด {totalPages} หน้า)
      </div>

      <div
        id="dca-pagination-controls"
        className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-2 sm:flex sm:w-auto sm:justify-center sm:gap-1"
      >
        <Button
          id="dca-pagination-first-button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1 || totalPages <= 1}
          className="hidden h-8 px-2 sm:inline-flex"
          title="หน้าแรก"
        >
          « หน้าแรก
        </Button>

        <Button
          id="dca-pagination-previous-button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1 || totalPages <= 1}
          className="h-10 min-w-0 px-3 sm:h-8 sm:w-8 sm:p-0"
          title="ก่อนหน้า"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="ml-1 sm:hidden">ก่อนหน้า</span>
        </Button>

        <div
          id="dca-pagination-mobile-current"
          className="bg-muted text-foreground flex h-10 min-w-16 items-center justify-center rounded-md px-3 text-sm font-medium sm:hidden"
        >
          {currentPage}
        </div>

        <div
          id="dca-pagination-pages"
          className="hidden items-center gap-1 sm:flex"
        >
          {getPageNumbers().map((page, idx) =>
            page === "..." ? (
              <span
                id={`dca-pagination-ellipsis-${idx}`}
                key={`ellipsis-${idx}`}
                className="text-muted-foreground px-2 text-sm"
              >
                ...
              </span>
            ) : (
              <Button
                id={`dca-pagination-page-${page}`}
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(page)}
                className={`h-8 w-8 p-0 ${
                  currentPage === page
                    ? "bg-primary text-primary-foreground"
                    : ""
                }`}
              >
                {page}
              </Button>
            ),
          )}
        </div>

        <Button
          id="dca-pagination-next-button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages || totalPages <= 1}
          className="h-10 min-w-0 px-3 sm:h-8 sm:w-8 sm:p-0"
          title="หน้าถัดไป"
        >
          <span className="mr-1 sm:hidden">ถัดไป</span>
          <ChevronRight className="h-4 w-4" />
        </Button>

        <Button
          id="dca-pagination-last-button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages || totalPages <= 1}
          className="hidden h-8 px-2 sm:inline-flex"
          title="หน้าสุดท้าย"
        >
          หน้าสุดท้าย »
        </Button>
      </div>

      <div
        id="dca-pagination-jump-section"
        className="flex w-full justify-center sm:w-auto"
      >
        {!showJumpInput ? (
          <Button
            id="dca-pagination-show-jump-button"
            variant="outline"
            size="sm"
            onClick={() => setShowJumpInput(true)}
            className="h-10 w-full text-sm sm:h-8 sm:w-auto sm:px-3 sm:text-xs"
            title="ไปยังหน้าที่ระบุ"
          >
            ไปหน้า...
          </Button>
        ) : (
          <div
            id="dca-pagination-jump-controls"
            className="grid w-full grid-cols-[1fr_auto_auto] items-center gap-2 sm:flex sm:w-auto sm:gap-1"
          >
            <Input
              id="dca-pagination-jump-input"
              type="number"
              min={1}
              max={totalPages}
              value={jumpInput}
              onChange={(e) => setJumpInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleJumpToPage();
                if (e.key === "Escape") {
                  setShowJumpInput(false);
                  setJumpInput("");
                }
              }}
              placeholder="หน้า"
              className="h-10 min-w-0 text-center text-sm sm:h-8 sm:w-20"
            />
            <Button
              id="dca-pagination-jump-submit-button"
              variant="outline"
              size="sm"
              onClick={handleJumpToPage}
              className="h-10 px-4 text-sm sm:h-8 sm:px-3 sm:text-xs"
            >
              ไป
            </Button>
            <Button
              id="dca-pagination-jump-cancel-button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowJumpInput(false);
                setJumpInput("");
              }}
              className="h-10 w-10 p-0 sm:h-8 sm:w-8"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
