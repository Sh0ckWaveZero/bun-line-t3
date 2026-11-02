import { lotterySchema } from "../lib/lottery";
import { z } from "zod";

const archiveSchema = z.object({
  total: z.number().int().nonnegative(),
  lottery: z.array(z.object({ date: z.iso.date() })),
});

async function postGlo(path: string, payload: unknown): Promise<unknown> {
  const response = await fetch(`https://www.glo.or.th${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error("Lottery source unavailable");
  const body: unknown = await response.json();
  const envelope = z
    .object({ status: z.literal(true), response: z.unknown() })
    .parse(body);
  return envelope.response;
}

export async function getLotteryArchive(page: number) {
  const result = archiveSchema.parse(
    await postGlo("/api/lottery/getLotteryResultByPage", { page }),
  );
  return { total: result.total, dates: result.lottery.map(({ date }) => date) };
}

export async function getLotteryByDate(date: string) {
  const [year, month, day] = date.split("-");
  const body = z
    .object({ result: z.unknown() })
    .parse(
      await postGlo("/api/checking/getLotteryResult", {
        date: day,
        month,
        year,
      }),
    );
  const lottery = lotterySchema.parse(body.result);
  if (lottery.date !== date) throw new Error("Lottery date mismatch");
  return lottery;
}

export async function getLatestLottery() {
  const response = await fetch(
    "https://www.glo.or.th/api/lottery/getLatestLottery",
    {
      method: "POST",
      signal: AbortSignal.timeout(10000),
    },
  );
  if (!response.ok) throw new Error("Lottery source unavailable");
  const body: unknown = await response.json();
  const parsed = lotterySchema.safeParse(
    typeof body === "object" && body !== null && "response" in body
      ? body.response
      : null,
  );
  if (!parsed.success) throw new Error("Invalid lottery data");
  return parsed.data;
}
