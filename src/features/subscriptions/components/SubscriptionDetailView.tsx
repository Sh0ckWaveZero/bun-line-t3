"use client";

import { AddMemberModal, type MemberFormData } from "./AddMemberModal";
import {
  AddSubscriptionModal,
  type SubscriptionFormData,
} from "./AddSubscriptionModal";
import { EditPaymentModal, type PaymentFormData } from "./EditPaymentModal";
import { PaymentTable } from "./PaymentTable";
import { ServiceIcon } from "./ServiceIcon";
import { AlertDialogBox, ConfirmDialog } from "@/components/ui/AlertDialog";
import { SUBSCRIPTION_SERVICE_LABELS } from "@/features/subscriptions/constants";
import { formatBillingMonthThai } from "@/features/subscriptions/helpers";
import type {
  MonthlySummary,
  SubscriptionMember,
  SubscriptionPayment,
  SubscriptionWithMembers,
} from "@/features/subscriptions/types";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Users,
} from "lucide-react";

interface SubscriptionDetailState {
  showAddMember: boolean;
  editingMemberId: string | null;
  deletingMemberId: string | null;
  editingPayment: SubscriptionPayment | null;
  deletePaymentConfirm: string | null;
  generateSuccessAlert: { created: number } | null;
  editingSub: SubscriptionWithMembers | null;
  editingSubId: string | null;
  isDeletingMember: boolean;
  isGeneratingPayments: boolean;
}

interface SubscriptionDetailActions {
  onBack: () => void;
  onEditSubscription: () => void;
  onChangeBillingMonth: (month: string) => void;
  onGeneratePayments: () => void;
  onMarkPaid: (paymentId: string) => void;
  onUnmarkPaid: (paymentId: string) => void;
  onSkip: (paymentId: string) => void;
  onEditPayment: (payment: SubscriptionPayment) => void;
  onDeletePayment: (paymentId: string) => void;
  onOpenAddMember: () => void;
  onCloseAddMember: () => void;
  onEditMember: (memberId: string) => void;
  onCloseEditMember: () => void;
  onStopDeletingMember: () => void;
  onStartDeletingMember: (memberId: string) => void;
  onDeleteMember: (memberId: string) => void;
  onAddMember: (data: MemberFormData) => Promise<void>;
  onUpdateMember: (memberId: string, data: MemberFormData) => Promise<void>;
  onCloseEditPayment: () => void;
  onSubmitEditPayment: (data: PaymentFormData) => Promise<void>;
  onDeletePaymentMutation: (paymentId: string) => Promise<void>;
  onCloseDeletePaymentConfirm: () => void;
  onConfirmDeletePayment: () => void;
  onCloseGenerateAlert: () => void;
  onCloseEditSubscription: () => void;
  onUpdateSubscription: (
    id: string,
    data: SubscriptionFormData,
  ) => Promise<void>;
  onDeleteSubscription: (id: string) => Promise<void>;
}

export interface SubscriptionDetailViewProps {
  subscription: SubscriptionWithMembers;
  subscriptionId: string;
  isAdmin: boolean;
  currentUserId: string;
  billingMonth: string;
  detailLoading: boolean;
  members: SubscriptionMember[];
  payments: SubscriptionPayment[];
  summary: MonthlySummary | undefined;
  state: SubscriptionDetailState;
  actions: SubscriptionDetailActions;
}

interface SubscriptionDetailHeaderProps {
  subscription: SubscriptionWithMembers;
  isAdmin: boolean;
  billingMonth: string;
  onBack: () => void;
  onEdit: () => void;
  onChangeBillingMonth: (month: string) => void;
}

