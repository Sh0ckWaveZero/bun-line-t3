// import { db } from "~/server/db";
import { db } from "~/server/db";

function findBySymbol(symbol: string) {
  return db.cmc.findFirst({
    where: {
      symbol: symbol,
    },
  });
}

function addMany(items: any[]) {
  return db.cmc.createMany({
    data: items,
  });
}

export const cmcRepository = {
  findBySymbol,
  addMany,
}
