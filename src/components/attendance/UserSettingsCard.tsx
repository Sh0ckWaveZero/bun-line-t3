"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Save, Settings, Bell, BellOff } from "lucide-react";
import { useToast } from "@/components/common/ToastProvider";
import { useSession } from "@/lib/auth/client";

interface UserSettings {
  enableCheckInReminders: boolean;
  enableCheckOutReminders: boolean;
  enableHolidayNotifications: boolean;
  timezone: string;
  language: string;
}

interface UserSettingsCardProps {
  className?: string;
}

export function UserSettingsCard({ className }: UserSettingsCardProps) {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { showToast } = useToast();
  const { data: session, status } = useSession();

  const fetchSettings = useCallback(async () => {
    if (status === "loading" || !session) return;

    try {
      setLoading(true);
      const response = await fetch("/api/user/settings");
      const data = await response.json();

      if (response.ok) {
        setSettings(data.settings);
      } else {
        showToast({
          title: "เกิดข้อผิดพลาด",
          description: data.error || "ไม่สามารถโหลดการตั้งค่าได้",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      showToast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [showToast, session, status]);

  // Fetch current settings
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSetting = (key: keyof UserSettings, value: boolean | string) => {
    if (!settings) return;

    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    setHasChanges(true);
  };

  const saveSettings = async () => {
    if (!settings || !hasChanges || !session) return;

    try {
      setSaving(true);
      const response = await fetch("/api/user/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (response.ok) {
        showToast({
          title: "บันทึกสำเร็จ",
          description: "การตั้งค่าของคุณได้รับการอัพเดทแล้ว",
          type: "success",
        });
        setHasChanges(false);
      } else {
        showToast({
          title: "เกิดข้อผิดพลาด",
          description: data.error || "ไม่สามารถบันทึกการตั้งค่าได้",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      showToast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            การตั้งค่าการแจ้งเตือน
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">กำลังโหลด...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (status === "unauthenticated") {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            การตั้งค่าการแจ้งเตือน
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground py-8 text-center">
            กรุณาเข้าสู่ระบบเพื่อใช้งานการตั้งค่า
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!settings) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            การตั้งค่าการแจ้งเตือน
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground py-8 text-center">
            ไม่สามารถโหลดการตั้งค่าได้
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          การตั้งค่าการแจ้งเตือน
        </CardTitle>
        <p className="text-muted-foreground text-sm">
          จัดการการแจ้งเตือนต่างๆ ของระบบ
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Check-in Reminders */}
        <div className="flex items-center justify-between space-x-2">
          <div className="space-y-0.5">
            <Label className="flex items-center gap-2 text-base font-medium">
              {settings.enableCheckInReminders ? (
                <Bell className="h-4 w-4 text-green-600" />
              ) : (
                <BellOff className="h-4 w-4 text-gray-400" />
              )}
              แจ้งเตือนเข้างาน
            </Label>
            <div className="text-muted-foreground text-sm">
              รับการแจ้งเตือนในเวลา 8:00 น. ทุกเช้า
            </div>
          </div>
          <Switch
            checked={settings.enableCheckInReminders}
            onCheckedChange={(checked) =>
              updateSetting("enableCheckInReminders", checked)
            }
          />
        </div>

        {/* Check-out Reminders */}
        <div className="flex items-center justify-between space-x-2">
          <div className="space-y-0.5">
            <Label className="flex items-center gap-2 text-base font-medium">
              {settings.enableCheckOutReminders ? (
                <Bell className="h-4 w-4 text-green-600" />
              ) : (
                <BellOff className="h-4 w-4 text-gray-400" />
              )}
              แจ้งเตือนเลิกงาน
            </Label>
            <div className="text-muted-foreground text-sm">
              รับการแจ้งเตือนก่อนครบ 9 ชั่วโมง และเมื่อครบ 9 ชั่วโมง
            </div>
          </div>
          <Switch
            checked={settings.enableCheckOutReminders}
            onCheckedChange={(checked) =>
              updateSetting("enableCheckOutReminders", checked)
            }
          />
        </div>

        {/* Holiday Notifications */}
        <div className="flex items-center justify-between space-x-2">
          <div className="space-y-0.5">
            <Label className="flex items-center gap-2 text-base font-medium">
              {settings.enableHolidayNotifications ? (
                <Bell className="h-4 w-4 text-green-600" />
              ) : (
                <BellOff className="h-4 w-4 text-gray-400" />
              )}
              แจ้งเตือนวันหยุดราชการ
            </Label>
            <div className="text-muted-foreground text-sm">
              รับการแจ้งเตือนเกี่ยวกับวันหยุดประจำปี
            </div>
          </div>
          <Switch
            checked={settings.enableHolidayNotifications}
            onCheckedChange={(checked) =>
              updateSetting("enableHolidayNotifications", checked)
            }
          />
        </div>

        {/* Save Button */}
        {hasChanges && (
          <div className="flex justify-end border-t pt-4">
            <Button onClick={saveSettings} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  บันทึกการตั้งค่า
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
