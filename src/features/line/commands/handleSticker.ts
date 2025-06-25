import { CONSOLATION } from "@/lib/constants/common.constant";
import { utils } from "@/lib/validation";
import { sendMessage } from "../../../lib/utils/line-utils";

export const handleSticker = (req: any, event: any) => {
  const keywords: string[] = ["Sad", "Crying", "Tears", "anguish"];
  if (event.message.keywords.some((k: any) => keywords.includes(k))) {
    const text: string = utils.randomItems(CONSOLATION);
    sendMessage(req, [{ type: "text", text: text }]);
  }
};
