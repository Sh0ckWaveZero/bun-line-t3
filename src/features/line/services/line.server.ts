import { handleLocation } from "../commands/handleLocation";
import { handleSticker } from "../commands/handleSticker";
import { handlePostback } from "../commands/handlePostback";
import { handleText } from "../commands/handleText";
import { handleApprovalCheck } from "../commands/handleApprovalCheck";
import { sendLoadingAnimation } from "@/lib/utils/line-utils";

interface LineApiRequest {
  body?: {
    events?: any[];
  };
}

interface LineApiResponse {
  json: (data: any) => any;
  send: (data: any) => any;
  status: (code: number) => LineApiResponse;
}

const handleEvent = async (
  req: LineApiRequest,
  res: LineApiResponse,
): Promise<any> => {
  const events = (req.body as any)?.events;

  console.log(`📬 [lineService.handleEvent] Received ${events?.length || 0} events`);

  if (!Array.isArray(events) || events.length === 0) {
    return res.status(400).json({ error: "No events to process" });
  }

  // ข้ามข้อความธรรมดาที่ไม่ใช่คำสั่ง (ไม่ขึ้นต้นด้วย /)
  const hasActionableEvent = events.some((e) => {
    if (e.type === "postback") return true;
    if (e.type === "message" && e.message?.type === "sticker") return true;
    if (e.type === "message" && e.message?.type === "location") return true;
    if (e.type === "message" && e.message?.type === "text") {
      return e.message.text?.startsWith("/");
    }
    return false;
  });

  if (!hasActionableEvent) {
    return res.status(200).json({ message: "ok" });
  }

  // 🔒 ตรวจสอบการอนุมัติก่อนทำงาน
  // ใช้ req แรกเพื่อ check user (กรณีหลาย events ใน batch ใช้ userId เดียวกัน)
  console.log(`🔒 [lineService.handleEvent] Checking approval...`);
  const isApproved = await handleApprovalCheck(req);

  console.log(`✅ [lineService.handleEvent] Approval check result:`, {
    isApproved,
    eventType: events[0]?.type,
    messageType: events[0]?.message?.type,
  });

  if (!isApproved) {
    // user ยังไม่ได้รับการอนุมัติ — ได้ส่งข้อความแจ้งไปแล้ว หยุดประมวลผล
    console.log(`⏸️ [lineService.handleEvent] User not approved - returning pending approval`);
    return res.status(200).json({ message: "pending approval" });
  }

  for (let index = 0; index < events.length; index++) {
    const event = events[index];
    console.log(`🔄 [lineService.handleEvent] Processing event ${index + 1}/${events.length}:`, {
      type: event.type,
      messageType: event.message?.type,
      text: event.message?.text?.substring(0, 50),
    });

    switch (event.type) {
      case "message":
        switch (event.message.type) {
          case "text":
            if (event.message.text.startsWith("/")) {
              void sendLoadingAnimation(req, 15);
              await handleText(req, event.message.text);
            }
            break;
          case "sticker":
            await handleSticker(req, event);
            break;
          case "location":
            await handleLocation(req, event);
            break;
          default:
            // ประเภทข้อความที่ไม่รองรับ — ไม่ต้องทำอะไร LINE ต้องการแค่ 200 OK
            break;
        }
        break;
      case "postback":
        await handlePostback(req, event);
        break;
      default:
        // event type ที่ไม่รองรับ — ไม่ต้องทำอะไร LINE ต้องการแค่ 200 OK
        break;
    }
  }
};

export const lineService = { handleEvent };
