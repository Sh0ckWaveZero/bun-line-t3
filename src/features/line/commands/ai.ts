/**
 * AI Command Handler
 *
 * Routes AI-related commands to appropriate handlers
 * Currently supports:
 * - /ai spotify [mood/query] - Music recommendations via Spotify
 */

import type { Client, MessageEvent } from '@line/bot-sdk';
import { spotifyHandler } from '@/features/spotify/handlers/spotify.handler';

// ============================================================================
// Command Router
// ============================================================================

export async function handleAiCommand(
  client: Client,
  event: MessageEvent
): Promise<void> {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return;
  }

  const text = event.message.text.trim();
  const replyToken = event.replyToken;

  // Route to Spotify handler
  if (text.toLowerCase().startsWith('/ai spotify')) {
    await spotifyHandler.handle(client, replyToken, text);
    return;
  }

  // Default help message
  await client.replyMessage({
    replyToken,
    messages: [
      {
        type: 'text',
        text: '🤖 AI Commands:\n\n' +
          '🎵 /ai spotify - Music recommendations\n' +
          '  • /ai spotify happy - Get happy music\n' +
          '  • /ai spotify sad - Get sad music\n' +
          '  • /ai spotify energetic - Get energetic music\n' +
          '  • /ai spotify chill - Get chill music\n' +
          '  • /ai spotify party - Get party music\n' +
          '  • /ai spotify focus - Get focus music\n' +
          '  • /ai spotify [artist/song] - Search & recommend',
      },
    ],
  });
}

// ============================================================================
// Export command info
// ============================================================================

export const aiCommand = {
  command: '/ai',
  description: 'AI-powered features including music recommendations',
  usage: [
    '/ai - Show available AI commands',
    '/ai spotify - Music recommendations',
  ],
  handlers: {
    spotify: spotifyHandler,
  },
};
