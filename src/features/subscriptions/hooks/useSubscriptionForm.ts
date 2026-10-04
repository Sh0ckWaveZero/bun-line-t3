"use client";

/**
 * useSubscriptionForm — state และ handlers ของฟอร์มเพิ่ม / แก้ไข subscription
 */

import { useState } from "react";
import type { FormEvent } from "react";
import {
  SUBSCRIPTION_SERVICE_LABELS,
  DEFAULT_PRICES,
} from "@/features/subscriptions/constants";
import type {
  SubscriptionService,
  SubscriptionPlanType,
  BillingCycle,
  SubscriptionWithMembers,
} from "@/features/subscriptions/types";
import type { SubscriptionFormData } from "@/features/subscriptions/components/AddSubscriptionModal";

interface UseSubscriptionFormArgs {
  onClose: () => void;
  onSubmit: (data: SubscriptionFormData) => Promise<void>;
  /** ถ้ามี initialData = edit mode */
  initialData?: Partial<SubscriptionWithMembers>;
  onDelete?: (id: string) => Promise<void>;
}

export function useSubscriptionForm({
  onClose,
  onSubmit,
  initialData,
  onDelete,
}: UseSubscriptionFormArgs) {
  const isEdit = !!initialData?.id;
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);

  const [form, setForm] = useState<SubscriptionFormData>({
    name: initialData?.name ?? "",
    service: (initialData?.service as SubscriptionService) ?? "NETFLIX",
    planType: (initialData?.planType as SubscriptionPlanType) ?? "FAMILY",
    billingCycle: (initialData?.billingCycle as BillingCycle) ?? "MONTHLY",
    totalPrice:
      initialData?.totalPrice ??
      DEFAULT_PRICES[(initialData?.service as SubscriptionService) ?? "NETFLIX"]
        .family,
    billingDay: initialData?.billingDay ?? 1,
    startDate: initialData?.startDate
      ? new Date(initialData.startDate).toISOString().split("T")[0]!
      : new Date().toISOString().split("T")[0]!,
    note: initialData?.note ?? "",
  });

  const handleServiceChange = (service: SubscriptionService) => {
    setForm((prev) => ({
      ...prev,
      service,
      name: prev.name || SUBSCRIPTION_SERVICE_LABELS[service],
      totalPrice:
        DEFAULT_PRICES[service][
          prev.planType === "FAMILY" ? "family" : "individual"
        ],
    }));
  };

  const handlePlanTypeChange = (planType: SubscriptionPlanType) => {
    setForm((prev) => ({
      ...prev,
      planType,
      totalPrice:
        DEFAULT_PRICES[prev.service][
          planType === "FAMILY" ? "family" : "individual"
        ],
    }));
  };

  /** อัปเดตฟอร์มบางฟิลด์ (ใช้โดย input ทั่วไปที่ไม่มี logic ข้ามฟิลด์) */
  const updateForm = (patch: Partial<SubscriptionFormData>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSubmit(form);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData?.id || !onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(initialData.id);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  const requestDelete = () => setShowDeleteConfirm(true);
  const cancelDelete = () => setShowDeleteConfirm(false);
  const openIconPicker = () => setShowIconPicker(true);
  const closeIconPicker = () => setShowIconPicker(false);

  return {
    isEdit,
    form,
    isLoading,
    isDeleting,
    showDeleteConfirm,
    showIconPicker,
    updateForm,
    handleServiceChange,
    handlePlanTypeChange,
    handleSubmit,
    handleDelete,
    requestDelete,
    cancelDelete,
    openIconPicker,
    closeIconPicker,
  };
}
