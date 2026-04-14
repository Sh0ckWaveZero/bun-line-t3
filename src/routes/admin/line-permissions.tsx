"use client"

/**
 * LINE Permissions Management Page — /admin/line-permissions
 * หน้าจัดการสิทธิ์การใช้งาน LINE features สำหรับ admin
 */

import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { useSession } from "@/lib/auth/client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Shield,
  Users,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  CalendarCheck,
  Bell,
} from "lucide-react"

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface LineApproval {
  id: string
  lineUserId: string
  displayName: string | null
  pictureUrl: string | null
  status: "PENDING" | "APPROVED" | "REJECTED"
  canRequestAttendanceReport: boolean
  canRequestLeave: boolean
  canReceiveReminders: boolean
  createdAt: string
  approvedAt: string | null
}

type FilterStatus = "all" | "pending" | "approved" | "rejected"

// ─────────────────────────────────────────────
// Route
// ─────────────────────────────────────────────

export const Route = createFileRoute("/admin/line-permissions")({
  component: LinePermissionsPage,
})

// ─────────────────────────────────────────────
// Page Component
// ─────────────────────────────────────────────

function LinePermissionsPage() {
  const { data: session, status } = useSession()
  const queryClient = useQueryClient()

  // ─── State (must be before any early return) ──

  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all")
  const [searchQuery, setSearchQuery] = useState("")

  // ─── Queries (must be before any early return) ─

  const { data: approvals = [], isLoading } = useQuery({
    queryKey: ["line-permissions"],
    queryFn: fetchPermissions,
    enabled: !!session?.isAdmin,
  })

  // ─── Mutations (must be before any early return) ─

  const updatePermissionMutation = useMutation({
    mutationFn: async ({ lineUserId, permissions }: { lineUserId: string; permissions: Partial<LineApproval> }) => {
      const res = await fetch("/api/line/permissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lineUserId, ...permissions }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "ไม่สามารถอัปเดตสิทธิ์ได้")
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["line-permissions"] })
    },
  })

  // ─── Auth Guard (after all hooks) ────────────

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">กำลังโหลด...</p>
      </div>
    )
  }

  if (!session?.isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-900/20">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            🚫
          </div>
          <h1 className="mb-2 text-xl font-bold text-red-900 dark:text-red-300">
            ไม่มีสิทธิ์เข้าถึง
          </h1>
          <p className="mb-6 text-sm text-red-700 dark:text-red-400">
            หน้านี้สำหรับผู้ดูแลระบบเท่านั้น
          </p>
          <a
            href="/"
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 dark:bg-red-500"
          >
            กลับหน้าแรก
          </a>
        </div>
      </div>
    )
  }

  // ─── Handlers ────────────────────────────────

  const handleTogglePermission = (lineUserId: string, permission: keyof LineApproval, value: boolean) => {
    updatePermissionMutation.mutate({
      lineUserId,
      permissions: { [permission]: value },
    })
  }

  // ─── Filter & Search ─────────────────────────

  const filteredApprovals = approvals.filter((approval) => {
    // Status filter
    if (filterStatus !== "all" && approval.status !== filterStatus.toUpperCase()) {
      return false
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        approval.displayName?.toLowerCase().includes(query) ||
        approval.lineUserId.toLowerCase().includes(query)
      )
    }

    return true
  })

  // ─── Render ───────────────────────────────────

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
            <Shield className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              จัดการสิทธิ์ LINE Features
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              อนุมัติสิทธิ์การใช้งานฟีเจอร์ต่างๆ สำหรับ LINE users
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">สถานะ:</span>
          <div className="flex gap-2">
            {[
              { value: "all", label: "ทั้งหมด" },
              { value: "pending", label: "รออนุมัติ" },
              { value: "approved", label: "อนุมัติแล้ว" },
              { value: "rejected", label: "ปฏิเสธ" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFilterStatus(option.value as FilterStatus)}
                className={`cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  filterStatus === option.value
                    ? "bg-indigo-600 text-white dark:bg-indigo-500"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหาชื่อ หรือ LINE User ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
          />
        </div>

        {/* Refresh */}
        <button
          type="button"
          onClick={() => void queryClient.invalidateQueries({ queryKey: ["line-permissions"] })}
          className="cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex min-h-[400px] items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400">กำลังโหลด...</p>
        </div>
      ) : filteredApprovals.length === 0 ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
          <Users className="mb-4 h-12 w-12 text-gray-400" />
          <p className="text-gray-600 dark:text-gray-400">ไม่พบข้อมูล</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-700 dark:text-gray-300">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-700 dark:text-gray-300">
                    สถานะ
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold uppercase text-gray-700 dark:text-gray-300">
                    <div className="flex items-center justify-center gap-2">
                      <CalendarCheck className="h-4 w-4" />
                      รายงานเข้างาน
                    </div>
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold uppercase text-gray-700 dark:text-gray-300">
                    <div className="flex items-center justify-center gap-2">
                      <UserCheck className="h-4 w-4" />
                      ขอลา
                    </div>
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold uppercase text-gray-700 dark:text-gray-300">
                    <div className="flex items-center justify-center gap-2">
                      <Bell className="h-4 w-4" />
                      แจ้งเตือน
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredApprovals.map((approval) => (
                  <tr key={approval.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    {/* User Info */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {approval.pictureUrl && (
                          <img
                            src={approval.pictureUrl}
                            alt={approval.displayName || approval.lineUserId}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        )}
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {approval.displayName || "ไม่ระบุชื่อ"}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {approval.lineUserId}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      {approval.status === "APPROVED" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          อนุมัติแล้ว
                        </span>
                      ) : approval.status === "REJECTED" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
                          <XCircle className="h-3.5 w-3.5" />
                          ปฏิเสธ
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                          <Clock className="h-3.5 w-3.5" />
                          รออนุมัติ
                        </span>
                      )}
                    </td>

                    {/* Permission Toggles */}
                    <td className="px-6 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={approval.canRequestAttendanceReport}
                        onChange={(e) =>
                          handleTogglePermission(approval.lineUserId, "canRequestAttendanceReport", e.target.checked)
                        }
                        disabled={approval.status !== "APPROVED"}
                        className="cursor-pointer h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={approval.canRequestLeave}
                        onChange={(e) => handleTogglePermission(approval.lineUserId, "canRequestLeave", e.target.checked)}
                        disabled={approval.status !== "APPROVED"}
                        className="cursor-pointer h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={approval.canReceiveReminders}
                        onChange={(e) =>
                          handleTogglePermission(approval.lineUserId, "canReceiveReminders", e.target.checked)
                        }
                        disabled={approval.status !== "APPROVED"}
                        className="cursor-pointer h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// API Functions
// ─────────────────────────────────────────────

async function fetchPermissions(): Promise<LineApproval[]> {
  const res = await fetch("/api/line/permissions")
  if (!res.ok) {
    throw new Error("ไม่สามารถดึงข้อมูลสิทธิ์ได้")
  }
  const data = await res.json()
  return data.data
}
