"use client";

import { SubscriptionDetailView } from "@/features/subscriptions/components/SubscriptionDetailView";
import { SubscriptionListView } from "@/features/subscriptions/components/SubscriptionListView";
import { useSubscriptionsPageController } from "@/features/subscriptions/hooks/useSubscriptionsPageController";

export function SubscriptionsPage() {
  const page = useSubscriptionsPageController();

  if (page.isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground text-lg">กำลังโหลด...</p>
      </div>
    );
  }

  return page.detailProps ? (
    <SubscriptionDetailView {...page.detailProps} />
  ) : (
    <SubscriptionListView {...page.listProps} />
  );
}
