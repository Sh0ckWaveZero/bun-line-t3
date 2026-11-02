import { useEffect, useState } from "react";
import { checkTicket, lotterySchema, type Lottery } from "../lib/lottery";

export function RoongiPage() {
  const [lottery, setLottery] = useState<Lottery | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [tickets, setTickets] = useState([""]);
  const [checked, setChecked] = useState<string[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(`/api/roongi?attempt=${attempt}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error();
        setLottery(lotterySchema.parse(await response.json()));
      } catch {
        if (!controller.signal.aborted)
          setError("โหลดผลสลากไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      }
    }
    void load();
    return () => controller.abort();
  }, [attempt]);

  const date =
    lottery &&
    new Date(`${lottery.date}T12:00:00+07:00`).toLocaleDateString("th-TH", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Asia/Bangkok",
    });
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:py-16">
      <div className="mb-10 max-w-2xl">
        <p className="mb-3 text-sm font-bold tracking-widest text-emerald-700 dark:text-emerald-400">
          ตรวจสลาก · สนุกกับตัวเลข
        </p>
        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
          รู้งิ<span className="text-emerald-600">.</span>
        </h1>
        <p className="text-muted-foreground mt-4 text-lg">
          ตรวจสลากของคุณ แล้วมาดูกันว่าใกล้รางวัลแค่ไหน
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <section className="bg-card rounded-3xl border p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-bold">ตรวจสลากของคุณ</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            กรอกหมายเลข 6 หลัก ตรวจได้หลายใบพร้อมกัน
          </p>
          <form
            className="mt-6 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              setChecked([...tickets]);
            }}
          >
            {tickets.map((ticket, index) => (
              <div key={index}>
                <label
                  htmlFor={`ticket-${index}`}
                  className="mb-1 block text-sm font-medium"
                >
                  สลากใบที่ {index + 1}
                </label>
                <div className="flex gap-2">
                  <input
                    id={`ticket-${index}`}
                    name={`ticket-${index}`}
                    value={ticket}
                    onChange={(event) => {
                      setTickets(
                        tickets.map((value, i) =>
                          i === index
                            ? event.target.value
                                .replace(/[^0-9]/g, "")
                                .slice(0, 6)
                            : value,
                        ),
                      );
                      setChecked([]);
                    }}
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    minLength={6}
                    maxLength={6}
                    required
                    placeholder="000000"
                    className="bg-background w-full rounded-xl border px-4 py-3 font-mono text-xl tracking-widest focus-visible:outline-2 focus-visible:outline-emerald-600"
                  />
                  {tickets.length > 1 && (
                    <button
                      type="button"
                      className="rounded-xl border px-3"
                      aria-label={`ลบสลากใบที่ ${index + 1}`}
                      onClick={() => {
                        setTickets(tickets.filter((_, i) => i !== index));
                        setChecked([]);
                      }}
                    >
                      ลบ
                    </button>
                  )}
                </div>
              </div>
            ))}
            <button
              type="button"
              className="text-sm font-semibold text-emerald-700 dark:text-emerald-400"
              onClick={() => setTickets([...tickets, ""])}
              disabled={tickets.length >= 20}
            >
              + เพิ่มสลากอีกใบ
            </button>
            <p className="text-muted-foreground text-sm">
              {date
                ? `งวดวันที่ ${date}`
                : error
                  ? "ไม่สามารถโหลดงวดล่าสุดได้"
                  : "กำลังโหลดงวดล่าสุด..."}
            </p>
            <button
              type="submit"
              disabled={!lottery}
              className="w-full rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
            >
              ตรวจสลาก
            </button>
          </form>
          {error && (
            <div role="alert" className="mt-4 text-red-700 dark:text-red-400">
              <p>{error}</p>
              <button
                type="button"
                className="mt-2 underline"
                onClick={() => {
                  setError("");
                  setAttempt((value) => value + 1);
                }}
              >
                ลองโหลดอีกครั้ง
              </button>
            </div>
          )}
        </section>
        <section className="bg-card rounded-3xl border p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            ผลสลากกินแบ่งรัฐบาล
          </p>
          <h2 className="mt-1 text-xl font-bold">
            {date ? `งวด ${date}` : "งวดล่าสุด"}
          </h2>
          {lottery ? (
            <div className="mt-6 space-y-5">
              {(
                [
                  ["first", "รางวัลที่ 1"],
                  ["last3f", "เลขหน้า 3 ตัว"],
                  ["last3b", "เลขท้าย 3 ตัว"],
                  ["last2", "เลขท้าย 2 ตัว"],
                ] as const
              ).map(([key, label]) => (
                <div key={key}>
                  <p className="text-muted-foreground text-sm">{label}</p>
                  <p className="mt-1 font-mono text-2xl font-bold tracking-wider">
                    {lottery.data[key].number
                      .map(({ value }) => value)
                      .join("  ")}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground mt-6">
              {error ? "ไม่สามารถโหลดผลสลากได้" : "กำลังโหลดผลสลาก..."}
            </p>
          )}
          <p className="text-muted-foreground mt-8 text-xs">
            ที่มา: สำนักงานสลากกินแบ่งรัฐบาล
            โปรดตรวจสอบกับประกาศทางการและสลากใบจริงอีกครั้ง
          </p>
        </section>
      </div>
      {lottery && checked.length > 0 && (
        <section className="mt-8" aria-live="polite">
          <h2 className="mb-4 text-2xl font-bold">ผลตรวจของคุณ</h2>
          <div className="grid gap-4">
            {checked.map((ticket, index) => {
              const result = checkTicket(ticket, lottery);
              return (
                <article
                  key={`${ticket}-${index}`}
                  className="bg-card rounded-2xl border p-5"
                >
                  <p className="font-mono text-2xl font-bold tracking-widest">
                    {ticket}
                  </p>
                  {result.matches.length ? (
                    <>
                      <p className="mt-2 font-semibold text-emerald-700 dark:text-emerald-400">
                        ยินดีด้วย คุณถูกรางวัล!
                      </p>
                      <ul className="mt-2">
                        {result.matches.map((match) => (
                          <li key={match.label}>
                            {match.label} ·{" "}
                            {match.price.toLocaleString("th-TH")} บาท
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <p className="mt-2 font-semibold">ไม่ถูกรางวัล</p>
                  )}
                  {result.near.length > 0 && (
                    <>
                      <p className="text-muted-foreground mt-2 text-sm">
                        รู้งี้... ใกล้ไปนิดเดียว
                      </p>
                      <ul className="mt-3 space-y-3 text-sm">
                        {result.near.map((near) => (
                          <li
                            key={`${near.label}-${near.winning}`}
                            className="rounded-xl border p-3"
                          >
                            <p>ถ้าซื้อเลขนี้ จะตรง{near.label}</p>
                            <p
                              className="mt-1 font-mono text-xl font-bold tracking-widest"
                              aria-label={`เลข ${near.alternative}`}
                            >
                              {[...near.alternative].map((digit, position) => (
                                <span
                                  key={`${position}-${digit}`}
                                  className={
                                    digit !== ticket[position]
                                      ? "text-emerald-700 underline decoration-2 underline-offset-4 dark:text-emerald-400"
                                      : undefined
                                  }
                                >
                                  {digit}
                                </span>
                              ))}
                            </p>
                            <p className="text-muted-foreground mt-1">
                              ต่างจากเลขของคุณ {near.differences} หลัก ·
                              เลขรางวัล {near.winning}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </article>
              );
            })}
          </div>
          <p className="text-muted-foreground mt-4 text-sm">
            เลขที่เฉียดเป็นการเปรียบเทียบเพื่อความสนุก ไม่ใช่รางวัล
            และไม่มีผลต่อโอกาสในงวดถัดไป
          </p>
        </section>
      )}
    </main>
  );
}
