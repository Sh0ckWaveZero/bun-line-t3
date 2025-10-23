import { generatePersonalText } from "@/lib/ai/text-generation";
import { db as prisma } from "@/lib/database/db";

const { sendMessage } = await import("@/lib/utils/line-utils");

/**
 * Handle natural language command routing
 */
export async function handleCommandRouting(req: any, naturalLanguage: string) {
  try {
    const userId = req.body.events[0].source.userId;

    // 🔥 Fetch user data (name and image) from DB
    console.log(`📢 Responding to user ${userId} with AI-generated personalized message`);

    let userName = "พื้นที่";
    let userImage: string | null = null;
    try {
      const user = await prisma.user.findUnique({
        where: { id: "68537c965b5bd5e41afec1d5" },
        select: { image: true, name: true },
      });
      userName = user?.name || "พื้นที่";
      userImage = user?.image || null;
    } catch (dbError) {
      console.error("Failed to fetch user data from DB:", dbError);
      // Continue with defaults
    }

    // Generate AI text with user's name
    let generatedText = "นะมันหล่อ ✨";
    try {
      const aiResponse = await generatePersonalText({
        personName: userName,
        context: "นะมันหล่อ",
      });
      generatedText = aiResponse.text;
      console.log(`✨ Generated AI text: ${generatedText}`);
    } catch (aiError) {
      console.error("Failed to generate AI text, using default:", aiError);
      // Fallback to default message
      generatedText = `นะมันหล่อ ${userName} ✨`;
    }

    // Fallback image if not found in DB
    const imageUrl = userImage || "https://example.com/default-image.jpg";

    const flexMessage = {
      type: "flex",
      altText: generatedText,
      contents: {
        type: "bubble",
        body: {
          type: "box",
          layout: "vertical",
          spacing: "md",
          contents: [
            {
              type: "image",
              url: imageUrl,
              size: "full",
              aspectRatio: "1:1",
              aspectMode: "cover",
            },
            {
              type: "box",
              layout: "vertical",
              spacing: "sm",
              paddingAll: "lg",
              backgroundColor: "#ffffff",
              cornerRadius: "md",
              contents: [
                {
                  type: "text",
                  text: generatedText,
                  size: "sm",
                  weight: "bold",
                  align: "center",
                  color: "#FF6B9D",
                  wrap: true,
                  maxLines: 3,
                },
                {
                  type: "text",
                  text: "✨ 100%",
                  size: "xs",
                  align: "center",
                  color: "#999999",
                  margin: "md",
                },
              ],
            },
          ],
        },
      },
    };

    await sendMessage(req, [flexMessage]);
  } catch (error) {
    console.error("❌ Error in command routing:", error);
    throw error;
  }
}
