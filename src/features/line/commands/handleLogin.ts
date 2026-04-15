import { bubbleTemplate } from "@/lib/validation/line";
import { sendMessage } from "../../../lib/utils/line-utils";
import { flexMessage } from "@/lib/utils/line-message-utils";
import { handleText } from "./handleText";
import { getLineUserAccount } from "../utils/getLineUserAccount";

export const handleLogin = async (req: any, message: string) => {
  const prefix = message[0] || "";

  if (!new Set(["/", "$"]).has(prefix)) {
    return;
  }

  const event = req.body?.events?.[0];
  const userPermission = await getLineUserAccount(event);

  if (!userPermission) {
    const payload = bubbleTemplate.signIn();
    return sendMessage(req, flexMessage(payload));
  }

  if (prefix === "/") {
    handleText(req, message);
  }
};
