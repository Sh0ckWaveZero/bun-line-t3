import { openMeteoService } from "@/features/air-quality/services/open-meteo.server";
import { sendMessage } from "../../../lib/utils/line-utils";
import { flexMessage, replyNotFound } from "@/lib/utils/line-message-utils";
import { getLineUserAccount } from "../utils/getLineUserAccount";

export const handleLocation = async (req: any, event: any) => {
  try {
    const account = await getLineUserAccount(event);
    if (!account) return;

    const { latitude, longitude, address } = event.message;
    const { aq, weather } = await openMeteoService.getAirQualityData(
      latitude,
      longitude,
    );

    const msg = openMeteoService.buildBubble(aq, weather, address ?? "ตำแหน่งของคุณ");
    sendMessage(req, flexMessage(msg));
  } catch (err: any) {
    console.error("Location handling error:", err);
    replyNotFound(req);
  }
};
