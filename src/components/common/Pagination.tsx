import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PaginationClassNames {
  root?: string;
  info?: string;
  button?: string;
  activeButton?: string;
  mobileCurrent?: string;
  ellipsis?: string;
  input?: string;
  cancelButton?: string;
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  idPrefix?: string;
  classNames?: PaginationClassNames;
}

export const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  idPrefix = "dca-pagination",
  classNames,
}: PaginationProps) => {
  const [jumpInput, setJumpInput] = useState("");
  const [showJumpInput, setShowJumpInput] = useState(false);

  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    pages.push(1);
    if (currentPage > 3) pages.push("...");

    for (
      let pageNumber = Math.max(2, currentPage - 1);
      pageNumber <= Math.min(totalPages - 1, currentPage + 1);
      pageNumber++
    ) {
      pages.push(pageNumber);
    }

    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
    return pages;
  };

  const handleJumpToPage = () => {
    const nextPage = Number.parseInt(jumpInput, 10);
    if (nextPage >= 1 && nextPage <= totalPages) {
      onPageChange(nextPage);
      setShowJumpInput(false);
      setJumpInput("");
    }
  };

  return (
    <div
      id={idPrefix}
      className={cn(
        "flex w-full flex-col items-stretch gap-3 py-4 sm:items-center",
        classNames?.root,
      )}
    >
      <div
        id={`${idPrefix}-info`}
        className={cn(
          "text-muted-foreground text-center text-sm",
          classNames?.info,
        )}
      >
        หน้า {currentPage} จาก {totalPages} (ทั้งหมด {totalPages} หน้า)
      </div>

      <div
        id={`${idPrefix}-controls`}
        className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-2 sm:flex sm:w-auto sm:justify-center sm:gap-1"
      >
        <Button
          id={`${idPrefix}-first-button`}
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1 || totalPages <= 1}
          className={cn("hidden h-8 px-2 sm:inline-flex", classNames?.button)}
          title="หน้าแรก"
        >
          « หน้าแรก
        </Button>

        <Button
          id={`${idPrefix}-previous-button`}
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1 || totalPages <= 1}
          className={cn(
            "h-10 min-w-0 px-3 sm:h-8 sm:w-8 sm:p-0",
            classNames?.button,
          )}
          title="ก่อนหน้า"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="ml-1 sm:hidden">ก่อนหน้า</span>
        </Button>

        <div
          id={`${idPrefix}-mobile-current`}
          className={cn(
            "bg-muted text-foreground flex h-10 min-w-16 items-center justify-center rounded-md px-3 text-sm font-medium sm:hidden",
            classNames?.mobileCurrent,
          )}
        >
          {currentPage}
        </div>

        <div
          id={`${idPrefix}-pages`}
          className="hidden items-center gap-1 sm:flex"
        >
          {getPageNumbers().map((pageNumber, index) =>
            pageNumber === "..." ? (
              <span
                id={`${idPrefix}-ellipsis-${index}`}
                key={`ellipsis-${index}`}
                className={cn(
                  "text-muted-foreground px-2 text-sm",
                  classNames?.ellipsis,
                )}
              >
                ...
              </span>
            ) : (
              <Button
                id={`${idPrefix}-page-${pageNumber}`}
                key={pageNumber}
                variant={currentPage === pageNumber ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(pageNumber)}
                className={cn(
                  "h-8 w-8 p-0",
                  currentPage === pageNumber
                    ? cn(
                        "bg-primary text-primary-foreground",
                        classNames?.activeButton,
                      )
                    : classNames?.button,
                )}
              >
                {pageNumber}
              </Button>
            ),
          )}
        </div>

        <Button
          id={`${idPrefix}-next-button`}
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages || totalPages <= 1}
          className={cn(
            "h-10 min-w-0 px-3 sm:h-8 sm:w-8 sm:p-0",
            classNames?.button,
          )}
          title="หน้าถัดไป"
        >
          <span className="mr-1 sm:hidden">ถัดไป</span>
          <ChevronRight className="h-4 w-4" />
        </Button>

        <Button
          id={`${idPrefix}-last-button`}
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages || totalPages <= 1}
          className={cn("hidden h-8 px-2 sm:inline-flex", classNames?.button)}
          title="หน้าสุดท้าย"
        >
          หน้าสุดท้าย »
        </Button>
      </div>

      <div
        id={`${idPrefix}-jump-section`}
        className="flex w-full justify-center sm:w-auto"
      >
        {!showJumpInput ? (
          <Button
            id={`${idPrefix}-show-jump-button`}
            variant="outline"
            size="sm"
            onClick={() => setShowJumpInput(true)}
            className={cn(
              "h-10 w-full text-sm sm:h-8 sm:w-auto sm:px-3 sm:text-xs",
              classNames?.button,
            )}
            title="ไปยังหน้าที่ระบุ"
          >
            ไปหน้า...
          </Button>
        ) : (
          <div
            id={`${idPrefix}-jump-controls`}
            className="grid w-full grid-cols-[1fr_auto_auto] items-center gap-2 sm:flex sm:w-auto sm:gap-1"
          >
            <Input
              id={`${idPrefix}-jump-input`}
              type="number"
              min={1}
              max={totalPages}
              value={jumpInput}
              onChange={(event) => setJumpInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") handleJumpToPage();
                if (event.key === "Escape") {
                  setShowJumpInput(false);
                  setJumpInput("");
                }
              }}
              placeholder="หน้า"
              className={cn(
                "h-10 min-w-0 text-center text-sm sm:h-8 sm:w-20",
                classNames?.input,
              )}
            />
            <Button
              id={`${idPrefix}-jump-submit-button`}
              variant="outline"
              size="sm"
              onClick={handleJumpToPage}
              className={cn(
                "h-10 px-4 text-sm sm:h-8 sm:px-3 sm:text-xs",
                classNames?.button,
              )}
            >
              ไป
            </Button>
            <Button
              id={`${idPrefix}-jump-cancel-button`}
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowJumpInput(false);
                setJumpInput("");
              }}
              className={cn(
                "h-10 w-10 p-0 sm:h-8 sm:w-8",
                classNames?.cancelButton,
              )}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
