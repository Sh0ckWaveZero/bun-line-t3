/**
 * Brand icons สำหรับ Subscription services
 * ใช้ simple-icons — tree-shakable imports
 */

import {
  siYoutube,
  siYoutubemusic,
  siSpotify,
  siApplemusic,
  siNetflix,
  siAppletv,
  siHbomax,
  siTwitch,
  siSteam,
  siPlaystation,
  siIcloud,
  siLine,
  siGoogletv,
} from "simple-icons"

import type { SubscriptionService } from "@/features/subscriptions/types"

export interface BrandIconData {
  /** SVG path string (24x24 viewBox) */
  path: string
  /** Brand hex color (without #) */
  hex: string
  /** แสดงสีพื้นหลังใน dark mode */
  darkBg?: string
  /** ชื่อแสดง */
  title: string
}

/**
 * Map จาก SubscriptionService → BrandIconData
 * ทุก icon มาจาก simple-icons (MIT licensed)
 */
export const BRAND_ICONS: Record<SubscriptionService, BrandIconData> = {
  YOUTUBE: {
    path: siYoutube.path,
    hex: siYoutube.hex,
    title: "YouTube Premium",
  },
  YOUTUBE_MUSIC: {
    path: siYoutubemusic.path,
    hex: siYoutubemusic.hex,
    title: "YouTube Music",
  },
  SPOTIFY: {
    path: siSpotify.path,
    hex: siSpotify.hex,
    title: "Spotify",
  },
  APPLE_MUSIC: {
    path: siApplemusic.path,
    hex: siApplemusic.hex,
    darkBg: "#1c1c1e",
    title: "Apple Music",
  },
  NETFLIX: {
    path: siNetflix.path,
    hex: siNetflix.hex,
    title: "Netflix",
  },
  APPLE_TV: {
    path: siAppletv.path,
    hex: siAppletv.hex,
    darkBg: "#1c1c1e",
    title: "Apple TV+",
  },
  HBO_MAX: {
    path: siHbomax.path,
    hex: siHbomax.hex,
    darkBg: "#1a1a2e",
    title: "Max (HBO Max)",
  },
  TWITCH: {
    path: siTwitch.path,
    hex: siTwitch.hex,
    title: "Twitch",
  },
  STEAM: {
    path: siSteam.path,
    hex: siSteam.hex,
    darkBg: "#1b2838",
    title: "Steam",
  },
  PLAYSTATION: {
    path: siPlaystation.path,
    hex: siPlaystation.hex,
    title: "PlayStation Plus",
  },
  ICLOUD: {
    path: siIcloud.path,
    hex: siIcloud.hex,
    title: "iCloud+",
  },
  LINE: {
    path: siLine.path,
    hex: siLine.hex,
    title: "LINE",
  },
  GOOGLE_TV: {
    path: siGoogletv.path,
    hex: siGoogletv.hex,
    title: "Google TV",
  },
  OTHER: {
    // Package icon (custom path)
    path: "M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zm-9 5H7v-1h4zm6 0h-4v-1h4z",
    hex: "6B7280",
    title: "อื่นๆ",
  },
}
