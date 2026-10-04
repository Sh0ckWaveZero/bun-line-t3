"use client";

/**
 * SubscriptionsTotalCard — การ์ดสรุปค่าใช้จ่ายรวมต่อเดือน
 */

import {
  formatBillingMonthThai,
  getCurrentMonthLabel,
} from "@/features/subscriptions/helpers";

interface SubscriptionsTotalCardProps {
  totalMonthly: number;
  subscriptionCount: number;
}

export const SubscriptionsTotalCard = ({
  totalMonthly,
  subscriptionCount,
}: SubscriptionsTotalCardProps) => {
  return (
    <div className="mb-6 rounded-2xl bg-linear-to-r from-indigo-500 to-purple-600 p-5 text-white shadow-md">
      <p className="text-sm font-medium opacity-80">ค่าใช้จ่ายรวม / เดือน</p>
      <p className="mt-1 text-3xl font-bold">
        {totalMonthly.toLocaleString("th-TH")}
        <span className="ml-1 text-lg font-normal opacity-80">฿</span>
      </p>
      <p className="mt-1 text-xs opacity-70">
        {subscriptionCount} subscription
        {subscriptionCount > 1 ? "s" : ""} ·{" "}
        {formatBillingMonthThai(getCurrentMonthLabel())}
      </p>
    </div>
  );
};
