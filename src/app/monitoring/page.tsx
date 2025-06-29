"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
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
import {
  AuthLoadingScreen,
  LoginPrompt,
  LoadingSpinner,
} from "@/components/attendance";
import { useChartTheme } from "@/hooks/useChartTheme";

// Register Chart.js components
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

export default function MonitoringDashboardPage() {
  const { data: session, status } = useSession();
  const [monitoringData, setMonitoringData] = useState<MonitoringData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { mounted, getChartOptions, getDoughnutOptions } = useChartTheme();

  // Fetch monitoring data
  const fetchMonitoringData = async () => {
    try {
      const response = await fetch("/api/monitoring/dashboard");
      if (!response.ok) {
        throw new Error("Failed to fetch monitoring data");
      }
      const data = await response.json();
      setMonitoringData(data);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    fetchMonitoringData();

    if (autoRefresh) {
      const interval = setInterval(fetchMonitoringData, 30000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Loading states
  if (status === "loading") return <AuthLoadingScreen />;
  if (!session) return <LoginPrompt />;
  if (!mounted) return <LoadingSpinner message="กำลังโหลด Dashboard..." />;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-green-600 dark:text-green-400";
      case "degraded":
        return "text-yellow-600 dark:text-yellow-400";
      case "unhealthy":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      case "degraded":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300";
      case "unhealthy":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Prepare chart data
  const prepareHealthScoreData = () => {
    if (!monitoringData) return { labels: [], datasets: [] };

    return {
      labels: ["Health Score"],
      datasets: [
        {
          data: [
            monitoringData.systemHealth.score,
            100 - monitoringData.systemHealth.score,
          ],
          backgroundColor: [
            monitoringData.systemHealth.score >= 80
              ? "rgb(34, 197, 94)"
              : monitoringData.systemHealth.score >= 60
                ? "rgb(249, 115, 22)"
                : "rgb(239, 68, 68)",
            "rgb(229, 231, 235)",
          ],
          borderWidth: 0,
        },
      ],
    };
  };

  const prepareResourceUsageData = () => {
    if (!monitoringData) return { labels: [], datasets: [] };

    return {
      labels: ["Memory", "Disk"],
      datasets: [
        {
          label: "Usage %",
          data: [
            monitoringData.metrics.memoryUsage.percentage,
            monitoringData.metrics.diskUsage.percentage,
          ],
          backgroundColor: [
            "rgba(59, 130, 246, 0.7)",
            "rgba(147, 51, 234, 0.7)",
          ],
          borderRadius: 5,
        },
      ],
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <LoadingSpinner message="กำลังโหลดข้อมูลการตรวจสอบ..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                📊 System Monitoring Dashboard
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                Real-time system health and performance monitoring
              </p>
            </div>
            <div className="flex items-center gap-4">
              {lastUpdate && (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  <Clock className="mr-1 inline h-4 w-4" />
                  Last updated: {lastUpdate.toLocaleTimeString()}
                </div>
              )}
              <button
                onClick={fetchMonitoringData}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                title="Refresh data"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded"
                />
                Auto-refresh
              </label>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-700 dark:bg-red-900/20">
            <div className="flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5 text-red-500" />
              <span className="text-red-700 dark:text-red-300">
                Error: {error}
              </span>
            </div>
          </div>
        )}

        {monitoringData && (
          <>
            {/* System Health Overview */}
            <div className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                System Health Overview
              </h2>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                {/* Health Status */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow dark:border-gray-700 dark:bg-gray-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        System Status
                      </p>
                      <p
                        className={`text-2xl font-bold ${getStatusColor(monitoringData.systemHealth.status)}`}
                      >
                        {monitoringData.systemHealth.status.toUpperCase()}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Score: {monitoringData.systemHealth.score}/100
                      </p>
                    </div>
                    <Activity
                      className={`h-8 w-8 ${getStatusColor(monitoringData.systemHealth.status)}`}
                    />
                  </div>
                  <div className="mt-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadge(monitoringData.systemHealth.status)}`}
                    >
                      {monitoringData.systemHealth.status}
                    </span>
                  </div>
                </div>

                {/* Uptime */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow dark:border-gray-700 dark:bg-gray-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        System Uptime
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {formatUptime(monitoringData.systemHealth.uptime)}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Since last restart
                      </p>
                    </div>
                    <Clock className="h-8 w-8 text-blue-500" />
                  </div>
                </div>

                {/* Response Time */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow dark:border-gray-700 dark:bg-gray-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Response Time
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {monitoringData.metrics.responseTime}ms
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        API response time
                      </p>
                    </div>
                    <Zap className="h-8 w-8 text-yellow-500" />
                  </div>
                </div>

                {/* Active Users */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow dark:border-gray-700 dark:bg-gray-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Active Users
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {monitoringData.metrics.activeUsers}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Registered users
                      </p>
                    </div>
                    <Users className="h-8 w-8 text-green-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
              {/* Health Score Chart */}
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow dark:border-gray-700 dark:bg-gray-800">
                <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Health Score
                </h3>
                <div className="flex h-64 items-center justify-center">
                  <div style={{ width: "250px", height: "250px" }}>
                    <Doughnut
                      data={prepareHealthScoreData()}
                      options={getDoughnutOptions({
                        plugins: {
                          legend: { display: false },
                        },
                      })}
                    />
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {monitoringData.systemHealth.score}%
                  </span>
                </div>
              </div>

              {/* Resource Usage Chart */}
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow dark:border-gray-700 dark:bg-gray-800">
                <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Resource Usage
                </h3>
                <div className="h-64">
                  <Bar
                    data={prepareResourceUsageData()}
                    options={getChartOptions({
                      plugins: {
                        legend: { display: false },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          max: 100,
                        },
                      },
                    })}
                  />
                </div>
              </div>
            </div>

            {/* Services Status */}
            <div className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
                Services Status
              </h2>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
                {Object.entries(monitoringData.services).map(
                  ([service, status]) => (
                    <div
                      key={service}
                      className="rounded-lg border border-gray-200 bg-white p-4 shadow dark:border-gray-700 dark:bg-gray-800"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium capitalize text-gray-900 dark:text-gray-100">
                            {service.replace(/([A-Z])/g, " $1").trim()}
                          </p>
                          <div className="mt-1 flex items-center">
                            <div
                              className={`mr-2 h-2 w-2 rounded-full ${status ? "bg-green-500" : "bg-red-500"}`}
                            />
                            <span
                              className={`text-sm ${status ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                            >
                              {status ? "Online" : "Offline"}
                            </span>
                          </div>
                        </div>
                        {service === "database" && (
                          <Database className="h-5 w-5 text-gray-400" />
                        )}
                        {service === "authentication" && (
                          <Shield className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>

            {/* Alerts */}
            {monitoringData.alerts.length > 0 && (
              <div className="mb-8">
                <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Active Alerts
                </h2>
                <div className="space-y-3">
                  {monitoringData.alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`rounded-lg border p-4 ${
                        alert.level === "critical"
                          ? "border-red-200 bg-red-50 dark:border-red-700 dark:bg-red-900/20"
                          : alert.level === "warning"
                            ? "border-yellow-200 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-900/20"
                            : "border-blue-200 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start">
                          <AlertTriangle
                            className={`mr-3 mt-0.5 h-5 w-5 ${
                              alert.level === "critical"
                                ? "text-red-500"
                                : alert.level === "warning"
                                  ? "text-yellow-500"
                                  : "text-blue-500"
                            }`}
                          />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {alert.message}
                            </p>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                              {new Date(alert.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            alert.level === "critical"
                              ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
                              : alert.level === "warning"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300"
                                : "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
                          }`}
                        >
                          {alert.level}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Logs */}
            <div className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
                Recent Activity
              </h2>
              <div className="rounded-lg border border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-800">
                <div className="max-h-64 overflow-y-auto">
                  {monitoringData.recentLogs.map((log, index) => (
                    <div
                      key={index}
                      className="border-b border-gray-200 p-4 last:border-b-0 dark:border-gray-700"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start">
                          <span
                            className={`mr-3 mt-2 inline-block h-2 w-2 rounded-full ${
                              log.level === "error"
                                ? "bg-red-500"
                                : log.level === "warn"
                                  ? "bg-yellow-500"
                                  : log.level === "info"
                                    ? "bg-blue-500"
                                    : "bg-gray-500"
                            }`}
                          />
                          <div>
                            <p className="text-sm text-gray-900 dark:text-gray-100">
                              {log.message}
                            </p>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              {log.source} •{" "}
                              {new Date(log.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`inline-flex items-center rounded px-2 py-1 text-xs font-medium ${
                            log.level === "error"
                              ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
                              : log.level === "warn"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300"
                                : log.level === "info"
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
                                  : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300"
                          }`}
                        >
                          {log.level}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recommendations */}
            {monitoringData.recommendations.length > 0 && (
              <div className="mb-8">
                <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Recommendations
                </h2>
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-6 dark:border-blue-700 dark:bg-blue-900/20">
                  <ul className="space-y-2">
                    {monitoringData.recommendations.map(
                      (recommendation, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2 text-blue-500">•</span>
                          <span className="text-blue-800 dark:text-blue-300">
                            {recommendation}
                          </span>
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
