"use client";

import { useState, useCallback } from "react";
import { useSession } from "@/lib/auth/client";
import { SubscriptionDetailView } from "@/features/subscriptions/components/SubscriptionDetailView";
import { SubscriptionsListView } from "@/features/subscriptions/components/SubscriptionsListView";
import {
  useSubscriptionsList,
  useSubscriptionDetail,
} from "@/features/subscriptions/hooks/useSubscriptionQueries";
import { useSubscriptionMutations } from "@/features/subscriptions/hooks/useSubscriptionMutations";
import { useMemberMutations } from "@/features/subscriptions/hooks/useMemberMutations";
import { usePaymentMutations } from "@/features/subscriptions/hooks/usePaymentMutations";
import type { SubscriptionPayment } from "@/features/subscriptions/types";
import {
  getCurrentMonthLabel,
  prevMonth,
  nextMonth,
} from "@/features/subscriptions/helpers";

export function SubscriptionsPage() {
  const { data: session, status } = useSession();
  const isPending = status === "loading";

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [billingMonth, setBillingMonth] = useState(getCurrentMonthLabel);
  const [showAddSub, setShowAddSub] = useState(false);
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);
  const [editingPayment, setEditingPayment] =
    useState<SubscriptionPayment | null>(null);
  const [deletePaymentConfirm, setDeletePaymentConfirm] = useState<
    string | null
  >(null);
  const [generateSuccessAlert, setGenerateSuccessAlert] = useState<{
    created: number;
  } | null>(null);

  const { subscriptions, listLoading, refetchList } = useSubscriptionsList(
    !!session?.user?.id,
  );
  const { detailData, detailLoading } = useSubscriptionDetail(
    selectedId,
    billingMonth,
  );

  const { createSubMutation, updateSubMutation, deleteSubMutation } =
    useSubscriptionMutations({
      editingSubId,
      onSubDeleted: () => setSelectedId(null),
    });

  const { addMemberMutation, deleteMemberMutation, updateMemberMutation } =
    useMemberMutations({
      selectedId,
      onMemberDeleted: () => setDeletingMemberId(null),
      onMemberUpdated: () => setEditingMemberId(null),
    });

  const {
    paymentMutation,
    updatePaymentMutation,
    deletePaymentMutation,
    generatePaymentsMutation,
  } = usePaymentMutations({
    selectedId,
    onEditingClosed: () => setEditingPayment(null),
    onGenerateSuccess: (created) => setGenerateSuccessAlert({ created }),
  });

  const handleMarkPaid = useCallback(
    (paymentId: string) =>
      paymentMutation.mutate({ paymentId, action: "paid" }),
    [paymentMutation],
  );
  const handleUnmarkPaid = useCallback(
    (paymentId: string) =>
      paymentMutation.mutate({ paymentId, action: "unpaid" }),
    [paymentMutation],
  );
  const handleSkip = useCallback(
    (paymentId: string) =>
      paymentMutation.mutate({ paymentId, action: "skip" }),
    [paymentMutation],
  );

  const handleEditPayment = useCallback((payment: SubscriptionPayment) => {
    setEditingPayment(payment);
  }, []);

  const handleDeletePayment = useCallback((paymentId: string) => {
    setDeletePaymentConfirm(paymentId);
  }, []);

  const confirmDeletePayment = useCallback(() => {
    if (deletePaymentConfirm) {
      deletePaymentMutation.mutate(deletePaymentConfirm);
    }
  }, [deletePaymentConfirm, deletePaymentMutation]);

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground text-lg">กำลังโหลด...</p>
      </div>
    );
  }

  const isAdmin = !!session!.isAdmin;
  const currentUserId = session!.user!.id;

  const selectedSub = selectedId
    ? subscriptions.find((s) => s.id === selectedId)
    : null;
  const editingSub = editingSubId
    ? (subscriptions.find((s) => s.id === editingSubId) ?? null)
    : null;

  if (selectedId && selectedSub) {
    return (
      <SubscriptionDetailView
        subscription={selectedSub}
        isAdmin={isAdmin}
        currentUserId={currentUserId}
        billingMonth={billingMonth}
        detailLoading={detailLoading}
        members={detailData?.detail?.members ?? []}
        payments={detailData?.payments ?? []}
        summary={detailData?.summary}
        editingSubId={editingSubId}
        editingSub={editingSub}
        editingMemberId={editingMemberId}
        deletingMemberId={deletingMemberId}
        editingPayment={editingPayment}
        deletePaymentConfirm={deletePaymentConfirm}
        showAddMember={showAddMember}
        generateSuccessAlert={generateSuccessAlert}
        isGeneratingPayments={generatePaymentsMutation.isPending}
        isDeletingMember={deleteMemberMutation.isPending}
        subscriptionId={selectedId}
        onBack={() => setSelectedId(null)}
        onEditSubscription={() => setEditingSubId(selectedId)}
        onCloseEditSubscription={() => setEditingSubId(null)}
        onUpdateSubscriptionSubmit={(id, data) =>
          updateSubMutation.mutateAsync({ id, data })
        }
        onDeleteSubscriptionSubmit={(id) => deleteSubMutation.mutateAsync(id)}
        onPrevMonth={() => setBillingMonth(prevMonth(billingMonth))}
        onNextMonth={() => setBillingMonth(nextMonth(billingMonth))}
        onGeneratePayments={() => generatePaymentsMutation.mutate(selectedId)}
        onMarkPaid={handleMarkPaid}
        onUnmarkPaid={handleUnmarkPaid}
        onSkip={handleSkip}
        onEditPayment={handleEditPayment}
        onDeletePaymentRequest={handleDeletePayment}
        onCloseEditPayment={() => setEditingPayment(null)}
        onUpdatePaymentSubmit={(data) =>
          updatePaymentMutation.mutateAsync({
            paymentId: editingPayment!.id,
            data,
          })
        }
        onDeletePaymentSubmit={(paymentId) =>
          deletePaymentMutation.mutateAsync(paymentId)
        }
        onCancelDeletePayment={() => setDeletePaymentConfirm(null)}
        onConfirmDeletePayment={confirmDeletePayment}
        onCloseGenerateAlert={() => setGenerateSuccessAlert(null)}
        onOpenAddMember={() => setShowAddMember(true)}
        onCloseAddMember={() => setShowAddMember(false)}
        onAddMemberSubmit={addMemberMutation.mutateAsync}
        onCloseEditMember={() => setEditingMemberId(null)}
        onUpdateMemberSubmit={(memberId, data) =>
          updateMemberMutation.mutateAsync({ memberId, data })
        }
        onEditMember={setEditingMemberId}
        onRequestDeleteMember={setDeletingMemberId}
        onCancelDeleteMember={() => setDeletingMemberId(null)}
        onConfirmDeleteMember={(memberId) =>
          deleteMemberMutation.mutate(memberId)
        }
      />
    );
  }

  return (
    <SubscriptionsListView
      isAdmin={isAdmin}
      subscriptions={subscriptions}
      listLoading={listLoading}
      showAdd={showAddSub}
      editingSubId={editingSubId}
      editingSub={editingSub}
      onSelect={setSelectedId}
      onOpenAdd={() => setShowAddSub(true)}
      onCloseAdd={() => setShowAddSub(false)}
      onCreateSubmit={createSubMutation.mutateAsync}
      onEditSubscription={(id) => setEditingSubId(id)}
      onCloseEditSubscription={() => setEditingSubId(null)}
      onUpdateSubscriptionSubmit={(id, data) =>
        updateSubMutation.mutateAsync({ id, data })
      }
      onDeleteSubscriptionSubmit={(id) => deleteSubMutation.mutateAsync(id)}
      onRefresh={() => void refetchList()}
    />
  );
}
