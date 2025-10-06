/**
 * Spotify Command Handler
 *
 * Handles Spotify-related commands via /ai spotify [mood/query]
 */

import type { Message } from "@line/bot-sdk";
import { spotifyService } from "../services/spotify.service";
import {
  createSpotifyRecommendationsCarousel,
  createMoodSelectionMessage,
  createSpotifyErrorMessage,
} from "../templates/spotify-flex.template";

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

    let messages: Message[];

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

    // Send error message
    const errorMsg =
      error instanceof Error ? error.message : "An unexpected error occurred";
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
