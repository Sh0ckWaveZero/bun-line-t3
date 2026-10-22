"use client";

import { useMemo, useState } from "react";
import { RefreshCw, Weight } from "lucide-react";
import { LiveScaleCard } from "@/features/body-weight/components/LiveScaleCard";
import { ProfileEditor } from "@/features/body-weight/components/ProfileEditor";
import { WeighInOverlay } from "@/features/body-weight/components/WeighInOverlay";
import { ProfileSwitcher } from "@/features/body-weight/components/ProfileSwitcher";
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
import {
  filterByProfile,
  filterHistory,
} from "@/features/body-weight/helpers/weigh-in-stats";
import { useBodyWeight } from "@/features/body-weight/hooks/useBodyWeight";
import { useLiveScale } from "@/features/body-weight/hooks/useLiveScale";
import { SkeletonReveal } from "@/components/ui/skeleton-reveal";
import "@/styles/body-weight.css";

const DEFAULT_RANGE_DAYS = 90;

function BodyWeightPageContent() {
  const {
    snapshot,
    isLoading,
    isRefreshing,
    error,
    refetch,
    saveProfile,
    isSaving,
    reassignMeasurement,
    deleteMeasurement,
    busyMeasurementId,
  } = useBodyWeight();

  const { reading, pending, overlay, closeOverlay } = useLiveScale();

  const [pickedProfileId, setPickedProfileId] = useState<string | null>(null);
  const [compareDays, setCompareDays] = useState(0);
  const [rangeDays, setRangeDays] = useState<number | null>(
    DEFAULT_RANGE_DAYS,
  );
  const [showEveryone, setShowEveryone] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const measurements = useMemo(
    () => snapshot?.measurements ?? [],
    [snapshot],
  );
  const profiles = useMemo(() => snapshot?.profiles ?? [], [snapshot]);

  // ยังไม่ได้เลือก (หรือโปรไฟล์ที่เลือกถูกลบ) — ใช้เจ้าของการชั่งล่าสุด หรือโปรไฟล์แรก
  const selectedProfileId = useMemo(() => {
    if (profiles.some((profile) => profile.id === pickedProfileId)) {
      return pickedProfileId;
    }
    const latestOwner = measurements.find((m) => m.profileId)?.profileId;
    return latestOwner ?? profiles[0]?.id ?? null;
  }, [pickedProfileId, profiles, measurements]);

  const profileMeasurements = useMemo(
    () => filterByProfile(measurements, selectedProfileId),
    [measurements, selectedProfileId],
  );
  const historyMeasurements = useMemo(
    () => filterHistory(measurements, selectedProfileId, showEveryone),
    [measurements, selectedProfileId, showEveryone],
  );

  // ตรึงคนที่กำลังดูไว้ก่อนแก้/ลบ — ไม่งั้นค่า default (เจ้าของการชั่งล่าสุด) จะเปลี่ยนหลัง refetch
  const pinSelectedProfile = () => setPickedProfileId(selectedProfileId);

  const handleReassign = (measurementId: string, profileId: string | null) => {
    pinSelectedProfile();
    setActionError(null);
    reassignMeasurement({ measurementId, profileId }).catch((e: unknown) => {
      setActionError(
        e instanceof Error ? e.message : "เปลี่ยนเจ้าของไม่สำเร็จ",
      );
    });
  };

  const handleDelete = async (measurementId: string) => {
    pinSelectedProfile();
    setActionError(null);
    await deleteMeasurement(measurementId);
  };

  const bannerError = error ?? actionError;
  // snapshot โหลดใหม่ตามหลัง poll ราว 1 วิ — ระหว่างนั้น overlay ยังแสดงน้ำหนักสดต่อ
  const overlayMeasurement =
    measurements.find((m) => m.id === overlay.measurementId) ?? null;

  return (
    <div id="body-weight-page" className="bg-background min-h-screen w-full">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Topbar */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-card border-border flex h-10 w-10 items-center justify-center rounded-lg border">
              <Weight className="text-foreground h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-foreground text-lg font-semibold tracking-tight">
                บันทึกน้ำหนัก
              </h1>
              <p className="text-muted-foreground font-mono text-[11px]">
                Mi Body Composition Scale 2 → BLE listener → webhook
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

        <div className="mt-4">
          <ProfileSwitcher
            profiles={profiles}
            selectedId={selectedProfileId}
            onSelect={setPickedProfileId}
          />
        </div>

        {/* Error banner */}
        {bannerError && (
          <div
            role="alert"
            className="mt-3 rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
          >
            {bannerError}
          </div>
        )}

        {/* Section 01: Overview */}
        <SectionLabel
          num="01"
          title="ภาพรวม"
          hint="ผลชั่งล่าสุด + กราฟน้ำหนัก/ไขมัน"
        />
        <div id="body-weight-section-overview" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            <LiveScaleCard reading={reading} measurements={measurements} />
            <SkeletonReveal
              isReady={!isLoading}
              skeleton={<WeightStatsSkeleton />}
            >
              <WeightStatsCards
                measurements={profileMeasurements}
                compareDays={compareDays}
                onCompareDaysChange={setCompareDays}
              />
            </SkeletonReveal>
          </div>
          <SkeletonReveal
            isReady={!isLoading}
            skeleton={<WeightChartSkeleton />}
          >
            <WeightChartCard
              measurements={profileMeasurements}
              rangeDays={rangeDays}
              onRangeDaysChange={setRangeDays}
            />
          </SkeletonReveal>
        </div>

        {/* Section 02: History */}
        <SectionLabel
          num="02"
          title="ประวัติการชั่ง"
          hint="แก้เจ้าของหรือลบได้ในแต่ละแถว"
        />
        <div id="body-weight-section-history">
          <SkeletonReveal
            isReady={!isLoading}
            skeleton={<WeightTableSkeleton />}
          >
            <WeighInTable
              measurements={historyMeasurements}
              profiles={profiles}
              showEveryone={showEveryone}
              onShowEveryoneChange={setShowEveryone}
              busyMeasurementId={busyMeasurementId}
              onReassign={handleReassign}
              onDelete={handleDelete}
            />
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

      <WeighInOverlay
        isOpen={overlay.isOpen}
        measurement={overlayMeasurement}
        pending={pending}
        reading={reading}
        measurements={measurements}
        onClose={closeOverlay}
      />
    </div>
  );
}

export function BodyWeightPage() {
  return <BodyWeightPageContent />;
}
