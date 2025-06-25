import { exchangeService } from "@/features/crypto/services/exchange";
import { getFlexMessage } from "@/lib/utils/line-message-utils";

export const handleGoldCommand = async (req: any) => {
  const goldResult = await exchangeService.getGoldPrice();

  await getFlexMessage(req, [goldResult], "gold");
};
