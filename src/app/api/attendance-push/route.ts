import { NextRequest } from "next/server";
import { env } from "@/env.mjs";
import { bubbleTemplate } from "@/lib/validation/line";
import { attendanceService } from "@/features/attendance/services/attendance";
import { db } from "@/lib/database/db";

// Helper function to send push message
const sendPushMessage = async (userId: string, messages: any[]) => {
  const lineChannelAccessToken = env.LINE_CHANNEL_ACCESS;
  const lineHeader = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${lineChannelAccessToken}`,
  };

  try {
    const response = await fetch(`${env.LINE_MESSAGING_API}/push`, {
      method: "POST",
      headers: lineHeader,
      body: JSON.stringify({
        to: userId,
        messages: messages,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to send push message");
    }

    return response;
  } catch (err: any) {
    console.error("Error sending push message:", err.message);
    throw err;
  }
};

const flexMessage = (bubbleItems: any[]) => {
  return [
    {
      type: "flex",
      altText: "Work Attendance System",
      contents: {
        type: "carousel",
        contents: bubbleItems,
      },
    },
  ];
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, messageType = "checkin_menu" } = body;

    if (!userId) {
      return Response.json({ message: "userId is required" }, { status: 400 });
    }

    // Find user account to get internal userId
    const userAccount = await db.account.findFirst({
      where: { providerAccountId: userId },
    });

    let payload;

    switch (messageType) {
      case "checkin_menu":
        // Check current attendance status
        if (userAccount?.userId) {
          const attendance = await attendanceService.getTodayAttendance(
            userAccount.userId,
          );
          if (attendance) {
            // User already has attendance record, show status
            payload = flexMessage(bubbleTemplate.workStatus(attendance));
          } else {
            // No attendance record, show check-in menu
            payload = flexMessage(bubbleTemplate.workCheckIn());
          }
        } else {
          // No user account found, show sign-in
          payload = flexMessage(bubbleTemplate.signIn());
        }
        break;
      case "reminder":
        // For reminders, check status first
        if (userAccount?.userId) {
          const attendance = await attendanceService.getTodayAttendance(
            userAccount.userId,
          );
          if (attendance) {
            // Already has attendance, show status instead of reminder
            payload = [
              {
                type: "text",
                text: "📊 สถานะการทำงานของคุณวันนี้",
              },
              ...flexMessage(bubbleTemplate.workStatus(attendance)),
            ];
          } else {
            // No attendance, show reminder
            payload = [
              {
                type: "text",
                text: "⏰ อย่าลืมลงชื่อเข้างานนะคะ! กดที่ปุ่มด้านล่างเพื่อเริ่มทำงาน 😊",
              },
              ...flexMessage(bubbleTemplate.workCheckIn()),
            ];
          }
        } else {
          payload = flexMessage(bubbleTemplate.signIn());
        }
        break;
      case "checkout_reminder":
        payload = [
          {
            type: "text",
            text: "🕔 ถึงเวลาเลิกงานแล้ว! อย่าลืมลงชื่อออกงานด้วยนะคะ 👋",
          },
        ];
        break;
      default:
        // Default case - check status first
        if (userAccount?.userId) {
          const attendance = await attendanceService.getTodayAttendance(
            userAccount.userId,
          );
          if (attendance) {
            payload = flexMessage(bubbleTemplate.workStatus(attendance));
          } else {
            payload = flexMessage(bubbleTemplate.workCheckIn());
          }
        } else {
          payload = flexMessage(bubbleTemplate.signIn());
        }
    }

    await sendPushMessage(userId, payload);

    return Response.json(
      {
        success: true,
        message: "Push message sent successfully",
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Error in attendance push API:", error);
    return Response.json(
      {
        success: false,
        message: "Failed to send push message",
        error: error.message,
      },
      { status: 500 },
    );
  }
}
