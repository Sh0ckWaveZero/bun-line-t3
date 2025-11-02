import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { db as prisma } from "@/lib/database/db";
import { z } from "zod";

const updateSettingsSchema = z.object({
  enableCheckInReminders: z.boolean().optional(),
  enableCheckOutReminders: z.boolean().optional(),
  enableHolidayNotifications: z.boolean().optional(),
  timezone: z.string().optional(),
  language: z.enum(["th", "en"]).optional(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    console.log("🚀 ~ GET /api/user/settings ~ session:", session);

    if (!session?.user?.id) {
      console.log("❌ No session or user id found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { settings: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If user doesn't have settings, create default ones
    if (!user.settings) {
      const defaultSettings = await prisma.userSettings.create({
        data: {
          userId: user.id,
          enableCheckInReminders: true,
          enableCheckOutReminders: true,
          enableHolidayNotifications: false,
          timezone: "Asia/Bangkok",
          language: "th",
        },
      });

      return NextResponse.json({
        settings: {
          enableCheckInReminders: defaultSettings.enableCheckInReminders,
          enableCheckOutReminders: defaultSettings.enableCheckOutReminders,
          enableHolidayNotifications:
            defaultSettings.enableHolidayNotifications,
          timezone: defaultSettings.timezone,
          language: defaultSettings.language,
        },
      });
    }

    return NextResponse.json({
      settings: {
        enableCheckInReminders: user.settings.enableCheckInReminders,
        enableCheckOutReminders: user.settings.enableCheckOutReminders,
        enableHolidayNotifications: user.settings.enableHolidayNotifications,
        timezone: user.settings.timezone,
        language: user.settings.language,
      },
    });
  } catch (error) {
    console.error("Error fetching user settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateSettingsSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
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
          enableCheckInReminders: validatedData.enableCheckInReminders ?? true,
          enableCheckOutReminders:
            validatedData.enableCheckOutReminders ?? true,
          enableHolidayNotifications:
            validatedData.enableHolidayNotifications ?? false,
          timezone: validatedData.timezone ?? "Asia/Bangkok",
          language: validatedData.language ?? "th",
        },
      });
    } else {
      // Update existing settings
      settings = await prisma.userSettings.update({
        where: { userId: user.id },
        data: validatedData,
      });
    }

    return NextResponse.json({
      message: "Settings updated successfully",
      settings: {
        enableCheckInReminders: settings.enableCheckInReminders,
        enableCheckOutReminders: settings.enableCheckOutReminders,
        enableHolidayNotifications: settings.enableHolidayNotifications,
        timezone: settings.timezone,
        language: settings.language,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 },
      );
    }

    console.error("Error updating user settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
