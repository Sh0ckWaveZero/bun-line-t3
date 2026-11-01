"use client";

import { useCallback, useState } from "react";
import { useSession } from "@/lib/auth/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SubscriptionDetailViewProps } from "@/features/subscriptions/components/SubscriptionDetailView";
import type { SubscriptionListViewProps } from "@/features/subscriptions/components/SubscriptionListView";
import type { SubscriptionFormData } from "@/features/subscriptions/components/AddSubscriptionModal";
import type { MemberFormData } from "@/features/subscriptions/components/AddMemberModal";
import type { PaymentFormData } from "@/features/subscriptions/components/EditPaymentModal";
import type {
  MonthlySummary,
  SubscriptionDetail,
  SubscriptionPayment,
  SubscriptionWithMembers,
} from "@/features/subscriptions/types";
import { getCurrentMonthLabel } from "@/features/subscriptions/helpers";

async function fetchSubscriptions(): Promise<SubscriptionWithMembers[]> {
  const response = await fetch("/api/subscriptions");
  if (!response.ok) throw new Error("ไม่สามารถดึงข้อมูล subscriptions ได้");
  const json = (await response.json()) as { data: SubscriptionWithMembers[] };
  return json.data;
}

async function fetchSubscriptionDetail(
  subscriptionId: string,
  billingMonth: string,
): Promise<{
  detail: SubscriptionDetail;
  payments: SubscriptionPayment[];
  summary: MonthlySummary;
}> {
  const [detailResponse, paymentsResponse] = await Promise.all([
    fetch(`/api/subscriptions/${subscriptionId}?billingMonth=${billingMonth}`),
    fetch(
      `/api/subscriptions/payments?subscriptionId=${subscriptionId}&billingMonth=${billingMonth}&summary=true`,
    ),
  ]);
  if (!detailResponse.ok) throw new Error("ไม่สามารถดึงรายละเอียดได้");
  const detailJson = (await detailResponse.json()) as {
    data: SubscriptionDetail;
  };
  const paymentsJson = (await paymentsResponse.json()) as {
    data: SubscriptionPayment[];
    summary: MonthlySummary;
  };
  return {
    detail: detailJson.data,
    payments: paymentsJson.data,
    summary: paymentsJson.summary,
  };
}

type SubscriptionsPageController =
  | { isPending: true }
  | {
      isPending: false;
      detailProps: SubscriptionDetailViewProps | null;
      listProps: SubscriptionListViewProps;
    };

