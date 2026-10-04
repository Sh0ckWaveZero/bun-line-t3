import {
  Activity,
  Bell,
  CalendarClock,
  CircleAlert,
  CircleCheck,
  Database,
  Search,
  ServerCog,
  Timer,
  type LucideIcon,
} from "lucide-react";
import type { TargetKind } from "@/features/cron-jobs/types";

export const TARGET_FILTER_OPTIONS: Array<{
  value: "all" | TargetKind;
  label: string;
}> = [
  { value: "all", label: "ทุกเป้าหมาย" },
  { value: "attendance", label: "Attendance" },
  { value: "webhook", label: "Webhook" },
  { value: "database", label: "ฐานข้อมูล" },
  { value: "search", label: "Search" },
  { value: "notifications", label: "Notifications" },
  { value: "payments", label: "Payments" },
  { value: "reports", label: "Reports" },
  { value: "storage", label: "Storage" },
  { value: "security", label: "Security" },
];

export const TARGET_ICONS: Record<TargetKind, LucideIcon> = {
  attendance: CalendarClock,
  webhook: Activity,
  database: Database,
  search: Search,
  notifications: Bell,
  payments: Timer,
  fraud: CircleAlert,
  reports: CalendarClock,
  storage: ServerCog,
  sync: Activity,
  security: CircleCheck,
};
