import { db } from "../../../lib/database/db";
import { bubbleTemplate } from "@/lib/validation/line";
import { sendMessage } from "../../../lib/utils/line-utils";
import { flexMessage } from "@/lib/utils/line-message-utils";
import { handleReportMenu } from "./handleReportMenu";

export const handleReportCommand = async (req: any) => {
  const userId = req.body.events[0].source.userId;
  const userAccount = await db.account.findFirst({
    where: { accountId: userId },
  });
  if (!userAccount) {
    const payload = bubbleTemplate.signIn();
    return sendMessage(req, flexMessage(payload));
  }

  await handleReportMenu(req);
};
