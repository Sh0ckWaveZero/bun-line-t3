/** คำใบ้รูปแบบคอลัมน์ที่จำเป็นสำหรับไฟล์นำเข้า */
export const DcaImportFormatHint = () => (
  <div
    id="dca-import-format-hint"
    className="bg-muted/30 text-muted-foreground space-y-1 rounded-lg px-4 py-3 text-xs"
  >
    <p className="text-foreground font-medium">คอลัมน์ที่จำเป็น:</p>
    <p>
      <span className="font-mono text-yellow-400">executedAt</span>,{" "}
      <span className="font-mono text-yellow-400">coin</span>,{" "}
      <span className="font-mono text-yellow-400">amountTHB</span>,{" "}
      <span className="font-mono text-yellow-400">coinReceived</span>,{" "}
      <span className="font-mono text-yellow-400">pricePerCoin</span>
    </p>
    <p>
      คอลัมน์เสริม: <span className="font-mono">status</span>,{" "}
      <span className="font-mono">note</span>
    </p>
  </div>
);
