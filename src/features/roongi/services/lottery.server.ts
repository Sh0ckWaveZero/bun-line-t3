import { lotterySchema } from "../lib/lottery";

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
