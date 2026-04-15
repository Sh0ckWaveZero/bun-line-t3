import { airVisualService } from "@/features/air-quality/services/airvisual.server";
import { sendMessage } from "../../../lib/utils/line-utils";
import { flexMessage, replyNotFound } from "@/lib/utils/line-message-utils";
import { getLineUserAccount } from "../utils/getLineUserAccount";

export const handleLocation = async (req: any, event: any) => {
  try {
    const account = await getLineUserAccount(event);
    if (!account) return;

    const location: any = await airVisualService.getNearestCity(
      event.message.latitude,
      event.message.longitude,
    );
    const msg = airVisualService.getNearestCityBubble(location);
    sendMessage(req, flexMessage(msg));
  } catch (err: any) {
    console.error("Location handling error:", err);
    replyNotFound(req);
    return;
  }
};
