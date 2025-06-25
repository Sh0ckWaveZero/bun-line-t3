"use client";
import dynamic from "next/dynamic";

const LeaveCalendarApp = dynamic(
  () => import("@/components/attendance/LeaveCalendarApp"),
  { ssr: false },
);

export default function LeaveCalendarClient() {
  return <LeaveCalendarApp />;
}
