import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/components/common/ToastProvider";
import type { DcaOrder } from "@/features/dca/types";
import { useAuthSession } from "@/lib/auth/session-context";

const positiveNumberInput = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `กรุณากรอก${label}`)
    .refine(
      (value) => Number.isFinite(Number(value)),
      "กรุณากรอกตัวเลขให้ถูกต้อง",
    )
    .refine((value) => Number(value) > 0, `${label}ต้องมากกว่า 0`)
    .transform(Number);

const coinFormSchema = z
  .string()
  .trim()
  .min(1, "กรุณาระบุเหรียญ")
  .max(20, "ชื่อเหรียญยาวเกินไป")
  .regex(/^[A-Za-z][A-Za-z0-9]*$/, "รูปแบบเหรียญไม่ถูกต้อง")
  .transform((coin) => coin.toUpperCase());

const dcaOrderFormSchema = z
  .object({
    mode: z.enum(["create", "edit"]),
    coin: z.string().optional(),
    amountTHB: positiveNumberInput("จำนวนเงิน"),
    coinReceived: positiveNumberInput("จำนวนเหรียญ"),
    pricePerCoin: positiveNumberInput("ราคาต่อเหรียญ"),
    executedAt: z
      .string()
      .min(1, "กรุณาระบุวันที่และเวลา")
      .refine(
        (value) => Number.isFinite(new Date(value).getTime()),
        "วันที่และเวลาไม่ถูกต้อง",
      )
      .transform((value) => new Date(value)),
    note: z.string().max(500, "หมายเหตุต้องไม่เกิน 500 ตัวอักษร"),
  })
  .superRefine((values, context) => {
    if (values.mode !== "create") return;

    if (!values.coin?.trim()) {
      context.addIssue({
        code: "custom",
        path: ["coin"],
        message: "กรุณาระบุเหรียญ",
      });
      return;
    }

    const coinResult = coinFormSchema.safeParse(values.coin);
    if (!coinResult.success) {
      for (const issue of coinResult.error.issues) {
        context.addIssue({ ...issue, path: ["coin", ...issue.path] });
      }
    }
  })
  .transform((values) => {
    const transaction = {
      amountTHB: values.amountTHB,
      coinReceived: values.coinReceived,
      pricePerCoin: values.pricePerCoin,
      executedAt: values.executedAt,
      note: values.note,
    };

    if (values.mode === "create") {
      return {
        mode: values.mode,
        coin: values.coin?.trim().toUpperCase() ?? "",
        ...transaction,
      };
    }

    return { mode: values.mode, ...transaction };
  });

type DcaOrderFormInput = z.input<typeof dcaOrderFormSchema>;
type DcaOrderFormOutput = z.output<typeof dcaOrderFormSchema>;

interface UseAddDcaOrderOptions {
  onClose: () => void;
  onSuccess: () => void;
  order?: DcaOrder;
}

const formatDateTimeLocal = (value: Date | string): string => {
  const date = new Date(value);
  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60_000,
  );
  return localDate.toISOString().slice(0, 16);
};

export const useAddDcaOrder = ({
  onClose,
  onSuccess,
  order,
}: UseAddDcaOrderOptions) => {
  const lineUserId = useAuthSession()?.user?.lineUserId;
  const { showToast } = useToast();
  const defaultValues: DcaOrderFormInput = {
    mode: order ? "edit" : "create",
    ...(order ? {} : { coin: "BTC" }),
    amountTHB: order ? String(order.amountTHB) : "",
    coinReceived: order ? String(order.coinReceived) : "",
    pricePerCoin: order ? String(order.pricePerCoin) : "",
    executedAt: formatDateTimeLocal(order?.executedAt ?? new Date()),
    note: order?.note ?? "",
  };
  const form = useForm<DcaOrderFormInput, undefined, DcaOrderFormOutput>({
    resolver: zodResolver(dcaOrderFormSchema),
    defaultValues,
  });

  const submit = form.handleSubmit(async (values) => {
    form.clearErrors("root.server");

    if (!lineUserId) {
      form.setError("root.server", {
        type: "server",
        message: "ไม่พบ LINE user ID กรุณาเข้าสู่ระบบใหม่",
      });
      return;
    }

    if (values.mode === "edit" && !order) {
      form.setError("root.server", {
        type: "server",
        message: "ไม่พบรายการ DCA ที่ต้องการแก้ไข",
      });
      return;
    }

    const transaction = {
      lineUserId,
      amountTHB: values.amountTHB,
      coinReceived: values.coinReceived,
      pricePerCoin: values.pricePerCoin,
      executedAt: values.executedAt.toISOString(),
      note: values.note.trim() || undefined,
    };
    const payload =
      values.mode === "create"
        ? { ...transaction, coin: values.coin }
        : transaction;
    const requestUrl =
      values.mode === "edit" && order
        ? `/api/dca/${encodeURIComponent(order.id)}`
        : "/api/dca/";

    try {
      const response = await fetch(requestUrl, {
        method: values.mode === "edit" ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? "เกิดข้อผิดพลาด กรุณาลองอีกครั้ง");
      }

      showToast({
        title:
          values.mode === "edit"
            ? "แก้ไขรายการ DCA สำเร็จ"
            : "เพิ่มรายการ DCA สำเร็จ",
        type: "success",
      });
      onSuccess();
      onClose();
    } catch (error) {
      form.setError("root.server", {
        type: "server",
        message:
          error instanceof Error
            ? error.message
            : "เกิดข้อผิดพลาด กรุณาลองอีกครั้ง",
      });
    }
  });

  return {
    ...form,
    submit,
    isEditing: Boolean(order),
  };
};
