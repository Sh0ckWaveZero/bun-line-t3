import {
  Settings,
  Eye,
  EyeOff,
  Bell,
  MessageSquare,
  Users,
  Globe,
  Loader2,
} from "lucide-react";
import { useUserSettings } from "../hooks/useUserSettings";
import { SettingsSection } from "../components/SettingsSection";
import { SettingsToggle } from "../components/SettingsToggle";

export function SettingsPage() {
  const { settings, loading, saving, error, updateSetting } = useUserSettings();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
          <p className="text-muted-foreground text-sm">
            กำลังโหลดการตั้งค่า...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-xl">
          <Settings className="text-primary h-5 w-5" />
        </div>
        <div>
          <h1 className="text-foreground text-xl font-bold sm:text-2xl">
            ตั้งค่า
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm">
            จัดการการตั้งค่าส่วนตัวของคุณ
          </p>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="border-destructive/30 bg-destructive/10 text-destructive mb-4 rounded-lg border px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Saving indicator */}
      {saving && (
        <div className="border-primary/30 bg-primary/10 text-primary mb-4 flex items-center gap-2 rounded-lg border px-4 py-2 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          กำลังบันทึก...
        </div>
      )}

      <div className="space-y-5">
        {/* ===== ความเป็นส่วนตัว — ซ่อนจำนวนเงิน ===== */}
        <SettingsSection
          title="ความเป็นส่วนตัว"
          description="ซ่อนจำนวนเงินที่แสดงผ่านช่องทางต่างๆ"
        >
          {/* LINE 1:1 */}
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#06C755]/10">
              <MessageSquare className="h-4 w-4 text-[#06C755]" />
            </div>
            <div className="flex-1">
              <SettingsToggle
                id="hide-amounts-line-personal"
                label="ซ่อนจำนวนเงินใน LINE (แชทส่วนตัว)"
                description="เมื่อเปิด จำนวนเงินจะแสดงเป็น •••••• ในแชท 1:1 กับบอท"
                checked={settings.hideAmountsLinePersonal}
                onCheckedChange={(checked) =>
                  updateSetting("hideAmountsLinePersonal", checked)
                }
                disabled={saving}
              />
            </div>
          </div>

          {/* LINE Group */}
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#06C755]/10">
              <Users className="h-4 w-4 text-[#06C755]" />
            </div>
            <div className="flex-1">
              <SettingsToggle
                id="hide-amounts-line-group"
                label="ซ่อนจำนวนเงินใน LINE (กลุ่ม)"
                description="เมื่อเปิด จำนวนเงินจะแสดงเป็น •••••• เมื่อใช้บอทในกลุ่ม LINE"
                checked={settings.hideAmountsLineGroup}
                onCheckedChange={(checked) =>
                  updateSetting("hideAmountsLineGroup", checked)
                }
                disabled={saving}
              />
            </div>
          </div>

          {/* Web */}
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
              <Globe className="h-4 w-4 text-blue-500" />
            </div>
            <div className="flex-1">
              <SettingsToggle
                id="hide-amounts-web"
                label="ซ่อนจำนวนเงินบนเว็บ"
                description="เมื่อเปิด จำนวนเงินทั้งหมดบนเว็บจะแสดงเป็น ••••••"
                checked={settings.hideAmountsWeb}
                onCheckedChange={(checked) =>
                  updateSetting("hideAmountsWeb", checked)
                }
                disabled={saving}
              />
            </div>
          </div>

          {/* Preview */}
          <div className="bg-muted/50 mt-2 rounded-lg p-3">
            <p className="text-muted-foreground mb-2 text-xs font-medium">
              ตัวอย่างการแสดงผล
            </p>
            <div className="flex items-center gap-3 text-sm">
              {settings.hideAmountsLinePersonal ||
              settings.hideAmountsLineGroup ||
              settings.hideAmountsWeb ? (
                <>
                  <EyeOff className="text-muted-foreground h-4 w-4" />
                  <span className="text-muted-foreground font-mono">
                    ••••••
                  </span>
                  <span className="text-muted-foreground text-xs">บาท</span>
                </>
              ) : (
                <>
                  <Eye className="text-foreground h-4 w-4" />
                  <span className="text-foreground font-mono">1,234.50</span>
                  <span className="text-muted-foreground text-xs">บาท</span>
                </>
              )}
            </div>
          </div>
        </SettingsSection>

        {/* ===== การแจ้งเตือน ===== */}
        <SettingsSection
          title="การแจ้งเตือน"
          description="ตั้งค่าการแจ้งเตือนผ่าน LINE"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
              <Bell className="h-4 w-4 text-amber-500" />
            </div>
            <div className="flex-1 space-y-2">
              <SettingsToggle
                id="enable-checkin-reminders"
                label="แจ้งเตือนเข้างาน (8:00 น.)"
                description="รับการแจ้งเตือนลงชื่อเข้างานทุกเช้า"
                checked={settings.enableCheckInReminders}
                onCheckedChange={(checked) =>
                  updateSetting("enableCheckInReminders", checked)
                }
                disabled={saving}
              />
              <SettingsToggle
                id="enable-checkout-reminders"
                label="แจ้งเตือนเลิกงาน"
                description="รับการแจ้งเตือนก่อนครบ 9 ชั่วโมง และเมื่อครบ 9 ชั่วโมง"
                checked={settings.enableCheckOutReminders}
                onCheckedChange={(checked) =>
                  updateSetting("enableCheckOutReminders", checked)
                }
                disabled={saving}
              />
              <SettingsToggle
                id="enable-holiday-notifications"
                label="แจ้งเตือนวันหยุดราชการ"
                description="รับการแจ้งเตือนเกี่ยวกับวันหยุดประจำปี"
                checked={settings.enableHolidayNotifications}
                onCheckedChange={(checked) =>
                  updateSetting("enableHolidayNotifications", checked)
                }
                disabled={saving}
              />
            </div>
          </div>
        </SettingsSection>
      </div>
    </div>
  );
}
