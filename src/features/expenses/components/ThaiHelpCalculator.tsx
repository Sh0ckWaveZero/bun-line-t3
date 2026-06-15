"use client";

import { useToast } from "@/components/common/ToastProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThaiHelpCalculatorSkeleton } from "@/features/expenses/components/LoadingSkeletons";
import {
  CO_PAY_DAILY_MAX_SUBSIDY,
  CO_PAY_STATE_SHARE,
  CO_PAY_USER_SHARE,
  IS_CO_PAYMENT_ACTIVE,
  calculateCoPaymentSplit,
  formatCoPaymentDetails,
  parseTransactionSubsidy,
} from "@/features/expenses/helpers/coPayment";
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
  Coins,
  Copy,
  Info,
  Plus,
  RotateCcw,
  TrendingDown,
} from "lucide-react";
import { useEffect, useState } from "react";

interface ExpenseCategory {
  id: string;
  name: string;
  icon?: string | null;
  color?: string | null;
  isActive: boolean;
}

interface ThaiHelpCalculatorProps {
  categories: ExpenseCategory[];
  transactions: any[];
  isSaving: boolean;
  isLoading?: boolean;
  onSave: (input: {
    categoryId: string;
    type: "EXPENSE";
    amount: number;
    note: string;
    tags: string;
    transDate: string;
  }) => Promise<void>;
  refetch: () => void;
}

