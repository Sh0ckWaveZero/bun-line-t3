import { aqicnService } from "@/features/air-quality/services/aqicn.server";
import { sendMessage } from "../../../lib/utils/line-utils";
import { flexMessage, replyNotFound } from "@/lib/utils/line-message-utils";
import { getLineUserAccount } from "../utils/getLineUserAccount";

export const handleLocation = async (req: any, event: any) => {
  try {
    const account = await getLineUserAccount(event);
    if (!account) return;

    const { latitude, longitude, address } = event.message;
    const data = await aqicnService.getAirQualityData(latitude, longitude);

    const msg = aqicnService.buildBubble(data, address ?? "ตำแหน่งของคุณ");
    sendMessage(req, flexMessage(msg));
  } catch (err: any) {
    console.error("Location handling error:", err);
    replyNotFound(req);
  }
};
