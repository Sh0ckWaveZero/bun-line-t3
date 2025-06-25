import { NextApiRequest, NextApiResponse } from "next";
import { handleLogin } from "../commands/handleLogin";
import { handleLocation } from "../commands/handleLocation";
import { handleSticker } from "../commands/handleSticker";
import { handlePostback } from "../commands/handlePostback";

const handleEvent = (req: NextApiRequest, res: NextApiResponse): any => {
  const events = req.body.events;
  events.forEach((event: any) => {
    switch (event.type) {
      case "message":
        switch (event.message.type) {
          case "text":
            handleLogin(req, event.message.text);
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
