"use client";

import React, { useState, useEffect, useCallback, memo, useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";
import {
  AlertTriangle,
  Activity,
  Database,
  Shield,
  Zap,
  RefreshCw,
  Clock,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useChartTheme } from "@/hooks/useChartTheme";
import { PendingApprovalModal } from "@/components/auth/PendingApprovalModal";
import { useLineApproval } from "@/lib/auth/hooks/useLineApproval";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
);

interface MonitoringData {
  timestamp: string;
  systemHealth: {
    status: "healthy" | "degraded" | "unhealthy";
    score: number;
    uptime: number;
    lastCheck: string;
  };
  metrics: {
    responseTime: number;
    memoryUsage: {
      used: number;
      total: number;
      percentage: number;
    };
    diskUsage: {
      used: number;
      total: number;
      percentage: number;
    };
    databaseConnections: number;
    activeUsers: number;
    requestsPerMinute: number;
  };
  services: {
    database: boolean;
    authentication: boolean;
    lineIntegration: boolean;
    cronJobs: boolean;
    rateLimit: boolean;
  };
  processes: Array<{
    name: string;
    status: "running" | "stopped" | "unknown";
    pid?: number;
    memoryUsage?: number;
    cpuUsage?: number;
  }>;
  recentLogs: Array<{
    timestamp: string;
    level: "info" | "warn" | "error" | "debug";
    message: string;
    source: string;
  }>;
  alerts: Array<{
    id: string;
    level: "info" | "warning" | "error" | "critical";
    message: string;
    timestamp: string;
    acknowledged: boolean;
  }>;
  recommendations: string[];
}

const STATUS_MAP = {
  healthy: {
    label: "ปกติ",
    color: "text-emerald-600 dark:text-emerald-400",
    badge:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  },
  degraded: {
    label: "บางส่วน",
    color: "text-amber-600 dark:text-amber-400",
    badge:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  },
  unhealthy: {
    label: "มีปัญหา",
    color: "text-red-600 dark:text-red-400",
    badge: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  },
} as const;

const SERVICE_LABELS: Record<string, string> = {
  database: "ฐานข้อมูล",
  authentication: "การยืนยันตัวตน",
  lineIntegration: "LINE",
  cronJobs: "Cron Jobs",
  rateLimit: "Rate Limit",
};

const SERVICE_ICONS: Record<string, React.ElementType> = {
  database: Database,
  authentication: Shield,
};

const ALERT_LEVEL_MAP = {
  critical: {
    label: "วิกฤต",
    classes: "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30",
    iconClass: "text-red-500",
  },
  error: {
    label: "ผิดพลาด",
    classes: "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30",
    iconClass: "text-red-500",
  },
  warning: {
    label: "เตือน",
    classes:
      "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30",
    iconClass: "text-amber-500",
  },
  info: {
    label: "แจ้งเตือน",
    classes:
      "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30",
    iconClass: "text-blue-500",
  },
} as const;

