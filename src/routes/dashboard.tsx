"use client";

import { Link, createFileRoute } from "@tanstack/react-router";
import { useSession } from "@/lib/auth/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSafeHydration } from "@/hooks/useHydrationSafe";
import { PendingApprovalModal } from "@/components/auth/PendingApprovalModal";
import { useLineApproval } from "@/hooks/useLineApproval";
import {
  Calendar,
  FileText,
  Wrench,
  BarChart3,
  Clock,
  User,
  Bitcoin,
  MessageSquare,
  Wallet,
  Briefcase,
  Shield,
} from "lucide-react";

const getDisplayIdentity = (user?: {
  email?: string | null;
  lineUserId?: string | null;
}) => {
  const email = user?.email?.trim();
  if (email && !email.toLowerCase().endsWith("@line.local")) {
    return email;
  }

  return user?.lineUserId ?? "LINE User";
};

function DashboardPage() {
  const { data: session, status } = useSession();
  const isAdmin = session?.isAdmin ?? false;
  const { needsApproval } = useLineApproval();

  const todayLabel = useSafeHydration("...", () =>
    new Intl.DateTimeFormat("th-TH", {
      day: "numeric",
      month: "short",
    }).format(new Date()),
  );

  if (status === "loading") {
    return (
      <div
        id="dashboard-loading"
        className="flex min-h-screen items-center justify-center"
      >
        <div id="loading-text" className="text-muted-foreground text-lg">
          กำลังโหลด...
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  // Quick actions configuration
  const quickActions = [
    {
      id: "attendance",
      title: "รายงานเข้างาน",
      description: "ดูรายงานการเข้างานและสถิติ",
      icon: <BarChart3 className="h-6 w-6" />,
      href: "/attendance-report",
      category: "work",
      color: "text-card-blue",
      bgColor: "bg-card-blue",
    },
    {
      id: "leave",
      title: "ลางาน",
      description: "แจ้งวันลาและดูประวัติ",
      icon: <Calendar className="h-6 w-6" />,
      href: "/leave",
      category: "work",
      color: "text-card-green",
      bgColor: "bg-card-green",
    },
    {
      id: "tools",
      title: "เครื่องมือสุ่ม",
      description: "เครื่องมือสุ่มข้อมูลต่างๆ",
      icon: <Wrench className="h-6 w-6" />,
      href: "/thai-names-generator",
      category: "tools",
      color: "text-card-purple",
      bgColor: "bg-card-purple",
    },
    {
      id: "help",
      title: "คำสั่งทั้งหมด",
      description: "ดูคำสั่ง LINE Bot",
      icon: <FileText className="h-6 w-6" />,
      href: "/help",
      category: "tools",
      color: "text-primary",
      bgColor: "bg-card-orange",
    },
    {
      id: "dca",
      title: "Auto DCA",
      description: "ประวัติคำสั่งซื้อ Bitcoin DCA",
      icon: <Bitcoin className="h-6 w-6" />,
      href: "/dca-history",
      category: "finance",
      color: "text-primary",
      bgColor: "bg-secondary",
    },
    {
      id: "expenses",
      title: "รายรับรายจ่าย",
      description: "บันทึกและดูสรุปรายรับรายจ่ายประจำเดือน",
      icon: <Wallet className="h-6 w-6" />,
      href: "/expenses",
      category: "finance",
      color: "text-card-red",
      bgColor: "bg-card-red",
    },
    // 🔐 Admin menu (สำหรับ admin เท่านั้น)
    ...(isAdmin
      ? [
          {
            id: "line-approval",
            title: "LINE Approval",
            description: "จัดการคำขอใช้งาน LINE Messaging API",
            icon: <MessageSquare className="h-6 w-6" />,
            href: "/line-approval",
            category: "admin",
            color: "text-destructive",
            bgColor: "bg-destructive/10",
            badge: (
              <span className="bg-destructive/10 text-destructive ml-2 rounded-full px-2 py-0.5 text-xs font-semibold">
                Admin
              </span>
            ),
          },
        ]
      : []),
  ];

  const quickActionCategories = [
    {
      id: "finance",
      title: "การเงิน",
      description: "รายรับรายจ่ายและการลงทุน",
      icon: <Wallet className="h-4 w-4" />,
    },
    {
      id: "work",
      title: "งาน",
      description: "เวลาเข้างานและวันลา",
      icon: <Briefcase className="h-4 w-4" />,
    },
    {
      id: "tools",
      title: "เครื่องมือ",
      description: "คำสั่งและเครื่องมือช่วยงาน",
      icon: <Wrench className="h-4 w-4" />,
    },
    ...(isAdmin
      ? [
          {
            id: "admin",
            title: "จัดการระบบ",
            description: "สิทธิ์และคำขอใช้งาน",
            icon: <Shield className="h-4 w-4" />,
          },
        ]
      : []),
  ] as const;

  return (
    <>
      {/* Pending Approval Modal */}
      <PendingApprovalModal open={needsApproval} />

      {/* Dashboard Content */}
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
              <CardTitle
                id="user-info-title"
                className="flex items-center gap-2"
              >
                <User id="user-icon" className="h-5 w-5" />
                ข้อมูลผู้ใช้
              </CardTitle>
            </CardHeader>
            <CardContent id="user-info-content">
              <div id="user-info-wrapper" className="flex items-center gap-4">
                {session.user?.image && (
                  <img
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
                  <p id="user-email" className="text-muted-foreground text-sm">
                    {getDisplayIdentity(session.user)}
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
                      className="text-muted-foreground text-sm"
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
                      className="text-muted-foreground text-sm"
                    >
                      วันนี้
                    </p>
                    <p id="stat-date-value" className="text-2xl font-bold">
                      {todayLabel}
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
                      className="text-muted-foreground text-sm"
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
          <div id="quick-actions-section" className="space-y-5">
            <h2 id="quick-actions-title" className="text-2xl font-bold">
              เมนูด่วน
            </h2>
            <div id="quick-actions-categories" className="space-y-6">
              {quickActionCategories.map((category) => {
                const categoryActions = quickActions.filter(
                  (action) => action.category === category.id,
                );
                if (categoryActions.length === 0) return null;

                return (
                  <section
                    key={category.id}
                    id={`quick-actions-category-${category.id}`}
                    className="space-y-3"
                  >
                    <div
                      id={`quick-actions-category-${category.id}-header`}
                      className="flex items-center justify-between gap-4"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          id={`quick-actions-category-${category.id}-icon`}
                          className="bg-muted text-muted-foreground flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                        >
                          {category.icon}
                        </div>
                        <div className="min-w-0">
                          <h3
                            id={`quick-actions-category-${category.id}-title`}
                            className="text-foreground text-base font-semibold"
                          >
                            {category.title}
                          </h3>
                          <p
                            id={`quick-actions-category-${category.id}-description`}
                            className="text-muted-foreground text-sm"
                          >
                            {category.description}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div
                      id={`quick-actions-category-${category.id}-grid`}
                      className="grid gap-3 md:grid-cols-2"
                    >
                      {categoryActions.map((action) => (
                        <Link
                          key={action.href}
                          to={action.href}
                          id={`action-${action.id}-link`}
                        >
                          <Card
                            id={`action-${action.id}-card`}
                            className="hover:border-primary/40 transition-colors"
                          >
                            <CardContent
                              id={`action-${action.id}-content`}
                              className="p-5"
                            >
                              <div className="flex items-start gap-4">
                                <div
                                  id={`action-${action.id}-icon-wrapper`}
                                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${action.bgColor}`}
                                >
                                  <div
                                    id={`action-${action.id}-icon`}
                                    className={action.color}
                                  >
                                    {action.icon}
                                  </div>
                                </div>
                                <div
                                  id={`action-${action.id}-text`}
                                  className="min-w-0 flex-1"
                                >
                                  <h4
                                    id={`action-${action.id}-title`}
                                    className="flex items-center gap-2 font-semibold"
                                  >
                                    {action.title}
                                    {"badge" in action && action.badge}
                                  </h4>
                                  <p
                                    id={`action-${action.id}-description`}
                                    className="text-muted-foreground mt-1 text-sm"
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
                  </section>
                );
              })}
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
              รองรับการบันทึกเวลาเข้า-ออกงาน การลางาน
              และเครื่องมือช่วยเหลือต่างๆ
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});
