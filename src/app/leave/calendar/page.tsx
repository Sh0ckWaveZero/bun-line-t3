import LeaveCalendarClient from "./LeaveCalendarClient";
import "@/styles/calendar.css";

export default function LeaveCalendarPage() {
  return (
    <main className="m-0 flex max-h-screen min-h-screen w-screen flex-col items-center justify-center overflow-hidden p-0">
      <h1 className="py-6 text-2xl font-bold text-foreground">
        ปฏิทินการลา
      </h1>
      <div className="h-full w-full flex-1 overflow-hidden px-4 sm:px-6 lg:p-8">
        <LeaveCalendarClient />
      </div>
    </main>
  );
}