export function useSubscriptionsPageController(): SubscriptionsPageController {
  const { data: session, status } = useSession();
  const isPending = status === "loading";
  const queryClient = useQueryClient();

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

  const {
    data: subscriptions = [],
    isLoading: listLoading,
    refetch: refetchList,
  } = useQuery({
    queryKey: ["subscriptions"],
    queryFn: fetchSubscriptions,
    enabled: !!session?.user?.id,
  });

  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ["subscription-detail", selectedId, billingMonth],
    queryFn: () => fetchSubscriptionDetail(selectedId!, billingMonth),
    enabled: !!selectedId,
  });

  const createSubMutation = useMutation({
    mutationFn: async (data: SubscriptionFormData) => {
      const response = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          startDate: new Date(data.startDate).toISOString(),
        }),
      });
      if (!response.ok) {
        const error = (await response.json()) as { error: string };
        throw new Error(error.error);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
    },
  });

  const updateSubMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: SubscriptionFormData;
    }) => {
      const response = await fetch(`/api/subscriptions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          startDate: new Date(data.startDate).toISOString(),
        }),
      });
      if (!response.ok) {
        const error = (await response.json()) as { error: string };
        throw new Error(error.error);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      void queryClient.invalidateQueries({
        queryKey: ["subscription-detail", editingSubId],
      });
    },
  });

  const deleteSubMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/subscriptions/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = (await response.json()) as { error: string };
        throw new Error(error.error);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      setSelectedId(null);
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: async (data: MemberFormData) => {
      const response = await fetch("/api/subscriptions/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = (await response.json()) as { error: string };
        throw new Error(error.error);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["subscription-detail", selectedId],
      });
      void queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
    },
  });

  const deleteMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const response = await fetch(
        `/api/subscriptions/members?memberId=${memberId}`,
        { method: "DELETE" },
      );
      if (!response.ok) {
        const error = (await response.json()) as { error: string };
        throw new Error(error.error);
      }
    },
    onSuccess: () => {
      setDeletingMemberId(null);
      void queryClient.invalidateQueries({
        queryKey: ["subscription-detail", selectedId],
      });
      void queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
    },
  });

  const updateMemberMutation = useMutation({
    mutationFn: async ({
      memberId,
      data,
    }: {
      memberId: string;
      data: MemberFormData;
    }) => {
      const response = await fetch(
        `/api/subscriptions/members?memberId=${memberId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );
      if (!response.ok) {
        const error = (await response.json()) as { error: string };
        throw new Error(error.error);
      }
    },
    onSuccess: () => {
      setEditingMemberId(null);
      void queryClient.invalidateQueries({
        queryKey: ["subscription-detail", selectedId],
      });
      void queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
    },
  });

  const paymentMutation = useMutation({
    mutationFn: async ({
      paymentId,
      action,
    }: {
      paymentId: string;
      action: "paid" | "unpaid" | "skip";
    }) => {
      const response = await fetch(
        `/api/subscriptions/payments?paymentId=${paymentId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        },
      );
      if (!response.ok) {
        const error = (await response.json()) as { error: string };
        throw new Error(error.error);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["subscription-detail", selectedId],
      });
    },
  });

  const updatePaymentMutation = useMutation({
    mutationFn: async ({
      paymentId,
      data,
    }: {
      paymentId: string;
      data: PaymentFormData;
    }) => {
      const response = await fetch(
        `/api/subscriptions/payments?paymentId=${paymentId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: data.amount,
            status: data.status,
            paidAt: data.paidAt ? new Date(data.paidAt) : undefined,
            note: data.note || null,
          }),
        },
      );
      if (!response.ok) {
        const error = (await response.json()) as { error: string };
        throw new Error(error.error);
      }
    },
    onSuccess: () => {
      setEditingPayment(null);
      void queryClient.invalidateQueries({
        queryKey: ["subscription-detail", selectedId],
      });
    },
  });

  const deletePaymentMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      const response = await fetch(
        `/api/subscriptions/payments?paymentId=${paymentId}`,
        { method: "DELETE" },
      );
      if (!response.ok) {
        const error = (await response.json()) as { error: string };
        throw new Error(error.error);
      }
    },
    onSuccess: () => {
      setEditingPayment(null);
      void queryClient.invalidateQueries({
        queryKey: ["subscription-detail", selectedId],
      });
    },
  });

  const generatePaymentsMutation = useMutation({
    mutationFn: async (subscriptionId: string) => {
      const response = await fetch(
        `/api/subscriptions/payments?subscriptionId=${subscriptionId}`,
        { method: "POST" },
      );
      if (!response.ok) {
        const error = (await response.json()) as { error: string };
        throw new Error(error.error);
      }
      return (await response.json()) as { created: number };
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({
        queryKey: ["subscription-detail", selectedId],
      });
      setGenerateSuccessAlert({ created: data.created });
    },
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

  if (isPending) return { isPending: true };

  const isAdmin = !!session!.isAdmin;
  const currentUserId = session!.user!.id;
  const selectedSub = selectedId
    ? subscriptions.find((subscription) => subscription.id === selectedId)
    : null;
  const editingSub = editingSubId
    ? subscriptions.find((subscription) => subscription.id === editingSubId)
    : null;

  const detailProps: SubscriptionDetailViewProps | null =
    selectedId && selectedSub
      ? {
          subscription: selectedSub,
          subscriptionId: selectedId,
          isAdmin,
          currentUserId,
          billingMonth,
          detailLoading,
          members: detailData?.detail?.members ?? [],
          payments: detailData?.payments ?? [],
          summary: detailData?.summary,
          state: {
            showAddMember,
            editingMemberId,
            deletingMemberId,
            editingPayment,
            deletePaymentConfirm,
            generateSuccessAlert,
            editingSub: editingSub ?? null,
            editingSubId,
            isDeletingMember: deleteMemberMutation.isPending,
            isGeneratingPayments: generatePaymentsMutation.isPending,
          },
          actions: {
            onBack: () => setSelectedId(null),
            onEditSubscription: () => setEditingSubId(selectedId),
            onChangeBillingMonth: setBillingMonth,
            onGeneratePayments: () =>
              generatePaymentsMutation.mutate(selectedId),
            onMarkPaid: handleMarkPaid,
            onUnmarkPaid: handleUnmarkPaid,
            onSkip: handleSkip,
            onEditPayment: handleEditPayment,
            onDeletePayment: handleDeletePayment,
            onOpenAddMember: () => setShowAddMember(true),
            onCloseAddMember: () => setShowAddMember(false),
            onEditMember: setEditingMemberId,
            onCloseEditMember: () => setEditingMemberId(null),
            onStopDeletingMember: () => setDeletingMemberId(null),
            onStartDeletingMember: setDeletingMemberId,
            onDeleteMember: (memberId) => deleteMemberMutation.mutate(memberId),
            onAddMember: addMemberMutation.mutateAsync,
            onUpdateMember: (memberId, data) =>
              updateMemberMutation.mutateAsync({ memberId, data }),
            onCloseEditPayment: () => setEditingPayment(null),
            onSubmitEditPayment: (data) =>
              updatePaymentMutation.mutateAsync({
                paymentId: editingPayment!.id,
                data,
              }),
            onDeletePaymentMutation: (paymentId) =>
              deletePaymentMutation.mutateAsync(paymentId),
            onCloseDeletePaymentConfirm: () => setDeletePaymentConfirm(null),
            onConfirmDeletePayment: confirmDeletePayment,
            onCloseGenerateAlert: () => setGenerateSuccessAlert(null),
            onCloseEditSubscription: () => setEditingSubId(null),
            onUpdateSubscription: (id, data) =>
              updateSubMutation.mutateAsync({ id, data }),
            onDeleteSubscription: (id) => deleteSubMutation.mutateAsync(id),
          },
        }
      : null;

  const listProps: SubscriptionListViewProps = {
    subscriptions,
    isAdmin,
    isLoading: listLoading,
    showAddSub,
    editingSubId,
    editingSub: editingSub ?? null,
    onOpenAddSub: () => setShowAddSub(true),
    onCloseAddSub: () => setShowAddSub(false),
    onCloseEditSub: () => setEditingSubId(null),
    onSelect: setSelectedId,
    onEdit: setEditingSubId,
    onRefresh: () => void refetchList(),
    onCreateSubscription: createSubMutation.mutateAsync,
    onUpdateSubscription: (id, data) =>
      updateSubMutation.mutateAsync({ id, data }),
    onDeleteSubscription: (id) => deleteSubMutation.mutateAsync(id),
  };

  return { isPending: false, detailProps, listProps };
}
