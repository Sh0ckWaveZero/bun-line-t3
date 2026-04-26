"use client";

import { useCallback, useState } from "react";
import { Bitcoin, Plus, RefreshCw, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddDcaForm } from "@/features/dca/components/AddDcaForm";
import { DcaExportButtons } from "@/features/dca/components/DcaExportButtons";
import { DcaHistoryTable } from "@/features/dca/components/DcaHistoryTable";
import { DcaImportModal } from "@/features/dca/components/DcaImportModal";
import { DcaInfoBox } from "@/features/dca/components/DcaInfoBox";
import { DcaSummaryCards } from "@/features/dca/components/DcaSummaryCards";
import { useDcaHistoryData } from "@/features/dca/hooks/useDcaHistoryData";
import { useDcaRealtimeUpdates } from "@/features/dca/hooks/useDcaRealtimeUpdates";
import { PendingApprovalModal } from "@/components/auth/PendingApprovalModal";
import { useLineApproval } from "@/lib/auth/hooks/useLineApproval";

export function DcaHistoryPage() {
  const [page, setPage] = useState(1);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const limit = 10;

  const { ordersData, summaryData, isLoading, error, refetchAll } =
    useDcaHistoryData(page, limit);

  useDcaRealtimeUpdates({ onUpdate: refetchAll });

  const { needsApproval } = useLineApproval();

  const handleDataMutated = useCallback(() => {
    setPage(1);
    const channel = new BroadcastChannel("dca-updates");
    channel.postMessage({ type: "update" });
    channel.close();
    refetchAll();
  }, [refetchAll]);

  return (
    <>
      <PendingApprovalModal open={needsApproval} />

      <div id="dca-history-page" className="bg-background min-h-screen w-full">
        <div
          id="dca-history-container"
          className="container mx-auto max-w-7xl px-4 py-8"
        >
          <div
            id="dca-history-header"
            className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
          >
            <div id="dca-history-heading-group" className="space-y-1">
              <h1
                id="dca-history-title"
                className="flex items-center gap-2 text-2xl font-bold tracking-tight"
              >
                <Bitcoin className="h-7 w-7 text-orange-500" />
                ประวัติคำสั่งซื้อ Auto DCA
              </h1>
              <p id="dca-history-description" className="text-muted-foreground text-sm">
                บันทึกประวัติการลงทุนแบบ Dollar Cost Averaging สำหรับ Bitcoin
              </p>
            </div>

            <div
              id="dca-history-actions"
              className="flex flex-wrap items-center gap-2"
            >
              <DcaExportButtons disabled={isLoading || !ordersData?.total} />
              <div className="bg-border h-6 w-px" aria-hidden />
              <Button
                id="dca-history-import-button"
                variant="outline"
                size="sm"
                onClick={() => setShowImportModal(true)}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                นำเข้า
              </Button>
              <Button
                id="dca-history-refresh-button"
                variant="outline"
                size="sm"
                onClick={refetchAll}
                disabled={isLoading}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                รีเฟรช
              </Button>
              <Button
                id="dca-history-add-button"
                size="sm"
                onClick={() => setShowAddForm(true)}
                className="gap-2 bg-yellow-500 text-black hover:bg-yellow-400"
              >
                <Plus className="h-4 w-4" />
                เพิ่มคำสั่งซื้อ
              </Button>
            </div>
          </div>

          {summaryData && <DcaSummaryCards summary={summaryData} />}

          <DcaHistoryTable
            ordersData={ordersData}
            error={error}
            isLoading={isLoading}
            page={page}
            onPageChange={setPage}
          />

          <DcaInfoBox />
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
