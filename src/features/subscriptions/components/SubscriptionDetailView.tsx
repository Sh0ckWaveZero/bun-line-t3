"use client";

/**
 * SubscriptionDetailView — หน้ารายละเอียด subscription (payments รายเดือน + สมาชิก)
 */

import { RefreshCw } from "lucide-react";
import { ConfirmDialog, AlertDialogBox } from "@/components/ui/AlertDialog";
import type {
  MonthlySummary,
  SubscriptionMember,
  SubscriptionPayment,
  SubscriptionWithMembers,
} from "@/features/subscriptions/types";
import { SubscriptionDetailHeader } from "./SubscriptionDetailHeader";
import { BillingMonthNav } from "./BillingMonthNav";
import { EmptyPaymentsCard } from "./EmptyPaymentsCard";
import { PaymentTable } from "./PaymentTable";
import { MembersSection } from "./MembersSection";
import { AddMemberModal } from "./AddMemberModal";
import { AddSubscriptionModal } from "./AddSubscriptionModal";
import { EditPaymentModal } from "./EditPaymentModal";
import type { SubscriptionFormData } from "./AddSubscriptionModal";
import type { MemberFormData } from "./AddMemberModal";
import type { PaymentFormData } from "./EditPaymentModal";

interface SubscriptionDetailViewProps {
  subscription: SubscriptionWithMembers;
  isAdmin: boolean;
  currentUserId: string;
  billingMonth: string;
  detailLoading: boolean;
  members: SubscriptionMember[];
  payments: SubscriptionPayment[];
  summary?: MonthlySummary;
  editingSubId: string | null;
  editingSub: SubscriptionWithMembers | null;
  editingMemberId: string | null;
  deletingMemberId: string | null;
  editingPayment: SubscriptionPayment | null;
  deletePaymentConfirm: string | null;
  showAddMember: boolean;
  generateSuccessAlert: { created: number } | null;
  isGeneratingPayments: boolean;
  isDeletingMember: boolean;
  subscriptionId: string;
  onBack: () => void;
  onEditSubscription: () => void;
  onCloseEditSubscription: () => void;
  onUpdateSubscriptionSubmit: (
    id: string,
    data: SubscriptionFormData,
  ) => Promise<void>;
  onDeleteSubscriptionSubmit: (id: string) => Promise<void>;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onGeneratePayments: () => void;
  onMarkPaid: (paymentId: string) => void;
  onUnmarkPaid: (paymentId: string) => void;
  onSkip: (paymentId: string) => void;
  onEditPayment: (payment: SubscriptionPayment) => void;
  onDeletePaymentRequest: (paymentId: string) => void;
  onCloseEditPayment: () => void;
  onUpdatePaymentSubmit: (data: PaymentFormData) => Promise<void>;
  onDeletePaymentSubmit: (paymentId: string) => Promise<void>;
  onCancelDeletePayment: () => void;
  onConfirmDeletePayment: () => void;
  onCloseGenerateAlert: () => void;
  onOpenAddMember: () => void;
  onCloseAddMember: () => void;
  onAddMemberSubmit: (data: MemberFormData) => Promise<void>;
  onCloseEditMember: () => void;
  onUpdateMemberSubmit: (
    memberId: string,
    data: MemberFormData,
  ) => Promise<void>;
  onEditMember: (memberId: string) => void;
  onRequestDeleteMember: (memberId: string) => void;
  onCancelDeleteMember: () => void;
  onConfirmDeleteMember: (memberId: string) => void;
}

