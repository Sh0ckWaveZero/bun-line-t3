import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UserSettingsData, UpdateSettingsPayload } from "../types";
import { DEFAULT_USER_SETTINGS } from "../constants";

const SETTINGS_QUERY_KEY = ["user-settings"] as const;

interface SettingUpdate {
  key: keyof UpdateSettingsPayload;
  value: UpdateSettingsPayload[keyof UpdateSettingsPayload];
}

async function fetchSettings(): Promise<UserSettingsData> {
  const response = await fetch("/api/user/settings");
  if (!response.ok) throw new Error("ไม่สามารถโหลดการตั้งค่าได้");

  const data = (await response.json()) as { settings?: UserSettingsData };
  return data.settings ?? DEFAULT_USER_SETTINGS;
}

interface UseUserSettingsReturn {
  settings: UserSettingsData;
  loading: boolean;
  saving: boolean;
  error: string | null;
  updateSetting: <K extends keyof UpdateSettingsPayload>(
    key: K,
    value: UpdateSettingsPayload[K],
  ) => Promise<void>;
}

export function useUserSettings(): UseUserSettingsReturn {
  const queryClient = useQueryClient();
  const settingsQuery = useQuery({
    queryKey: SETTINGS_QUERY_KEY,
    queryFn: fetchSettings,
    retry: false,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ key, value }: SettingUpdate) => {
      const response = await fetch("/api/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
      if (!response.ok) throw new Error("ไม่สามารถบันทึกการตั้งค่าได้");

      const data = (await response.json()) as { settings?: UserSettingsData };
      return data.settings;
    },
    onMutate: async ({ key, value }) => {
      await queryClient.cancelQueries({ queryKey: SETTINGS_QUERY_KEY });
      const previousSettings =
        queryClient.getQueryData<UserSettingsData>(SETTINGS_QUERY_KEY);

      queryClient.setQueryData<UserSettingsData>(
        SETTINGS_QUERY_KEY,
        (current) =>
          Object.assign({}, current ?? DEFAULT_USER_SETTINGS, { [key]: value }),
      );

      return { previousSettings };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(
        SETTINGS_QUERY_KEY,
        context?.previousSettings ?? DEFAULT_USER_SETTINGS,
      );
    },
    onSuccess: (settings) => {
      if (settings) queryClient.setQueryData(SETTINGS_QUERY_KEY, settings);
    },
  });

  const settings = settingsQuery.data ?? DEFAULT_USER_SETTINGS;
  const mutationError = updateMutation.error;
  const queryError = settingsQuery.error;
  const activeError = mutationError ?? queryError;
  const error = activeError
    ? activeError instanceof Error
      ? activeError.message
      : "เกิดข้อผิดพลาด"
    : null;

  const updateSetting = useCallback(
    async <K extends keyof UpdateSettingsPayload>(
      key: K,
      value: UpdateSettingsPayload[K],
    ) => {
      try {
        await updateMutation.mutateAsync({ key, value });
      } catch {
        // The mutation exposes the error through the hook result.
      }
    },
    [updateMutation.mutateAsync],
  );

  return {
    settings,
    loading: settingsQuery.isLoading,
    saving: updateMutation.isPending,
    error,
    updateSetting,
  };
}
