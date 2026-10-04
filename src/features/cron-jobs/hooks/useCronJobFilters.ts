import { useMemo, useState } from "react";
import { getCronJobStatus } from "@/features/cron-jobs/helpers";
import type {
  CronJob,
  EnvironmentFilter,
  JobFilter,
  TargetKind,
} from "@/features/cron-jobs/types";

export interface UseCronJobFiltersResult {
  activeFilter: JobFilter;
  environmentFilter: EnvironmentFilter;
  targetFilter: "all" | TargetKind;
  query: string;
  pageSize: number;
  filteredJobs: CronJob[];
  visibleJobs: CronJob[];
  pageCount: number;
  currentPage: number;
  firstVisibleRow: number;
  lastVisibleRow: number;
  hasActiveFilters: boolean;
  handleSelectFilter: (filter: JobFilter) => void;
  handleEnvironmentFilterChange: (value: EnvironmentFilter) => void;
  handleTargetFilterChange: (value: "all" | TargetKind) => void;
  handleQueryChange: (value: string) => void;
  handleResetFilters: () => void;
  handlePageSizeChange: (size: number) => void;
  goToPage: (pageNumber: number) => void;
  goToPreviousPage: () => void;
  goToNextPage: () => void;
}

export function useCronJobFilters(jobs: CronJob[]): UseCronJobFiltersResult {
  const [activeFilter, setActiveFilter] = useState<JobFilter>("all");
  const [environmentFilter, setEnvironmentFilter] =
    useState<EnvironmentFilter>("all");
  const [targetFilter, setTargetFilter] = useState<"all" | TargetKind>("all");
  const [query, setQuery] = useState("");
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState(1);

  const filteredJobs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return jobs.filter((job) => {
      const matchesStatus =
        activeFilter === "all" || getCronJobStatus(job) === activeFilter;
      const matchesEnvironment =
        environmentFilter === "all" ||
        job.target.environment === environmentFilter;
      const matchesTarget =
        targetFilter === "all" || job.target.kind === targetFilter;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        job.name.toLowerCase().includes(normalizedQuery) ||
        job.command.toLowerCase().includes(normalizedQuery) ||
        job.target.name.toLowerCase().includes(normalizedQuery);

      return (
        matchesStatus && matchesEnvironment && matchesTarget && matchesQuery
      );
    });
  }, [activeFilter, environmentFilter, jobs, query, targetFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredJobs.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleJobs = filteredJobs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const firstVisibleRow =
    filteredJobs.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastVisibleRow = Math.min(currentPage * pageSize, filteredJobs.length);
  const hasActiveFilters = Boolean(
    query ||
    activeFilter !== "all" ||
    environmentFilter !== "all" ||
    targetFilter !== "all",
  );

  const handleSelectFilter = (filter: JobFilter) => {
    setActiveFilter(filter);
    setPage(1);
  };

  const handleEnvironmentFilterChange = (value: EnvironmentFilter) => {
    setEnvironmentFilter(value);
    setPage(1);
  };

  const handleTargetFilterChange = (value: "all" | TargetKind) => {
    setTargetFilter(value);
    setPage(1);
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setPage(1);
  };

  const handleResetFilters = () => {
    setActiveFilter("all");
    setEnvironmentFilter("all");
    setTargetFilter("all");
    setQuery("");
    setPage(1);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  const goToPage = (pageNumber: number) => {
    setPage(pageNumber);
  };

  const goToPreviousPage = () => {
    setPage((current) => Math.max(1, current - 1));
  };

  const goToNextPage = () => {
    setPage((current) => Math.min(pageCount, current + 1));
  };

  return {
    activeFilter,
    environmentFilter,
    targetFilter,
    query,
    pageSize,
    filteredJobs,
    visibleJobs,
    pageCount,
    currentPage,
    firstVisibleRow,
    lastVisibleRow,
    hasActiveFilters,
    handleSelectFilter,
    handleEnvironmentFilterChange,
    handleTargetFilterChange,
    handleQueryChange,
    handleResetFilters,
    handlePageSizeChange,
    goToPage,
    goToPreviousPage,
    goToNextPage,
  };
}
