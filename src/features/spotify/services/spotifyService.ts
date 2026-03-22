/**
 * Spotify Service
 *
 * Handles Spotify Web API integration for music recommendations
 * Uses Client Credentials Flow for server-to-server authentication
 */

import { z } from "zod";
import { env } from "@/env.mjs";

// ============================================================================
// Types & Schemas
// ============================================================================

const SpotifyTokenResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  expires_in: z.number(),
});

const SpotifyTrackSchema = z.object({
  id: z.string(),
  name: z.string(),
  artists: z.array(
    z.object({
      name: z.string(),
    }),
  ),
  album: z.object({
    name: z.string(),
    images: z.array(
      z.object({
        url: z.string(),
        height: z.number().optional(),
        width: z.number().optional(),
      }),
    ),
  }),
  external_urls: z.object({
    spotify: z.string(),
  }),
  preview_url: z.string().nullable(),
  duration_ms: z.number(),
  popularity: z.number(),
});

const SpotifyRecommendationsResponseSchema = z.object({
  tracks: z.array(SpotifyTrackSchema),
});

export type SpotifyTrack = z.infer<typeof SpotifyTrackSchema>;

interface GetRecommendationsParams {
  seedGenres?: string[];
  seedArtists?: string[];
  seedTracks?: string[];
  limit?: number;
  targetEnergy?: number;
  targetValence?: number;
  targetDanceability?: number;
}

// ============================================================================
// Service Class
// ============================================================================

class SpotifyService {
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  private readonly baseUrl = "https://api.spotify.com/v1";
  private readonly authUrl = "https://accounts.spotify.com/api/token";

  /**
   * Get Spotify access token using Client Credentials Flow
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    const clientId = env.SPOTIFY_CLIENT_ID;
    const clientSecret = env.SPOTIFY_CLIENT_SECRET;

    if (
      !clientId ||
      !clientSecret ||
      clientId === "your_spotify_client_id_here" ||
      clientSecret === "your_spotify_client_secret_here"
    ) {
      throw new Error("SPOTIFY_NOT_CONFIGURED");
    }

    try {
      const response = await fetch(this.authUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
        },
        body: "grant_type=client_credentials",
      });

      if (!response.ok) {
        throw new Error(`SPOTIFY_AUTH_FAILED: ${response.status}`);
      }

      const data = await response.json();
      const parsed = SpotifyTokenResponseSchema.parse(data);

      // Cache token
      this.accessToken = parsed.access_token;
      this.tokenExpiresAt = Date.now() + parsed.expires_in * 1000 - 60000;

      return this.accessToken;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.startsWith("SPOTIFY_")) {
          throw error;
        }
      }

      throw new Error("SPOTIFY_CONNECTION_ERROR");
    }
  }

  /**
   * Search for tracks, artists, or genres
   */
  async search(
    query: string,
    type: "track" | "artist" | "playlist" = "track",
    limit = 10,
  ) {
    try {
      const token = await this.getAccessToken();

      const params = new URLSearchParams({
        q: query,
        type,
        limit: limit.toString(),
        market: "TH",
      });

      const response = await fetch(`${this.baseUrl}/search?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`SPOTIFY_SEARCH_FAILED: ${response.status}`);
      }

      const data = await response.json();

      return data;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.startsWith("SPOTIFY_")) {
          throw error;
        }
      }

      throw new Error("SPOTIFY_SEARCH_ERROR");
    }
  }

  /**
   * Get music recommendations based on various parameters
   */
  async getRecommendations(
    params: GetRecommendationsParams,
  ): Promise<SpotifyTrack[]> {
    try {
      const token = await this.getAccessToken();

      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.append("limit", (params.limit || 10).toString());
      queryParams.append("market", "TH");

      if (params.seedGenres?.length) {
        queryParams.append("seed_genres", params.seedGenres.join(","));
      }
      if (params.seedArtists?.length) {
        queryParams.append("seed_artists", params.seedArtists.join(","));
      }
      if (params.seedTracks?.length) {
        queryParams.append("seed_tracks", params.seedTracks.join(","));
      }

      // Audio features
      if (params.targetEnergy !== undefined) {
        queryParams.append("target_energy", params.targetEnergy.toString());
      }
      if (params.targetValence !== undefined) {
        queryParams.append("target_valence", params.targetValence.toString());
      }
      if (params.targetDanceability !== undefined) {
        queryParams.append(
          "target_danceability",
          params.targetDanceability.toString(),
        );
      }

      const response = await fetch(
        `${this.baseUrl}/recommendations?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 400) {
          throw new Error("SPOTIFY_INVALID_REQUEST");
        } else if (response.status === 401) {
          throw new Error("SPOTIFY_AUTH_FAILED: 401");
        } else if (response.status === 403) {
          throw new Error("SPOTIFY_FORBIDDEN");
        } else if (response.status === 429) {
          throw new Error("SPOTIFY_RATE_LIMITED");
        }

        throw new Error(`SPOTIFY_RECOMMENDATIONS_FAILED: ${response.status}`);
      }

      const data = await response.json();
      const parsed = SpotifyRecommendationsResponseSchema.parse(data);

      return parsed.tracks;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.startsWith("SPOTIFY_")) {
          throw error;
        }
      }

      throw new Error("SPOTIFY_RECOMMENDATIONS_ERROR");
    }
  }

  /**
   * Get available genre seeds for recommendations
   */
  async getAvailableGenreSeeds(): Promise<string[]> {
    const token = await this.getAccessToken();

    try {
      const response = await fetch(
        `${this.baseUrl}/recommendations/available-genre-seeds`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to get genre seeds: ${response.statusText}`);
      }

      const data = await response.json();
      return data.genres || [];
    } catch {
      return [];
    }
  }

  /**
   * Get recommendations by mood/vibe using Search API
   */
  async getRecommendationsByMood(
    mood: "happy" | "sad" | "energetic" | "chill" | "party" | "focus",
    limit = 10,
  ): Promise<SpotifyTrack[]> {
    const moodQueries: Record<string, string> = {
      happy: "happy pop upbeat",
      sad: "sad acoustic emotional",
      energetic: "energetic edm workout",
      chill: "chill lofi relax",
      party: "party dance club",
      focus: "focus study concentration",
    };

    const query = moodQueries[mood] || mood;

    try {
      const result = await this.search(query, "track", limit);

      // Extract tracks from search results
      if (result.tracks?.items && result.tracks.items.length > 0) {
        return result.tracks.items;
      }

      // Fallback: try simpler query
      const fallbackResult = await this.search(mood, "track", limit);

      if (
        fallbackResult.tracks?.items &&
        fallbackResult.tracks.items.length > 0
      ) {
        return fallbackResult.tracks.items;
      }

      return [];
    } catch (error) {
      throw error;
    }
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const spotifyService = new SpotifyService();
