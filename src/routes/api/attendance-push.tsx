import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { env } from "@/env.mjs";
import { bubbleTemplate } from "@/lib/validation/line";
import { attendanceService } from "@/features/attendance/services/attendance.server";
import { db } from "@/lib/database/db";
import type {
  LineMessage,
  LineFlexMessage,
} from "@/types/line-message";

// Validation schema for request body
const AttendancePushSchema = z.object({
  userId: z.string().min(1, "userId is required"),
  messageType: z
    .enum(["checkin_menu", "reminder", "checkout_reminder", "default"])
    .default("checkin_menu"),
});

// Helper function to send push message with proper typing
const sendPushMessage = async (
  userId: string,
  messages: LineMessage[],
): Promise<Response> => {
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
      const errorText = await response.text();
      throw new Error(`LINE API error: ${response.status} ${errorText}`);
    }

    return response;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error sending push message:", {
        error: error.message,
        userId: userId.slice(0, 8) + "...", // Log partial ID only
      });
    }
    throw error;
  }
};

const flexMessage = (
  bubbleItems: Array<Record<string, unknown>>,
): LineFlexMessage[] => {
  return [
    {
      type: "flex" as const,
      altText: "Work Attendance System",
      contents: {
        type: "carousel" as const,
        contents: bubbleItems,
      },
    },
  ];
};

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validate request body with Zod
    const validationResult = AttendancePushSchema.safeParse(body);
    if (!validationResult.success) {
      return Response.json(
        {
          success: false,
          message: "Validation error",
          errors: validationResult.error.issues.map((e) => ({
            path: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 },
      );
    }

    const { userId, messageType } = validationResult.data;

    // Find user account to get internal userId
    const userAccount = await db.account.findFirst({
      where: { accountId: userId },
    });

    let payload: LineMessage[];

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
  } catch (error) {
    // Log error securely without exposing sensitive details
    if (error instanceof Error) {
      console.error("Error in attendance push API:", {
        error: error.message,
        stack:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }

    // Return generic error to client in production
    return Response.json(
      {
        success: false,
        message: "Failed to send push message",
        ...(process.env.NODE_ENV === "development" &&
          error instanceof Error && { error: error.message }),
      },
      { status: 500 },
    );
  }
}

export const Route = createFileRoute("/api/attendance-push")({
  server: {
    handlers: {
      POST: ({ request }) => POST(request),
    },
  },
});
