"use client"

/**
 * Subscription Tracker Page — /subscriptions
 * รองรับ create / edit / delete subscription และสมาชิก
 */

import { createFileRoute } from "@tanstack/react-router"
import { useState, useCallback } from "react"
import { useSession } from "@/lib/auth/client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { SubscriptionCard } from "@/components/subscriptions/SubscriptionCard"
import { PaymentTable } from "@/components/subscriptions/PaymentTable"
import { AddSubscriptionModal } from "@/components/subscriptions/AddSubscriptionModal"
import { AddMemberModal } from "@/components/subscriptions/AddMemberModal"
import { EditPaymentModal } from "@/components/subscriptions/EditPaymentModal"
import { ServiceIcon } from "@/components/subscriptions/ServiceIcon"
import { ConfirmDialog, AlertDialogBox } from "@/components/ui/AlertDialog"
import type {
  SubscriptionWithMembers,
  SubscriptionDetail,
  SubscriptionPayment,
  SubscriptionMember,
  MonthlySummary,
} from "@/features/subscriptions/types"
import { formatBillingMonthThai, getCurrentMonthLabel } from "@/features/subscriptions/helpers"
import { SUBSCRIPTION_SERVICE_LABELS } from "@/features/subscriptions/constants"
import type { SubscriptionFormData } from "@/components/subscriptions/AddSubscriptionModal"
import type { MemberFormData } from "@/components/subscriptions/AddMemberModal"
import type { PaymentFormData } from "@/components/subscriptions/EditPaymentModal"
import {
  Plus,
  ArrowLeft,
  Users,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
} from "lucide-react"

// ─────────────────────────────────────────────
// Route
// ─────────────────────────────────────────────

export const Route = createFileRoute("/subscriptions")({
  component: SubscriptionsPage,
})

// ─────────────────────────────────────────────
// API helpers
// ─────────────────────────────────────────────

async function fetchSubscriptions(): Promise<SubscriptionWithMembers[]> {
  const res = await fetch("/api/subscriptions")
  if (!res.ok) throw new Error("ไม่สามารถดึงข้อมูล subscriptions ได้")
  const json = (await res.json()) as { data: SubscriptionWithMembers[] }
  return json.data
}

async function fetchSubscriptionDetail(
  subscriptionId: string,
  billingMonth: string,
): Promise<{
  detail: SubscriptionDetail
  payments: SubscriptionPayment[]
  summary: MonthlySummary
}> {
  const [detailRes, paymentsRes] = await Promise.all([
    fetch(`/api/subscriptions/${subscriptionId}?billingMonth=${billingMonth}`),
    fetch(
      `/api/subscriptions/payments?subscriptionId=${subscriptionId}&billingMonth=${billingMonth}&summary=true`,
    ),
  ])
  if (!detailRes.ok) throw new Error("ไม่สามารถดึงรายละเอียดได้")
  const detailJson = (await detailRes.json()) as { data: SubscriptionDetail }
  const paymentsJson = (await paymentsRes.json()) as {
    data: SubscriptionPayment[]
    summary: MonthlySummary
  }
  return {
    detail: detailJson.data,
    payments: paymentsJson.data,
    summary: paymentsJson.summary,
  }
}

