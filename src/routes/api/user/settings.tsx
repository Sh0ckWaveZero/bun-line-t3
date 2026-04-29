import { createFileRoute } from "@tanstack/react-router";
import { getServerAuthSession } from "@/lib/auth/auth";
import { db as prisma } from "@/lib/database/db";
import { z } from "zod";

const updateSettingsSchema = z.object({
  enableCheckInReminders: z.boolean().optional(),
  enableCheckOutReminders: z.boolean().optional(),
  enableHolidayNotifications: z.boolean().optional(),
  hideAmountsLinePersonal: z.boolean().optional(),
  hideAmountsLineGroup: z.boolean().optional(),
  hideAmountsWeb: z.boolean().optional(),
  timezone: z.string().optional(),
  language: z.enum(["th", "en"]).optional(),
});

export async function GET(request: Request) {
  try {
    const session = await getServerAuthSession(request);

    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { settings: true },
    });

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // If user doesn't have settings, create default ones
    if (!user.settings) {
      const defaultSettings = await prisma.userSettings.create({
        data: {
          userId: user.id,
          enableCheckInReminders: true,
          enableCheckOutReminders: true,
          enableHolidayNotifications: false,
          hideAmountsLinePersonal: false,
          hideAmountsLineGroup: false,
          hideAmountsWeb: false,
          timezone: "Asia/Bangkok",
          language: "th",
        },
      });

      return Response.json({
        settings: {
          enableCheckInReminders: defaultSettings.enableCheckInReminders,
          enableCheckOutReminders: defaultSettings.enableCheckOutReminders,
          enableHolidayNotifications:
            defaultSettings.enableHolidayNotifications,
          hideAmountsLinePersonal: defaultSettings.hideAmountsLinePersonal,
          hideAmountsLineGroup: defaultSettings.hideAmountsLineGroup,
          hideAmountsWeb: defaultSettings.hideAmountsWeb,
          timezone: defaultSettings.timezone,
          language: defaultSettings.language,
        },
      });
    }

    return Response.json({
      settings: {
        enableCheckInReminders: user.settings.enableCheckInReminders,
        enableCheckOutReminders: user.settings.enableCheckOutReminders,
        enableHolidayNotifications: user.settings.enableHolidayNotifications,
        hideAmountsLinePersonal: user.settings.hideAmountsLinePersonal,
        hideAmountsLineGroup: user.settings.hideAmountsLineGroup,
        hideAmountsWeb: user.settings.hideAmountsWeb,
        timezone: user.settings.timezone,
        language: user.settings.language,
      },
    });
  } catch (error) {
    console.error("Error fetching user settings:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const Route = createFileRoute("/api/user/settings")({
  server: {
    handlers: {
      GET: ({ request }) => GET(request),
      PUT: ({ request }) => PUT(request),
    },
  },
});

export async function PUT(request: Request) {
  try {
    const session = await getServerAuthSession(request);

    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateSettingsSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { settings: true },
    });

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
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
          hideAmountsLinePersonal:
            validatedData.hideAmountsLinePersonal ?? false,
          hideAmountsLineGroup:
            validatedData.hideAmountsLineGroup ?? false,
          hideAmountsWeb: validatedData.hideAmountsWeb ?? false,
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

    return Response.json({
      message: "Settings updated successfully",
      settings: {
        enableCheckInReminders: settings.enableCheckInReminders,
        enableCheckOutReminders: settings.enableCheckOutReminders,
        enableHolidayNotifications: settings.enableHolidayNotifications,
        hideAmountsLinePersonal: settings.hideAmountsLinePersonal,
        hideAmountsLineGroup: settings.hideAmountsLineGroup,
        hideAmountsWeb: settings.hideAmountsWeb,
        timezone: settings.timezone,
        language: settings.language,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 },
      );
    }

    console.error("Error updating user settings:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
