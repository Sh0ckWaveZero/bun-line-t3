// src/components/attendance/LeaveForm.tsx
"use client";
import { useState, useEffect } from "react";
import { useToast } from "@/components/common/ToastProvider";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface LeaveFormProps {
  onSubmit?: () => void;
}

export const LeaveForm = ({ onSubmit }: LeaveFormProps) => {
  const [date, setDate] = useState("");
  const [type, setType] = useState("personal");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data: session, status } = useSession();

  // ตั้งค่า default วันที่ลาเป็นวันนี้เมื่อโหลด component
  useEffect(() => {
    if (!date) {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      setDate(`${yyyy}-${mm}-${dd}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      showToast({ title: "กรุณาเข้าสู่ระบบ", type: "error" });
      setTimeout(() => {
        if (typeof window !== "undefined") {
          const callbackUrl = window.location.pathname + window.location.search;
          window.location.href = `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;
        }
      }, 1200);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status !== "authenticated") {
      showToast({ title: "กรุณาเข้าสู่ระบบ", type: "error" });
      setTimeout(() => {
        if (typeof window !== "undefined") {
          const callbackUrl = window.location.pathname + window.location.search;
          window.location.href = `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;
        }
      }, 1200);
      return;
    }
    setLoading(true);
    try {
      if (!date) {
        showToast({ title: "กรุณาเลือกวันที่ลา", type: "warning" });
        setLoading(false);
        return;
      }
      const res = await fetch("/api/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, type, reason }),
      });
      const isJson = res.headers
        .get("content-type")
        ?.includes("application/json");
      const data = isJson ? await res.json().catch(() => ({})) : {};
      if (!res.ok || (data && data.success === false)) {
        // ใช้ message จาก API เป็นหลัก
        const msg =
          typeof data.message === "string"
            ? data.message
            : "ไม่สามารถบันทึกวันลาได้ กรุณาลองใหม่อีกครั้ง";
        showToast({ title: msg, type: "error" });
        if (msg === "กรุณาเข้าสู่ระบบ") {
          setTimeout(() => {
            if (typeof window !== "undefined") {
              const callbackUrl =
                window.location.pathname + window.location.search;
              window.location.href = `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;
            }
          }, 1200);
        }
        return;
      }
      setDate("");
      setType("personal");
      setReason("");
      showToast({ title: "บันทึกวันลาสำเร็จ", type: "success" });
      onSubmit?.();
    } catch {
      showToast({
        title: "ไม่สามารถบันทึกวันลาได้ กรุณาลองใหม่อีกครั้ง",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="animate-fade-in mx-auto mt-2 flex w-full max-w-md flex-col gap-4 rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-6 shadow-lg dark:border-gray-700 dark:bg-gray-900 sm:max-w-lg sm:py-12 md:max-w-xl md:py-16"
      style={{ minWidth: 0 }}
    >
      <h2 className="text-high-contrast dark:text-high-contrast mb-2 text-center text-xl font-bold sm:text-2xl">
        แจ้งวันลา
      </h2>
      <div className="flex flex-col gap-1">
        <label
          className="text-medium-contrast dark:text-medium-contrast mb-1 font-medium"
          htmlFor="leave-date"
        >
          วันที่ลา
        </label>
        <input
          id="leave-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className="w-full rounded-lg border-2 border-gray-200 bg-background px-3 py-2 text-foreground transition focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label
          className="text-medium-contrast dark:text-medium-contrast mb-1 font-medium"
          htmlFor="leave-type"
        >
          ประเภทวันลา
        </label>
        <select
          id="leave-type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full rounded-lg border-2 border-gray-200 bg-background px-3 py-2 text-foreground transition focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600"
        >
          <option value="personal">ลากิจ</option>
          <option value="sick">ลาป่วย</option>
          <option value="vacation">ลาพักร้อน</option>
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label
          className="text-medium-contrast dark:text-medium-contrast mb-1 font-medium"
          htmlFor="leave-reason"
        >
          เหตุผล (ถ้ามี)
        </label>
        <input
          id="leave-reason"
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full rounded-lg border-2 border-gray-200 bg-background px-3 py-2 text-foreground transition focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600"
          placeholder="ระบุเหตุผล (ถ้ามี)"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="hover:bg-primary/90 dark:hover:bg-primary/80 mt-2 w-full rounded-lg border-2 border-primary bg-primary px-4 py-2 font-semibold text-primary-foreground shadow-sm transition disabled:opacity-60 dark:border-primary dark:bg-primary dark:text-primary-foreground"
      >
        {loading ? "กำลังบันทึก..." : "บันทึกวันลา"}
      </button>
    </form>
  );
};
