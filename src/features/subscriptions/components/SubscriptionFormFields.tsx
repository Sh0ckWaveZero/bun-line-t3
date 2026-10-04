"use client";

/**
 * SubscriptionFormFields — ฟิลด์ฟอร์มของ AddSubscriptionModal
 * (บริการ, ชื่อ, ประเภทแพ็กเกจ, รอบเรียกเก็บ, ราคา, วันตัดเงิน, วันเริ่มต้น, หมายเหตุ)
 */

import {
  SUBSCRIPTION_SERVICE_LABELS,
  PLAN_TYPE_LABELS,
  BILLING_CYCLE_LABELS,
} from "@/features/subscriptions/constants";
import type {
  SubscriptionPlanType,
  BillingCycle,
} from "@/features/subscriptions/types";
import { ServiceIconButton } from "./ServiceIconPicker";
import type { SubscriptionFormData } from "./AddSubscriptionModal";

interface SubscriptionFormFieldsProps {
  form: SubscriptionFormData;
  /** อัปเดตฟอร์มบางฟิลด์ (ไม่มี logic ข้ามฟิลด์) */
  onFormChange: (patch: Partial<SubscriptionFormData>) => void;
  onPlanTypeChange: (planType: SubscriptionPlanType) => void;
  onOpenIconPicker: () => void;
}

export const SubscriptionFormFields = ({
  form,
  onFormChange,
  onPlanTypeChange,
  onOpenIconPicker,
}: SubscriptionFormFieldsProps) => {
  return (
    <>
      {/* icon / service picker trigger */}
      <div>
        <p className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          บริการ
        </p>
        <ServiceIconButton service={form.service} onClick={onOpenIconPicker} />
      </div>

      {/* name */}
      <div>
        <label
          htmlFor="subscription-name"
          className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          ชื่อที่แสดง
        </label>
        <input
          id="subscription-name"
          type="text"
          value={form.name}
          onChange={(e) => onFormChange({ name: e.target.value })}
          required
          placeholder={`เช่น ${SUBSCRIPTION_SERVICE_LABELS[form.service]} Family`}
          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
        />
      </div>

      {/* plan type + billing cycle */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            ประเภทแพ็กเกจ
          </p>
          <div role="group" aria-label="ประเภทแพ็กเกจ" className="flex gap-2">
            {(["INDIVIDUAL", "FAMILY"] as SubscriptionPlanType[]).map((pt) => (
              <button
                key={pt}
                type="button"
                onClick={() => onPlanTypeChange(pt)}
                className={`flex-1 rounded-xl border py-2 text-xs font-medium transition-colors ${
                  form.planType === pt
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-900/30 dark:text-indigo-300"
                    : "border-gray-200 bg-white text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                }`}
              >
                {PLAN_TYPE_LABELS[pt]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            รอบเรียกเก็บ
          </p>
          <div role="group" aria-label="รอบเรียกเก็บ" className="flex gap-2">
            {(["MONTHLY", "YEARLY"] as BillingCycle[]).map((bc) => (
              <button
                key={bc}
                type="button"
                onClick={() => onFormChange({ billingCycle: bc })}
                className={`flex-1 rounded-xl border py-2 text-xs font-medium transition-colors ${
                  form.billingCycle === bc
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-900/30 dark:text-indigo-300"
                    : "border-gray-200 bg-white text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                }`}
              >
                {BILLING_CYCLE_LABELS[bc]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* price + billing day */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="subscription-total-price"
            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            ราคารวม (฿)
          </label>
          <input
            id="subscription-total-price"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={form.totalPrice}
            onChange={(e) =>
              onFormChange({ totalPrice: parseFloat(e.target.value) || 0 })
            }
            required
            className="w-full [appearance:textfield] rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
        </div>

        <div>
          <label
            htmlFor="subscription-billing-day"
            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            วันตัดเงิน (1–31)
          </label>
          <input
            id="subscription-billing-day"
            type="number"
            inputMode="numeric"
            min="1"
            max="31"
            value={form.billingDay}
            onChange={(e) =>
              onFormChange({ billingDay: parseInt(e.target.value) || 1 })
            }
            required
            className="w-full [appearance:textfield] rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
        </div>
      </div>

      {/* start date */}
      <div>
        <label
          htmlFor="subscription-start-date"
          className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          วันเริ่มต้น
        </label>
        <input
          id="subscription-start-date"
          type="date"
          value={form.startDate}
          onChange={(e) => onFormChange({ startDate: e.target.value })}
          required
          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
      </div>

      {/* note */}
      <div>
        <label
          htmlFor="subscription-note"
          className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          หมายเหตุ (ไม่บังคับ)
        </label>
        <textarea
          id="subscription-note"
          rows={2}
          value={form.note}
          onChange={(e) => onFormChange({ note: e.target.value })}
          placeholder="บันทึกเพิ่มเติม..."
          className="w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
        />
      </div>
    </>
  );
};