function prevMonth(billingMonth: string): string {
  const [y, m] = billingMonth.split("-").map(Number) as [number, number]
  const d = new Date(y, m - 2, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

function nextMonth(billingMonth: string): string {
  const [y, m] = billingMonth.split("-").map(Number) as [number, number]
  const d = new Date(y, m, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

// ─────────────────────────────────────────────
// Main page component
// ─────────────────────────────────────────────

function SubscriptionsPage() {
  const { data: session, status } = useSession()
  const isPending = status === "loading"
  const queryClient = useQueryClient()

  // ─── auth guard ────────────────────────────

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">กำลังโหลด...</p>
      </div>
    )
  }

  // Check if user is admin
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

  if (!session?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">กรุณาเข้าสู่ระบบก่อน</p>
      </div>
    )
  }

  // view state
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [billingMonth, setBillingMonth] = useState(getCurrentMonthLabel())
  const [showAddSub, setShowAddSub] = useState(false)
  const [editingSubId, setEditingSubId] = useState<string | null>(null)
  const [showAddMember, setShowAddMember] = useState(false)
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null)
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null)
  const [editingPayment, setEditingPayment] = useState<SubscriptionPayment | null>(null)
  const [deletePaymentConfirm, setDeletePaymentConfirm] = useState<string | null>(null)
  const [generateSuccessAlert, setGenerateSuccessAlert] = useState<{ created: number } | null>(null)

  // ─── queries ───────────────────────────────

  const {
    data: subscriptions = [],
    isLoading: listLoading,
    refetch: refetchList,
  } = useQuery({
    queryKey: ["subscriptions"],
    queryFn: fetchSubscriptions,
    enabled: !!session?.user?.id && session.isAdmin,
  })

  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ["subscription-detail", selectedId, billingMonth],
    queryFn: () => fetchSubscriptionDetail(selectedId!, billingMonth),
    enabled: !!selectedId,
  })

  // ─── mutations ─────────────────────────────

  const createSubMutation = useMutation({
    mutationFn: async (data: SubscriptionFormData) => {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, startDate: new Date(data.startDate).toISOString() }),
      })
      if (!res.ok) {
        const err = (await res.json()) as { error: string }
        throw new Error(err.error)
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["subscriptions"] })
    },
  })

  const updateSubMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: SubscriptionFormData }) => {
      const res = await fetch(`/api/subscriptions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, startDate: new Date(data.startDate).toISOString() }),
      })
      if (!res.ok) {
        const err = (await res.json()) as { error: string }
        throw new Error(err.error)
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["subscriptions"] })
      void queryClient.invalidateQueries({ queryKey: ["subscription-detail", editingSubId] })
    },
  })

  const deleteSubMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/subscriptions/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const err = (await res.json()) as { error: string }
        throw new Error(err.error)
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["subscriptions"] })
      setSelectedId(null)
    },
  })

  const addMemberMutation = useMutation({
    mutationFn: async (data: MemberFormData) => {
      const res = await fetch("/api/subscriptions/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = (await res.json()) as { error: string }
        throw new Error(err.error)
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["subscription-detail", selectedId] })
      void queryClient.invalidateQueries({ queryKey: ["subscriptions"] })
    },
  })

  const deleteMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const res = await fetch(`/api/subscriptions/members?memberId=${memberId}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const err = (await res.json()) as { error: string }
        throw new Error(err.error)
      }
    },
    onSuccess: () => {
      setDeletingMemberId(null)
      void queryClient.invalidateQueries({ queryKey: ["subscription-detail", selectedId] })
      void queryClient.invalidateQueries({ queryKey: ["subscriptions"] })
    },
  })

  const updateMemberMutation = useMutation({
    mutationFn: async ({ memberId, data }: { memberId: string; data: MemberFormData }) => {
      const res = await fetch(`/api/subscriptions/members?memberId=${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = (await res.json()) as { error: string }
        throw new Error(err.error)
      }
    },
    onSuccess: () => {
      setEditingMemberId(null)
      void queryClient.invalidateQueries({ queryKey: ["subscription-detail", selectedId] })
      void queryClient.invalidateQueries({ queryKey: ["subscriptions"] })
    },
  })

  const paymentMutation = useMutation({
    mutationFn: async ({
      paymentId,
      action,
    }: {
      paymentId: string
      action: "paid" | "unpaid" | "skip"
    }) => {
      const res = await fetch(`/api/subscriptions/payments?paymentId=${paymentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) {
        const err = (await res.json()) as { error: string }
        throw new Error(err.error)
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["subscription-detail", selectedId] })
    },
  })

  const updatePaymentMutation = useMutation({
    mutationFn: async ({ paymentId, data }: { paymentId: string; data: PaymentFormData }) => {
      const res = await fetch(`/api/subscriptions/payments?paymentId=${paymentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: data.amount,
          status: data.status,
          paidAt: data.paidAt ? new Date(data.paidAt) : undefined,
          note: data.note || null,
        }),
      })
      if (!res.ok) {
        const err = (await res.json()) as { error: string }
        throw new Error(err.error)
      }
    },
    onSuccess: () => {
      setEditingPayment(null)
      void queryClient.invalidateQueries({ queryKey: ["subscription-detail", selectedId] })
    },
  })

  const deletePaymentMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      const res = await fetch(`/api/subscriptions/payments?paymentId=${paymentId}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const err = (await res.json()) as { error: string }
        throw new Error(err.error)
      }
    },
    onSuccess: () => {
      setEditingPayment(null)
      void queryClient.invalidateQueries({ queryKey: ["subscription-detail", selectedId] })
    },
  })

  const generatePaymentsMutation = useMutation({
    mutationFn: async (subscriptionId: string) => {
      const res = await fetch(`/api/subscriptions/payments?subscriptionId=${subscriptionId}`, {
        method: "POST",
      })
      if (!res.ok) {
        const err = (await res.json()) as { error: string }
        throw new Error(err.error)
      }
      return (await res.json()) as { created: number }
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["subscription-detail", selectedId] })
      setGenerateSuccessAlert({ created: data.created })
    },
  })

  // ─── handlers ──────────────────────────────

  const handleMarkPaid = useCallback(
    (paymentId: string) => paymentMutation.mutate({ paymentId, action: "paid" }),
    [paymentMutation],
  )
  const handleUnmarkPaid = useCallback(
    (paymentId: string) => paymentMutation.mutate({ paymentId, action: "unpaid" }),
    [paymentMutation],
  )
  const handleSkip = useCallback(
    (paymentId: string) => paymentMutation.mutate({ paymentId, action: "skip" }),
    [paymentMutation],
  )

  const handleEditPayment = useCallback((payment: SubscriptionPayment) => {
    setEditingPayment(payment)
  }, [])

  const handleDeletePayment = useCallback((paymentId: string) => {
    setDeletePaymentConfirm(paymentId)
  }, [])

  const confirmDeletePayment = useCallback(() => {
    if (deletePaymentConfirm) {
      deletePaymentMutation.mutate(deletePaymentConfirm)
    }
  }, [deletePaymentConfirm, deletePaymentMutation])

  // Derived values (after queries are loaded)
  const selectedSub = selectedId ? subscriptions.find((s) => s.id === selectedId) : null
  const editingSub = editingSubId ? subscriptions.find((s) => s.id === editingSubId) : null

  // ─── DETAIL VIEW ───────────────────────────

  if (selectedId && selectedSub) {
    const members: SubscriptionMember[] = detailData?.detail?.members ?? []
    const payments: SubscriptionPayment[] = detailData?.payments ?? []
    const summary = detailData?.summary

    return (
      <div className="mx-auto min-h-screen max-w-3xl px-4 py-6 pb-24">
        {/* back + title + edit */}
        <div className="mb-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSelectedId(null)}
            className="cursor-pointer flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <ArrowLeft className="h-4 w-4" />
            กลับ
          </button>
          <div className="flex flex-1 items-center gap-2.5">
            <ServiceIcon service={selectedSub.service} size={40} variant="badge" />
            <div>
              <h1 className="font-bold text-gray-900 dark:text-white">{selectedSub.name}</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {SUBSCRIPTION_SERVICE_LABELS[selectedSub.service]}
              </p>
            </div>
          </div>
          {/* edit button */}
          <button
            type="button"
            onClick={() => setEditingSubId(selectedId)}
            className="cursor-pointer flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            <Pencil className="h-4 w-4" />
            แก้ไข
          </button>
        </div>

        {/* billing month nav */}
        <div className="mb-5 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setBillingMonth(prevMonth(billingMonth))}
            className="cursor-pointer rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-base font-semibold text-gray-800 dark:text-gray-200">
            {formatBillingMonthThai(billingMonth)}
          </span>
          <button
            type="button"
            onClick={() => setBillingMonth(nextMonth(billingMonth))}
            className="cursor-pointer rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* actions bar */}
        {payments.length === 0 && (
          <div className="mb-5 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-center dark:border-gray-700 dark:bg-gray-800">
            <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">
              ยังไม่มีรายการจ่ายเงินสำหรับเดือนนี้
            </p>
            <button
              type="button"
              onClick={() => generatePaymentsMutation.mutate(selectedId)}
              disabled={generatePaymentsMutation.isPending}
              className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60 dark:bg-indigo-500"
            >
              {generatePaymentsMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  กำลังสร้าง...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  สร้างรายการจ่ายเงิน
                </>
              )}
            </button>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              ดึงข้อมูลสมาชิกทั้งหมดมาสร้าง payment อัตโนมัติ
            </p>
          </div>
        )}

        {/* payment table */}
        {detailLoading ? (
          <div className="flex h-48 items-center justify-center rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <PaymentTable
            payments={payments}
            members={members}
            billingMonth={billingMonth}
            summary={summary}
            currentUserId={session.user.id}
            onMarkPaid={handleMarkPaid}
            onUnmarkPaid={handleUnmarkPaid}
            onSkip={handleSkip}
            onEdit={handleEditPayment}
            onDelete={handleDeletePayment}
          />
        )}

        {/* members list */}
        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                สมาชิก ({members.filter((m) => m.isActive).length} คน)
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setShowAddMember(true)}
              className="cursor-pointer flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-700 dark:bg-indigo-500"
            >
              <Plus className="h-3.5 w-3.5" />
              เพิ่มสมาชิก
            </button>
          </div>

          <div className="space-y-2">
            {members
              .filter((m) => m.isActive)
              .map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-sm font-bold text-white">
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{m.name}</p>
                      {m.email && (
                        <p className="text-xs text-gray-400 dark:text-gray-500">{m.email}</p>
                      )}
                      {m.tags && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {m.tags.split(",").map((tag, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                            >
                              {tag.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                      {m.shareAmount.toLocaleString("th-TH")} ฿
                    </span>
                    {/* actions */}
                    {deletingMemberId === m.id ? (
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => setDeletingMemberId(null)}
                          className="rounded-lg px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          ยกเลิก
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteMemberMutation.mutate(m.id)}
                          disabled={deleteMemberMutation.isPending}
                          className="rounded-lg bg-red-100 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-200 disabled:opacity-60 dark:bg-red-900/30 dark:text-red-400"
                        >
                          ยืนยันลบ
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-0.5">
                        {/* edit button */}
                        <button
                          type="button"
                          onClick={() => setEditingMemberId(m.id)}
                          className="cursor-pointer rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                          aria-label="แก้ไข"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        {/* delete button */}
                        <button
                          type="button"
                          onClick={() => setDeletingMemberId(m.id)}
                          className="cursor-pointer rounded-full p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                          aria-label="ลบสมาชิก"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* add member modal */}
        <AddMemberModal
          open={showAddMember}
          onClose={() => setShowAddMember(false)}
          subscriptionId={selectedId}
          totalPrice={selectedSub.totalPrice}
          currentMemberCount={members.filter((m) => m.isActive).length}
          onSubmit={addMemberMutation.mutateAsync}
        />

        {/* edit member modal */}
        {editingMemberId && (
          <AddMemberModal
            open={!!editingMemberId}
            onClose={() => setEditingMemberId(null)}
            subscriptionId={selectedId}
            totalPrice={selectedSub.totalPrice}
            currentMemberCount={members.filter((m) => m.isActive).length}
            initialData={members.find((m) => m.id === editingMemberId)}
            onSubmit={(data) =>
              updateMemberMutation.mutateAsync({ memberId: editingMemberId, data })
            }
          />
        )}

        {/* edit payment modal */}
        <EditPaymentModal
          open={!!editingPayment}
          onClose={() => setEditingPayment(null)}
          payment={editingPayment}
          onSubmit={(data) =>
            updatePaymentMutation.mutateAsync({ paymentId: editingPayment!.id, data })
          }
          onDelete={(paymentId) => deletePaymentMutation.mutateAsync(paymentId)}
        />

        {/* delete payment confirmation dialog */}
        <ConfirmDialog
          open={!!deletePaymentConfirm}
          onOpenChange={(open) => !open && setDeletePaymentConfirm(null)}
          title="ยืนยันการลบรายการจ่ายเงิน?"
          description="ข้อมูลการจ่ายเงินรายการนี้จะถูกลบถาวร คุณแน่ใจหรือไม่?"
          confirmLabel="ลบรายการ"
          cancelLabel="ยกเลิก"
          onConfirm={confirmDeletePayment}
          variant="danger"
        />

        {/* generate payments success alert */}
        {generateSuccessAlert && (
          <AlertDialogBox
            open={!!generateSuccessAlert}
            onOpenChange={(open) => !open && setGenerateSuccessAlert(null)}
            title={
              generateSuccessAlert.created > 0
                ? "สร้างรายการจ่ายเงินสำเร็จ!"
                : "มีรายการจ่ายเงินอยู่แล้ว"
            }
            description={
              generateSuccessAlert.created > 0
                ? `สร้างรายการจ่ายเงินสำเร็จ ${generateSuccessAlert.created} รายการ`
                : "รายการจ่ายเงินสำหรับเดือนนี้มีอยู่แล้วทั้งหมด"
            }
          />
        )}

        {/* edit subscription modal */}
        {editingSub && (
          <AddSubscriptionModal
            open={!!editingSubId}
            onClose={() => setEditingSubId(null)}
            initialData={editingSub}
            onSubmit={(data) =>
              updateSubMutation.mutateAsync({ id: editingSub.id, data })
            }
            onDelete={(id) => deleteSubMutation.mutateAsync(id)}
          />
        )}
      </div>
    )
  }

  // ─── LIST VIEW ─────────────────────────────

  const totalMonthly = subscriptions.reduce((sum, s) => sum + s.totalPrice, 0)

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 py-6 pb-24">
      {/* header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">📦 Subscriptions</h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            จัดการ subscriptions และติดตามการจ่ายเงิน
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddSub(true)}
          className="cursor-pointer flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 dark:bg-indigo-500"
        >
          <Plus className="h-4 w-4" />
          เพิ่มใหม่
        </button>
      </div>

      {/* monthly banner */}
      {subscriptions.length > 0 && (
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 p-5 text-white shadow-md">
          <p className="text-sm font-medium opacity-80">ค่าใช้จ่ายรวม / เดือน</p>
          <p className="mt-1 text-3xl font-bold">
            {totalMonthly.toLocaleString("th-TH")}
            <span className="ml-1 text-lg font-normal opacity-80">฿</span>
          </p>
          <p className="mt-1 text-xs opacity-70">
            {subscriptions.length} subscription
            {subscriptions.length > 1 ? "s" : ""} · {formatBillingMonthThai(getCurrentMonthLabel())}
          </p>
        </div>
      )}

      {/* list */}
      {listLoading ? (
        <div className="flex h-48 items-center justify-center">
          <RefreshCw className="h-7 w-7 animate-spin text-gray-400" />
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 py-20 text-center dark:border-gray-700">
          <span className="mb-4 text-5xl">📦</span>
          <p className="text-base font-semibold text-gray-700 dark:text-gray-300">
            ยังไม่มี Subscription
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            กดปุ่ม "เพิ่มใหม่" เพื่อเริ่มต้น
          </p>
          <button
            type="button"
            onClick={() => setShowAddSub(true)}
            className="mt-5 flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 dark:bg-indigo-500"
          >
            <Plus className="h-4 w-4" />
            เพิ่ม Subscription แรก
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {subscriptions.map((sub) => (
            <SubscriptionCard
              key={sub.id}
              subscription={sub}
              onSelect={setSelectedId}
              onEdit={(id) => setEditingSubId(id)}
            />
          ))}
        </div>
      )}

      {/* refresh */}
      {subscriptions.length > 0 && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => void refetchList()}
            className="cursor-pointer flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            <RefreshCw className="h-4 w-4" />
            รีเฟรช
          </button>
        </div>
      )}

      {/* create modal */}
      <AddSubscriptionModal
        open={showAddSub}
        onClose={() => setShowAddSub(false)}
        onSubmit={createSubMutation.mutateAsync}
      />

      {/* edit modal (list view) */}
      {editingSub && (
        <AddSubscriptionModal
          open={!!editingSubId}
          onClose={() => setEditingSubId(null)}
          initialData={editingSub}
          onSubmit={(data) =>
            updateSubMutation.mutateAsync({ id: editingSub.id, data })
          }
          onDelete={(id) => deleteSubMutation.mutateAsync(id)}
        />
      )}
    </div>
  )
}
