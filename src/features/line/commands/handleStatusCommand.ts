import { db } from "@/lib/database";
import { utils } from "@/lib/validation";
import { bubbleTemplate } from "@/lib/validation/line";
import { sendMessage } from "@/lib/utils/line-utils";
import { flexMessage } from "@/lib/utils/line-message-utils";

export const handleStatusCommand = async (req: any) => {
  const statusUserId = req.body.events[0].source.userId;
  const statusUserAccount = await db.account.findFirst({
    where: { providerAccountId: statusUserId },
  });
  const isStatusPermissionExpired =
    !statusUserAccount ||
    !statusUserAccount.expires_at ||
    !utils.compareDate(
      statusUserAccount.expires_at.toString(),
      new Date().toISOString(),
    );
  if (isStatusPermissionExpired) {
    const payload = bubbleTemplate.signIn();
    return sendMessage(req, flexMessage(payload));
  }
  if (statusUserAccount?.userId) {
    const { handleWorkStatus } = await import("./handleWorkStatus");
    await handleWorkStatus(req, statusUserAccount.userId);
  }
};
