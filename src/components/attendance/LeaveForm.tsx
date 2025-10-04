// src/components/attendance/LeaveForm.tsx
"use client";
import { useState, useEffect } from "react";
import { useToast } from "@/components/common/ToastProvider";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Save,
  Cake,
  Palmtree,
  Stethoscope,
  User,
} from "lucide-react";

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

  const leaveTypes = [
    {
      value: "personal",
      label: "ลากิจ",
      icon: <User className="h-4 w-4" />,
    },
    {
      value: "sick",
      label: "ลาป่วย",
      icon: <Stethoscope className="h-4 w-4" />,
    },
    {
      value: "vacation",
      label: "ลาพักร้อน",
      icon: <Palmtree className="h-4 w-4" />,
    },
    {
      value: "birthday",
      label: "เดือนเกิด",
      icon: <Cake className="h-4 w-4" />,
    },
  ];

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">แจ้งวันลา</h1>
          <p className="text-muted-foreground">
            บันทึกข้อมูลวันลาของคุณ ระบบจะสร้างบันทึกการทำงานอัตโนมัติ
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              ข้อมูลการลา
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Date Field */}
              <div className="space-y-2">
                <Label htmlFor="leave-date" className="text-sm font-medium">
                  วันที่ลา
                </Label>
                <input
                  id="leave-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full rounded-md border bg-background px-3 py-1.5 text-sm text-foreground transition focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Leave Type Field */}
              <div className="space-y-3">
                <Label htmlFor="leave-type" className="text-sm font-semibold">
                  ประเภทวันลา
                </Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {leaveTypes.map((leaveType) => (
                    <button
                      key={leaveType.value}
                      type="button"
                      onClick={() => setType(leaveType.value)}
                      className={`flex h-14 items-center gap-3 rounded-lg border p-3 transition-all ${
                        type === leaveType.value
                          ? "bg-primary/10 border-primary text-primary"
                          : "border-border bg-card hover:bg-accent"
                      }`}
                    >
                      <div
                        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md ${
                          type === leaveType.value
                            ? "bg-primary/20 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {leaveType.icon}
                      </div>
                      <span className="font-medium">{leaveType.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Reason Field */}
              <div className="space-y-3">
                <Label htmlFor="leave-reason" className="text-sm font-semibold">
                  เหตุผล (ถ้ามี)
                </Label>
                <input
                  id="leave-reason"
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-foreground transition focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="ระบุเหตุผล (ถ้ามี)"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full"
                size="lg"
              >
                <Save className="mr-2 h-4 w-4" />
                {loading ? "กำลังบันทึก..." : "บันทึกวันลา"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Info Section */}
        <div className="space-y-2 rounded-lg border border-blue-500/50 bg-blue-500/10 p-6">
          <h3 className="font-semibold text-blue-700 dark:text-blue-400">
            ℹ️ ข้อมูลสำคัญ
          </h3>
          <p className="text-sm text-blue-700/80 dark:text-blue-400/80">
            เมื่อบันทึกวันลา ระบบจะสร้างบันทึกการทำงานอัตโนมัติให้
            โดยเวลาเข้างาน 08:00 น. และเวลาออกงาน 17:00 น. (เวลาประเทศไทย)
          </p>
        </div>
      </div>
    </div>
  );
};
