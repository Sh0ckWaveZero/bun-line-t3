import { z } from "zod";

const prizeSchema = z.object({
  price: z.string().regex(/^\d+(?:\.\d{1,2})?$/),
  number: z.array(z.object({ value: z.string().regex(/^\d+$/) })).min(1),
});

export const lotterySchema = z
  .object({
    date: z.iso.date(),
    data: z.object({
      first: prizeSchema,
      second: prizeSchema,
      third: prizeSchema,
      fourth: prizeSchema,
      fifth: prizeSchema,
      near1: prizeSchema,
      last2: prizeSchema,
      last3f: prizeSchema,
      last3b: prizeSchema,
    }),
  })
  .superRefine(({ data }, context) => {
    const requirements = [
      ["first", 1, 6],
      ["second", 5, 6],
      ["third", 10, 6],
      ["fourth", 50, 6],
      ["fifth", 100, 6],
      ["near1", 2, 6],
      ["last2", 1, 2],
      ["last3f", 2, 3],
      ["last3b", 2, 3],
    ] as const;
    for (const [key, count, length] of requirements) {
      const numbers = data[key].number;
      if (
        numbers.length !== count ||
        numbers.some(({ value }) => value.length !== length)
      ) {
        context.addIssue({
          code: "custom",
          path: ["data", key],
          message: "Incomplete lottery results",
        });
      }
    }
  });

export type Lottery = z.infer<typeof lotterySchema>;

const prizes = [
  ["first", "รางวัลที่ 1", 6],
  ["near1", "รางวัลข้างเคียงรางวัลที่ 1", 6],
  ["second", "รางวัลที่ 2", 6],
  ["third", "รางวัลที่ 3", 6],
  ["fourth", "รางวัลที่ 4", 6],
  ["fifth", "รางวัลที่ 5", 6],
  ["last3f", "เลขหน้า 3 ตัว", 3],
  ["last3b", "เลขท้าย 3 ตัว", 3],
  ["last2", "เลขท้าย 2 ตัว", 2],
] as const;

export function checkTicket(ticket: string, lottery: Lottery) {
  const matches = prizes.flatMap(([key, label, length]) => {
    const value =
      key === "last3f" ? ticket.slice(0, length) : ticket.slice(-length);
    return lottery.data[key].number
      .filter((number) => number.value === value)
      .map(() => ({ label, price: Number(lottery.data[key].price) }));
  });
  const near = prizes
    .filter(
      ([key]) =>
        key !== "near1" &&
        !(
          key === "first" &&
          matches.some((match) => match.label === "รางวัลข้างเคียงรางวัลที่ 1")
        ),
    )
    .flatMap(([key, label, length]) => {
      const value =
        key === "last3f" ? ticket.slice(0, length) : ticket.slice(-length);
      return lottery.data[key].number.flatMap(({ value: winning }) => {
        const differences = [...value].filter(
          (digit, index) => digit !== winning[index],
        ).length;
        const delta = Number(winning) - Number(value);
        const alternative =
          key === "last3f"
            ? winning + ticket.slice(length)
            : ticket.slice(0, ticket.length - length) + winning;
        return differences > 0 &&
          (differences <= (key === "first" ? 2 : 1) || Math.abs(delta) === 1)
          ? [
              {
                label,
                winning,
                differences,
                alternative,
                ...(Math.abs(delta) === 1
                  ? {
                      adjustment: {
                        direction: delta > 0 ? "เพิ่ม" : "ลด",
                        segment:
                          key === "last3f"
                            ? "เลขหน้า 3 ตัว"
                            : key === "last3b"
                              ? "เลขท้าย 3 ตัว"
                              : key === "last2"
                                ? "เลขท้าย 2 ตัว"
                                : "เลขสลาก",
                      },
                    }
                  : {}),
              },
            ]
          : [];
      });
    });
  return { matches, near };
}
