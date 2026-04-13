"use client"

/**
 * ServiceIconPicker — Modal/inline picker สำหรับเลือก service icon
 * จัดหมวดหมู่ตาม streaming / music / gaming / cloud ฯลฯ
 */

import { useState } from "react"
import { ServiceIcon, ServiceIconGridItem } from "./ServiceIcon"
import { SUBSCRIPTION_SERVICE_LABELS, SERVICE_CATEGORIES } from "@/features/subscriptions/constants"
import type { SubscriptionService } from "@/features/subscriptions/types"
import { X, Search } from "lucide-react"

interface ServiceIconPickerProps {
  value: SubscriptionService
  onChange: (service: SubscriptionService) => void
  /** แสดงแบบ inline (ไม่มี modal wrapper) */
  inline?: boolean
}

export const ServiceIconPicker = ({ value, onChange, inline = false }: ServiceIconPickerProps) => {
  const [search, setSearch] = useState("")

  const filteredCategories = Object.entries(SERVICE_CATEGORIES).map(([key, cat]) => ({
    key,
    label: cat.label,
    services: cat.services.filter((svc) =>
      search
        ? SUBSCRIPTION_SERVICE_LABELS[svc].toLowerCase().includes(search.toLowerCase())
        : true,
    ),
  })).filter((cat) => cat.services.length > 0)

  const content = (
    <div className="space-y-4">
      {/* search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหา service..."
          className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-9 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
        />
      </div>

      {/* categories */}
      <div className="max-h-72 overflow-y-auto space-y-4 pr-1">
        {filteredCategories.map(({ key, label, services }) => (
          <div key={key}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              {label}
            </p>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
              {services.map((svc) => (
                <ServiceIconGridItem
                  key={svc}
                  service={svc}
                  label={SUBSCRIPTION_SERVICE_LABELS[svc]}
                  selected={value === svc}
                  onClick={() => onChange(svc)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  if (inline) return content

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      {content}
    </div>
  )
}

// ─────────────────────────────────────────────
// ServiceIconPickerModal — modal version
// ─────────────────────────────────────────────

interface ServiceIconPickerModalProps {
  open: boolean
  onClose: () => void
  value: SubscriptionService
  onChange: (service: SubscriptionService) => void
}

export const ServiceIconPickerModal = ({
  open,
  onClose,
  value,
  onChange,
}: ServiceIconPickerModalProps) => {
  if (!open) return null

  const handleSelect = (svc: SubscriptionService) => {
    onChange(svc)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-lg rounded-t-3xl bg-white shadow-2xl dark:bg-gray-900 sm:rounded-2xl">
        {/* header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <ServiceIcon service={value} size={36} variant="badge" />
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">เลือก Service Icon</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                กำลังใช้: {SUBSCRIPTION_SERVICE_LABELS[value]}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* content */}
        <div className="p-5">
          <ServiceIconPicker value={value} onChange={handleSelect} inline />
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// ServiceIconButton — ปุ่มเปิด picker (trigger)
// ─────────────────────────────────────────────

interface ServiceIconButtonProps {
  service: SubscriptionService
  onClick: () => void
  label?: string
}

export const ServiceIconButton = ({ service, onClick, label }: ServiceIconButtonProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center gap-3 rounded-2xl border-2 border-dashed border-gray-300 p-3 transition-all hover:border-indigo-400 hover:bg-indigo-50 dark:border-gray-600 dark:hover:border-indigo-500 dark:hover:bg-indigo-900/20"
    >
      <ServiceIcon service={service} size={48} variant="badge" />
      <div className="text-left">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">
          {SUBSCRIPTION_SERVICE_LABELS[service]}
        </p>
        <p className="text-xs text-indigo-600 group-hover:underline dark:text-indigo-400">
          {label ?? "แตะเพื่อเปลี่ยน icon →"}
        </p>
      </div>
    </button>
  )
}
