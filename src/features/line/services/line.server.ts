import { z } from "zod";
import { handleLocation } from "../commands/handleLocation";
import { handleSticker } from "../commands/handleSticker";
import { handlePostback } from "../commands/handlePostback";
import { handleText } from "../commands/handleText";
import { handleApprovalCheck } from "../commands/handleApprovalCheck";
import { handleParsedDcaAdd } from "../commands/handleDcaCommand";
import { canAutoRecordDca } from "../line/permissions";
import {
  hasBitkubDcaLabels,
  parseBitkubDcaMessage,
} from "@/features/dca/helpers/parse-bitkub-dca";
import type { ParsedBitkubDcaMessage } from "@/features/dca/types";
import { sendLoadingAnimation } from "@/lib/utils/line-utils";

interface LineWebhookEvent {
  type?: string;
  webhookEventId?: string;
  source?: { type?: string; userId?: string };
  message?: { type?: string; text?: string; keywords?: string[] };
  [key: string]: unknown;
}
interface LineApiRequest {
  body?: { events?: LineWebhookEvent[]; [key: string]: unknown };
}
interface LineApiResponse {
  json: (data: unknown) => unknown;
  send: (data: unknown) => unknown;
  status: (code: number) => LineApiResponse;
}
type EventAction =
  | { kind: "command" | "sticker" | "location" | "postback" }
  | { kind: "auto-dca"; parsed: ParsedBitkubDcaMessage };

const getAction = (event: LineWebhookEvent): EventAction | null => {
  if (typeof event !== "object" || event === null) return null;
  if (event.type === "postback") return { kind: "postback" };
  if (event.type !== "message") return null;
  if (event.message?.type === "sticker") return { kind: "sticker" };
  if (event.message?.type === "location") return { kind: "location" };
  if (event.message?.type !== "text" || typeof event.message.text !== "string")
    return null;
  const text = event.message.text;
  if (text.startsWith("/")) return { kind: "command" };
  if (event.source?.type !== "user" || !hasBitkubDcaLabels(text)) return null;
  if (
    !z
      .object({
        webhookEventId: z.string().min(1),
        source: z.object({ userId: z.string().min(1) }),
      })
      .safeParse(event).success
  )
    return null;
  const parsed = parseBitkubDcaMessage(text);
  return parsed ? { kind: "auto-dca", parsed } : null;
};

const handleEvent = async (
  req: LineApiRequest,
  res: LineApiResponse,
): Promise<unknown> => {
  const events = req.body?.events;
  if (!Array.isArray(events) || events.length === 0)
    return res.status(400).json({ error: "No events to process" });
  // ประมวลผล event ควบคู่กันทุกตัว (Promise.all ตาม recipe ของ
  // react-doctor/async-await-in-loop) — owner ยอมรับ trade-off ชัดเจน:
  // reply ผ่าน LINE API อาจสลับลำดับในแชท และ event คู่ที่อ่านสถานะซ้อนกัน
  // (เช่น /dca add ตามด้วย /dca list) อาจแซงกัน ถ้า event ใด throw
  // Promise.all จะ reject → webhook ตอบ 500 ให้ LINE retry ทั้ง batch เหมือนเดิม
  await Promise.all(
    events.map(async (event) => {
      const action = getAction(event);
      if (!action) return;
      // สร้าง object ตรง ๆ (allowlist) — downstream อ่านแค่ body.events เสมอ
      const eventReq: LineApiRequest = { body: { events: [event] } };
      if (action.kind === "auto-dca") {
        if (await canAutoRecordDca(event.source!.userId!))
          await handleParsedDcaAdd(eventReq, action.parsed);
        return;
      }
      if (!(await handleApprovalCheck(eventReq))) return;
      switch (action.kind) {
        case "command":
          void sendLoadingAnimation(eventReq, 15);
          await handleText(eventReq, event.message!.text!);
          break;
        case "sticker":
          await handleSticker(eventReq, {
            ...event,
            message: { keywords: event.message?.keywords ?? [] },
          });
          break;
        case "location":
          await handleLocation(eventReq, event);
          break;
        case "postback":
          await handlePostback(eventReq, event);
          break;
      }
    }),
  );
  return res.status(200).json({ message: "ok" });
};

export const lineService = { handleEvent };
