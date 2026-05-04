"use client";

import { useCallback, useState } from "react";
import "@/styles/dca-dashboard.css";
import { AddDcaForm } from "@/features/dca/components/AddDcaForm";
import { DcaChartCard } from "@/features/dca/components/DcaChartCard";
import { DcaExportButtons } from "@/features/dca/components/DcaExportButtons";
import { DcaImportModal } from "@/features/dca/components/DcaImportModal";
import { DcaRecordsTable } from "@/features/dca/components/DcaRecordsTable";
import { DcaTopbar } from "@/features/dca/components/DcaTopbar";
import { GoalsSection } from "@/features/dca/components/GoalsSection";
import { PnlCard } from "@/features/dca/components/PnlCard";
import { SectionLabel } from "@/features/dca/components/SectionLabel";
import { StatsGrid } from "@/features/dca/components/StatsGrid";
import { useDcaAllOrders } from "@/features/dca/hooks/useDcaAllOrders";
import { useDcaHistoryData } from "@/features/dca/hooks/useDcaHistoryData";
import { useDcaRealtimeUpdates } from "@/features/dca/hooks/useDcaRealtimeUpdates";
import { DcaLocaleProvider } from "@/features/dca/lib/dca-locale-context";
import { PendingApprovalModal } from "@/components/auth/PendingApprovalModal";
import { useLineApproval } from "@/lib/auth/hooks/useLineApproval";

function DcaHistoryPageContent() {
  const [page, setPage] = useState(1);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const limit = 10;

  const { ordersData, summaryData, isLoading, error, refetchAll } =
    useDcaHistoryData(page, limit);

  const allOrdersQuery = useDcaAllOrders();
  const allOrders = allOrdersQuery.data?.orders ?? [];
  const refetchAllOrders = allOrdersQuery.refetch;

  useDcaRealtimeUpdates({
    onUpdate: useCallback(() => {
      refetchAll();
      void refetchAllOrders();
    }, [refetchAll, refetchAllOrders]),
  });

  const { needsApproval } = useLineApproval();

  const handleDataMutated = useCallback(() => {
    setPage(1);
    const channel = new BroadcastChannel("dca-updates");
    channel.postMessage({ type: "update" });
    channel.close();
    refetchAll();
    void refetchAllOrders();
  }, [refetchAll, refetchAllOrders]);

  return (
    <>
      <PendingApprovalModal open={needsApproval} />

      <div id="dca-history-page" className="bg-background min-h-screen w-full">
        <div className="container mx-auto max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8">
          {/* Topbar */}
          <DcaTopbar
            onAdd={() => setShowAddForm(true)}
            onImport={() => setShowImportModal(true)}
            onRefresh={() => {
              refetchAll();
              void refetchAllOrders();
            }}
            isLoading={isLoading}
          />

          {/* Error banner */}
          {error && (
            <div id="dca-error-banner" className="mt-3 rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Section 01: Overview */}
          <SectionLabel num="01" title="Overview" hint="PNL · chart · hover for daily values" />
          <div id="dca-section-overview" className="grid grid-cols-1 gap-4 md:grid-cols-[380px_1fr]">
            <PnlCard summary={summaryData} />
            <DcaChartCard
              orders={allOrders}
              currentPrice={summaryData?.currentPrice ?? null}
            />
          </div>

          {/* Section 02: Metrics & Goals */}
          <SectionLabel num="02" title="Metrics & Goals" hint="core numbers · progress" />
          <div id="dca-section-metrics-goals" className="space-y-4">
            <StatsGrid summary={summaryData} orders={allOrders} />
            <GoalsSection orders={allOrders} />
          </div>

          {/* Section 03: Buy History */}
          <SectionLabel num="03" title="Buy History" hint="sortable · searchable · paginated" />
          <div id="dca-section-buy-history">
            <DcaRecordsTable
              orders={allOrders}
              currentPrice={summaryData?.currentPrice ?? null}
            />
          </div>

          {/* Export buttons */}
          {ordersData && ordersData.total > 0 && (
            <div id="dca-export-section" className="mt-4 flex justify-end">
              <DcaExportButtons disabled={isLoading} />
            </div>
          )}
        </div>

        {showAddForm && (
          <AddDcaForm
            onClose={() => setShowAddForm(false)}
            onSuccess={handleDataMutated}
          />
        )}

        {showImportModal && (
          <DcaImportModal
            onClose={() => setShowImportModal(false)}
            onSuccess={handleDataMutated}
          />
        )}
      </div>
    </>
  );
}

export function DcaHistoryPage() {
  return (
    <DcaLocaleProvider>
      <DcaHistoryPageContent />
    </DcaLocaleProvider>
  );
}
