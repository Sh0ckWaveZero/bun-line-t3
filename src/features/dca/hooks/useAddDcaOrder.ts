import type { FormEvent } from "react";
import { useState } from "react";
import { useAuthSession } from "@/lib/auth/session-context";

interface UseAddDcaOrderOptions {
  onClose: () => void;
  onSuccess: () => void;
}

export const useAddDcaOrder = ({
  onClose,
  onSuccess,
}: UseAddDcaOrderOptions) => {
  const lineUserId = useAuthSession()?.user?.lineUserId;
  const [form, setForm] = useState({
    coin: "BTC",
    amountTHB: "",
    coinReceived: "",
    pricePerCoin: "",
    executedAt: new Date().toISOString().slice(0, 16),
    note: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!lineUserId) {
        throw new Error("ไม่พบ LINE user ID");
      }

      const res = await fetch("/api/dca/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lineUserId,
          coin: form.coin,
          amountTHB: parseFloat(form.amountTHB),
          coinReceived: parseFloat(form.coinReceived),
          pricePerCoin: parseFloat(form.pricePerCoin),
          executedAt: new Date(form.executedAt).toISOString(),
          note: form.note || undefined,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? "เกิดข้อผิดพลาด");
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    form,
    setForm,
    error,
    isLoading,
    handleSubmit,
  };
};
