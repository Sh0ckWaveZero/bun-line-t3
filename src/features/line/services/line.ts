import { handleLogin } from "../commands/handleLogin";
import { handleLocation } from "../commands/handleLocation";
import { handleSticker } from "../commands/handleSticker";
import { handlePostback } from "../commands/handlePostback";
import { handleText } from "../commands/handleText";

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
            res.status(401).send("Invalid token");
            break;
        }
        break;
      case "postback":
        await handlePostback(req, event);
        break;
      default:
        res.status(401).send("Invalid token");
    }
  }
};

export const lineService = { handleEvent };
