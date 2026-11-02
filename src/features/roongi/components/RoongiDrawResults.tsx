import type { Lottery } from "../lib/lottery";

interface RoongiDrawResultsProps {
  date?: string;
  hasError: boolean;
  lottery: Lottery | null;
}

const DRAW_PRIZES = [
  { key: "first", label: "รางวัลที่ 1" },
  { key: "last3f", label: "เลขหน้า 3 ตัว" },
  { key: "last3b", label: "เลขท้าย 3 ตัว" },
  { key: "last2", label: "เลขท้าย 2 ตัว" },
] as const;

export function RoongiDrawResults({
  date,
  hasError,
  lottery,
}: RoongiDrawResultsProps) {
  return (
    <section className="border-primary/20 bg-primary/5 rounded-xl border p-5 sm:p-7 md:col-start-2 md:row-span-2 md:row-start-1 md:self-start">
      <p className="text-primary text-sm font-semibold hover:underline focus-visible:outline-2 focus-visible:outline-offset-2">
        ผลสลากกินแบ่งรัฐบาล
      </p>
      <h2 className="mt-1 text-xl font-bold">
        {date ? `งวด ${date}` : "งวดล่าสุด"}
      </h2>
      {lottery ? (
        <div className="mt-6 space-y-5">
          {DRAW_PRIZES.map(({ key, label }) => (
            <div key={key}>
              <p className="text-muted-foreground text-sm">{label}</p>
              <p className="mt-1 font-mono text-2xl font-bold tracking-wider">
                {lottery.data[key].number.map(({ value }) => value).join("  ")}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground mt-6">
          {hasError ? "ไม่สามารถโหลดผลสลากได้" : "กำลังโหลดผลสลาก..."}
        </p>
      )}
      <p className="text-muted-foreground mt-8 text-xs">
        ที่มา: สำนักงานสลากกินแบ่งรัฐบาล
        โปรดตรวจสอบกับประกาศทางการและสลากใบจริงอีกครั้ง
      </p>
    </section>
  );
}
