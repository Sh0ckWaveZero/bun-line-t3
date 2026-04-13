/**
 * ServiceIcon — renders brand SVG icon สำหรับแต่ละ subscription service
 *
 * ใช้ SVG paths จาก simple-icons (MIT)
 * รองรับ dark mode: icons ที่มี dark background จะปรับอัตโนมัติ
 */

import { BRAND_ICONS } from "@/lib/icons/brand-icons"
import type { SubscriptionService } from "@/features/subscriptions/types"

interface ServiceIconProps {
  service: SubscriptionService
  /** ขนาด container (px) — default 40 */
  size?: number
  /** แสดงเป็น rounded square พร้อม brand color background */
  variant?: "badge" | "flat" | "mono"
  className?: string
}

/**
 * แปลง hex color เป็น rgb สำหรับ inline style
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "")
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  }
}

/**
 * คำนวณว่าสี foreground ควรเป็น white หรือ black
 * ตาม WCAG luminance contrast
 */
function getForegroundColor(hex: string): string {
  const { r, g, b } = hexToRgb(hex)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.55 ? "#000000" : "#ffffff"
}

export const ServiceIcon = ({
  service,
  size = 40,
  variant = "badge",
  className = "",
}: ServiceIconProps) => {
  const icon = BRAND_ICONS[service]
  const bgColor = `#${icon.hex}`
  const fgColor = getForegroundColor(icon.hex)
  const iconSize = Math.round(size * 0.55) // icon ขนาด 55% ของ container

  if (variant === "flat") {
    // SVG สีเดียวตาม brand color ไม่มี background
    return (
      <svg
        role="img"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        aria-label={icon.title}
        className={className}
        style={{ fill: bgColor }}
      >
        <path d={icon.path} />
      </svg>
    )
  }

  if (variant === "mono") {
    // SVG สี currentColor (ใช้กับ dark/light mode)
    return (
      <svg
        role="img"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        aria-label={icon.title}
        className={className}
        style={{ fill: "currentColor" }}
      >
        <path d={icon.path} />
      </svg>
    )
  }

  // variant === "badge" — rounded square with brand bg + white/black icon
  const radius = Math.round(size * 0.22)

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: bgColor,
      }}
      title={icon.title}
      aria-label={icon.title}
    >
      <svg
        role="img"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        width={iconSize}
        height={iconSize}
        aria-hidden="true"
        style={{ fill: fgColor }}
      >
        <path d={icon.path} />
      </svg>
    </span>
  )
}

// ─────────────────────────────────────────────
// ServiceIconGrid — แสดง icon + ชื่อ service
// ─────────────────────────────────────────────

interface ServiceIconGridItemProps {
  service: SubscriptionService
  label: string
  selected?: boolean
  onClick?: () => void
}

export const ServiceIconGridItem = ({
  service,
  label,
  selected = false,
  onClick,
}: ServiceIconGridItemProps) => {
  const icon = BRAND_ICONS[service]
  const bgColor = `#${icon.hex}`

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex flex-col items-center gap-2 rounded-2xl border-2 p-3 text-center transition-all ${
        selected
          ? "border-indigo-500 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-900/20"
          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600 dark:hover:bg-gray-700"
      }`}
    >
      <ServiceIcon service={service} size={44} variant="badge" />
      <span
        className={`line-clamp-2 text-xs font-medium leading-tight ${
          selected
            ? "text-indigo-700 dark:text-indigo-300"
            : "text-gray-700 dark:text-gray-300"
        }`}
      >
        {label}
      </span>
    </button>
  )
}