export const SubscriptionDetailView = ({
  subscription,
  isAdmin,
  currentUserId,
  billingMonth,
  detailLoading,
  members,
  payments,
  summary,
  editingSubId,
  editingSub,
  editingMemberId,
  deletingMemberId,
  editingPayment,
  deletePaymentConfirm,
  showAddMember,
  generateSuccessAlert,
  isGeneratingPayments,
  isDeletingMember,
  subscriptionId,
  onBack,
  onEditSubscription,
  onCloseEditSubscription,
  onUpdateSubscriptionSubmit,
  onDeleteSubscriptionSubmit,
  onPrevMonth,
  onNextMonth,
  onGeneratePayments,
  onMarkPaid,
  onUnmarkPaid,
  onSkip,
  onEditPayment,
  onDeletePaymentRequest,
  onCloseEditPayment,
  onUpdatePaymentSubmit,
  onDeletePaymentSubmit,
  onCancelDeletePayment,
  onConfirmDeletePayment,
  onCloseGenerateAlert,
  onOpenAddMember,
  onCloseAddMember,
  onAddMemberSubmit,
  onCloseEditMember,
  onUpdateMemberSubmit,
  onEditMember,
  onRequestDeleteMember,
  onCancelDeleteMember,
  onConfirmDeleteMember,
}: SubscriptionDetailViewProps) => {
  const activeMembers = members.filter((m) => m.isActive);

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 py-6 pb-24">
      <SubscriptionDetailHeader
        subscription={subscription}
        isAdmin={isAdmin}
        onBack={onBack}
        onEdit={onEditSubscription}
      />

      <BillingMonthNav
        billingMonth={billingMonth}
        onPrevMonth={onPrevMonth}
        onNextMonth={onNextMonth}
      />

      {isAdmin && payments.length === 0 && (
        <EmptyPaymentsCard
          isAdmin
          isGenerating={isGeneratingPayments}
          onGenerate={onGeneratePayments}
        />
      )}

      {!isAdmin && payments.length === 0 && !detailLoading && (
        <EmptyPaymentsCard isAdmin={false} />
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
          onEdit={onEditPayment}
          onDelete={onDeletePaymentRequest}
        />
      )}

      <MembersSection
        members={activeMembers}
        isAdmin={isAdmin}
        deletingMemberId={deletingMemberId}
        isDeletingMember={isDeletingMember}
        onOpenAddMember={onOpenAddMember}
        onEditMember={onEditMember}
        onRequestDeleteMember={onRequestDeleteMember}
        onCancelDeleteMember={onCancelDeleteMember}
        onConfirmDeleteMember={onConfirmDeleteMember}
      />

      {isAdmin && (
        <AddMemberModal
          open={showAddMember}
          onClose={onCloseAddMember}
          subscriptionId={subscriptionId}
          totalPrice={subscription.totalPrice}
          currentMemberCount={activeMembers.length}
          onSubmit={onAddMemberSubmit}
        />
      )}

      {isAdmin && editingMemberId && (
        <AddMemberModal
          open={!!editingMemberId}
          onClose={onCloseEditMember}
          subscriptionId={subscriptionId}
          totalPrice={subscription.totalPrice}
          currentMemberCount={activeMembers.length}
          initialData={members.find((m) => m.id === editingMemberId)}
          onSubmit={(data) => onUpdateMemberSubmit(editingMemberId, data)}
        />
      )}

      <EditPaymentModal
        open={!!editingPayment}
        onClose={onCloseEditPayment}
        payment={editingPayment}
        onSubmit={onUpdatePaymentSubmit}
        onDelete={onDeletePaymentSubmit}
      />

      <ConfirmDialog
        open={!!deletePaymentConfirm}
        onOpenChange={(open) => !open && onCancelDeletePayment()}
        title="ยืนยันการลบรายการจ่ายเงิน?"
        description="ข้อมูลการจ่ายเงินรายการนี้จะถูกลบถาวร คุณแน่ใจหรือไม่?"
        confirmLabel="ลบรายการ"
        cancelLabel="ยกเลิก"
        onConfirm={onConfirmDeletePayment}
        variant="danger"
      />

      {generateSuccessAlert && (
        <AlertDialogBox
          open={!!generateSuccessAlert}
          onOpenChange={(open) => !open && onCloseGenerateAlert()}
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

      {isAdmin && editingSub && (
        <AddSubscriptionModal
          open={!!editingSubId}
          onClose={onCloseEditSubscription}
          initialData={editingSub}
          onSubmit={(data) => onUpdateSubscriptionSubmit(editingSub.id, data)}
          onDelete={onDeleteSubscriptionSubmit}
        />
      )}
    </div>
  );
};
