import { sendMessage } from "@/lib/utils/line-utils";
import { getConsolationMessage } from "@/lib/utils/ai-message-generator";

/**
 * Handle sticker messages from LINE users
 * Responds with consolation messages for sad stickers using AI or fallback messages
 */

// Sticker keywords that trigger consolation responses
const SAD_STICKER_KEYWORDS = ["Sad", "Crying", "Tears", "anguish"] as const;

type SadStickerKeyword = typeof SAD_STICKER_KEYWORDS[number];

interface StickerEvent {
  message: {
    keywords: string[];
  };
}

/**
 * Checks if the sticker contains any sad keywords
 */
function isSadSticker(keywords: string[]): boolean {
  return keywords.some((keyword) => 
    SAD_STICKER_KEYWORDS.includes(keyword as SadStickerKeyword)
  );
}

/**
 * Handle sticker events from LINE webhook
 */
export const handleSticker = async (req: any, event: StickerEvent): Promise<void> => {
  try {
    if (!event.message?.keywords || !Array.isArray(event.message.keywords)) {
      return;
    }

    if (isSadSticker(event.message.keywords)) {
      console.log("🎭 Sad sticker detected, sending consolation message");
      
      const consolationMessage = await getConsolationMessage({ 
        useAI: true // Always try AI first, fallback handled in utils
      });
      
      await sendMessage(req, [{ 
        type: "text", 
        text: consolationMessage 
      }]);
    }
  } catch (error) {
    console.error("❌ Error in handleSticker:", error);
    // Don't throw - this is a non-critical feature
  }
};