export function ThaiHelpCalculator({
  categories,
  transactions,
  isSaving,
  isLoading = false,
  onSave,
  refetch,
}: ThaiHelpCalculatorProps) {
  // If the co-payment campaign is inactive, render absolutely nothing
  if (!IS_CO_PAYMENT_ACTIVE) return null;

  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"split" | "topup" | "stats">(
    "split",
  );

  // Tab 1: Split Bill State
  const [totalBill, setTotalBill] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");

  // Tab 2: Top Up State
  const [desiredSubsidy, setDesiredSubsidy] = useState("");
  const [copied, setCopied] = useState(false);

  // Save error state for inline retry
  const [saveError, setSaveError] = useState(false);

  // Auto-select category (default to "อาหาร" or first active category)
  useEffect(() => {
    if (categories.length > 0 && !selectedCategoryId) {
      const foodCat = categories.find(
        (c) =>
          c.isActive && (c.name.includes("อาหาร") || c.name.includes("กิน")),
      );
      if (foodCat) {
        setSelectedCategoryId(foodCat.id);
      } else {
        const firstActive = categories.find((c) => c.isActive);
        if (firstActive) {
          setSelectedCategoryId(firstActive.id);
        }
      }
    }
  }, [categories, selectedCategoryId]);

  // Daily Stats (client-side only to avoid SSR hydration mismatch)
  const [dailyStats, setDailyStats] = useState({
    todaySubsidyUsed: 0,
    todayUserSpent: 0,
    todayTotalBill: 0,
    todayRemaining: CO_PAY_DAILY_MAX_SUBSIDY,
  });

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0]!;
    let todaySubsidyUsed = 0;
    let todayUserSpent = 0;

    transactions.forEach((tx) => {
      const txDate = tx.transDate ? String(tx.transDate).substring(0, 10) : "";
      if (txDate !== today || tx.type !== "EXPENSE") return;
      const subsidy = parseTransactionSubsidy(tx.amount, tx.note, tx.tags);
      if (subsidy > 0) {
        todaySubsidyUsed += subsidy;
        todayUserSpent += tx.amount;
      }
    });

    setDailyStats({
      todaySubsidyUsed,
      todayUserSpent,
      todayTotalBill: todaySubsidyUsed + todayUserSpent,
      todayRemaining: Math.max(CO_PAY_DAILY_MAX_SUBSIDY - todaySubsidyUsed, 0),
    });
  }, [transactions]);

  // Monthly Stats (client-side only to avoid SSR hydration mismatch)
  const [stats, setStats] = useState({
    totalSubsidyUsed: 0,
    remainingSubsidy: 1000,
    totalUserSpent: 0,
    count: 0,
  });

  useEffect(() => {
    let totalSubsidyUsed = 0;
    let totalUserSpent = 0;
    let count = 0;

    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    transactions.forEach((tx) => {
      const txMonth =
        tx.transMonth || (tx.transDate ? tx.transDate.substring(0, 7) : "");
      if (txMonth !== currentMonthStr || tx.type !== "EXPENSE") return;

      const subsidy = parseTransactionSubsidy(tx.amount, tx.note, tx.tags);
      if (subsidy > 0) {
        count++;
        totalUserSpent += tx.amount;
        totalSubsidyUsed += subsidy;
      }
    });

    const remainingSubsidy = Math.max(1000 - totalSubsidyUsed, 0);

    setStats({
      totalSubsidyUsed,
      remainingSubsidy,
      totalUserSpent,
      count,
    });
  }, [transactions]);

  // Calculations for Split Bill — cap subsidy at monthly quota to prevent phantom amounts
  const numericBill = parseFloat(totalBill) || 0;
  const { subsidyAmount: rawSubsidy60 } = calculateCoPaymentSplit(numericBill);
  const subsidy60 = Math.min(rawSubsidy60, stats.remainingSubsidy);
  const userPaid40 = Math.max(numericBill - subsidy60, 0);
  const monthlyQuotaExceeded = numericBill > 0 && rawSubsidy60 > stats.remainingSubsidy;

  // Calculations for Top Up
  const numericSubsidy = parseFloat(desiredSubsidy) || 0;
  const topUpNeeded = numericSubsidy * (CO_PAY_USER_SHARE / CO_PAY_STATE_SHARE);
  const purchaseValue = numericSubsidy * (1 / CO_PAY_STATE_SHARE);

  // Remaining combined purchasing power (state + user) for this month
  const monthlyRemainingCombined =
    stats.remainingSubsidy +
    stats.remainingSubsidy * (CO_PAY_USER_SHARE / CO_PAY_STATE_SHARE);

  // Handle Save Transaction
  const handleSaveExpense = async () => {
    if (numericBill <= 0) {
      showToast({
        title: "กรุณาระบุยอดสินค้า",
        description: "ยอดสินค้าต้องมากกว่า 0 บาท",
        type: "warning",
      });
      return;
    }

    if (!selectedCategoryId) {
      showToast({
        title: "กรุณาเลือกหมวดหมู่",
        description: "เลือกหมวดหมู่เพื่อจัดเก็บรายจ่าย",
        type: "warning",
      });
      return;
    }

    try {
      const todayStr = new Date().toISOString().split("T")[0]!;

      // Standardize co-payment details using the isolated helper
      const { note, tags } = formatCoPaymentDetails(
        numericBill,
        subsidy60,
        null, // No original note
        [], // No original tags
      );

      await onSave({
        categoryId: selectedCategoryId,
        type: "EXPENSE",
        amount: userPaid40, // Only log user's actual share!
        note,
        tags: tags.join(","),
        transDate: todayStr,
      });

      showToast({
        title: "บันทึกสำเร็จ!",
        description: `บันทึกส่วนที่คุณจ่ายเอง ฿${userPaid40.toFixed(2)} เรียบร้อยแล้ว`,
        type: "success",
      });

      setSaveError(false);
      setTotalBill("");
      refetch();
    } catch (error) {
      console.error(error);
      setSaveError(true);
    }
  };

  return (
    <div
      id="thai-help-calculator-container"
      className="font-noto-sans-thai relative border-border/30 bg-card dark:bg-card/85 mb-6 overflow-hidden rounded-xl border shadow-sm transition-all"
    >
      {isLoading && <ThaiHelpCalculatorSkeleton />}

      {!isLoading && (
        <>
          {/* Main Header Action */}
          <button
            id="thai-help-toggle-btn"
            onClick={() => setIsOpen(!isOpen)}
            className="font-noto-sans-thai text-foreground hover:bg-muted/30 flex w-full flex-col px-4 py-3 text-left transition-colors sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4"
          >
            {/* Row 1: icon + title + chevron */}
            <div className="flex items-center justify-between gap-3">
              <div id="thai-help-title-group" className="flex items-center gap-2.5 sm:gap-3">
                <div
                  id="thai-help-icon-wrapper"
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:bg-violet-400/15 dark:text-violet-400 sm:h-10 sm:w-10"
                >
                  <Coins className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div>
                  <h2
                    id="thai-help-heading"
                    className="font-noto-sans-thai flex items-center gap-1.5 whitespace-nowrap text-sm font-bold sm:text-base"
                  >
                    เครื่องคำนวณสิทธิ์ 60/40
                    <span className="relative flex h-2 w-2 flex-shrink-0">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                    </span>
                  </h2>
                  <p
                    id="thai-help-subheading"
                    className="text-muted-foreground hidden text-xs font-normal sm:block"
                  >
                    คำนวณโครงการไทยช่วยไทย พลัส และบันทึกยอดจ่ายจริง 40% ทันที
                  </p>
                </div>
              </div>
              {/* Chevron: right on mobile row 1, kept in sm+ right cluster */}
              <div
                id="thai-help-chevron-mobile"
                className="text-muted-foreground sm:hidden"
              >
                {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
            </div>

            {/* Row 2 (mobile only): badges aligned under title text */}
            <div className="mt-2 flex items-center gap-1.5 pl-[2.375rem] sm:hidden">
              <div
                id="thai-help-monthly-remaining-mobile"
                className="flex items-center gap-1 whitespace-nowrap rounded-full bg-violet-500/10 px-2.5 py-1 text-xs font-semibold tabular-nums text-violet-700 dark:bg-violet-400/15 dark:text-violet-400"
              >
                <span>ใช้ได้/เดือน ฿{monthlyRemainingCombined.toLocaleString("th-TH", { maximumFractionDigits: 0 })}</span>
              </div>
              <div
                id="thai-help-daily-remaining-mobile"
                className={`flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums ${dailyStats.todayRemaining === 0
                    ? "bg-red-500/10 text-red-600 dark:bg-red-400/15 dark:text-red-400"
                    : dailyStats.todayRemaining < 100
                      ? "bg-amber-500/10 text-amber-700 dark:bg-amber-400/15 dark:text-amber-400"
                      : "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-400"
                  }`}
              >
                <span>ใช้ได้/วัน ฿{dailyStats.todayRemaining.toLocaleString("th-TH", { maximumFractionDigits: 0 })}</span>
              </div>
            </div>

            {/* sm+: badges + chevron on right */}
            <div className="hidden flex-shrink-0 items-center gap-2 sm:flex">
              <div
                id="thai-help-monthly-remaining"
                className="flex items-center gap-1 whitespace-nowrap rounded-full bg-violet-500/10 px-2.5 py-1 text-xs font-semibold tabular-nums text-violet-700 dark:bg-violet-400/15 dark:text-violet-400"
              >
                <span>ใช้ได้/เดือน ฿{monthlyRemainingCombined.toLocaleString("th-TH", { maximumFractionDigits: 0 })}</span>
              </div>
              <div
                id="thai-help-daily-remaining"
                className={`flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums ${dailyStats.todayRemaining === 0
                    ? "bg-red-500/10 text-red-600 dark:bg-red-400/15 dark:text-red-400"
                    : dailyStats.todayRemaining < 100
                      ? "bg-amber-500/10 text-amber-700 dark:bg-amber-400/15 dark:text-amber-400"
                      : "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-400"
                  }`}
              >
                <span>ใช้ได้/วัน ฿{dailyStats.todayRemaining.toLocaleString("th-TH", { maximumFractionDigits: 0 })}</span>
              </div>
              <div
                id="thai-help-chevron"
                className="text-muted-foreground transition-colors"
              >
                {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </div>
          </button>

          {isOpen && (
            <div
              id="thai-help-content"
              className="border-border/10 border-t p-5 transition-all duration-300 ease-out"
            >
              {/* Daily Budget Progress Bar */}
              <div className="mb-5 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-muted-foreground">สิทธิ์รัฐรายวัน</span>
                  <span className="text-muted-foreground tabular-nums">
                    ฿{dailyStats.todaySubsidyUsed.toFixed(0)} / ฿{CO_PAY_DAILY_MAX_SUBSIDY}
                  </span>
                </div>
                <div className="bg-muted/50 h-2 w-full overflow-hidden rounded-full">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${dailyStats.todaySubsidyUsed === 0
                        ? "bg-emerald-500"
                        : dailyStats.todayRemaining === 0
                          ? "bg-red-500"
                          : dailyStats.todayRemaining < 100
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                      }`}
                    style={{
                      width: `${Math.min((dailyStats.todaySubsidyUsed / CO_PAY_DAILY_MAX_SUBSIDY) * 100, 100)}%`,
                    }}
                  />
                </div>
                {dailyStats.todayTotalBill > 0 && (
                  <div className="text-muted-foreground flex items-center justify-between text-xs">
                    <span>
                      ยอดรวม 100%{" "}
                      <span className="text-foreground font-semibold tabular-nums">
                        ฿{dailyStats.todayTotalBill.toFixed(2)}
                      </span>
                    </span>
                    <span>
                      รัฐ{" "}
                      <span className="font-semibold tabular-nums text-blue-600 dark:text-blue-400">
                        ฿{dailyStats.todaySubsidyUsed.toFixed(2)}
                      </span>{" "}
                      + คุณ{" "}
                      <span className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                        ฿{dailyStats.todayUserSpent.toFixed(2)}
                      </span>
                    </span>
                  </div>
                )}
              </div>

              {/* Interactive Navigation Tabs */}
              <div
                id="thai-help-tabs"
                className="bg-muted/60 relative mb-5 flex rounded-lg p-1"
              >
                {(["split", "topup", "stats"] as const).map((tab) => {
                  const isActive = activeTab === tab;
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`relative z-10 flex-1 rounded-md py-1.5 text-center text-xs font-semibold transition-all duration-200 ${isActive
                          ? "bg-card text-foreground font-bold shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                      {tab === "split" && "แยกบิล (60/40)"}
                      {tab === "topup" && "ต้องเติมเท่าไหร่"}
                      {tab === "stats" && `สถิติเดือนนี้ (${stats.count})`}
                    </button>
                  );
                })}
              </div>

              {/* Tab panels — always mounted, CSS crossfade on switch */}
              <div className="relative">
                {/* Split Bill */}
                <div
                  id="thai-help-tab-split"
                  className={`space-y-4 transition-all duration-200 ease-out ${
                    activeTab === "split"
                      ? "relative opacity-100 translate-y-0"
                      : "pointer-events-none absolute inset-0 opacity-0 translate-y-1"
                  }`}
                  aria-hidden={activeTab !== "split"}
                >
                  <div className="space-y-2">
                    <Label
                      htmlFor="total-bill-input"
                      className="text-foreground text-sm font-semibold"
                    >
                      ยอดราคาสินค้าทั้งหมด (บาท)
                    </Label>
                    <div className="relative">
                      <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 font-semibold">
                        ฿
                      </span>
                      <Input
                        id="total-bill-input"
                        type="number"
                        pattern="[0-9]*"
                        inputMode="decimal"
                        placeholder="ระบุยอดซื้อทั้งหมด เช่น 150"
                        value={totalBill}
                        onChange={(e) => setTotalBill(e.target.value)}
                        className="h-11 pl-7 text-base font-bold tabular-nums"
                      />
                      {totalBill && (
                        <button
                          onClick={() => setTotalBill("")}
                          className="text-muted-foreground hover:bg-muted hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1"
                        >
                          <RotateCcw size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="border-border/20 bg-muted/20 rounded-xl border p-3">
                      <span className="text-muted-foreground text-xs font-semibold tracking-wide">
                        รัฐช่วยจ่าย ({(CO_PAY_STATE_SHARE * 100).toFixed(0)}%)
                      </span>
                      <p className="mt-1 text-lg font-extrabold text-blue-600 tabular-nums dark:text-blue-400">
                        ฿{subsidy60.toFixed(2)}
                      </p>
                    </div>
                    <div className="border-border/20 rounded-xl border bg-emerald-500/5 p-3">
                      <span className="text-muted-foreground text-xs font-semibold tracking-wide">
                        คุณจ่ายจริง ({(CO_PAY_USER_SHARE * 100).toFixed(0)}%)
                      </span>
                      <p className="mt-1 text-lg font-extrabold text-emerald-600 tabular-nums dark:text-emerald-400">
                        ฿{userPaid40.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {monthlyQuotaExceeded && numericBill > 0 && (
                    <div className="flex items-start gap-2 rounded-lg border border-amber-500/25 bg-amber-500/5 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                      <AlertCircle size={13} className="mt-0.5 shrink-0" />
                      <span>
                        สิทธิ์เดือนนี้เหลือ <strong className="tabular-nums">฿{stats.remainingSubsidy.toFixed(0)}</strong> รัฐช่วยได้แค่ <strong className="tabular-nums">฿{subsidy60.toFixed(2)}</strong> ส่วนที่เหลือคุณจ่ายเอง
                      </span>
                    </div>
                  )}

                  {numericBill > 0 && (
                    <div
                      id="thai-help-save-flow"
                      className="space-y-3 rounded-xl border border-violet-500/15 bg-violet-500/5 p-4"
                    >
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <Label
                            htmlFor="tct-category-select"
                            className="text-muted-foreground text-xs font-semibold tracking-wide"
                          >
                            หมวดหมู่รายจ่าย
                          </Label>
                          <select
                            id="tct-category-select"
                            value={selectedCategoryId}
                            onChange={(e) => setSelectedCategoryId(e.target.value)}
                            className="font-noto-sans-thai bg-card border-border/40 text-foreground h-9 w-full rounded-md border px-2 text-xs font-medium focus:ring-1 focus:ring-violet-500 focus:outline-none"
                          >
                            {categories
                              .filter((c) => c.isActive)
                              .map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.icon ? `${c.icon} ` : ""}
                                  {c.name}
                                </option>
                              ))}
                          </select>
                        </div>
                        <div className="flex items-end">
                          <Button
                            onClick={handleSaveExpense}
                            disabled={isSaving}
                            className="h-9 w-full gap-1.5 bg-violet-600 text-xs font-bold text-white hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600"
                          >
                            {isSaving ? "กำลังบันทึก..." : <Plus size={14} />}
                            บันทึกรายจ่าย ฿{userPaid40.toFixed(2)}
                          </Button>
                        </div>
                      </div>

                      {saveError && (
                        <div className="flex items-center justify-between gap-2 rounded-md border border-red-500/20 bg-red-500/5 px-3 py-2">
                          <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                            <AlertCircle size={13} className="shrink-0" />
                            <span>บันทึกไม่สำเร็จ</span>
                          </div>
                          <button
                            onClick={handleSaveExpense}
                            disabled={isSaving}
                            className="text-xs font-semibold text-red-600 underline underline-offset-2 hover:text-red-700 dark:text-red-400"
                          >
                            ลองใหม่
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Top Up */}
                <div
                  id="thai-help-tab-topup"
                  className={`space-y-4 transition-all duration-200 ease-out ${
                    activeTab === "topup"
                      ? "relative opacity-100 translate-y-0"
                      : "pointer-events-none absolute inset-0 opacity-0 translate-y-1"
                  }`}
                  aria-hidden={activeTab !== "topup"}
                >
                  <div className="space-y-2">
                    <Label
                      htmlFor="desired-subsidy-input"
                      className="text-foreground text-sm font-semibold"
                    >
                      ยอดเงินสนับสนุนของรัฐที่ต้องการใช้วันนี้ (บาท)
                    </Label>
                    <div className="relative">
                      <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 font-semibold">
                        ฿
                      </span>
                      <Input
                        id="desired-subsidy-input"
                        type="number"
                        pattern="[0-9]*"
                        inputMode="decimal"
                        placeholder="เช่น 150 (ไม่เกิน 200)"
                        value={desiredSubsidy}
                        onChange={(e) => setDesiredSubsidy(e.target.value)}
                        className="h-11 pl-7 text-base font-bold tabular-nums"
                      />
                      {desiredSubsidy && (
                        <button
                          onClick={() => setDesiredSubsidy("")}
                          className="text-muted-foreground hover:bg-muted hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1"
                        >
                          <RotateCcw size={14} />
                        </button>
                      )}
                    </div>
                    <p className="text-muted-foreground text-xs leading-tight">
                      ป้อนยอดเงินรัฐที่คุณต้องการสแกนใช้ เพื่อดูว่ากระเป๋าเป๋าตัง
                      (G-Wallet) ของคุณต้องมีเงินอยู่อีกเท่าไหร่
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="border-border/20 rounded-xl border bg-emerald-500/5 p-3">
                      <span className="text-muted-foreground text-xs font-semibold tracking-wide">
                        เติมใน เป๋าตัง ({(CO_PAY_USER_SHARE * 100).toFixed(0)}%)
                      </span>
                      <div className="mt-1 flex items-center gap-2">
                        <p className="text-lg font-extrabold text-emerald-600 tabular-nums dark:text-emerald-400">
                          ฿{topUpNeeded.toFixed(2)}
                        </p>
                        {numericSubsidy > 0 && (
                          <button
                            onClick={() => {
                              void navigator.clipboard.writeText(topUpNeeded.toFixed(2));
                              setCopied(true);
                              setTimeout(() => setCopied(false), 2000);
                            }}
                            className="text-muted-foreground hover:text-foreground rounded p-0.5 transition-colors"
                            title="คัดลอก"
                          >
                            {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="border-border/20 bg-muted/20 rounded-xl border p-3">
                      <span className="text-muted-foreground text-xs font-semibold tracking-wide">
                        ซื้อสินค้าได้รวม
                      </span>
                      <p className="text-foreground mt-1 text-lg font-extrabold tabular-nums">
                        ฿{purchaseValue.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div
                  id="thai-help-tab-stats"
                  className={`space-y-4 transition-all duration-200 ease-out ${
                    activeTab === "stats"
                      ? "relative opacity-100 translate-y-0"
                      : "pointer-events-none absolute inset-0 opacity-0 translate-y-1"
                  }`}
                  aria-hidden={activeTab !== "stats"}
                >
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="border-border/10 bg-card dark:bg-muted/10 rounded-xl border p-3 shadow-sm">
                      <span className="text-muted-foreground text-xs font-semibold tracking-wide">
                        รัฐช่วยแล้วเดือนนี้
                      </span>
                      <p className="mt-1 text-lg font-extrabold text-blue-600 tabular-nums dark:text-blue-400">
                        ฿{stats.totalSubsidyUsed.toFixed(2)}
                      </p>
                      <span className="text-muted-foreground mt-0.5 block text-xs">
                        จากโควตา ฿1,000.00 / เดือน
                      </span>
                    </div>
                    <div className="border-border/10 bg-card dark:bg-muted/10 rounded-xl border p-3 shadow-sm">
                      <span className="text-muted-foreground text-xs font-semibold tracking-wide">
                        สิทธิ์คงเหลือจากรัฐ
                      </span>
                      <p className="mt-1 text-lg font-extrabold text-emerald-600 tabular-nums dark:text-emerald-400">
                        ฿{stats.remainingSubsidy.toFixed(2)}
                      </p>
                      <span className="text-muted-foreground mt-0.5 block text-xs">
                        รีเซ็ตอัตโนมัติสิ้นเดือนนี้
                      </span>
                    </div>
                    <div className="border-border/10 bg-card dark:bg-muted/10 rounded-xl border p-3 shadow-sm">
                      <span className="text-muted-foreground text-xs font-semibold tracking-wide">
                        เงินคุณที่จ่ายสมทบ
                      </span>
                      <p className="text-foreground mt-1 text-lg font-extrabold tabular-nums">
                        ฿{stats.totalUserSpent.toFixed(2)}
                      </p>
                      <span className="text-muted-foreground mt-0.5 block text-xs">
                        บันทึกในประวัติแล้ว {stats.count} รายการ
                      </span>
                    </div>
                  </div>

                  {/* Info banner */}
                  <div className="flex items-start gap-2.5 rounded-lg border border-yellow-500/25 bg-yellow-500/5 p-3 text-xs leading-relaxed text-yellow-700 dark:text-yellow-400">
                    <Info size={16} className="mt-0.5 shrink-0" />
                    <p>
                      ระบบจะค้นหาประวัติการเงินของคุณในเดือนปัจจุบันที่มีเครื่องหมายหรือหมายเหตุตัวย่อ
                      เช่น <strong>#ไทยช่วยไทย</strong>, <strong>#ทชท</strong>,{" "}
                      <strong>#TCT</strong>, <strong>#6040</strong>,{" "}
                      <strong>#คนละครึ่ง</strong>, <strong>#KLK</strong>{" "}
                      เพื่อคำนวณสิทธิ์ให้อัตโนมัติ
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Notice */}
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-500/10 bg-red-500/5 px-3 py-2">
                <TrendingDown className="h-3.5 w-3.5 shrink-0 text-red-500" />
                <p className="text-xs leading-none font-medium text-red-700 dark:text-red-400">
                  เงิน 1,000 บาทต่อเดือน ของสิทธิ์รัฐช่วยจ่าย
                  หากใช้ไม่หมดจะไม่ทบไปเดือนถัดไป
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
