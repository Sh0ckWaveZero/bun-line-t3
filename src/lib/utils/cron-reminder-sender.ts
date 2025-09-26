import { env } from "@/env.mjs";
import { attendanceService } from "@/features/attendance/services/attendance";
import { getCheckInMessage } from "@/lib/constants/checkin-reminder-messages";
import { sendPushMessage } from "@/lib/utils/line-push";

interface ReminderResult {
  success: boolean;
  sentCount: number;
  failedCount: number;
  messageText: string;
  totalUsers: number;
}

/**
 * Sends check-in reminder messages to active LINE users
 * @param todayString Date string in YYYY-MM-DD format (Bangkok timezone)
 * @returns ReminderResult with sending statistics
 */
export async function sendCheckInReminders(
  todayString: string,
): Promise<ReminderResult> {
  // Get active LINE user IDs for today
  const lineUserIds =
    await attendanceService.getActiveLineUserIdsForCheckinReminder(todayString);

  if (lineUserIds.length === 0) {
    console.log(
      "📭 ไม่มี LINE userId สำหรับแจ้งเตือน (อาจมีคนลาทั้งหมดหรือไม่มี LINE ID ที่ active)",
    );
    return {
      success: false,
      sentCount: 0,
      failedCount: 0,
      messageText: "",
      totalUsers: 0,
    };
  }

  console.log(`📢 พบ ${lineUserIds.length} คนที่ต้องส่งแจ้งเตือน`);

  // Get check-in message (AI or fallback)
  const currentHour = new Date().getHours();
  const timeOfDay =
    currentHour < 12 ? "morning" : currentHour < 17 ? "afternoon" : "evening";
  const dayOfWeek = new Intl.DateTimeFormat("th-TH", {
    weekday: "long",
  }).format(new Date());

  const reminderMessage = await getCheckInMessage({
    useAI: env.OPENAI_API_KEY ? true : false, // Use AI if API key is available
    context: {
      timeOfDay,
      dayOfWeek,
      weather: "สดใส", // Default weather, could be enhanced with weather API
    },
  });

  const messages = createReminderMessages(reminderMessage);

  // Send push messages to all users
  let pushSuccess = 0;
  let pushFail = 0;

  for (const lineId of lineUserIds) {
    try {
      await sendPushMessage(lineId, messages);
      pushSuccess++;
    } catch (error) {
      pushFail++;
      console.error(
        `❌ ส่ง push แจ้งเตือนให้ LINE userId ${lineId} ไม่สำเร็จ`,
        error,
      );
    }
  }

  console.log(
    `✅ ส่ง push แจ้งเตือนเช็คอินสำเร็จ ${pushSuccess} คน, ล้มเหลว ${pushFail} คน`,
  );
  console.log(`📝 ข้อความที่ส่ง: "${reminderMessage}"`);

  return {
    success: pushSuccess > 0,
    sentCount: pushSuccess,
    failedCount: pushFail,
    messageText: reminderMessage,
    totalUsers: lineUserIds.length,
  };
}

/**
 * Creates LINE message array for check-in reminders
 * @param messageText Random reminder message text
 * @returns Array of LINE message objects
 */
function createReminderMessages(messageText: string) {
  return [
    {
      type: "text",
      text: messageText,
    },
    {
      type: "template",
      altText: "ลงชื่อเข้างาน",
      template: {
        type: "buttons",
        text: "กดปุ่มด้านล่างเพื่อลงชื่อเข้างานได้เลย 👇🏼",
        actions: [
          {
            type: "postback",
            label: "🏢 ลงชื่อเข้างาน",
            data: "action=checkin",
          },
        ],
      },
    },
  ];
}
