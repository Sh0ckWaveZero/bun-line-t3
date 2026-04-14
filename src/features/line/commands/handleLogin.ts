import { db } from "../../../lib/database/db";
import { bubbleTemplate } from "@/lib/validation/line";
import { sendMessage } from "../../../lib/utils/line-utils";
import { flexMessage } from "@/lib/utils/line-message-utils";
import { handleText } from "./handleText";

export const handleLogin = async (req: any, message: string) => {
  const prefix = message[0] || "";

  if (!new Set(["/", "$"]).has(prefix)) {
    return;
  }

  const userId = req.body?.events?.[0]?.source?.userId;
  const userPermission: any = await db.account.findFirst({
    where: { accountId: userId },
  });

  if (!userPermission) {
    const payload = bubbleTemplate.signIn();
    return sendMessage(req, flexMessage(payload));
  }

  if (prefix === "/") {
    handleText(req, message);
  }
};
