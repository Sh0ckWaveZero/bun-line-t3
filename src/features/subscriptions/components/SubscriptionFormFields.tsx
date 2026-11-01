"use client";

import type { Dispatch, SetStateAction } from "react";
import {
  BILLING_CYCLE_LABELS,
  PLAN_TYPE_LABELS,
  SUBSCRIPTION_SERVICE_LABELS,
} from "@/features/subscriptions/constants";
import type {
  BillingCycle,
  SubscriptionPlanType,
  SubscriptionService,
} from "@/features/subscriptions/types";
import { ServiceIconButton } from "./ServiceIconPicker";

export interface SubscriptionFormData {
  name: string;
  service: SubscriptionService;
  planType: SubscriptionPlanType;
  billingCycle: BillingCycle;
  totalPrice: number;
  billingDay: number;
  startDate: string;
  note?: string;
}

interface SubscriptionFormFieldsProps {
  form: SubscriptionFormData;
  setForm: Dispatch<SetStateAction<SubscriptionFormData>>;
  onPlanTypeChange: (planType: SubscriptionPlanType) => void;
  onOpenIconPicker: () => void;
}

export const SubscriptionFormFields = ({
  form,
  setForm,
  onPlanTypeChange,
  onOpenIconPicker,
}: SubscriptionFormFieldsProps) => (
  <>
    <div>
      <p className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
        บริการ
      </p>
      <ServiceIconButton service={form.service} onClick={onOpenIconPicker} />
    </div>

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
        onChange={(event) =>
          setForm((previous) => ({ ...previous, name: event.target.value }))
        }
        required
        placeholder={`เช่น ${SUBSCRIPTION_SERVICE_LABELS[form.service]} Family`}
        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
      />
    </div>

    <div className="grid grid-cols-2 gap-3">
      <div>
        <p className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          ประเภทแพ็กเกจ
        </p>
        <div role="group" aria-label="ประเภทแพ็กเกจ" className="flex gap-2">
          {(["INDIVIDUAL", "FAMILY"] as SubscriptionPlanType[]).map(
            (planType) => (
              <button
                key={planType}
                type="button"
                onClick={() => onPlanTypeChange(planType)}
                className={`flex-1 rounded-xl border py-2 text-xs font-medium transition-colors ${
                  form.planType === planType
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-900/30 dark:text-indigo-300"
                    : "border-gray-200 bg-white text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                }`}
              >
                {PLAN_TYPE_LABELS[planType]}
              </button>
            ),
          )}
        </div>
      </div>

      <div>
        <p className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          รอบเรียกเก็บ
        </p>
        <div role="group" aria-label="รอบเรียกเก็บ" className="flex gap-2">
          {(["MONTHLY", "YEARLY"] as BillingCycle[]).map((billingCycle) => (
            <button
              key={billingCycle}
              type="button"
              onClick={() =>
                setForm((previous) => ({ ...previous, billingCycle }))
              }
              className={`flex-1 rounded-xl border py-2 text-xs font-medium transition-colors ${
                form.billingCycle === billingCycle
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-900/30 dark:text-indigo-300"
                  : "border-gray-200 bg-white text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
              }`}
            >
              {BILLING_CYCLE_LABELS[billingCycle]}
            </button>
          ))}
        </div>
      </div>
    </div>

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
          onChange={(event) =>
            setForm((previous) => ({
              ...previous,
              totalPrice: parseFloat(event.target.value) || 0,
            }))
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
          onChange={(event) =>
            setForm((previous) => ({
              ...previous,
              billingDay: parseInt(event.target.value) || 1,
            }))
          }
          required
          className="w-full [appearance:textfield] rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
      </div>
    </div>

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
        onChange={(event) =>
          setForm((previous) => ({
            ...previous,
            startDate: event.target.value,
          }))
        }
        required
        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
      />
    </div>

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
        onChange={(event) =>
          setForm((previous) => ({ ...previous, note: event.target.value }))
        }
        placeholder="บันทึกเพิ่มเติม..."
        className="w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
      />
    </div>
  </>
);
