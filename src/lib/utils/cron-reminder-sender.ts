import { env } from "@/env.mjs";
import { attendanceService } from "@/features/attendance/services/attendance.server";
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
  const lineUserIds =
    await attendanceService.getActiveLineUserIdsForCheckinReminder(todayString);

  if (lineUserIds.length === 0) {
    return {
      success: false,
      sentCount: 0,
      failedCount: 0,
      messageText: "",
      totalUsers: 0,
    };
  }

  const currentBangkokHour = parseInt(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Bangkok",
      hour: "numeric",
      hour12: false,
    }).format(new Date()),
    10,
  );
  const timeOfDay =
    currentBangkokHour < 12
      ? "morning"
      : currentBangkokHour < 17
        ? "afternoon"
        : "evening";
  const dayOfWeek = new Intl.DateTimeFormat("th-TH", {
    weekday: "long",
  }).format(new Date());

  const reminderMessage = await getCheckInMessage({
    useAI: env.OPENAI_API_KEY ? true : false,
    context: {
      timeOfDay,
      dayOfWeek,
      weather: "สดใส",
    },
  });

  const messages = createReminderMessages(reminderMessage);

  let pushSuccess = 0;
  let pushFail = 0;

  for (const lineId of lineUserIds) {
    try {
      await sendPushMessage(lineId, messages);
      pushSuccess++;
    } catch {
      pushFail++;
    }
  }

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
