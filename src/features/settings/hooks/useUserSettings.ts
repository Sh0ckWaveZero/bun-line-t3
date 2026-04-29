import { useCallback, useEffect, useState } from "react"
import type { UserSettingsData, UpdateSettingsPayload } from "../types"
import { DEFAULT_USER_SETTINGS } from "../constants"

interface UseUserSettingsReturn {
  settings: UserSettingsData
  loading: boolean
  saving: boolean
  error: string | null
  updateSetting: <K extends keyof UpdateSettingsPayload>(
    key: K,
    value: UpdateSettingsPayload[K],
  ) => Promise<void>
}

export function useUserSettings(): UseUserSettingsReturn {
  const [settings, setSettings] = useState<UserSettingsData>(DEFAULT_USER_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch settings on mount
  useEffect(() => {
    let cancelled = false

    async function fetchSettings() {
      try {
        const res = await fetch("/api/user/settings")
        if (!res.ok) throw new Error("ไม่สามารถโหลดการตั้งค่าได้")

        const data = await res.json()
        if (!cancelled && data.settings) {
          setSettings(data.settings)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchSettings()
    return () => {
      cancelled = true
    }
  }, [])

  const updateSetting = useCallback(
    async <K extends keyof UpdateSettingsPayload>(
      key: K,
      value: UpdateSettingsPayload[K],
    ) => {
      // Optimistic update
      setSettings((prev) => ({ ...prev, [key]: value }))
      setSaving(true)
      setError(null)

      try {
        const res = await fetch("/api/user/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [key]: value }),
        })

        if (!res.ok) {
          throw new Error("ไม่สามารถบันทึกการตั้งค่าได้")
        }

        const data = await res.json()
        if (data.settings) {
          setSettings(data.settings)
        }
      } catch (err) {
        // Rollback optimistic update
        setSettings((prev) => ({ ...prev, [key]: !value }))
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด")
      } finally {
        setSaving(false)
      }
    },
    [],
  )

  return { settings, loading, saving, error, updateSetting }
}
