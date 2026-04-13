/**
 * ไทป์และอินเทอร์เฟซสำหรับระบบติดตาม Subscription
 */

export type SubscriptionService =
  | "YOUTUBE"
  | "YOUTUBE_MUSIC"
  | "SPOTIFY"
  | "APPLE_MUSIC"
  | "NETFLIX"
  | "APPLE_TV"
  | "HBO_MAX"
  | "TWITCH"
  | "STEAM"
  | "PLAYSTATION"
  | "ICLOUD"
  | "LINE"
  | "GOOGLE_TV"
  | "OTHER"
export type SubscriptionPlanType = "INDIVIDUAL" | "FAMILY"
export type BillingCycle = "MONTHLY" | "YEARLY"
export type PaymentStatus = "PENDING" | "PAID" | "SKIPPED"

// ─────────────────────────────────────────────
// Subscription
// ─────────────────────────────────────────────

export interface Subscription {
  id: string
  name: string
  service: SubscriptionService
  planType: SubscriptionPlanType
  billingCycle: BillingCycle
  totalPrice: number
  currency: string
  billingDay: number // วันที่ตัดเงิน (1-31)
  ownerId: string
  isActive: boolean
  startDate: Date
  endDate?: Date | null
  logoUrl?: string | null
  note?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateSubscriptionInput {
  name: string
  service: SubscriptionService
  planType: SubscriptionPlanType
  billingCycle: BillingCycle
  totalPrice: number
  currency?: string
  billingDay: number
  ownerId: string
  startDate: Date
  endDate?: Date
  logoUrl?: string
  note?: string
}

export interface UpdateSubscriptionInput {
  name?: string
  service?: SubscriptionService
  planType?: SubscriptionPlanType
  billingCycle?: BillingCycle
  totalPrice?: number
  currency?: string
  billingDay?: number
  isActive?: boolean
  endDate?: Date | null
  logoUrl?: string | null
  note?: string | null
}

// ─────────────────────────────────────────────
// SubscriptionMember
// ─────────────────────────────────────────────

export interface SubscriptionMember {
  id: string
  subscriptionId: string
  userId?: string | null
  name: string
  email?: string | null
  shareAmount: number
  isActive: boolean
  joinedAt: Date
  leftAt?: Date | null
  note?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateMemberInput {
  subscriptionId: string
  userId?: string
  name: string
  email?: string
  shareAmount: number
  joinedAt?: Date
  note?: string
}

export interface UpdateMemberInput {
  name?: string
  email?: string | null
  shareAmount?: number
  isActive?: boolean
  leftAt?: Date | null
  note?: string | null
}

// ─────────────────────────────────────────────
// SubscriptionPayment
// ─────────────────────────────────────────────

export interface SubscriptionPayment {
  id: string
  subscriptionId: string
  memberId: string
  billingMonth: string // YYYY-MM
  amount: number
  status: PaymentStatus
  paidAt?: Date | null
  dueDate: Date
  paidBy?: string | null
  note?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface CreatePaymentInput {
  subscriptionId: string
  memberId: string
  billingMonth: string // YYYY-MM
  amount: number
  dueDate: Date
  note?: string
}

export interface UpdatePaymentInput {
  status?: PaymentStatus
  paidAt?: Date | null
  amount?: number
  paidBy?: string | null
  note?: string | null
}

// ─────────────────────────────────────────────
// Aggregated / View types
// ─────────────────────────────────────────────

export interface SubscriptionWithMembers extends Subscription {
  members: SubscriptionMember[]
}

export interface SubscriptionDetail extends Subscription {
  members: MemberWithPayments[]
}

export interface MemberWithPayments extends SubscriptionMember {
  payments: SubscriptionPayment[]
}

/** สรุปการจ่ายเงินรายเดือน */
export interface MonthlySummary {
  billingMonth: string // YYYY-MM
  totalAmount: number
  paidAmount: number
  pendingAmount: number
  paidCount: number
  pendingCount: number
  skippedCount: number
}

/** สรุปรายการที่ต้องจ่ายของสมาชิกคนหนึ่ง */
export interface MemberPaymentSummary {
  memberId: string
  memberName: string
  subscriptionName: string
  service: SubscriptionService
  billingDay: number
  shareAmount: number
  currentMonthStatus: PaymentStatus
  lastPaidAt?: Date | null
}
