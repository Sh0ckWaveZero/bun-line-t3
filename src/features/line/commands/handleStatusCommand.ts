import { bubbleTemplate } from "@/lib/validation/line";
import { sendMessage } from "@/lib/utils/line-utils";
import { flexMessage } from "@/lib/utils/line-message-utils";
import { getLineUserAccount } from "@/features/line/utils/getLineUserAccount";

export const handleStatusCommand = async (req: any) => {
  const statusUserAccount = await getLineUserAccount(req.body.events[0]);
  if (!statusUserAccount) {
    const payload = bubbleTemplate.signIn();
    return sendMessage(req, flexMessage(payload));
  }
  if (statusUserAccount?.userId) {
    const { handleWorkStatus } = await import("./handleWorkStatus");
    await handleWorkStatus(req, statusUserAccount.userId);
  }
};
