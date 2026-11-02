import { Select } from "@/components/ui/select";
import { useDrawArchive } from "@/features/roongi/hooks/useDrawArchive";

interface DrawSelectorProps {
  selectedDate: string;
  latestDate: string | undefined;
  onChange: (date: string) => void;
}

export function DrawSelector({
  selectedDate,
  latestDate,
  onChange,
}: DrawSelectorProps) {
  const {
    archiveDates,
    archiveTotal,
    archiveError,
    isLoadingArchive,
    hasMoreArchive,
    loadMoreArchive,
    retryArchive,
  } = useDrawArchive();

  return (
    <div>
      <label htmlFor="draw-date" className="mb-1 block text-sm font-medium">
        งวดที่ตรวจ
      </label>
      <Select
        id="draw-date"
        value={selectedDate}
        onValueChange={(value) => {
          if (value !== selectedDate) onChange(value);
        }}
        className="h-12"
        options={[
          { value: "", label: "งวดล่าสุด" },
          ...archiveDates
            .filter((value) => value !== (selectedDate ? "" : latestDate))
            .map((value) => ({
              value,
              label: new Date(`${value}T12:00:00+07:00`).toLocaleDateString(
                "th-TH",
                {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  timeZone: "Asia/Bangkok",
                },
              ),
            })),
        ]}
      />
      {!archiveError &&
        hasMoreArchive &&
        archiveDates.length < archiveTotal && (
          <button
            type="button"
            disabled={isLoadingArchive}
            onClick={() => void loadMoreArchive()}
            className="text-primary mt-2 text-sm font-medium hover:underline disabled:opacity-50"
          >
            {isLoadingArchive
              ? "กำลังโหลดงวดเพิ่มเติม..."
              : "โหลดงวดย้อนหลังเพิ่มเติม"}
          </button>
        )}
      {archiveError && (
        <div className="mt-2 text-sm text-red-700 dark:text-red-400">
          <p role="alert">โหลดรายการงวดย้อนหลังไม่สำเร็จ</p>
          <button
            type="button"
            className="mt-1 underline"
            onClick={() => void retryArchive()}
          >
            ลองโหลดอีกครั้ง
          </button>
        </div>
      )}
    </div>
  );
}
