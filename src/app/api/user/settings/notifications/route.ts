import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { db as prisma } from "@/lib/database/db";
import { z } from "zod";

const notificationSettingsSchema = z.object({
  enableCheckInReminders: z.boolean(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { settings: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If user doesn't have settings, return defaults
    const enableCheckInReminders = user.settings?.enableCheckInReminders ?? true;

    return NextResponse.json({
      enableCheckInReminders,
    });
  } catch (error) {
    console.error("Error fetching notification settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { enableCheckInReminders } = notificationSettingsSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { settings: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let settings;

    if (!user.settings) {
      // Create new settings if they don't exist
      settings = await prisma.userSettings.create({
        data: {
          userId: user.id,
          enableCheckInReminders,
          enableCheckOutReminders: true,
          enableHolidayNotifications: true,
          timezone: "Asia/Bangkok",
          language: "th",
        },
      });
    } else {
      // Update existing settings
      settings = await prisma.userSettings.update({
        where: { userId: user.id },
        data: { enableCheckInReminders },
      });
    }

    return NextResponse.json({
      message: "Notification settings updated successfully",
      enableCheckInReminders: settings.enableCheckInReminders,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating notification settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}