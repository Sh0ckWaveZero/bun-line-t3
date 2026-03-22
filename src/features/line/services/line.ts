import { NextApiRequest, NextApiResponse } from "next";
import { handleLogin } from "../commands/handleLogin";
import { handleLocation } from "../commands/handleLocation";
import { handleSticker } from "../commands/handleSticker";
import { handlePostback } from "../commands/handlePostback";
import { handleText } from "../commands/handleText";

const handleEvent = async (
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<any> => {
  const events = req.body?.events;

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
              handleText(req, event.message.text);
            } else {
              handleLogin(req, event.message.text);
            }
            break;
          case "sticker":
            await handleSticker(req, event);
            break;
          case "location":
            handleLocation(req, event);
            break;
          default:
            res.status(401).send("Invalid token");
            break;
        }
        break;
      case "postback":
        handlePostback(req, event);
        break;
      default:
        res.status(401).send("Invalid token");
    }
  }
};

export const lineService = { handleEvent };
