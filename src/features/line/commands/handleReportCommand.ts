import { bubbleTemplate } from "@/lib/validation/line";
import { sendMessage } from "../../../lib/utils/line-utils";
import { flexMessage } from "@/lib/utils/line-message-utils";
import { handleReportMenu } from "./handleReportMenu";
import { getLineUserAccount } from "@/features/line/utils/getLineUserAccount";

export const handleReportCommand = async (req: any) => {
  const userAccount = await getLineUserAccount(req.body.events[0]);
  if (!userAccount) {
    const payload = bubbleTemplate.signIn();
    return sendMessage(req, flexMessage(payload));
  }

  await handleReportMenu(req);
};
