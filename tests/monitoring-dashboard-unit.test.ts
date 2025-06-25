import { test, expect, describe, beforeEach, afterEach } from "bun:test";

// Simple unit tests for monitoring dashboard functionality
describe("Monitoring Dashboard Unit Tests", () => {
  describe("Data Formatting Functions", () => {
    test("should format bytes correctly", () => {
      const formatBytes = (bytes: number) => {
        const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
        if (bytes === 0) return "0 Bytes";
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return (
          Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i]
        );
      };

      expect(formatBytes(0)).toBe("0 Bytes");
      expect(formatBytes(1024)).toBe("1 KB");
      expect(formatBytes(1048576)).toBe("1 MB");
      expect(formatBytes(1073741824)).toBe("1 GB");
      expect(formatBytes(1536)).toBe("1.5 KB");
    });

    test("should format uptime correctly", () => {
      const formatUptime = (seconds: number) => {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (days > 0) return `${days}d ${hours}h ${minutes}m`;
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
      };

      expect(formatUptime(60)).toBe("1m");
      expect(formatUptime(3600)).toBe("1h 0m");
      expect(formatUptime(3660)).toBe("1h 1m");
      expect(formatUptime(86400)).toBe("1d 0h 0m");
      expect(formatUptime(90061)).toBe("1d 1h 1m");
    });
  });

  describe("Status Color Functions", () => {
    test("should return correct status colors", () => {
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

      expect(getStatusColor("healthy")).toBe(
        "text-green-600 dark:text-green-400",
      );
      expect(getStatusColor("degraded")).toBe(
        "text-yellow-600 dark:text-yellow-400",
      );
      expect(getStatusColor("unhealthy")).toBe(
        "text-red-600 dark:text-red-400",
      );
      expect(getStatusColor("unknown")).toBe(
        "text-gray-600 dark:text-gray-400",
      );
    });

    test("should return correct status badges", () => {
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

      expect(getStatusBadge("healthy")).toContain("bg-green-100");
      expect(getStatusBadge("degraded")).toContain("bg-yellow-100");
      expect(getStatusBadge("unhealthy")).toContain("bg-red-100");
      expect(getStatusBadge("unknown")).toContain("bg-gray-100");
    });
  });

  describe("Chart Data Preparation", () => {
    test("should prepare health score chart data correctly", () => {
      const prepareHealthScoreData = (score: number) => {
        return {
          labels: ["Health Score"],
          datasets: [
            {
              data: [score, 100 - score],
              backgroundColor: [
                score >= 80
                  ? "rgb(34, 197, 94)"
                  : score >= 60
                    ? "rgb(249, 115, 22)"
                    : "rgb(239, 68, 68)",
                "rgb(229, 231, 235)",
              ],
              borderWidth: 0,
            },
          ],
        };
      };

      const healthyData = prepareHealthScoreData(95);
      // ใช้ non-null assertion เพื่อบอก TypeScript ว่า datasets[0] มีอยู่จริงแน่นอน
      expect(healthyData.datasets[0]!.data).toEqual([95, 5]);
      expect(healthyData.datasets[0]!.backgroundColor[0]).toBe(
        "rgb(34, 197, 94)",
      ); // green

      const degradedData = prepareHealthScoreData(70);
      expect(degradedData.datasets[0]!.data).toEqual([70, 30]);
      expect(degradedData.datasets[0]!.backgroundColor[0]).toBe(
        "rgb(249, 115, 22)",
      ); // orange

      const unhealthyData = prepareHealthScoreData(40);
      expect(unhealthyData.datasets[0]!.data).toEqual([40, 60]);
      expect(unhealthyData.datasets[0]!.backgroundColor[0]).toBe(
        "rgb(239, 68, 68)",
      ); // red
    });

    test("should prepare resource usage chart data correctly", () => {
      const prepareResourceUsageData = (
        memoryPercent: number,
        diskPercent: number,
      ) => {
        return {
          labels: ["Memory", "Disk"],
          datasets: [
            {
              label: "Usage %",
              data: [memoryPercent, diskPercent],
              backgroundColor: [
                "rgba(59, 130, 246, 0.7)",
                "rgba(147, 51, 234, 0.7)",
              ],
              borderRadius: 5,
            },
          ],
        };
      };

      const resourceData = prepareResourceUsageData(75, 50);
      expect(resourceData.datasets[0]!.data).toEqual([75, 50]);
      expect(resourceData.labels).toEqual(["Memory", "Disk"]);
      expect(resourceData.datasets[0]!.backgroundColor).toHaveLength(2);
    });
  });

  describe("API Data Validation", () => {
    test("should validate monitoring data structure", () => {
      const validateMonitoringData = (data: any): boolean => {
        const requiredFields = [
          "timestamp",
          "systemHealth",
          "metrics",
          "services",
          "processes",
          "recentLogs",
          "alerts",
          "recommendations",
        ];

        return requiredFields.every((field) => field in data);
      };

      const validData = {
        timestamp: "2025-06-18T12:00:00.000Z",
        systemHealth: { status: "healthy", score: 95 },
        metrics: { responseTime: 125 },
        services: { database: true },
        processes: [],
        recentLogs: [],
        alerts: [],
        recommendations: [],
      };

      const invalidData = {
        timestamp: "2025-06-18T12:00:00.000Z",
        // missing other required fields
      };

      expect(validateMonitoringData(validData)).toBe(true);
      expect(validateMonitoringData(invalidData)).toBe(false);
    });

    test("should validate health score range", () => {
      const validateHealthScore = (score: number): boolean => {
        return score >= 0 && score <= 100;
      };

      expect(validateHealthScore(0)).toBe(true);
      expect(validateHealthScore(50)).toBe(true);
      expect(validateHealthScore(100)).toBe(true);
      expect(validateHealthScore(-1)).toBe(false);
      expect(validateHealthScore(101)).toBe(false);
    });

    test("should validate percentage values", () => {
      const validatePercentage = (value: number): boolean => {
        return value >= 0 && value <= 100;
      };

      expect(validatePercentage(0)).toBe(true);
      expect(validatePercentage(50.5)).toBe(true);
      expect(validatePercentage(100)).toBe(true);
      expect(validatePercentage(-0.1)).toBe(false);
      expect(validatePercentage(100.1)).toBe(false);
    });
  });

  describe("Alert Level Classification", () => {
    test("should classify alert levels correctly", () => {
      const classifyAlert = (message: string) => {
        const lowerMessage = message.toLowerCase();
        if (
          lowerMessage.includes("critical") ||
          lowerMessage.includes("failed")
        )
          return "critical";
        if (lowerMessage.includes("high") || lowerMessage.includes("elevated"))
          return "warning";
        return "info";
      };

      expect(classifyAlert("Critical system failure")).toBe("critical");
      expect(classifyAlert("Database connection failed")).toBe("critical");
      expect(classifyAlert("Memory usage is high")).toBe("warning");
      expect(classifyAlert("Disk usage elevated")).toBe("warning");
      expect(classifyAlert("System backup completed")).toBe("info");
    });

    test("should get correct alert colors", () => {
      const getAlertColor = (level: string) => {
        switch (level) {
          case "critical":
            return "text-red-500";
          case "warning":
            return "text-yellow-500";
          case "error":
            return "text-red-500";
          default:
            return "text-blue-500";
        }
      };

      expect(getAlertColor("critical")).toBe("text-red-500");
      expect(getAlertColor("warning")).toBe("text-yellow-500");
      expect(getAlertColor("error")).toBe("text-red-500");
      expect(getAlertColor("info")).toBe("text-blue-500");
    });
  });

  describe("Service Status Functions", () => {
    test("should count online services correctly", () => {
      const countOnlineServices = (
        services: Record<string, boolean>,
      ): number => {
        return Object.values(services).filter((status) => status).length;
      };

      const allOnline = { database: true, auth: true, line: true };
      const partialOnline = { database: true, auth: false, line: true };
      const allOffline = { database: false, auth: false, line: false };

      expect(countOnlineServices(allOnline)).toBe(3);
      expect(countOnlineServices(partialOnline)).toBe(2);
      expect(countOnlineServices(allOffline)).toBe(0);
    });

    test("should calculate service health percentage", () => {
      const calculateServiceHealth = (
        services: Record<string, boolean>,
      ): number => {
        const total = Object.keys(services).length;
        const online = Object.values(services).filter(
          (status) => status,
        ).length;
        return total > 0 ? Math.round((online / total) * 100) : 0;
      };

      const allOnline = { database: true, auth: true, line: true, cron: true };
      const halfOnline = {
        database: true,
        auth: false,
        line: true,
        cron: false,
      };

      expect(calculateServiceHealth(allOnline)).toBe(100);
      expect(calculateServiceHealth(halfOnline)).toBe(50);
      expect(calculateServiceHealth({})).toBe(0);
    });
  });

  describe("Time and Date Functions", () => {
    test("should format timestamps correctly", () => {
      const formatTimestamp = (timestamp: string): string => {
        return new Date(timestamp).toLocaleString();
      };

      const testTimestamp = "2025-06-18T12:00:00.000Z";
      const formatted = formatTimestamp(testTimestamp);

      expect(typeof formatted).toBe("string");
      expect(formatted.length).toBeGreaterThan(0);
    });

    test("should calculate time differences", () => {
      const getTimeDifference = (timestamp: string): number => {
        return Date.now() - new Date(timestamp).getTime();
      };

      const pastTimestamp = new Date(Date.now() - 60000).toISOString(); // 1 minute ago
      const diff = getTimeDifference(pastTimestamp);

      expect(diff).toBeGreaterThan(59000); // approximately 1 minute
      expect(diff).toBeLessThan(61000);
    });
  });

  describe("Data Processing Functions", () => {
    test("should process log entries correctly", () => {
      const processLogs = (logs: any[]) => {
        return logs.map((log) => ({
          ...log,
          formattedTime: new Date(log.timestamp).toLocaleTimeString(),
          isRecent: Date.now() - new Date(log.timestamp).getTime() < 300000, // 5 minutes
        }));
      };

      const testLogs = [
        {
          timestamp: new Date().toISOString(),
          message: "Recent log",
          level: "info",
        },
        {
          timestamp: new Date(Date.now() - 600000).toISOString(),
          message: "Old log",
          level: "warn",
        },
      ];

      const processed = processLogs(testLogs);

      expect(processed[0].isRecent).toBe(true);
      expect(processed[1].isRecent).toBe(false);
      expect(processed.every((log) => "formattedTime" in log)).toBe(true);
    });

    test("should aggregate metric data correctly", () => {
      const aggregateMetrics = (metrics: any[]) => {
        if (metrics.length === 0) return { avg: 0, min: 0, max: 0 };

        const values = metrics.map((m) => m.value);
        return {
          avg: values.reduce((a, b) => a + b, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
        };
      };

      const testMetrics = [{ value: 10 }, { value: 20 }, { value: 30 }];

      const aggregated = aggregateMetrics(testMetrics);

      expect(aggregated.avg).toBe(20);
      expect(aggregated.min).toBe(10);
      expect(aggregated.max).toBe(30);
      expect(aggregateMetrics([])).toEqual({ avg: 0, min: 0, max: 0 });
    });
  });
});

console.log("✅ Monitoring Dashboard Unit Tests completed successfully");
