"use client";

import { RefreshCw, Scale } from "lucide-react";
import { ProfileEditor } from "@/features/body-weight/components/ProfileEditor";
import { SectionLabel } from "@/features/body-weight/components/SectionLabel";
import {
  WeightChartSkeleton,
  WeightProfileSkeleton,
  WeightStatsSkeleton,
  WeightTableSkeleton,
} from "@/features/body-weight/components/BodyWeightSkeletons";
import { WeightChartCard } from "@/features/body-weight/components/WeightChartCard";
import { WeightStatsCards } from "@/features/body-weight/components/WeightStatsCards";
import { WeighInTable } from "@/features/body-weight/components/WeighInTable";
import { useBodyWeight } from "@/features/body-weight/hooks/useBodyWeight";
import { SkeletonReveal } from "@/components/ui/skeleton-reveal";

function BodyWeightPageContent() {
  const {
    snapshot,
    isLoading,
    isRefreshing,
    error,
    refetch,
    saveProfile,
    isSaving,
  } = useBodyWeight();

  const measurements = snapshot?.measurements ?? [];
  const profiles = snapshot?.profiles ?? [];

  return (
    <div id="body-weight-page" className="bg-background min-h-screen w-full">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Topbar */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-card border-border flex h-10 w-10 items-center justify-center rounded-lg border">
              <Scale className="text-foreground h-5 w-5" />
            </div>
            <div>
              <h1 className="text-foreground text-lg font-semibold tracking-tight">
                บันทึกน้ำหนัก
              </h1>
              <p className="text-muted-foreground font-mono text-[11px]">
                Mi Body Composition Scale 2 → miscale-dashboard → webhook
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void refetch()}
            aria-label="รีเฟรชข้อมูล"
            className="border-border bg-card text-foreground hover:bg-muted flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border transition-colors"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mt-3 rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Section 01: Overview */}
        <SectionLabel num="01" title="ภาพรวม" hint="สรุปล่าสุด + กราฟ 90 วัน" />
        <div id="body-weight-section-overview" className="space-y-4">
          <SkeletonReveal
            isReady={!isLoading}
            skeleton={<WeightStatsSkeleton />}
          >
            <WeightStatsCards measurements={measurements} />
          </SkeletonReveal>
          <SkeletonReveal
            isReady={!isLoading}
            skeleton={<WeightChartSkeleton />}
          >
            <WeightChartCard measurements={measurements} />
          </SkeletonReveal>
        </div>

        {/* Section 02: History */}
        <SectionLabel
          num="02"
          title="ประวัติการชั่ง"
          hint="ล่าสุด 500 รายการ"
        />
        <div id="body-weight-section-history">
          <SkeletonReveal
            isReady={!isLoading}
            skeleton={<WeightTableSkeleton />}
          >
            <WeighInTable measurements={measurements} />
          </SkeletonReveal>
        </div>

        {/* Section 03: Profiles */}
        <SectionLabel
          num="03"
          title="โปรไฟล์"
          hint="เติมส่วนสูง/วันเกิดเพื่อคำนวณสัดส่วนร่างกาย"
        />
        <div id="body-weight-section-profiles">
          <SkeletonReveal
            isReady={!isLoading}
            skeleton={<WeightProfileSkeleton />}
          >
            <ProfileEditor
              profiles={profiles}
              isSaving={isSaving}
              onSave={saveProfile}
            />
          </SkeletonReveal>
        </div>
      </div>
    </div>
  );
}

export function BodyWeightPage() {
  return <BodyWeightPageContent />;
}
