/**
 * Spotify Command Handler
 *
 * Handles Spotify-related commands via /ai spotify [mood/query]
 */

import type { LineMessage } from "@/lib/types/line-messaging";
import { spotifyService } from "../services/spotifyService";
import {
  createSpotifyRecommendationsCarousel,
  createMoodSelectionMessage,
  createSpotifyErrorMessage,
} from "../templates/spotifyFlexTemplate";

const { sendMessage } = await import("@/lib/utils/line-utils");

// ============================================================================
// Types
// ============================================================================

type MoodType = "happy" | "sad" | "energetic" | "chill" | "party" | "focus";

const VALID_MOODS: MoodType[] = [
  "happy",
  "sad",
  "energetic",
  "chill",
  "party",
  "focus",
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if text is a valid mood
 */
function isValidMood(text: string): text is MoodType {
  return VALID_MOODS.includes(text.toLowerCase() as MoodType);
}

/**
 * Parse Spotify command
 * Examples:
 * - /ai spotify -> show mood selection
 * - /ai spotify happy -> get happy songs
 * - /ai spotify recommend pop -> search for pop recommendations
 */
function parseSpotifyCommand(text: string): {
  action: "mood-select" | "mood-recommend" | "search";
  mood?: MoodType;
  query?: string;
} {
  const parts = text.trim().toLowerCase().split(/\s+/);

  // Remove '/ai' and 'spotify' (or 'เพลง', 'music') from parts
  const relevantParts = parts.filter(
    (p) => p !== "/ai" && p !== "spotify" && p !== "เพลง" && p !== "music",
  );

  // No additional params -> show mood selection
  if (relevantParts.length === 0) {
    return { action: "mood-select" };
  }

  // First param is a valid mood
  if (isValidMood(relevantParts[0]!)) {
    return {
      action: "mood-recommend",
      mood: relevantParts[0] as MoodType,
    };
  }

  // Otherwise, treat as search query
  return {
    action: "search",
    query: relevantParts.join(" "),
  };
}

// ============================================================================
// Main Handler
// ============================================================================

export async function handleSpotifyCommand(
  req: any,
  text: string,
): Promise<void> {
  try {
    const command = parseSpotifyCommand(text);

    let messages: LineMessage[];

    switch (command.action) {
      case "mood-select":
        // Show mood selection menu
        messages = [createMoodSelectionMessage()];
        break;

      case "mood-recommend":
        // Get recommendations by mood
        if (!command.mood) {
          messages = [createSpotifyErrorMessage("Invalid mood specified")];
          break;
        }

        const moodTracks = await spotifyService.getRecommendationsByMood(
          command.mood,
          10,
        );

        if (moodTracks.length === 0) {
          messages = [
            createSpotifyErrorMessage("No recommendations found for this mood"),
          ];
          break;
        }

        const moodEmoji = {
          happy: "😊",
          sad: "😢",
          energetic: "⚡",
          chill: "😌",
          party: "🎉",
          focus: "🎯",
        }[command.mood];

        messages = [
          createSpotifyRecommendationsCarousel(
            moodTracks,
            `${moodEmoji} ${command.mood.charAt(0).toUpperCase() + command.mood.slice(1)} Music`,
          ),
        ];
        break;

      case "search":
        // Search and get recommendations
        if (!command.query) {
          messages = [
            createSpotifyErrorMessage("Please provide a search query"),
          ];
          break;
        }

        // First, search for the query to get seed tracks/artists
        const searchResults = await spotifyService.search(
          command.query,
          "track",
          1,
        );

        if (!searchResults.tracks?.items?.length) {
          messages = [
            createSpotifyErrorMessage(
              `No results found for "${command.query}"`,
            ),
          ];
          break;
        }

        // Use the first result as seed for recommendations
        const seedTrack = searchResults.tracks.items[0];
        const recommendations = await spotifyService.getRecommendations({
          seedTracks: [seedTrack.id],
          limit: 10,
        });

        if (recommendations.length === 0) {
          messages = [createSpotifyErrorMessage("No recommendations found")];
          break;
        }

        messages = [
          createSpotifyRecommendationsCarousel(
            recommendations,
            `🎵 Similar to "${seedTrack.name}"`,
          ),
        ];
        break;

      default:
        messages = [createSpotifyErrorMessage("Invalid command")];
    }

    // Send reply using LINE utils
    await sendMessage(req, messages);
  } catch (error) {
    console.error("Spotify command error:", error);

    // Send user-friendly error message
    let errorMsg = "เกิดข้อผิดพลาดที่ไม่คาดคิด";

    if (error instanceof Error) {
      switch (error.message) {
        case "SPOTIFY_NOT_CONFIGURED":
          errorMsg =
            "🎵 Spotify ยังไม่ได้ตั้งค่า\n\n" +
            "กรุณาติดต่อผู้ดูแลระบบเพื่อ:\n" +
            "1. สร้าง Spotify App ที่ developer.spotify.com\n" +
            "2. ตั้งค่า SPOTIFY_CLIENT_ID และ SPOTIFY_CLIENT_SECRET\n" +
            "3. Restart server\n\n" +
            "📖 ดูรายละเอียดเพิ่มเติม:\n" +
            "src/features/spotify/README.md";
          break;

        case "SPOTIFY_CONNECTION_ERROR":
          errorMsg =
            "⚠️ ไม่สามารถเชื่อมต่อ Spotify ได้\n\n" +
            "กรุณาลองใหม่อีกครั้ง\n" +
            "หรือติดต่อผู้ดูแลระบบถ้าปัญหาไม่หาย";
          break;

        case "SPOTIFY_RECOMMENDATIONS_ERROR":
          errorMsg =
            "⚠️ ไม่สามารถแนะนำเพลงได้\n\n" +
            "เกิดข้อผิดพลาดจาก Spotify API\n" +
            "กรุณาลองใหม่อีกครั้ง";
          break;

        case "SPOTIFY_SEARCH_ERROR":
          errorMsg =
            "⚠️ ไม่สามารถค้นหาเพลงได้\n\n" +
            "เกิดข้อผิดพลาดจาก Spotify API\n" +
            "กรุณาลองใหม่อีกครั้ง";
          break;

        case "SPOTIFY_INVALID_REQUEST":
          errorMsg =
            "⚠️ คำขอไม่ถูกต้อง\n\n" +
            "รูปแบบคำสั่งหรือพารามิเตอร์ไม่ถูกต้อง\n" +
            "ลองใช้คำสั่งอื่นดูครับ";
          break;

        case "SPOTIFY_FORBIDDEN":
          errorMsg =
            "🚫 การเข้าถึงถูกปฏิเสธ\n\n" +
            "Spotify API key อาจไม่มีสิทธิ์\n" +
            "กรุณาติดต่อผู้ดูแลระบบ";
          break;

        case "SPOTIFY_RATE_LIMITED":
          errorMsg = "⏱️ ใช้งานบ่อยเกินไป\n\n" + "กรุณารอสักครู่แล้วลองใหม่";
          break;

        default:
          if (error.message.startsWith("SPOTIFY_AUTH_FAILED")) {
            errorMsg =
              "🔐 การยืนยันตัวตน Spotify ล้มเหลว\n\n" +
              "Client ID หรือ Secret อาจไม่ถูกต้อง\n" +
              "กรุณาติดต่อผู้ดูแลระบบ";
          } else if (
            error.message.startsWith("SPOTIFY_RECOMMENDATIONS_FAILED")
          ) {
            errorMsg =
              "⚠️ Spotify API ส่งกลับ error\n\n" +
              "กรุณาลองใหม่อีกครั้ง\n" +
              "หรือเปลี่ยน mood/คำค้นหา";
          } else if (error.message.startsWith("SPOTIFY_SEARCH_FAILED")) {
            errorMsg = "🔍 ไม่พบผลลัพธ์\n\n" + "ลองค้นหาด้วยคำอื่นดูครับ";
          } else {
            errorMsg = `เกิดข้อผิดพลาด: ${error.message}`;
          }
      }
    }

    await sendMessage(req, [createSpotifyErrorMessage(errorMsg)]);
  }
}

// ============================================================================
// Export
// ============================================================================

export const spotifyHandler = {
  handle: handleSpotifyCommand,
  commands: ["/ai spotify", "/ai เพลง", "/ai music"],
  description: "Get music recommendations from Spotify",
  usage: [
    "/ai spotify - Show mood selection",
    "/ai spotify happy - Get happy music",
    "/ai spotify sad - Get sad music",
    "/ai spotify energetic - Get energetic music",
    "/ai spotify chill - Get chill music",
    "/ai spotify party - Get party music",
    "/ai spotify focus - Get focus music",
    "/ai spotify [artist/song] - Search and get recommendations",
    "/ai เพลง [mood/ค้นหา] - Thai language support",
  ],
};
