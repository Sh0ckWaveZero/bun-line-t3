/** โทนสีของการ์ดกำไร/ขาดทุน */
export type PnlTone = "profit" | "loss" | "neutral";

/** กำหนดโทนสีของการ์ด PnL จากเปอร์เซ็นต์กำไร/ขาดทุน */
export const getPnlTone = (pnlPercent: number | null): PnlTone => {
  if (pnlPercent !== null && pnlPercent >= 0) return "profit";
  if (pnlPercent !== null && pnlPercent < 0) return "loss";
  return "neutral";
};

/** คลาสพื้นหลังของการ์ด PnL ตามโทน */
export const PNL_CARD_BG_CLASSES: Record<PnlTone, string> = {
  profit: "bg-green-500/5",
  loss: "bg-red-500/5",
  neutral: "",
};

/** คลาสพื้นหลังของกล่องไอคอน PnL ตามโทน */
export const PNL_ICON_BG_CLASSES: Record<PnlTone, string> = {
  profit: "bg-green-500/10",
  loss: "bg-red-500/10",
  neutral: "bg-muted",
};

/** คลาสสีของไอคอน PnL ตามโทน */
export const PNL_ICON_TEXT_CLASSES: Record<PnlTone, string> = {
  profit: "text-green-500",
  loss: "text-red-500",
  neutral: "text-muted-foreground",
};
