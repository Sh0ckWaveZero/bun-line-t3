"use client";

import { useState, useEffect, useMemo } from "react";
import { useTheme } from "next-themes";
import { ScheduleXCalendar, useNextCalendarApp } from "@schedule-x/react";
import {
  createViewDay,
  createViewWeek,
  createViewMonthGrid,
  createViewMonthAgenda,
} from "@schedule-x/calendar";
import { createEventsServicePlugin } from "@schedule-x/events-service";
import { translations, mergeLocales } from "@schedule-x/translations";
import "@schedule-x/theme-default/dist/index.css";

export default function LeaveCalendarApp() {
  const { theme } = useTheme();
  console.log("🚀 ~ LeaveCalendarApp ~ theme:", theme);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const eventsService = useState(() => createEventsServicePlugin())[0];

  // เพิ่ม calendars config สำหรับสี event ตามหมวดหมู่
  const calendars = useMemo(
    () => ({
      personal: {
        colorName: "personal",
        lightColors: {
          main: "#f9d71c",
          container: "#fff5aa",
          onContainer: "#594800",
        },
        darkColors: {
          main: "#fff5c0",
          onContainer: "#fff5de",
          container: "#a29742",
        },
      },
      work: {
        colorName: "work",
        lightColors: {
          main: "#f91c45",
          container: "#ffd2dc",
          onContainer: "#59000d",
        },
        darkColors: {
          main: "#ffc0cc",
          onContainer: "#ffdee6",
          container: "#a24258",
        },
      },
      leisure: {
        colorName: "leisure",
        lightColors: {
          main: "#1cf9b0",
          container: "#dafff0",
          onContainer: "#004d3d",
        },
        darkColors: {
          main: "#c0fff5",
          onContainer: "#e6fff5",
          container: "#42a297",
        },
      },
      school: {
        colorName: "school",
        lightColors: {
          main: "#1c7df9",
          container: "#d2e7ff",
          onContainer: "#002859",
        },
        darkColors: {
          main: "#c0dfff",
          onContainer: "#dee6ff",
          container: "#426aa2",
        },
      },
    }),
    [],
  );

  // ดึงข้อมูลวันลาจาก API
  useEffect(() => {
    const fetchLeaves = async () => {
      setLoading(true);
      try {
        // หาวันที่ปัจจุบันเพื่อดึงข้อมูลเดือนนี้
        const now = new Date();
        const month = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}`;
        const res = await fetch(`/api/leave?month=${month}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.leaves)) {
          // แปลงข้อมูล leave เป็น event format ของ schedule-x ด้วย helper
          const formattedEvents = data.leaves.map(mapLeaveToEvent);
          console.log("📅 Formatted events:", formattedEvents);
          setEvents(formattedEvents);
        } else {
          console.log("❌ No leaves data or invalid format");
          setEvents([]);
        }
      } catch (error) {
        console.error("❌ Error fetching leaves:", error);
        setEvents([]);
      }
      setLoading(false);
    };
    fetchLeaves();
  }, []);

  // ใช้ useMemo เพื่อสร้าง views แบบ tuple ไม่ว่างเปล่า
  const views = useMemo(
    () =>
      [
        createViewDay(),
        createViewWeek(),
        createViewMonthGrid(),
        createViewMonthAgenda(),
      ] as [any, ...any[]],
    [],
  );

  // เพิ่ม useMemo สำหรับ thaiTranslations
  const thaiTranslations = useMemo(
    () => ({
      enUS: {
        // General
        Today: "วันนี้",
        Month: "เดือน",
        Week: "สัปดาห์",
        Day: "วัน",
        "No events": "ไม่มีรายการ",
        "All day": "ทั้งวัน",
        Previous: "ก่อนหน้า",
        Next: "ถัดไป",
        Loading: "กำลังโหลด...",

        // Weekday names
        Monday: "จันทร์",
        Tuesday: "อังคาร",
        Wednesday: "พุธ",
        Thursday: "พฤหัสบดี",
        Friday: "ศุกร์",
        Saturday: "เสาร์",
        Sunday: "อาทิตย์",

        // Abbreviated weekday names
        Mon: "จ",
        Tue: "อ",
        Wed: "พ",
        Thu: "พฤ",
        Fri: "ศ",
        Sat: "ส",
        Sun: "อา",
        MON: "จ.",
        TUE: "อ.",
        WED: "พ.",
        THU: "พฤ.",
        FRI: "ศ.",
        SAT: "ส.",
        SUN: "อา.",

        // 1-character weekday names for date picker
        M: "จ",
        T: "อ",
        W: "พ",
        "T short": "พฤ", // Thursday
        F: "ศ",
        S: "ส", // Saturday
        "S short": "อา", // Sunday

        // Month names
        January: "มกราคม",
        February: "กุมภาพันธ์",
        March: "มีนาคม",
        April: "เมษายน",
        May: "พฤษภาคม",
        June: "มิถุนายน",
        July: "กรกฎาคม",
        August: "สิงหาคม",
        September: "กันยายน",
        October: "ตุลาคม",
        November: "พฤศจิกายน",
        December: "ธันวาคม",
        JANUARY: "มกราคม",
        FEBRUARY: "กุมภาพันธ์",
        MARCH: "มีนาคม",
        APRIL: "เมษายน",
        MAY: "พฤษภาคม",
        JUNE: "มิถุนายน",
        JULY: "กรกฎาคม",
        AUGUST: "สิงหาคม",
        SEPTEMBER: "กันยายน",
        OCTOBER: "ตุลาคม",
        NOVEMBER: "พฤศจิกายน",
        DECEMBER: "ธันวาคม",

        // Abbreviated month names
        Jan: "ม.ค.",
        Feb: "ก.พ.",
        Mar: "มี.ค.",
        Apr: "เม.ย.",
        "May short": "พ.ค.",
        Jun: "มิ.ย.",
        Jul: "ก.ค.",
        Aug: "ส.ค.",
        Sep: "ก.ย.",
        Oct: "ต.ค.",
        Nov: "พ.ย.",
        Dec: "ธ.ค.",
        "Jan short": "ม.ค.",
        "Feb short": "ก.พ.",
        "Mar short": "มี.ค.",
        "Apr short": "เม.ย.",
        "May short2": "พ.ค.",
        "Jun short": "มิ.ย.",
        "Jul short": "ก.ค.",
        "Aug short": "ส.ค.",
        "Sep short": "ก.ย.",
        "Oct short": "ต.ค.",
        "Nov short": "พ.ย.",
        "Dec short": "ธ.ค.",

        // Date picker
        "Date picker": "ตัวเลือกวันที่",
        "Select date": "เลือกวันที่",
        OK: "ตกลง",
        Cancel: "ยกเลิก",
        Clear: "ล้าง",

        // Event modal
        "Add event": "เพิ่มกิจกรรม",
        "Edit event": "แก้ไขกิจกรรม",
        "Event details": "รายละเอียดกิจกรรม",
        "Event name": "ชื่อกิจกรรม",
        "Event date": "วันที่กิจกรรม",
        "Event time": "เวลากิจกรรม",
        "Event description": "รายละเอียดกิจกรรม",
        "Event location": "สถานที่กิจกรรม",
        "Event type": "ประเภทกิจกรรม",
        "Event color": "สีของกิจกรรม",
        "All day event": "กิจกรรมทั้งวัน",
        Description: "รายละเอียด",
        Time: "เวลา",
        Date: "วันที่",
        Start: "เริ่มต้น",
        End: "สิ้นสุด", // Note: This is for event start/end time
        Save: "บันทึก",
        Delete: "ลบ",
        Close: "ปิด",
        Event: "กิจกรรม",
        Events: "กิจกรรม",
        Add: "เพิ่ม",
        Remove: "ลบ",

        // Recurrence
        Repeat: "ทำซ้ำ",
        "Does not repeat": "ไม่ทำซ้ำ",
        "Repeat every": "ทำซ้ำทุก",
        day: "วัน",
        days: "วัน",
        week: "สัปดาห์",
        weeks: "สัปดาห์",
        month: "เดือน",
        months: "เดือน",
        year: "ปี",
        years: "ปี",
        every: "ทุกๆ",
        on: "ใน",
        "on the": "ใน",
        the: "", // Usually not needed in Thai
        first: "แรก",
        second: "ที่สอง",
        third: "ที่สาม",
        fourth: "ที่สี่",
        last: "สุดท้าย",
        for: "เป็นเวลา",
        in: "ใน",
        Ends: "สิ้นสุด", // Note: This is for recurrence ending
        Never: "ไม่สิ้นสุด",
        On: "ในวันที่",
        After: "หลังจาก",
        occurrences: "ครั้ง",
        Custom: "กำหนดเอง",
        Daily: "รายวัน",
        Weekly: "รายสัปดาห์",
        Monthly: "รายเดือน",
        Yearly: "รายปี",
        Summary: "สรุป",

        // Calendar views
        "Week agenda": "กำหนดการสัปดาห์",
        "Month agenda": "กำหนดการเดือน",
        "Select view": "เลือกมุมมอง",

        // Toolbar
        "Go to today": "ไปยังวันนี้",
        "Go to date": "ไปยังวันที่",
        "Show weekends": "แสดงวันหยุดสุดสัปดาห์",
        "Hide weekends": "ซ่อนวันหยุดสุดสัปดาห์",
        "Show week numbers": "แสดงเลขสัปดาห์",
        "Hide week numbers": "ซ่อนเลขสัปดาห์",
        "Show mini calendar": "แสดงปฏิทินย่อ",
        "Hide mini calendar": "ซ่อนปฏิทินย่อ",
      },
    }),
    [],
  );

  // สร้าง config calendar ด้วย useMemo
  const calendarConfig = useMemo(() => {
    const config = {
      views,
      events,
      calendars,
      plugins: [eventsService],
      isDark: theme === "dark",
      translations: mergeLocales(translations, thaiTranslations),
      language: "en-US",
      callbacks: {
        onRender: () => {
          console.log("🎨 Calendar rendered, events:", eventsService.getAll());
        },
      },
    };
    console.log("⚙️ Calendar config:", config);
    return config;
  }, [events, eventsService, views, calendars, theme, thaiTranslations]);

  // เรียก useNextCalendarApp ที่ top-level เท่านั้น
  const calendar = useNextCalendarApp(calendarConfig);

  // เพิ่ม effect เพื่อ sync events กับ eventsService
  useEffect(() => {
    if (events.length > 0) {
      console.log("🔄 Syncing events with eventsService:", events);
      // Clear existing events
      eventsService.getAll().forEach((event) => {
        eventsService.remove(event.id);
      });
      // Add new events
      events.forEach((event) => {
        eventsService.add(event);
      });
    }
  }, [events, eventsService]);

  // helper สำหรับแปลง leave เป็น event format ของ schedule-x
  const mapLeaveToEvent = (leave: any) => {
    // กำหนดเวลา 09:00-18:00 (8 ชั่วโมง) ในรูปแบบ 'YYYY-MM-DD HH:mm' ตามตัวอย่าง
    const startDateTime = `${leave.date} 09:00`;
    const endDateTime = `${leave.date} 18:00`;
    // กำหนดชื่อและ calendarId ตามประเภทการลา
    let title = "ขอลางาน";
    let calendarId = "work";
    if (leave.type === "sick") {
      title = "ลาป่วย";
      calendarId = "personal";
    } else if (leave.type === "vacation") {
      title = "ลาพักร้อน";
      calendarId = "leisure";
    } else if (leave.type === "school") {
      title = "ลากิจศึกษา";
      calendarId = "school";
    }
    return {
      id: leave.id,
      title,
      start: startDateTime,
      end: endDateTime,
      description: leave.reason || "",
      calendarId,
    };
  };

  return (
    <div className="flex h-full min-h-screen w-full flex-1 flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-border bg-card p-4 shadow-2xl transition-all duration-300 sm:p-6 md:p-8">
      {loading ? (
        <div className="animate-pulse py-8 text-center text-base text-muted-foreground sm:text-lg">
          กำลังโหลดข้อมูลวันลา...
        </div>
      ) : (
        <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-y-auto">
          <ScheduleXCalendar calendarApp={calendar} />
        </div>
      )}
    </div>
  );
}
