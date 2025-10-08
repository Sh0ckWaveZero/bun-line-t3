/**
 * Spotify Flex Message Templates
 *
 * Beautiful Flex Messages for displaying Spotify music recommendations
 */

import type { SpotifyTrack } from "../services/spotifyService";

// ============================================================================
// Flex Message Types (LINE Messaging API)
// ============================================================================

interface FlexMessage {
  type: "flex";
  altText: string;
  contents: FlexBubble | FlexCarousel;
}

interface FlexBubble {
  type: "bubble";
  size?: string;
  hero?: any;
  body?: any;
  footer?: any;
}

interface FlexCarousel {
  type: "carousel";
  contents: FlexBubble[];
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format duration from milliseconds to MM:SS
 */
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

/**
 * Get album image URL with fallback
 */
function getAlbumImage(track: SpotifyTrack): string {
  const images = track.album.images;
  if (!images || images.length === 0) {
    return "https://via.placeholder.com/300x300.png?text=No+Image";
  }

  // Get medium size image (usually 300x300)
  // Spotify returns images in descending size order: [large, medium, small]
  const mediumImage = images[1]?.url;
  const largeImage = images[0]?.url;
  const smallImage = images[images.length - 1]?.url;

  return (
    mediumImage ||
    largeImage ||
    smallImage ||
    "https://via.placeholder.com/300x300.png?text=No+Image"
  );
}

/**
 * Truncate text to specified length
 */
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
}

// ============================================================================
// Single Track Bubble Template
// ============================================================================

function createTrackBubble(track: SpotifyTrack, index?: number): FlexBubble {
  const artists = track.artists.map((a) => a.name).join(", ");
  const imageUrl = getAlbumImage(track);
  const duration = formatDuration(track.duration_ms);

  return {
    type: "bubble",
    size: "kilo",
    hero: {
      type: "image",
      url: imageUrl,
      size: "full",
      aspectRatio: "1:1",
      aspectMode: "cover",
      action: {
        type: "uri",
        uri: track.external_urls.spotify,
      },
    },
    body: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      contents: [
        // Track number badge (if provided)
        ...(index !== undefined
          ? [
              {
                type: "box" as const,
                layout: "horizontal" as const,
                contents: [
                  {
                    type: "box" as const,
                    layout: "baseline" as const,
                    contents: [
                      {
                        type: "text" as const,
                        text: `#${index + 1}`,
                        color: "#FFFFFF",
                        size: "xs",
                        weight: "bold" as const,
                      },
                    ],
                    backgroundColor: "#1DB954",
                    cornerRadius: "md",
                    paddingAll: "xs",
                    width: "40px",
                    height: "20px",
                  },
                ],
                margin: "none",
              },
            ]
          : []),
        // Track name
        {
          type: "text",
          text: truncate(track.name, 40),
          size: "lg",
          weight: "bold",
          color: "#1a1a1a",
          wrap: true,
          maxLines: 2,
        },
        // Artist name
        {
          type: "text",
          text: truncate(artists, 50),
          size: "sm",
          color: "#666666",
          wrap: true,
        },
        // Album name
        {
          type: "text",
          text: truncate(track.album.name, 50),
          size: "xs",
          color: "#999999",
          wrap: true,
        },
        // Separator
        {
          type: "separator",
          margin: "md",
        },
        // Info box
        {
          type: "box",
          layout: "horizontal",
          spacing: "sm",
          margin: "md",
          contents: [
            {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "text",
                  text: "Duration",
                  size: "xxs",
                  color: "#999999",
                },
                {
                  type: "text",
                  text: duration,
                  size: "xs",
                  weight: "bold",
                  color: "#333333",
                },
              ],
              flex: 1,
            },
            {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "text",
                  text: "Popularity",
                  size: "xxs",
                  color: "#999999",
                  align: "end",
                },
                {
                  type: "text",
                  text: `${track.popularity}/100`,
                  size: "xs",
                  weight: "bold",
                  color: "#333333",
                  align: "end",
                },
              ],
              flex: 1,
            },
          ],
        },
      ],
    },
    footer: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      contents: [
        {
          type: "button",
          style: "primary",
          action: {
            type: "uri",
            label: "🎵 Play on Spotify",
            uri: track.external_urls.spotify,
          },
          color: "#1DB954",
          height: "sm",
        },
      ],
    },
  };
}

// ============================================================================
// Carousel Template (Multiple Tracks)
// ============================================================================

export function createSpotifyRecommendationsCarousel(
  tracks: SpotifyTrack[],
  title = "🎵 Spotify Recommendations",
): FlexMessage {
  const bubbles = tracks
    .slice(0, 5)
    .map((track, index) => createTrackBubble(track, index));

  return {
    type: "flex",
    altText: `${title} - ${tracks.length} tracks`,
    contents: {
      type: "carousel",
      contents: bubbles,
    },
  };
}

// ============================================================================
// Single Track Template
// ============================================================================

export function createSpotifyTrackMessage(
  track: SpotifyTrack,
  _title = "🎵 Track",
): FlexMessage {
  return {
    type: "flex",
    altText: `${track.name} by ${track.artists.map((a) => a.name).join(", ")}`,
    contents: createTrackBubble(track),
  };
}

// ============================================================================
// Error Template
// ============================================================================

export function createSpotifyErrorMessage(errorMessage: string): FlexMessage {
  return {
    type: "flex",
    altText: "Spotify Error",
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "❌ Error",
            size: "xl",
            weight: "bold",
            color: "#FF0000",
          },
          {
            type: "text",
            text: errorMessage,
            size: "sm",
            color: "#666666",
            wrap: true,
            margin: "md",
          },
        ],
      },
    },
  };
}

// ============================================================================
// Mood Selection Template
// ============================================================================

export function createMoodSelectionMessage(): FlexMessage {
  return {
    type: "flex",
    altText: "Select your mood for music recommendations",
    contents: {
      type: "bubble",
      hero: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "🎵 Music Mood",
            size: "xl",
            weight: "bold",
            color: "#FFFFFF",
            align: "center",
          },
        ],
        backgroundColor: "#1DB954",
        paddingAll: "lg",
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          {
            type: "text",
            text: "เลือก mood ที่คุณต้องการ:",
            size: "md",
            color: "#333333",
            wrap: true,
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          {
            type: "button",
            style: "primary",
            action: {
              type: "message",
              label: "😊 Happy",
              text: "/ai spotify happy",
            },
            color: "#FFD700",
          },
          {
            type: "button",
            style: "primary",
            action: {
              type: "message",
              label: "😢 Sad",
              text: "/ai spotify sad",
            },
            color: "#4169E1",
          },
          {
            type: "button",
            style: "primary",
            action: {
              type: "message",
              label: "⚡ Energetic",
              text: "/ai spotify energetic",
            },
            color: "#FF4500",
          },
          {
            type: "button",
            style: "primary",
            action: {
              type: "message",
              label: "😌 Chill",
              text: "/ai spotify chill",
            },
            color: "#20B2AA",
          },
          {
            type: "button",
            style: "primary",
            action: {
              type: "message",
              label: "🎉 Party",
              text: "/ai spotify party",
            },
            color: "#FF1493",
          },
          {
            type: "button",
            style: "primary",
            action: {
              type: "message",
              label: "🎯 Focus",
              text: "/ai spotify focus",
            },
            color: "#8A2BE2",
          },
        ],
      },
    },
  };
}
