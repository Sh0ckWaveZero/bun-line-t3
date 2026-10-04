"use client";

import { useState } from "react";
import { CronJobActionsDialog } from "../components/CronJobActionsDialog";
import { CronJobFiltersBar } from "../components/CronJobFiltersBar";
import { CronJobFormDialog } from "../components/CronJobFormDialog";
import { CronJobListToolbar } from "../components/CronJobListToolbar";
import { CronJobStatusTabs } from "../components/CronJobStatusTabs";
import { CronJobTable } from "../components/CronJobTable";
import { CronJobsAlerts } from "../components/CronJobsAlerts";
import { CronJobsHeader } from "../components/CronJobsHeader";
import { CronJobsListFooter } from "../components/CronJobsListFooter";
import { CronJobsMetricsSection } from "../components/CronJobsMetricsSection";
import { useCronJobActions } from "../hooks/useCronJobActions";
import { useCronJobFilters } from "../hooks/useCronJobFilters";
import { useCronJobMetrics } from "../hooks/useCronJobMetrics";
import { useCronJobs } from "../hooks/useCronJobs";
import type { DisplayMode } from "../types";

export function CronJobsPage() {
  const {
    jobs,
    source,
    isLoading,
    isRefreshing,
    isMutating,
    error,
    refresh,
    createJob,
    updateJob,
    deleteJob,
    runJob,
  } = useCronJobs();
  const filters = useCronJobFilters(jobs);
  const metrics = useCronJobMetrics(jobs, source);
  const actions = useCronJobActions({
    isMutating,
    createJob,
    updateJob,
    deleteJob,
    runJob,
  });
  const [displayMode, setDisplayMode] = useState<DisplayMode>("comfortable");

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-[#f5f7f8] px-4 py-7 text-slate-900 sm:px-6 lg:px-8 dark:bg-[#0d0f11] dark:text-slate-100">
      <div className="mx-auto max-w-[1640px]">
        <CronJobsHeader
          jobsCount={jobs.length}
          failingJobs={metrics.failingJobs}
          timezone={source?.timezone}
          environmentFilter={filters.environmentFilter}
          onEnvironmentFilterChange={filters.handleEnvironmentFilterChange}
          onCreateJob={actions.handleOpenCreate}
        />

        <CronJobsAlerts
          isLoading={isLoading}
          error={error}
          isRefreshing={isRefreshing}
          source={source}
          notice={actions.notice}
          onRefresh={() => void refresh()}
          onDismissNotice={actions.handleDismissNotice}
        />

        <CronJobsMetricsSection metrics={metrics} jobs={jobs} />

        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_10px_34px_rgba(16,24,40,0.05)] dark:border-white/[0.08] dark:bg-[#151719] dark:shadow-none">
          <CronJobListToolbar
            jobsCount={jobs.length}
            failingJobs={metrics.failingJobs}
            displayMode={displayMode}
            onToggleDisplayMode={() =>
              setDisplayMode((current) =>
                current === "compact" ? "comfortable" : "compact",
              )
            }
          />
          <CronJobStatusTabs
            statusCounts={metrics.statusCounts}
            activeFilter={filters.activeFilter}
            onSelectFilter={filters.handleSelectFilter}
          />
          <CronJobFiltersBar
            query={filters.query}
            onQueryChange={filters.handleQueryChange}
            targetFilter={filters.targetFilter}
            onTargetFilterChange={filters.handleTargetFilterChange}
            onResetFilters={filters.handleResetFilters}
          />
          <CronJobTable
            jobs={filters.visibleJobs}
            compact={displayMode === "compact"}
            onToggleJob={(selected) => void actions.handleToggleJob(selected)}
            onMenuJob={actions.handleSelectJob}
            toggleDisabled={isMutating}
            hasFilters={filters.hasActiveFilters}
            isLoading={isLoading}
          />
          <CronJobsListFooter
            pageSize={filters.pageSize}
            onPageSizeChange={filters.handlePageSizeChange}
            firstVisibleRow={filters.firstVisibleRow}
            lastVisibleRow={filters.lastVisibleRow}
            totalCount={filters.filteredJobs.length}
            currentPage={filters.currentPage}
            pageCount={filters.pageCount}
            onPreviousPage={filters.goToPreviousPage}
            onNextPage={filters.goToNextPage}
            onSelectPage={filters.goToPage}
          />
        </section>
      </div>
      <CronJobFormDialog
        key={`form-${actions.formOpen ? (actions.editingJob?.id ?? "new") : "closed"}`}
        open={actions.formOpen}
        job={actions.editingJob}
        isSaving={isMutating}
        onClose={actions.handleCloseForm}
        onSubmit={actions.handleSaveJob}
      />
      <CronJobActionsDialog
        key={`actions-${actions.selectedJob?.id ?? "closed"}`}
        job={actions.selectedJob}
        isBusy={isMutating}
        onClose={actions.handleCloseActions}
        onEdit={() => {
          if (actions.selectedJob) actions.handleOpenEdit(actions.selectedJob);
        }}
        onRun={() =>
          actions.selectedJob
            ? actions.handleRunJob(actions.selectedJob)
            : Promise.resolve()
        }
        onToggle={() =>
          actions.selectedJob
            ? actions.handleToggleJob(actions.selectedJob)
            : Promise.resolve()
        }
        onDelete={() =>
          actions.selectedJob
            ? actions.handleDeleteJob(actions.selectedJob)
            : Promise.resolve()
        }
      />
    </main>
  );
}
