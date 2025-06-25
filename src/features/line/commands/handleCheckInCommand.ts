import { db } from "@/lib/database";
import { utils } from "@/lib/validation";
import { bubbleTemplate } from "@/lib/validation/line";
import { sendMessage } from "@/lib/utils/line-utils";
import { flexMessage } from "@/lib/utils/line-message-utils";

export const handleCheckInCommand = async (req: any) => {
  const directCheckinUserId = req.body.events[0].source.userId;
  const directCheckinUserAccount = await db.account.findFirst({
    where: { providerAccountId: directCheckinUserId },
  });
  const isDirectCheckinPermissionExpired =
    !directCheckinUserAccount ||
    !directCheckinUserAccount.expires_at ||
    !utils.compareDate(
      directCheckinUserAccount.expires_at.toString(),
      new Date().toISOString(),
    );
  if (isDirectCheckinPermissionExpired) {
    const payload = bubbleTemplate.signIn();
    return sendMessage(req, flexMessage(payload));
  }
  if (directCheckinUserAccount?.userId) {
    const { handleCheckIn } = await import("./handleCheckIn");
    await handleCheckIn(req, directCheckinUserAccount.userId);
  }
};
