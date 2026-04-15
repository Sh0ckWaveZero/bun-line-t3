import { handleLogin } from "../commands/handleLogin";
import { handleLocation } from "../commands/handleLocation";
import { handleSticker } from "../commands/handleSticker";
import { handlePostback } from "../commands/handlePostback";
import { handleText } from "../commands/handleText";
import { handleApprovalCheck } from "../commands/handleApprovalCheck";

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

  if (!Array.isArray(events) || events.length === 0) {
    return res.status(400).json({ error: "No events to process" });
  }

  // 🔒 ตรวจสอบการอนุมัติก่อนทำงาน
  // ใช้ req แรกเพื่อ check user (กรณีหลาย events ใน batch ใช้ userId เดียวกัน)
  const isApproved = await handleApprovalCheck(req);
  if (!isApproved) {
    // user ยังไม่ได้รับการอนุมัติ — ได้ส่งข้อความแจ้งไปแล้ว หยุดประมวลผล
    return res.status(200).json({ message: "pending approval" });
  }

  for (let index = 0; index < events.length; index++) {
    const event = events[index];

    switch (event.type) {
      case "message":
        switch (event.message.type) {
          case "text":
            if (event.message.text.startsWith("/")) {
              await handleText(req, event.message.text);
            } else {
              await handleLogin(req, event.message.text);
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
