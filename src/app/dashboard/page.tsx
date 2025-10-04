"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar,
  FileText,
  Wrench,
  BarChart3,
  Clock,
  User,
} from "lucide-react";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div
        id="dashboard-loading"
        className="flex min-h-screen items-center justify-center"
      >
        <div id="loading-text" className="text-lg text-muted-foreground">
          กำลังโหลด...
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const quickActions = [
    {
      id: "attendance",
      title: "รายงานเข้างาน",
      description: "ดูรายงานการเข้างานและสถิติ",
      icon: <BarChart3 className="h-6 w-6" />,
      href: "/attendance-report",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      id: "leave",
      title: "ลางาน",
      description: "แจ้งวันลาและดูประวัติ",
      icon: <Calendar className="h-6 w-6" />,
      href: "/leave",
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/20",
    },
    {
      id: "tools",
      title: "เครื่องมือสุ่ม",
      description: "เครื่องมือสุ่มข้อมูลต่างๆ",
      icon: <Wrench className="h-6 w-6" />,
      href: "/thai-names-generator",
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
    },
    {
      id: "help",
      title: "คำสั่งทั้งหมด",
      description: "ดูคำสั่ง LINE Bot",
      icon: <FileText className="h-6 w-6" />,
      href: "/help",
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-100 dark:bg-orange-900/20",
    },
  ];

  return (
    <div
      id="dashboard-container"
      className="container mx-auto max-w-6xl px-4 py-8"
    >
      <div id="dashboard-content" className="space-y-8">
        {/* Header */}
        <div id="dashboard-header" className="space-y-2">
          <h1
            id="dashboard-title"
            className="text-3xl font-bold tracking-tight"
          >
            Dashboard
          </h1>
          <p id="dashboard-welcome" className="text-muted-foreground">
            ยินดีต้อนรับ {session.user?.name}
          </p>
        </div>

        {/* User Info Card */}
        <Card id="user-info-card">
          <CardHeader id="user-info-header">
            <CardTitle id="user-info-title" className="flex items-center gap-2">
              <User id="user-icon" className="h-5 w-5" />
              ข้อมูลผู้ใช้
            </CardTitle>
          </CardHeader>
          <CardContent id="user-info-content">
            <div id="user-info-wrapper" className="flex items-center gap-4">
              {session.user?.image && (
                <Image
                  id="user-avatar"
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  width={64}
                  height={64}
                  className="h-16 w-16 rounded-full"
                />
              )}
              <div id="user-details">
                <p id="user-name" className="font-semibold">
                  {session.user?.name}
                </p>
                <p id="user-email" className="text-sm text-muted-foreground">
                  {session.user?.email}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div
          id="quick-stats"
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          <Card id="stat-status">
            <CardContent id="stat-status-content" className="p-6">
              <div className="flex items-center gap-4">
                <div
                  id="stat-status-icon-wrapper"
                  className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20"
                >
                  <Clock
                    id="stat-status-icon"
                    className="h-6 w-6 text-blue-600 dark:text-blue-400"
                  />
                </div>
                <div id="stat-status-text">
                  <p
                    id="stat-status-label"
                    className="text-sm text-muted-foreground"
                  >
                    สถานะ
                  </p>
                  <p id="stat-status-value" className="text-2xl font-bold">
                    เข้าสู่ระบบ
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card id="stat-date">
            <CardContent id="stat-date-content" className="p-6">
              <div className="flex items-center gap-4">
                <div
                  id="stat-date-icon-wrapper"
                  className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20"
                >
                  <Calendar
                    id="stat-date-icon"
                    className="h-6 w-6 text-green-600 dark:text-green-400"
                  />
                </div>
                <div id="stat-date-text">
                  <p
                    id="stat-date-label"
                    className="text-sm text-muted-foreground"
                  >
                    วันนี้
                  </p>
                  <p id="stat-date-value" className="text-2xl font-bold">
                    {new Date().toLocaleDateString("th-TH", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card id="stat-system">
            <CardContent id="stat-system-content" className="p-6">
              <div className="flex items-center gap-4">
                <div
                  id="stat-system-icon-wrapper"
                  className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/20"
                >
                  <BarChart3
                    id="stat-system-icon"
                    className="h-6 w-6 text-purple-600 dark:text-purple-400"
                  />
                </div>
                <div id="stat-system-text">
                  <p
                    id="stat-system-label"
                    className="text-sm text-muted-foreground"
                  >
                    ระบบ
                  </p>
                  <p id="stat-system-value" className="text-2xl font-bold">
                    ใช้งานได้
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div id="quick-actions-section" className="space-y-4">
          <h2 id="quick-actions-title" className="text-2xl font-bold">
            เมนูด่วน
          </h2>
          <div id="quick-actions-grid" className="grid gap-4 md:grid-cols-2">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                id={`action-${action.id}-link`}
              >
                <Card
                  id={`action-${action.id}-card`}
                  className="transition-all hover:scale-105 hover:shadow-lg"
                >
                  <CardContent
                    id={`action-${action.id}-content`}
                    className="p-6"
                  >
                    <div className="flex items-start gap-4">
                      <div
                        id={`action-${action.id}-icon-wrapper`}
                        className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg ${action.bgColor}`}
                      >
                        <div
                          id={`action-${action.id}-icon`}
                          className={action.color}
                        >
                          {action.icon}
                        </div>
                      </div>
                      <div id={`action-${action.id}-text`} className="flex-1">
                        <h3
                          id={`action-${action.id}-title`}
                          className="font-bold"
                        >
                          {action.title}
                        </h3>
                        <p
                          id={`action-${action.id}-description`}
                          className="text-sm text-muted-foreground"
                        >
                          {action.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Info Section */}
        <div
          id="info-section"
          className="space-y-2 rounded-lg border border-blue-500/50 bg-blue-500/10 p-6"
        >
          <h3
            id="info-title"
            className="font-semibold text-blue-700 dark:text-blue-400"
          >
            ℹ️ เกี่ยวกับระบบ
          </h3>
          <p
            id="info-description"
            className="text-sm text-blue-700/80 dark:text-blue-400/80"
          >
            ระบบจัดการการเข้างานและ LINE Bot สำหรับองค์กร
            รองรับการบันทึกเวลาเข้า-ออกงาน การลางาน และเครื่องมือช่วยเหลือต่างๆ
          </p>
        </div>
      </div>
    </div>
  );
}
