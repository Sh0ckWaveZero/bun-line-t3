/** ขั้นตอนกำลังอัปโหลดของ modal นำเข้า */
export const DcaImportUploadingStep = () => (
  <div
    id="dca-import-step-uploading"
    className="flex flex-col items-center justify-center gap-4 py-12"
  >
    <span className="h-10 w-10 animate-spin rounded-full border-4 border-yellow-400 border-t-transparent" />
    <p className="text-muted-foreground text-sm">กำลังนำเข้าข้อมูล…</p>
  </div>
);
