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

  // Validate events array
  if (!Array.isArray(events) || events.length === 0) {
    console.warn("⚠️ No valid events in request body");
    return res.status(400).json({ error: "No events to process" });
  }

  console.log("🚀 LINE handleEvent - processing events:", events.length);

  // Process events sequentially to handle async operations properly
  for (let index = 0; index < events.length; index++) {
    const event = events[index];
    console.log(
      `🚀 Processing event ${index + 1}:`,
      event.type,
      event.message?.type,
    );

    switch (event.type) {
      case "message":
        switch (event.message.type) {
          case "text":
            console.log("📝 Text message received:", event.message.text);
            // Check if it's a command (starts with /)
            if (event.message.text.startsWith("/")) {
              console.log("⚙️ Command detected, routing to handleText");
              handleText(req, event.message.text);
            } else {
              console.log("🔐 Non-command text, routing to handleLogin");
              handleLogin(req, event.message.text);
            }
            break;
          case "sticker":
            console.log("🎭 Sticker received, routing to handleSticker");
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
