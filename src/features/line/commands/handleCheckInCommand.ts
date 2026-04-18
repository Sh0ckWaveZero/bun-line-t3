import { bubbleTemplate } from "@/lib/validation/line";
import { sendMessage } from "@/lib/utils/line-utils";
import { flexMessage } from "@/lib/utils/line-message-utils";
import { getLineUserAccount } from "@/features/line/utils/getLineUserAccount";

export const handleCheckInCommand = async (req: any) => {
  const directCheckinUserAccount = await getLineUserAccount(req.body.events[0]);
  if (!directCheckinUserAccount) {
    const payload = bubbleTemplate.signIn();
    return sendMessage(req, flexMessage(payload));
  }
  if (directCheckinUserAccount?.userId) {
    const { handleCheckIn } = await import("./handleCheckIn");
    await handleCheckIn(req, directCheckinUserAccount.userId);
  }
};
