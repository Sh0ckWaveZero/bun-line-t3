import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthSession } from "@/lib/auth/session-context";
import type { BitkubCredentials } from "../lib/bitkub-credentials";
import { bitkubConnectionSchema, requestBitkub } from "../lib/bitkub-api";

export function useBitkubConnection({
  enabled = true,
}: { enabled?: boolean } = {}) {
  const userId = useAuthSession()?.user?.id;
  const queryClient = useQueryClient();
  const queryKey = ["bitkub-connection", userId] as const;
  const [message, setMessage] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const connection = useQuery({
    queryKey,
    queryFn: () =>
      requestBitkub("/api/exchanges/bitkub/connection", bitkubConnectionSchema),
    enabled: Boolean(userId) && enabled,
  });
  const disconnectMutation = useMutation({
    mutationFn: () =>
      requestBitkub(
        "/api/exchanges/bitkub/connection",
        bitkubConnectionSchema,
        { method: "DELETE" },
      ),
    onMutate: () => {
      setMessage("");
      setActionError(null);
    },
    onSuccess: (status) => {
      queryClient.setQueryData(queryKey, status);
      setMessage(
        "ยกเลิกการเชื่อมต่อแล้ว ข้อมูลรับรองถูกล้าง ประวัติที่โหลดและรายการ DCA ยังอยู่",
      );
    },
  });

  const handleConnect = async (
    credentials: BitkubCredentials,
  ): Promise<boolean> => {
    const body = JSON.stringify(credentials);
    setMessage("");
    setActionError(null);
    disconnectMutation.reset();
    setIsConnecting(true);
    try {
      const status = await requestBitkub(
        "/api/exchanges/bitkub/connection",
        bitkubConnectionSchema,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        },
      );
      queryClient.setQueryData(queryKey, status);
      setMessage("เชื่อมต่อ Bitkub แล้ว");
      return true;
    } catch (cause) {
      setActionError(
        cause instanceof Error ? cause.message : "ไม่สามารถดำเนินการได้",
      );
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async (): Promise<boolean> => {
    try {
      await disconnectMutation.mutateAsync();
      return true;
    } catch {
      return false;
    }
  };

  return {
    connection,
    error:
      actionError ??
      connection.error?.message ??
      disconnectMutation.error?.message ??
      null,
    isBusy: isConnecting || disconnectMutation.isPending,
    message,
    handleConnect,
    handleDisconnect,
  };
}
