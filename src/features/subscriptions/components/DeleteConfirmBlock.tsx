import { Loader2 } from "lucide-react";

interface DeleteConfirmBlockProps {
  /** หัวข้อยืนยัน เช่น "⚠️ ยืนยันการลบ subscription นี้?" */
  title: string;
  /** คำอธิบายผลกระทบของการลบ */
  description: string;
  onCancel: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

/** แถบยืนยันการลบใน modal ของ feature subscriptions — ใช้ร่วมกันทุก modal */
export const DeleteConfirmBlock = ({
  title,
  description,
  onCancel,
  onDelete,
  isDeleting,
}: DeleteConfirmBlockProps) => (
  <div className="rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
    <p className="text-sm font-medium text-red-700 dark:text-red-400">
      {title}
    </p>
    <p className="mt-0.5 text-xs text-red-500 dark:text-red-500">
      {description}
    </p>
    <div className="mt-2 flex gap-2">
      <button
        type="button"
        onClick={onCancel}
        className="flex-1 rounded-lg border border-gray-200 py-1.5 text-xs font-medium text-gray-700 dark:border-gray-600 dark:text-gray-300"
      >
        ยกเลิก
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={isDeleting}
        className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-red-600 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
      >
        {isDeleting && <Loader2 className="h-3 w-3 animate-spin" />}
        ยืนยันลบ
      </button>
    </div>
  </div>
);
