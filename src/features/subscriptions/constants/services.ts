/**
 * ค่าคงที่สำหรับ Subscription Services
 * Icons มาจาก simple-icons ผ่าน @/lib/icons/brand-icons
 */

import { BRAND_ICONS } from "@/lib/icons/brand-icons"
import type { SubscriptionService, SubscriptionPlanType, BillingCycle } from "../types"

// re-export สำหรับ convenience
export { BRAND_ICONS }

// ─────────────────────────────────────────────
// Service labels
// ─────────────────────────────────────────────

export const SUBSCRIPTION_SERVICE_LABELS: Record<SubscriptionService, string> = {
  YOUTUBE: "YouTube Premium",
  YOUTUBE_MUSIC: "YouTube Music",
  SPOTIFY: "Spotify",
  APPLE_MUSIC: "Apple Music",
  NETFLIX: "Netflix",
  APPLE_TV: "Apple TV+",
  HBO_MAX: "Max (HBO Max)",
  TWITCH: "Twitch",
  STEAM: "Steam",
  PLAYSTATION: "PlayStation Plus",
  ICLOUD: "iCloud+",
  LINE: "LINE",
  GOOGLE_TV: "Google TV",
  OTHER: "อื่นๆ",
}

/** หมวดหมู่ของ service (สำหรับแสดงใน picker) */
export const SERVICE_CATEGORIES = {
  streaming: {
    label: "🎬 วิดีโอ",
    services: ["NETFLIX", "APPLE_TV", "HBO_MAX", "GOOGLE_TV"] as SubscriptionService[],
  },
  music: {
    label: "🎵 เพลง",
    services: ["SPOTIFY", "YOUTUBE_MUSIC", "APPLE_MUSIC"] as SubscriptionService[],
  },
  social: {
    label: "💬 Social / Live",
    services: ["YOUTUBE", "TWITCH", "LINE"] as SubscriptionService[],
  },
  gaming: {
    label: "🎮 เกม",
    services: ["STEAM", "PLAYSTATION"] as SubscriptionService[],
  },
  cloud: {
    label: "☁️ Cloud / Storage",
    services: ["ICLOUD"] as SubscriptionService[],
  },
  other: {
    label: "📦 อื่นๆ",
    services: ["OTHER"] as SubscriptionService[],
  },
} as const

// ─────────────────────────────────────────────
// Plan type labels
// ─────────────────────────────────────────────

export const PLAN_TYPE_LABELS: Record<SubscriptionPlanType, string> = {
  INDIVIDUAL: "รายบุคคล",
  FAMILY: "แฟมิลี่",
}

export const PLAN_TYPE_COLORS: Record<SubscriptionPlanType, string> = {
  INDIVIDUAL: "text-blue-600 dark:text-blue-400",
  FAMILY: "text-purple-600 dark:text-purple-400",
}

// ─────────────────────────────────────────────
// Billing cycle labels
// ─────────────────────────────────────────────

export const BILLING_CYCLE_LABELS: Record<BillingCycle, string> = {
  MONTHLY: "รายเดือน",
  YEARLY: "รายปี",
}

// ─────────────────────────────────────────────
// Default prices (THB) — ราคาตลาด (โดยประมาณ)
// ─────────────────────────────────────────────

export const DEFAULT_PRICES: Record<SubscriptionService, { individual: number; family: number }> = {
  YOUTUBE: { individual: 179, family: 319 },
  YOUTUBE_MUSIC: { individual: 99, family: 179 },
  SPOTIFY: { individual: 129, family: 199 },
  APPLE_MUSIC: { individual: 99, family: 179 },
  NETFLIX: { individual: 219, family: 369 },
  APPLE_TV: { individual: 99, family: 99 },
  HBO_MAX: { individual: 199, family: 199 },
  TWITCH: { individual: 179, family: 179 },
  STEAM: { individual: 0, family: 0 },
  PLAYSTATION: { individual: 199, family: 199 },
  ICLOUD: { individual: 35, family: 109 },
  LINE: { individual: 139, family: 139 },
  GOOGLE_TV: { individual: 0, family: 0 },
  OTHER: { individual: 0, family: 0 },
}

// ─────────────────────────────────────────────
// Max family members
// ─────────────────────────────────────────────

export const MAX_FAMILY_MEMBERS: Record<SubscriptionService, number> = {
  YOUTUBE: 6,
  YOUTUBE_MUSIC: 6,
  SPOTIFY: 6,
  APPLE_MUSIC: 6,
  NETFLIX: 6,
  APPLE_TV: 6,
  HBO_MAX: 5,
  TWITCH: 1,
  STEAM: 5,
  PLAYSTATION: 1,
  ICLOUD: 6,
  LINE: 1,
  GOOGLE_TV: 1,
  OTHER: 10,
}

// ─────────────────────────────────────────────
// Payment status labels
// ─────────────────────────────────────────────

export const PAYMENT_STATUS_LABELS = {
  PENDING: "รอจ่าย",
  PAID: "จ่ายแล้ว",
  SKIPPED: "ข้าม",
} as const

export const PAYMENT_STATUS_COLORS = {
  PENDING: "text-yellow-600 dark:text-yellow-400",
  PAID: "text-green-600 dark:text-green-400",
  SKIPPED: "text-gray-500 dark:text-gray-400",
} as const

export const PAYMENT_STATUS_BG = {
  PENDING: "bg-yellow-100 dark:bg-yellow-900/30",
  PAID: "bg-green-100 dark:bg-green-900/30",
  SKIPPED: "bg-gray-100 dark:bg-gray-800",
} as const
