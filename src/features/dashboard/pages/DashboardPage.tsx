"use client";

import { PendingApprovalModal } from "@/components/auth/PendingApprovalModal";
import { useSession } from "@/lib/auth/client";
import { useLineApproval } from "@/lib/auth/hooks/useLineApproval";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  Bitcoin,
  Briefcase,
  Calendar,
  FileText,
  MessageSquare,
  Shield,
  Wallet,
  Wrench,
} from "lucide-react";

interface ActionItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  category: string;
  colorClass: string;
  bgClass: string;
  hoverClass: string;
  badge?: React.ReactNode;
}

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

const actions: ActionItem[] = [
  {
    id: "attendance",
    title: "รายงานเข้างาน",
    description: "ดูรายงานการเข้างานและสถิติ",
    icon: <BarChart3 className="h-5 w-5" />,
    href: "/attendance-report",
    category: "work",
    colorClass: "text-card-blue",
    bgClass: "bg-card-blue",
    hoverClass: "hover:bg-card-blue-hover",
  },
  {
    id: "leave",
    title: "ลางาน",
    description: "แจ้งวันลาและดูประวัติ",
    icon: <Calendar className="h-5 w-5" />,
    href: "/leave",
    category: "work",
    colorClass: "text-card-green",
    bgClass: "bg-card-green",
    hoverClass: "hover:bg-card-green-hover",
  },
  {
    id: "tools",
    title: "เครื่องมือสุ่ม",
    description: "เครื่องมือสุ่มข้อมูลต่างๆ",
    icon: <Wrench className="h-5 w-5" />,
    href: "/thai-names-generator",
    category: "tools",
    colorClass: "text-card-purple",
    bgClass: "bg-card-purple",
    hoverClass: "hover:bg-card-purple-hover",
  },
  {
    id: "help",
    title: "คำสั่งทั้งหมด",
    description: "ดูคำสั่ง LINE Bot",
    icon: <FileText className="h-5 w-5" />,
    href: "/help",
    category: "tools",
    colorClass: "text-primary",
    bgClass: "bg-card-orange",
    hoverClass: "hover:bg-card-orange-hover",
  },
  {
    id: "dca",
    title: "Auto DCA",
    description: "ประวัติคำสั่งซื้อ Bitcoin DCA",
    icon: <Bitcoin className="h-5 w-5" />,
    href: "/dca-history",
    category: "finance",
    colorClass: "text-primary",
    bgClass: "bg-secondary",
    hoverClass: "hover:bg-secondary/80",
  },
  {
    id: "expenses",
    title: "รายรับรายจ่าย",
    description: "บันทึกและดูสรุปรายรับรายจ่ายประจำเดือน",
    icon: <Wallet className="h-5 w-5" />,
    href: "/expenses",
    category: "finance",
    colorClass: "text-card-red",
    bgClass: "bg-card-red",
    hoverClass: "hover:bg-card-red-hover",
  },
];

const adminAction: ActionItem = {
  id: "line-approval",
  title: "LINE Approval",
  description: "จัดการคำขอใช้งาน LINE Messaging API",
  icon: <MessageSquare className="h-5 w-5" />,
  href: "/line-approval",
  category: "admin",
  colorClass: "text-destructive",
  bgClass: "bg-destructive/10",
  hoverClass: "hover:bg-destructive/20",
  badge: (
    <span className="bg-destructive/10 text-destructive ml-2 rounded-full px-2 py-0.5 text-xs font-semibold">
      Admin
    </span>
  ),
};

const categoryMeta: Record<
  string,
  { title: string; description: string; icon: React.ReactNode }
> = {
  finance: {
    title: "การเงิน",
    description: "รายรับรายจ่ายและการลงทุน",
    icon: <Wallet className="h-4 w-4" />,
  },
  work: {
    title: "งาน",
    description: "เวลาเข้างานและวันลา",
    icon: <Briefcase className="h-4 w-4" />,
  },
  tools: {
    title: "เครื่องมือ",
    description: "คำสั่งและเครื่องมือช่วยงาน",
    icon: <Wrench className="h-4 w-4" />,
  },
  admin: {
    title: "จัดการระบบ",
    description: "สิทธิ์และคำขอใช้งาน",
    icon: <Shield className="h-4 w-4" />,
  },
};

const categoryOrder = ["work", "finance", "tools", "admin"];

export function DashboardPage() {
  const { data: session } = useSession();
  const isAdmin = session?.isAdmin ?? false;
  const { needsApproval } = useLineApproval();

  if (!session) return null;

  const allActions = isAdmin ? [...actions, adminAction] : actions;
  const activeCategories = categoryOrder.filter((cat) =>
    allActions.some((a) => a.category === cat),
  );

  return (
    <>
      <PendingApprovalModal open={needsApproval} />

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <header className="mb-10">
          <div className="flex items-center gap-4">
            {session.user?.image && (
              <img
                src={session.user.image}
                alt=""
                width={48}
                height={48}
                className="ring-border h-12 w-12 shrink-0 rounded-full ring-2"
              />
            )}
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight">
                {session.user?.name}
              </h1>
              <p className="text-muted-foreground text-sm">
                {getDisplayIdentity(session.user)}
              </p>
            </div>
          </div>
        </header>

        <div className="space-y-10">
          {activeCategories.map((categoryId, categoryIndex) => {
            const meta = categoryMeta[categoryId]!;
            const categoryActions = allActions.filter(
              (a) => a.category === categoryId,
            );
            if (categoryActions.length === 0) return null;

            return (
              <section
                key={categoryId}
                className={`animate-section-enter stagger-${Math.min(categoryIndex + 1, 4)}`}
              >
                <div className="mb-4 flex items-center gap-2.5">
                  <div className="bg-muted text-muted-foreground flex h-8 w-8 items-center justify-center rounded-md">
                    {meta.icon}
                  </div>
                  <div>
                    <h2 className="text-base leading-tight font-semibold">
                      {meta.title}
                    </h2>
                    <p className="text-muted-foreground text-xs">
                      {meta.description}
                    </p>
                  </div>
                </div>

                <div
                  className={
                    categoryActions.length === 1
                      ? ""
                      : "grid gap-3 sm:grid-cols-2"
                  }
                >
                  {categoryActions.map((action) => (
                    <Link
                      key={action.id}
                      to={action.href}
                      className={`group bg-card relative flex items-center gap-4 rounded-xl border p-4 transition-[background-color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] ${action.hoverClass} hover:-translate-y-px hover:shadow-sm active:translate-y-0 active:shadow-none`}
                    >
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-105 ${action.bgClass}`}
                      >
                        <div className={action.colorClass}>{action.icon}</div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">
                            {action.title}
                          </span>
                          {"badge" in action && action.badge}
                        </div>
                        <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
                          {action.description}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 translate-x-0 opacity-0 transition-all duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:translate-x-0.5 group-hover:opacity-100" />
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </>
  );
}
