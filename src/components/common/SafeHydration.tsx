/**
 * 🛡️ Safe Hydration Components
 * Components สำหรับป้องกันและจัดการ hydration mismatch errors
 */

import React from "react";
import { useMemo } from "react";
import {
  useSafeTimestamp,
  useSuppressHydrationWarning,
  useClientOnlyMounted,
} from "@/hooks/useHydrationSafe";

/**
 * 📅 SafeTimestamp Component
 * แสดงเวลาที่ปลอดภัยจาก hydration mismatch
 */
interface SafeTimestampProps {
  format?: "full" | "date" | "time";
  className?: string;
  initialTime?: Date;
}

export function SafeTimestamp({
  format = "full",
  className = "",
  initialTime,
}: SafeTimestampProps) {
  const { timestamp, suppressHydrationWarning, isHydrated } =
    useSafeTimestamp(initialTime);

  const formatTime = (date: Date) => {
    if (!isHydrated) {
      // Return safe server-side format
      return date.toISOString().split("T")[0]; // YYYY-MM-DD
    }

    // Client-side formatting with Intl API
    switch (format) {
      case "date":
        return new Intl.DateTimeFormat("th-TH", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }).format(date);
      case "time":
        return new Intl.DateTimeFormat("th-TH", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }).format(date);
      default:
        return new Intl.DateTimeFormat("th-TH", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }).format(date);
    }
  };

  return (
    <time
      dateTime={timestamp.toISOString()}
      className={className}
      suppressHydrationWarning={suppressHydrationWarning}
    >
      {formatTime(timestamp)}
    </time>
  );
}

/**
 * 🎲 SafeRandomContent Component
 * แสดงเนื้อหาแบบสุ่มที่ปลอดภัยจาก hydration mismatch
 */
interface SafeRandomContentProps {
  items: string[];
  className?: string;
  fallback?: string;
}

export function SafeRandomContent({
  items,
  className = "",
  fallback = "Loading...",
}: SafeRandomContentProps) {
  const mounted = useClientOnlyMounted();
  const suppressWarning = useSuppressHydrationWarning(!mounted);
  const selectedItem = useMemo(() => {
    if (!mounted || items.length === 0) {
      return fallback;
    }

    const stableIndex =
      items.reduce((total, item) => total + item.length, 0) % items.length;
    return items[stableIndex] ?? fallback;
  }, [fallback, items, mounted]);

  return (
    <span className={className} suppressHydrationWarning={suppressWarning}>
      {selectedItem}
    </span>
  );
}

/**
 * 🌐 ClientOnlyWrapper Component
 * Wrapper สำหรับ components ที่ควรแสดงเฉพาะบน client
 */
interface ClientOnlyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

export function ClientOnlyWrapper({
  children,
  fallback = null,
  className = "",
}: ClientOnlyWrapperProps) {
  const mounted = useClientOnlyMounted();

  if (!mounted) {
    return fallback ? <div className={className}>{fallback}</div> : null;
  }

  return (
    <div className={className} suppressHydrationWarning={true}>
      {children}
    </div>
  );
}

/**
 * 📊 UserSpecificContent Component
 * สำหรับเนื้อหาที่เฉพาะเจาะจงกับผู้ใช้และอาจแตกต่างระหว่าง server/client
 */
interface UserSpecificContentProps {
  serverContent: React.ReactNode;
  clientContent: () => React.ReactNode;
  className?: string;
}

export function UserSpecificContent({
  serverContent,
  clientContent,
  className = "",
}: UserSpecificContentProps) {
  const mounted = useClientOnlyMounted();
  const suppressWarning = useSuppressHydrationWarning();

  return (
    <div className={className} suppressHydrationWarning={suppressWarning}>
      {mounted ? clientContent() : serverContent}
    </div>
  );
}

/**
 * 🔧 ConditionalSuppression Component
 * Helper สำหรับการ suppress hydration warning แบบมีเงื่อนไข
 */
interface ConditionalSuppressionProps {
  children: React.ReactNode;
  condition: boolean;
  className?: string;
}

export function ConditionalSuppression({
  children,
  condition,
  className = "",
}: ConditionalSuppressionProps) {
  return (
    <div className={className} suppressHydrationWarning={condition}>
      {children}
    </div>
  );
}

/**
 * 📋 ตัวอย่างการใช้งาน
 */
export function HydrationExamples() {
  return (
    <div className="space-y-4 p-4">
      <h2 className="text-xl font-bold">🛡️ Hydration Safe Components</h2>

      {/* ✅ Safe Timestamp */}
      <div>
        <strong>เวลาปัจจุบัน:</strong>{" "}
        <SafeTimestamp format="full" className="text-blue-600" />
      </div>

      {/* ✅ Safe Random Content */}
      <div>
        <strong>ข้อความสุ่ม:</strong>{" "}
        <SafeRandomContent
          items={[
            "🎉 ยินดีต้อนรับ!",
            "🚀 เริ่มต้นใหม่!",
            "✨ วันนี้เป็นวันที่ดี!",
          ]}
          className="text-green-600"
          fallback="กำลังโหลด..."
        />
      </div>

      {/* ✅ Client Only Content */}
      <ClientOnlyWrapper fallback={<div>กำลังโหลด...</div>}>
        <div className="rounded bg-yellow-100 p-2">
          <strong>เนื้อหาเฉพาะ Client:</strong> {window.location.href}
        </div>
      </ClientOnlyWrapper>

      {/* ✅ User Specific Content */}
      <UserSpecificContent
        serverContent={<div>เนื้อหาสำหรับ Server</div>}
        clientContent={() => (
          <div className="rounded bg-purple-100 p-2">
            User Agent: {navigator.userAgent.slice(0, 50)}...
          </div>
        )}
      />

      {/* ✅ Conditional Suppression */}
      <ConditionalSuppression condition={true}>
        <div className="rounded bg-red-100 p-2">
          เนื้อหาที่อาจมี hydration mismatch แต่ถูก suppress แล้ว
        </div>
      </ConditionalSuppression>
    </div>
  );
}
