import { replyNotFound } from "@/lib/utils/line-message-utils";

export const handleDefaultCommand = (req: any) => {
  replyNotFound(req);
};
