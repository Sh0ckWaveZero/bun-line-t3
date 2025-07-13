import { NextApiRequest, NextApiResponse } from "next";
import { handleLogin } from "../commands/handleLogin";
import { handleLocation } from "../commands/handleLocation";
import { handleSticker } from "../commands/handleSticker";
import { handlePostback } from "../commands/handlePostback";
import { handleText } from "../commands/handleText";

const handleEvent = (req: NextApiRequest, res: NextApiResponse): any => {
  const events = req.body.events;
  console.log("🚀 LINE handleEvent - processing events:", events.length);
  events.forEach((event: any, index: number) => {
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
            handleSticker(req, event);
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
  });
};

export const lineService = { handleEvent };
