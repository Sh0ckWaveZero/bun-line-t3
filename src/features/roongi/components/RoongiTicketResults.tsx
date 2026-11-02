import type { RefObject } from "react";
import SplitFlapText from "./SplitFlapText/SplitFlapText";
import { checkTicket, type Lottery } from "../lib/lottery";
import type { LotteryTicket } from "./RoongiTicketForm";

interface RoongiTicketResultsProps {
  checkSequence: number;
  headingRef: RefObject<HTMLHeadingElement | null>;
  lottery: Lottery;
  tickets: readonly LotteryTicket[];
}

export function RoongiTicketResults({
  checkSequence,
  headingRef,
  lottery,
  tickets,
}: RoongiTicketResultsProps) {
  return (
    <section className="md:col-start-1" aria-live="polite">
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="mb-3 text-xl font-bold focus:outline-none"
      >
        ผลตรวจของคุณ
      </h2>
      <div className="grid gap-4">
        {tickets.map((ticket) => {
          const result = checkTicket(ticket.number, lottery);
          return (
            <article
              key={`${checkSequence}-${ticket.id}`}
              className={`roongi-result rounded-xl border p-5 ${result.matches.length ? "border-violet-300 bg-violet-50 dark:border-violet-700 dark:bg-violet-950/30" : result.near.length ? "border-fuchsia-400 bg-yellow-50 dark:border-fuchsia-500 dark:bg-fuchsia-950/30" : "bg-card"}`}
            >
              <p className="font-mono text-2xl font-bold tracking-widest">
                {ticket.number}
              </p>
              {result.matches.length ? (
                <>
                  <p className="text-primary mt-2 font-semibold">
                    ยินดีด้วย คุณถูกรางวัล!
                  </p>
                  <ul className="mt-2">
                    {result.matches.map((match) => (
                      <li key={match.label}>
                        {match.label} · {match.price.toLocaleString("th-TH")}{" "}
                        บาท
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="mt-2 font-semibold">ไม่ถูกรางวัล</p>
              )}
              {result.near.length > 0 && (
                <>
                  <p className="roongi-exclamation mt-4 text-xl font-bold text-fuchsia-800 dark:text-fuchsia-200">
                    รู้งี้...{" "}
                    <span className="text-foreground text-sm font-medium">
                      ถ้าเป็นเลขนี้ก็คงดี
                    </span>
                  </p>
                  <ul className="mt-3 space-y-3 text-sm">
                    {result.near.map((near) => (
                      <li
                        key={`${near.label}-${near.winning}`}
                        className="rounded-md bg-yellow-200 p-4 text-fuchsia-950 dark:bg-fuchsia-900/60 dark:text-fuchsia-50"
                      >
                        {near.adjustment ? (
                          <p className="roongi-wish text-base leading-relaxed font-bold text-fuchsia-950 dark:text-fuchsia-50">
                            <span className="roongi-wish-lead">รู้งี้...</span>{" "}
                            <span className="roongi-wish-action">
                              {near.adjustment.direction}
                              {near.adjustment.segment}อีก 1 ก็ดี
                            </span>
                          </p>
                        ) : (
                          <p>ถ้าเป็นเลขนี้ จะตรง{near.label}</p>
                        )}
                        {near.adjustment && (
                          <p className="mt-1 text-fuchsia-950 dark:text-fuchsia-100">
                            จะตรง{near.label} {near.winning}
                          </p>
                        )}
                        <div className="mt-2">
                          <SplitFlapText
                            text={near.alternative}
                            initialText={ticket.number}
                            charset="numeric"
                            padTo={6}
                            loop={false}
                            flipsPerChar={0}
                            startDelay={500}
                            flipDuration={0.4}
                            stagger={0.16}
                            fontSize={30}
                            gap={5}
                            tileRadius={5}
                            tileColor="#5b21b6"
                            textColor="#ffffff"
                            className={[...near.alternative]
                              .map((digit, position) =>
                                digit !== ticket.number[position]
                                  ? `roongi-diff-${position}`
                                  : "",
                              )
                              .join(" ")}
                          />
                        </div>
                        <p className="mt-1 text-fuchsia-950 dark:text-fuchsia-100">
                          ต่างจากเลขของคุณ {near.differences} หลัก · เลขรางวัล{" "}
                          {near.winning}
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
        การเปรียบเทียบตัวเลขนี้มีไว้เพื่อความสนุก ไม่ใช่รางวัล
        และไม่มีผลต่อโอกาสในงวดถัดไป
      </p>
    </section>
  );
}
