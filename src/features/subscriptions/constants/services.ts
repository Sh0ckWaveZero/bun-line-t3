/**
 * ค่าคงที่สำหรับ Subscription Services
 */

import type { SubscriptionService, SubscriptionPlanType, BillingCycle } from "../types"

// ─────────────────────────────────────────────
// Service labels / metadata
// ─────────────────────────────────────────────

export const SUBSCRIPTION_SERVICE_LABELS: Record<SubscriptionService, string> = {
  YOUTUBE: "YouTube Premium",
  SPOTIFY: "Spotify",
  NETFLIX: "Netflix",
  OTHER: "อื่นๆ",
}

export const SUBSCRIPTION_SERVICE_COLORS: Record<SubscriptionService, string> = {
  YOUTUBE: "#FF0000",
  SPOTIFY: "#1DB954",
  NETFLIX: "#E50914",
  OTHER: "#6B7280",
}

export const SUBSCRIPTION_SERVICE_EMOJI: Record<SubscriptionService, string> = {
  YOUTUBE: "▶️",
  SPOTIFY: "🎵",
  NETFLIX: "🎬",
  OTHER: "📦",
}

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
// Default prices (THB) — ราคาตลาด (ณ ปัจจุบัน)
// ─────────────────────────────────────────────

export const DEFAULT_PRICES: Record<SubscriptionService, { individual: number; family: number }> = {
  YOUTUBE: { individual: 179, family: 319 },
  SPOTIFY: { individual: 129, family: 199 },
  NETFLIX: { individual: 219, family: 369 },
  OTHER: { individual: 0, family: 0 },
}

// ─────────────────────────────────────────────
// Max members per plan type
// ─────────────────────────────────────────────

export const MAX_FAMILY_MEMBERS: Record<SubscriptionService, number> = {
  YOUTUBE: 6,
  SPOTIFY: 6,
  NETFLIX: 6,
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
