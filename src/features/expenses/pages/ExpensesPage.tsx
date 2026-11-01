"use client";

import { MonthNavigationCard } from "@/features/expenses/components/MonthNavigationCard";
import {
  ExpenseOverviewSection,
  ExpenseTransactionsSection,
  ExpensesPageHeader,
} from "@/features/expenses/components/ExpensesPageSections";
import { ExpensesPageModalLayer } from "@/features/expenses/components/ExpensesPageModalLayer";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { TransactionTab } from "@/features/expenses/constants";
import { useExpenseCategories } from "@/features/expenses/hooks/useExpenseCategories";
import { useExpenseTransactions } from "@/features/expenses/hooks/useExpenseTransactions";
import { useMonthlyCharts } from "@/features/expenses/hooks/useMonthlyCharts";
import { useMonthNavigationWithSwipe } from "@/features/expenses/hooks/useMonthNavigationWithSwipe";
import { useCategoryModalFlow } from "@/features/expenses/hooks/useCategoryModalFlow";
import { useTransactionModal } from "@/features/expenses/hooks/useTransactionModal";
import { useExpensePageUI } from "@/features/expenses/hooks/useExpensePageUI";
import { useBudgets } from "@/features/expenses/hooks/useBudgets";
import { Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function ExpensesPage() {
  useEffect(() => {
    const recoverPointerLock = () => {
      const hasOpenModal =
        document.querySelector('[role="dialog"][data-state="open"]') !== null ||
        document.querySelector('[role="alertdialog"][data-state="open"]') !==
          null;

      if (!hasOpenModal && document.body.style.pointerEvents === "none") {
        document.body.style.pointerEvents = "";
      }
    };

    recoverPointerLock();
    // MutationObserver: recovery ทันทีเมื่อ body style เปลี่ยน (modal เปิด/ปิด)
    // แทนการ query DOM ทุก 500ms ตลอดเวลา
    const observer = new MutationObserver(recoverPointerLock);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["style"],
    });
    // backstop: กันเคส Radix ปิด modal ไม่ครบโดยไม่ mutate style (ลดจาก 500ms → 2s)
    const intervalId = window.setInterval(recoverPointerLock, 2000);

    return () => {
      observer.disconnect();
      window.clearInterval(intervalId);
      recoverPointerLock();
    };
  }, []);

  // Month navigation with swipe support
  const {
    currentMonth,
    prevMonth,
    nextMonth,
    monthNavRef,
    swipeTransform,
    isSwiping,
    contentOpacity,
    contentTransform,
  } = useMonthNavigationWithSwipe();

  const {
    transactions,
    summary,
    categorySummary,
    isLoading: txLoading,
    refetch: refetchTx,
    isSaving: txSaving,
    categories,
    hideAmountsWeb,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  } = useExpenseTransactions(currentMonth, true);

  const {
    isSaving: catSaving,
    createCategory,
    updateCategory,
    deleteCategory,
  } = useExpenseCategories(false, () => void refetchTx());

  const {
    hideAmounts,
    showCharts,
    exporting,
    toggleHideAmounts,
    toggleCharts,
    handleExport,
  } = useExpensePageUI({
    transactions,
    summary,
    currentMonth,
    initialHideAmounts: hideAmountsWeb,
  });

  const { multiMonthSummaries } = useMonthlyCharts(currentMonth, showCharts);

  const { budgets, createBudget, updateBudget, deleteBudget } = useBudgets(
    currentMonth,
    true,
  );
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [activeTab, setActiveTab] = useState<TransactionTab>("all");

  const fabRef = useRef<HTMLDivElement>(null);

  // FAB glow animation — RAF coalesce + cache center (FAB fixed → เปลี่ยนตำแหน่งตอน resize เท่านั้น)
  useEffect(() => {
    const el = fabRef.current;
    if (!el) return;

    let cx = 0;
    let cy = 0;
    let rafId = 0;
    let lastE: PointerEvent | null = null;

    const recomputeCenter = () => {
      const rect = el.getBoundingClientRect();
      cx = rect.left + rect.width / 2;
      cy = rect.top + rect.height / 2;
    };
    const update = () => {
      rafId = 0;
      const e = lastE;
      if (!e) return;
      let deg = (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI;
      if (deg < 0) deg += 360;
      el.style.setProperty("--start", String(deg + 90));
    };
    const onMove = (e: PointerEvent) => {
      lastE = e;
      if (!rafId) rafId = requestAnimationFrame(update);
    };

    recomputeCenter();
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("resize", recomputeCenter);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", recomputeCenter);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  const txModal = useTransactionModal({
    createTransaction,
    updateTransaction,
    deleteTransaction,
  });
  const catFlow = useCategoryModalFlow({
    createCategory,
    updateCategory,
    deleteCategory,
    onReturnToAddTransaction: txModal.openAdd,
  });

  return (
    <TooltipProvider>
      <div id="expenses-page" className="bg-background min-h-screen w-full">
        <div
          id="expenses-container"
          className="container mx-auto max-w-5xl px-4 py-6 pb-28 sm:px-6 sm:py-8 sm:pb-32"
        >
          <ExpensesPageHeader
            hideAmounts={hideAmounts}
            exporting={exporting}
            transactionCount={transactions.length}
            isLoading={txLoading}
            onToggleAmounts={toggleHideAmounts}
            onExport={handleExport}
            onOpenCategoryManager={() => catFlow.setShowManagerModal(true)}
            onRefresh={() => void refetchTx()}
          />

          <MonthNavigationCard
            currentMonth={currentMonth}
            onPreviousMonth={prevMonth}
            onNextMonth={nextMonth}
            swipeTransform={swipeTransform}
            isSwiping={isSwiping}
            ref={monthNavRef}
          />

          <div
            id="content-animator"
            className="min-h-[400px] transition-[opacity,transform] duration-300 ease-out"
            style={{
              opacity: contentOpacity,
              transform: `translateY(${contentTransform}px)`,
            }}
          >
            <ExpenseOverviewSection
              transactions={transactions}
              summary={summary}
              categorySummary={categorySummary}
              categories={categories}
              txLoading={txLoading}
              txSaving={txSaving}
              hideAmounts={hideAmounts}
              createTransaction={createTransaction}
              refetchTransactions={refetchTx}
              budgets={budgets}
              onManageBudgets={() => setShowBudgetModal(true)}
              showCharts={showCharts}
              onToggleCharts={toggleCharts}
              multiMonthSummaries={multiMonthSummaries}
            />
            <ExpenseTransactionsSection
              transactions={transactions}
              txLoading={txLoading}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              hideAmounts={hideAmounts}
              onEditTransaction={txModal.openEdit}
              onDeleteTransaction={txModal.handleDelete}
            />
          </div>
        </div>

        <div
          id="fab-wrapper"
          ref={fabRef}
          className="glow-fab-wrapper fixed right-4 bottom-6 z-40 sm:right-8 sm:bottom-8"
        >
          <div id="fab-glow-ring" className="glow-fab-ring" />
          <Button
            id="fab-add-btn"
            onClick={txModal.openAdd}
            aria-label="เพิ่มรายการ"
            className="group/btn bg-primary/40 text-primary-foreground relative h-14 w-14 overflow-hidden rounded-full p-0 shadow-lg"
          >
            <span
              id="fab-hover-layer"
              className="bg-primary pointer-events-none absolute inset-0 transition-[clip-path] duration-500 ease-in-out [clip-path:circle(0%)] group-hover/btn:[clip-path:circle(100%)] group-active/btn:[clip-path:circle(100%)]"
            />
            <Plus id="fab-icon" size={24} className="relative z-10" />
          </Button>
        </div>

        <ExpensesPageModalLayer
          categories={categories}
          txSaving={txSaving}
          catSaving={catSaving}
          txModal={txModal}
          catFlow={catFlow}
          budgets={budgets}
          showBudgetModal={showBudgetModal}
          onBudgetModalOpenChange={setShowBudgetModal}
          budgetActions={{ createBudget, updateBudget, deleteBudget }}
        />
      </div>
    </TooltipProvider>
  );
}
