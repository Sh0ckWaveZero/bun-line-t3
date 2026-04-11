import { Bitcoin } from "lucide-react";

export const DcaInfoBox = () => (
  <div
    id="dca-info-box"
    className="mt-6 rounded-lg border border-orange-500/30 bg-orange-500/5 p-4"
  >
    <h3
      id="dca-info-title"
      className="mb-1 flex items-center gap-2 text-sm font-semibold text-orange-500"
    >
      <Bitcoin className="h-4 w-4" />
      วิธีบันทึกประวัติ Auto DCA
    </h3>
    <ul id="dca-info-list" className="text-muted-foreground space-y-2 text-xs">
      <li id="dca-info-line-paste-item" className="space-y-1">
        <p id="dca-info-line-paste-label">
          📱 <strong>LINE Bot — paste ข้อความ Bitkub:</strong>
        </p>
        <code
          id="dca-info-line-paste-example"
          className="bg-muted block rounded px-2 py-1 font-mono leading-relaxed whitespace-pre-wrap"
        >
          {`/dca add 🤗🎉 You Spent : 107.99 THB\nPrice : 2330307.8 THB/BTC\nYou Received : 0.00004634 BTC\nTime : 2026-04-11T08:00:14.663+07:00`}
        </code>
      </li>
      <li id="dca-info-line-manual-item">
        🔢 <strong>LINE Bot — กรอกค่าทีละตัว:</strong>{" "}
        <code id="dca-info-line-manual-example" className="bg-muted rounded px-1">
          /dca add 107.99 BTC 0.00004634 2330307.8 2026-04-11
        </code>
      </li>
      <li id="dca-info-web-manual-item">
        ✏️ <strong>กรอกเองบนเว็บ:</strong> กดปุ่ม &ldquo;เพิ่มคำสั่งซื้อ&rdquo;
        แล้วกรอกข้อมูล
      </li>
      <li id="dca-info-help-item">
        📋 <strong>ดูคำสั่งทั้งหมด:</strong> พิมพ์{" "}
        <code id="dca-info-help-command" className="bg-muted rounded px-1">
          /dca help
        </code>{" "}
        ใน LINE
      </li>
    </ul>
  </div>
);