function SubscriptionDetailHeader({
  subscription,
  isAdmin,
  billingMonth,
  onBack,
  onEdit,
  onChangeBillingMonth,
}: SubscriptionDetailHeaderProps) {
  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          กลับ
        </button>
        <div className="flex flex-1 items-center gap-2.5">
          <ServiceIcon
            service={subscription.service}
            size={40}
            variant="badge"
          />
          <div>
            <h1 className="font-bold text-gray-900 dark:text-white">
              {subscription.name}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {SUBSCRIPTION_SERVICE_LABELS[subscription.service]}
            </p>
          </div>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={onEdit}
            className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            <Pencil className="h-4 w-4" />
            แก้ไข
          </button>
        )}
      </div>

      <div className="mb-5 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onChangeBillingMonth(previousMonth(billingMonth))}
          aria-label="เดือนก่อนหน้า"
          className="cursor-pointer rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-base font-semibold text-gray-800 dark:text-gray-200">
          {formatBillingMonthThai(billingMonth)}
        </span>
        <button
          type="button"
          onClick={() => onChangeBillingMonth(nextMonth(billingMonth))}
          aria-label="เดือนถัดไป"
          className="cursor-pointer rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </>
  );
}

function previousMonth(billingMonth: string): string {
  const [year, month] = billingMonth.split("-").map(Number) as [number, number];
  const date = new Date(year, month - 2, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function nextMonth(billingMonth: string): string {
  const [year, month] = billingMonth.split("-").map(Number) as [number, number];
  const date = new Date(year, month, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

interface SubscriptionPaymentsSectionProps {
  isAdmin: boolean;
  detailLoading: boolean;
  payments: SubscriptionPayment[];
  members: SubscriptionMember[];
  billingMonth: string;
  summary: MonthlySummary | undefined;
  currentUserId: string;
  isGeneratingPayments: boolean;
  onGeneratePayments: () => void;
  onMarkPaid: (paymentId: string) => void;
  onUnmarkPaid: (paymentId: string) => void;
  onSkip: (paymentId: string) => void;
  onEdit: (payment: SubscriptionPayment) => void;
  onDelete: (paymentId: string) => void;
}

function SubscriptionPaymentsSection({
  isAdmin,
  detailLoading,
  payments,
  members,
  billingMonth,
  summary,
  currentUserId,
  isGeneratingPayments,
  onGeneratePayments,
  onMarkPaid,
  onUnmarkPaid,
  onSkip,
  onEdit,
  onDelete,
}: SubscriptionPaymentsSectionProps) {
  return (
    <>
      {isAdmin && payments.length === 0 && (
        <div className="mb-5 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-center dark:border-gray-700 dark:bg-gray-800">
          <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">
            ยังไม่มีรายการจ่ายเงินสำหรับเดือนนี้
          </p>
          <button
            type="button"
            onClick={onGeneratePayments}
            disabled={isGeneratingPayments}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60 dark:bg-indigo-500"
          >
            {isGeneratingPayments ? (
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

      {!isAdmin && payments.length === 0 && !detailLoading && (
        <div className="mb-5 rounded-2xl border border-gray-200 bg-gray-50 p-6 text-center dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            ยังไม่มีรายการจ่ายเงินสำหรับเดือนนี้
          </p>
        </div>
      )}

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
          currentUserId={currentUserId}
          onMarkPaid={onMarkPaid}
          onUnmarkPaid={onUnmarkPaid}
          onSkip={onSkip}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )}
    </>
  );
}

interface SubscriptionMembersSectionProps {
  subscriptionId: string;
  totalPrice: number;
  members: SubscriptionMember[];
  isAdmin: boolean;
  showAddMember: boolean;
  editingMemberId: string | null;
  deletingMemberId: string | null;
  isDeletingMember: boolean;
  onOpenAddMember: () => void;
  onCloseAddMember: () => void;
  onEditMember: (memberId: string) => void;
  onCloseEditMember: () => void;
  onStopDeletingMember: () => void;
  onStartDeletingMember: (memberId: string) => void;
  onDeleteMember: (memberId: string) => void;
  onAddMember: (data: MemberFormData) => Promise<void>;
  onUpdateMember: (memberId: string, data: MemberFormData) => Promise<void>;
}

function SubscriptionMembersSection({
  subscriptionId,
  totalPrice,
  members,
  isAdmin,
  showAddMember,
  editingMemberId,
  deletingMemberId,
  isDeletingMember,
  onOpenAddMember,
  onCloseAddMember,
  onEditMember,
  onCloseEditMember,
  onStopDeletingMember,
  onStartDeletingMember,
  onDeleteMember,
  onAddMember,
  onUpdateMember,
}: SubscriptionMembersSectionProps) {
  const activeMembers = members.filter((member) => member.isActive);
  const editingMember = members.find((member) => member.id === editingMemberId);

  return (
    <div className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            สมาชิก ({activeMembers.length} คน)
          </h2>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={onOpenAddMember}
            className="flex cursor-pointer items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-700 dark:bg-indigo-500"
          >
            <Plus className="h-3.5 w-3.5" />
            เพิ่มสมาชิก
          </button>
        )}
      </div>

      <div className="space-y-2">
        {activeMembers.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-indigo-400 to-purple-500 text-sm font-bold text-white">
                {member.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {member.name}
                </p>
                {member.email && (
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {member.email}
                  </p>
                )}
                {member.tags && (
                  <MemberTags memberId={member.id} tags={member.tags} />
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                {member.shareAmount.toLocaleString("th-TH")} ฿
              </span>
              {isAdmin && (
                <MemberActions
                  member={member}
                  deletingMemberId={deletingMemberId}
                  isDeleting={isDeletingMember}
                  onStopDeleting={onStopDeletingMember}
                  onEdit={onEditMember}
                  onStartDeleting={onStartDeletingMember}
                  onDelete={onDeleteMember}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {isAdmin && (
        <AddMemberModal
          open={showAddMember}
          onClose={onCloseAddMember}
          subscriptionId={subscriptionId}
          totalPrice={totalPrice}
          currentMemberCount={activeMembers.length}
          onSubmit={onAddMember}
        />
      )}

      {isAdmin && editingMemberId && (
        <AddMemberModal
          open={!!editingMemberId}
          onClose={onCloseEditMember}
          subscriptionId={subscriptionId}
          totalPrice={totalPrice}
          currentMemberCount={activeMembers.length}
          initialData={editingMember}
          onSubmit={(data) => onUpdateMember(editingMemberId, data)}
        />
      )}
    </div>
  );
}

function MemberTags({ memberId, tags }: { memberId: string; tags: string }) {
  const occurrences = new Map<string, number>();
  const labels = tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((label) => {
      const occurrence = occurrences.get(label) ?? 0;
      occurrences.set(label, occurrence + 1);
      return { key: `${memberId}:${label}:${occurrence}`, label };
    });

  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {labels.map(({ key, label }) => (
        <span
          key={key}
          className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
        >
          {label}
        </span>
      ))}
    </div>
  );
}

interface MemberActionsProps {
  member: SubscriptionMember;
  deletingMemberId: string | null;
  isDeleting: boolean;
  onStopDeleting: () => void;
  onEdit: (memberId: string) => void;
  onStartDeleting: (memberId: string) => void;
  onDelete: (memberId: string) => void;
}

function MemberActions({
  member,
  deletingMemberId,
  isDeleting,
  onStopDeleting,
  onEdit,
  onStartDeleting,
  onDelete,
}: MemberActionsProps) {
  if (deletingMemberId === member.id) {
    return (
      <div className="flex gap-1">
        <button
          type="button"
          onClick={onStopDeleting}
          className="rounded-lg px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          ยกเลิก
        </button>
        <button
          type="button"
          onClick={() => onDelete(member.id)}
          disabled={isDeleting}
          className="rounded-lg bg-red-100 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-200 disabled:opacity-60 dark:bg-red-900/30 dark:text-red-400"
        >
          ยืนยันลบ
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-0.5">
      <button
        type="button"
        onClick={() => onEdit(member.id)}
        className="cursor-pointer rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200"
        aria-label="แก้ไข"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => onStartDeleting(member.id)}
        className="cursor-pointer rounded-full p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
        aria-label="ลบสมาชิก"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

interface SubscriptionDetailDialogsProps {
  isAdmin: boolean;
  state: SubscriptionDetailState;
  actions: SubscriptionDetailActions;
}

function SubscriptionDetailDialogs({
  isAdmin,
  state,
  actions,
}: SubscriptionDetailDialogsProps) {
  return (
    <>
      <EditPaymentModal
        open={!!state.editingPayment}
        onClose={actions.onCloseEditPayment}
        payment={state.editingPayment}
        onSubmit={actions.onSubmitEditPayment}
        onDelete={actions.onDeletePaymentMutation}
      />

      <ConfirmDialog
        open={!!state.deletePaymentConfirm}
        onOpenChange={(open) => !open && actions.onCloseDeletePaymentConfirm()}
        title="ยืนยันการลบรายการจ่ายเงิน?"
        description="ข้อมูลการจ่ายเงินรายการนี้จะถูกลบถาวร คุณแน่ใจหรือไม่?"
        confirmLabel="ลบรายการ"
        cancelLabel="ยกเลิก"
        onConfirm={actions.onConfirmDeletePayment}
        variant="danger"
      />

      {state.generateSuccessAlert && (
        <AlertDialogBox
          open={!!state.generateSuccessAlert}
          onOpenChange={(open) => !open && actions.onCloseGenerateAlert()}
          title={
            state.generateSuccessAlert.created > 0
              ? "สร้างรายการจ่ายเงินสำเร็จ!"
              : "มีรายการจ่ายเงินอยู่แล้ว"
          }
          description={
            state.generateSuccessAlert.created > 0
              ? `สร้างรายการจ่ายเงินสำเร็จ ${state.generateSuccessAlert.created} รายการ`
              : "รายการจ่ายเงินสำหรับเดือนนี้มีอยู่แล้วทั้งหมด"
          }
        />
      )}

      {isAdmin && state.editingSub && (
        <AddSubscriptionModal
          open={!!state.editingSubId}
          onClose={actions.onCloseEditSubscription}
          initialData={state.editingSub}
          onSubmit={(data) =>
            actions.onUpdateSubscription(state.editingSub!.id, data)
          }
          onDelete={actions.onDeleteSubscription}
        />
      )}
    </>
  );
}

export function SubscriptionDetailView({
  subscription,
  subscriptionId,
  isAdmin,
  currentUserId,
  billingMonth,
  detailLoading,
  members,
  payments,
  summary,
  state,
  actions,
}: SubscriptionDetailViewProps) {
  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 py-6 pb-24">
      <SubscriptionDetailHeader
        subscription={subscription}
        isAdmin={isAdmin}
        billingMonth={billingMonth}
        onBack={actions.onBack}
        onEdit={actions.onEditSubscription}
        onChangeBillingMonth={actions.onChangeBillingMonth}
      />

      <SubscriptionPaymentsSection
        isAdmin={isAdmin}
        detailLoading={detailLoading}
        payments={payments}
        members={members}
        billingMonth={billingMonth}
        summary={summary}
        currentUserId={currentUserId}
        isGeneratingPayments={state.isGeneratingPayments}
        onGeneratePayments={actions.onGeneratePayments}
        onMarkPaid={actions.onMarkPaid}
        onUnmarkPaid={actions.onUnmarkPaid}
        onSkip={actions.onSkip}
        onEdit={actions.onEditPayment}
        onDelete={actions.onDeletePayment}
      />

      <SubscriptionMembersSection
        subscriptionId={subscriptionId}
        totalPrice={subscription.totalPrice}
        members={members}
        isAdmin={isAdmin}
        showAddMember={state.showAddMember}
        editingMemberId={state.editingMemberId}
        deletingMemberId={state.deletingMemberId}
        isDeletingMember={state.isDeletingMember}
        onOpenAddMember={actions.onOpenAddMember}
        onCloseAddMember={actions.onCloseAddMember}
        onEditMember={actions.onEditMember}
        onCloseEditMember={actions.onCloseEditMember}
        onStopDeletingMember={actions.onStopDeletingMember}
        onStartDeletingMember={actions.onStartDeletingMember}
        onDeleteMember={actions.onDeleteMember}
        onAddMember={actions.onAddMember}
        onUpdateMember={actions.onUpdateMember}
      />

      <SubscriptionDetailDialogs
        isAdmin={isAdmin}
        state={state}
        actions={actions}
      />
    </div>
  );
}