const LOG_LEVEL_MAP = {
  error: {
    dotClass: "bg-red-500",
    badgeClass: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  },
  warn: {
    dotClass: "bg-amber-500",
    badgeClass:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  },
  info: {
    dotClass: "bg-blue-500",
    badgeClass:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  },
  debug: {
    dotClass: "bg-muted-foreground/40",
    badgeClass: "bg-muted text-muted-foreground",
  },
} as const;

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}วัน ${hours}ชม.`;
  if (hours > 0) return `${hours}ชม. ${minutes}นาที`;
  return `${minutes}นาที`;
}

const OverviewCard = memo(function OverviewCard({
  label,
  value,
  sub,
  icon: Icon,
  iconClass,
  badge,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  iconClass?: string;
  badge?: React.ReactNode;
}) {
  return (
    <div className="bg-card rounded-xl border p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs font-medium">{label}</p>
          <p className="text-foreground font-mono text-xl font-semibold">
            {value}
          </p>
          {sub && <p className="text-muted-foreground text-xs">{sub}</p>}
        </div>
        <Icon
          className={cn(
            "h-5 w-5 shrink-0",
            iconClass ?? "text-muted-foreground",
          )}
        />
      </div>
      {badge && <div className="mt-3">{badge}</div>}
    </div>
  );
});

const HealthScoreChart = memo(function HealthScoreChart({
  score,
  getDoughnutOptions,
}: {
  score: number;
  getDoughnutOptions: (base?: any) => any;
}) {
  const data = useMemo(
    () => ({
      labels: ["Health Score"],
      datasets: [
        {
          data: [score, 100 - score],
          backgroundColor: [
            score >= 80
              ? "rgb(16, 185, 129)"
              : score >= 60
                ? "rgb(245, 158, 11)"
                : "rgb(239, 68, 68)",
            "rgb(229, 231, 235)",
          ],
          borderWidth: 0,
        },
      ],
    }),
    [score],
  );

  return (
    <div className="bg-card rounded-xl border p-5">
      <h3 className="text-muted-foreground mb-3 text-sm font-medium">
        คะแนนสุขภาพระบบ
      </h3>
      <div className="flex h-48 items-center justify-center">
        <div className="h-48 w-48">
          <Doughnut
            data={data}
            options={getDoughnutOptions({
              plugins: { legend: { display: false } },
            })}
          />
        </div>
      </div>
      <p className="text-foreground mt-2 text-center font-mono text-2xl font-bold">
        {score}%
      </p>
    </div>
  );
});

const ResourceChart = memo(function ResourceChart({
  memory,
  disk,
  getChartOptions,
}: {
  memory: number;
  disk: number;
  getChartOptions: (base?: any) => any;
}) {
  const data = useMemo(
    () => ({
      labels: ["หน่วยความจำ", "ดิสก์"],
      datasets: [
        {
          label: "การใช้งาน %",
          data: [memory, disk],
          backgroundColor: [
            "rgba(14, 165, 233, 0.7)",
            "rgba(124, 58, 237, 0.7)",
          ],
          borderRadius: 5,
        },
      ],
    }),
    [memory, disk],
  );

  return (
    <div className="bg-card rounded-xl border p-5">
      <h3 className="text-muted-foreground mb-3 text-sm font-medium">
        การใช้ทรัพยากร
      </h3>
      <div className="h-56">
        <Bar
          data={data}
          options={getChartOptions({
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, max: 100 } },
          })}
        />
      </div>
    </div>
  );
});

const ServicesGrid = memo(function ServicesGrid({
  services,
}: {
  services: MonitoringData["services"];
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {Object.entries(services).map(([key, online]) => {
        const Icon = SERVICE_ICONS[key];
        return (
          <div
            key={key}
            className="bg-card flex items-center gap-2.5 rounded-xl border px-3.5 py-3"
          >
            {Icon && <Icon className="text-muted-foreground h-4 w-4" />}
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                online ? "bg-emerald-500" : "bg-red-500",
              )}
            />
            <span className="text-foreground text-xs font-medium">
              {SERVICE_LABELS[key] ?? key}
            </span>
          </div>
        );
      })}
    </div>
  );
});

const AlertsList = memo(function AlertsList({
  alerts,
}: {
  alerts: MonitoringData["alerts"];
}) {
  return (
    <div className="space-y-2">
      {alerts.map((alert) => {
        const cfg = ALERT_LEVEL_MAP[alert.level] ?? ALERT_LEVEL_MAP.info;
        return (
          <div
            key={alert.id}
            className={cn(
              "flex items-start gap-3 rounded-xl border p-3.5",
              cfg.classes,
            )}
          >
            <AlertTriangle
              className={cn("mt-0.5 h-4 w-4 shrink-0", cfg.iconClass)}
            />
            <div className="min-w-0 flex-1">
              <p className="text-foreground text-sm font-medium">
                {alert.message}
              </p>
              <p className="text-muted-foreground mt-0.5 text-xs">
                {new Date(alert.timestamp).toLocaleString("th-TH")}
              </p>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
                cfg.classes.includes("amber")
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                  : cfg.classes.includes("red")
                    ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                    : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
              )}
            >
              {cfg.label}
            </span>
          </div>
        );
      })}
    </div>
  );
});

const LogTable = memo(function LogTable({
  logs,
}: {
  logs: MonitoringData["recentLogs"];
}) {
  return (
    <div className="max-h-64 overflow-y-auto rounded-xl border">
      {logs.map((log, i) => {
        const cfg = LOG_LEVEL_MAP[log.level] ?? LOG_LEVEL_MAP.debug;
        return (
          <div
            key={i}
            className="bg-card flex items-start gap-3 border-b px-4 py-3 last:border-b-0"
          >
            <span
              className={cn(
                "mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full",
                cfg.dotClass,
              )}
            />
            <div className="min-w-0 flex-1">
              <p className="text-foreground text-sm">{log.message}</p>
              <p className="text-muted-foreground mt-0.5 text-xs">
                {log.source} · {new Date(log.timestamp).toLocaleString("th-TH")}
              </p>
            </div>
            <span
              className={cn(
                "shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px]",
                cfg.badgeClass,
              )}
            >
              {log.level}
            </span>
          </div>
        );
      })}
    </div>
  );
});

export function MonitoringDashboardPage() {
  const [monitoringData, setMonitoringData] = useState<MonitoringData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { mounted, getChartOptions, getDoughnutOptions } = useChartTheme();
  const { needsApproval } = useLineApproval();

  const fetchMonitoringData = useCallback(async () => {
    try {
      const response = await fetch("/api/monitoring/dashboard");
      if (!response.ok) throw new Error("ไม่สามารถโหลดข้อมูลได้");
      const data = await response.json();
      setMonitoringData(data);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMonitoringData();
    if (autoRefresh) {
      const interval = setInterval(fetchMonitoringData, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, fetchMonitoringData]);

  if (!mounted || loading) {
    return (
      <>
        <PendingApprovalModal open={needsApproval} />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="border-muted border-t-primary h-6 w-6 animate-spin rounded-full border-2" />
            <p className="text-muted-foreground text-sm">
              กำลังโหลดข้อมูลระบบ...
            </p>
          </div>
        </div>
      </>
    );
  }

  const statusCfg = monitoringData
    ? (STATUS_MAP[monitoringData.systemHealth.status] ?? STATUS_MAP.healthy)
    : STATUS_MAP.healthy;

  return (
    <>
      <PendingApprovalModal open={needsApproval} />

      <div className="mx-auto min-h-screen w-full max-w-6xl px-4 py-6 sm:px-6">
        <header className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-foreground text-lg font-semibold">
                ตรวจสอบระบบ
              </h1>
              <p className="text-muted-foreground mt-0.5 text-sm">
                สถานะและประสิทธิภาพของระบบแบบเรียลไทม์
              </p>
            </div>
            <div className="flex items-center gap-3">
              {lastUpdate && (
                <span className="text-muted-foreground hidden text-xs sm:inline">
                  {lastUpdate.toLocaleTimeString("th-TH")}
                </span>
              )}
              <button
                onClick={fetchMonitoringData}
                className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-md p-1.5 transition-colors"
                aria-label="รีเฟรชข้อมูล"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              <label className="text-muted-foreground flex cursor-pointer items-center gap-1.5 text-xs">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded"
                />
                <span>รีเฟรชอัตโนมัติ</span>
              </label>
            </div>
          </div>
        </header>

        {error && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/30">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
            <span className="text-sm text-red-700 dark:text-red-300">
              {error}
            </span>
          </div>
        )}

        {monitoringData && (
          <div className="space-y-6">
            <section>
              <h2 className="text-muted-foreground mb-3 text-sm font-semibold tracking-wide uppercase">
                ภาพรวม
              </h2>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <OverviewCard
                  label="สถานะระบบ"
                  value={statusCfg.label}
                  sub={`คะแนน ${monitoringData.systemHealth.score}/100`}
                  icon={Activity}
                  iconClass={statusCfg.color}
                  badge={
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
                        statusCfg.badge,
                      )}
                    >
                      {monitoringData.systemHealth.status}
                    </span>
                  }
                />
                <OverviewCard
                  label="ระยะเวลาทำงาน"
                  value={formatUptime(monitoringData.systemHealth.uptime)}
                  sub="นับจากรีสตาร์ทล่าสุด"
                  icon={Clock}
                  iconClass="text-ocean-500"
                />
                <OverviewCard
                  label="เวลาตอบสนอง"
                  value={`${monitoringData.metrics.responseTime}ms`}
                  sub="API response time"
                  icon={Zap}
                  iconClass="text-amber-500"
                />
                <OverviewCard
                  label="ผู้ใช้งาน"
                  value={`${monitoringData.metrics.activeUsers}`}
                  sub="ผู้ใช้ที่ลงทะเบียน"
                  icon={Users}
                  iconClass="text-emerald-500"
                />
              </div>
            </section>

            <section>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <HealthScoreChart
                  score={monitoringData.systemHealth.score}
                  getDoughnutOptions={getDoughnutOptions}
                />
                <ResourceChart
                  memory={monitoringData.metrics.memoryUsage.percentage}
                  disk={monitoringData.metrics.diskUsage.percentage}
                  getChartOptions={getChartOptions}
                />
              </div>
            </section>

            <section>
              <h2 className="text-muted-foreground mb-3 text-sm font-semibold tracking-wide uppercase">
                บริการ
              </h2>
              <ServicesGrid services={monitoringData.services} />
            </section>

            {monitoringData.alerts.length > 0 && (
              <section>
                <h2 className="text-muted-foreground mb-3 text-sm font-semibold tracking-wide uppercase">
                  แจ้งเตือน ({monitoringData.alerts.length})
                </h2>
                <AlertsList alerts={monitoringData.alerts} />
              </section>
            )}

            <section>
              <h2 className="text-muted-foreground mb-3 text-sm font-semibold tracking-wide uppercase">
                บันทึกล่าสุด
              </h2>
              <LogTable logs={monitoringData.recentLogs} />
            </section>

            {monitoringData.recommendations.length > 0 && (
              <section>
                <h2 className="text-muted-foreground mb-3 text-sm font-semibold tracking-wide uppercase">
                  ข้อเสนอแนะ
                </h2>
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-800 dark:bg-blue-950/30">
                  <ul className="space-y-1.5">
                    {monitoringData.recommendations.map((rec, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-blue-800 dark:text-blue-300"
                      >
                        <span className="mt-0.5 text-blue-500">·</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </>
  );
}
