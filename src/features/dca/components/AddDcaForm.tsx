import type { ComponentProps, ReactNode } from "react";
import { Pencil, Plus } from "lucide-react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAddDcaOrder } from "@/features/dca/hooks/useAddDcaOrder";
import type { DcaOrder } from "@/features/dca/types";

interface AddDcaFormProps {
  onClose: () => void;
  onSuccess: () => void;
  order?: DcaOrder;
}

const getSubmitLabel = (isSubmitting: boolean, isEditing: boolean): string =>
  isSubmitting
    ? "กำลังบันทึก..."
    : isEditing
      ? "บันทึกการแก้ไข"
      : "เพิ่มรายการ";

interface DcaFormFieldProps {
  id: string;
  label: ReactNode;
  /** ข้อความ validation error — มี = แสดงใต้ช่องและตั้ง aria-invalid */
  error?: string;
  registration: UseFormRegisterReturn;
  inputProps?: ComponentProps<typeof Input>;
}

/** ช่องกรอกพร้อม label + ข้อความ error — pattern เดียวกันทุกช่องของฟอร์ม DCA */
const DcaFormField = ({
  id,
  label,
  error,
  registration,
  inputProps,
}: DcaFormFieldProps) => (
  <div className="space-y-1">
    <label htmlFor={id} className="text-muted-foreground text-sm font-medium">
      {label}
    </label>
    <Input
      id={id}
      aria-invalid={Boolean(error)}
      aria-describedby={error ? `${id}-error` : undefined}
      className="h-10"
      {...inputProps}
      {...registration}
    />
    {error && (
      <p
        id={`${id}-error`}
        role="alert"
        className="text-sm text-red-600 dark:text-red-400"
      >
        {error}
      </p>
    )}
  </div>
);

export const AddDcaForm = ({ onClose, onSuccess, order }: AddDcaFormProps) => {
  const {
    register,
    formState: { errors, isSubmitting },
    submit,
    isEditing,
  } = useAddDcaOrder({ onClose, onSuccess, order });
  const serverError = errors.root?.server?.message;

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !isSubmitting) onClose();
      }}
    >
      <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg gap-0 overflow-y-auto p-0">
        <DialogHeader className="border-border border-b px-6 py-5 pr-14 text-left">
          <DialogTitle className="flex items-center gap-2 text-lg">
            {isEditing ? (
              <Pencil aria-hidden="true" className="text-primary h-5 w-5" />
            ) : (
              <Plus aria-hidden="true" className="text-primary h-5 w-5" />
            )}
            {isEditing ? "แก้ไขรายการ DCA" : "เพิ่มรายการ DCA"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? `แก้ไขข้อมูลรายการซื้อ ${order?.coin.toUpperCase() ?? ""} ใน DCA`
              : "บันทึกรายการซื้อใหม่ใน DCA ของบัญชีนี้"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4 px-6 py-5">
          {serverError && (
            <div
              role="alert"
              className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300"
            >
              {serverError}
            </div>
          )}

          {!isEditing && (
            <DcaFormField
              id="dca-order-coin"
              label="เหรียญ"
              error={errors.coin?.message}
              registration={register("coin")}
              inputProps={{ placeholder: "BTC" }}
            />
          )}

          <DcaFormField
            id="dca-order-amount"
            label="ยอดซื้อรวม (THB)"
            error={errors.amountTHB?.message}
            registration={register("amountTHB")}
            inputProps={{
              type: "number",
              min: "0",
              step: "0.01",
              inputMode: "decimal",
              placeholder: "107.99",
            }}
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DcaFormField
              id="dca-order-coin-received"
              label="จำนวนเหรียญที่ได้รับ"
              error={errors.coinReceived?.message}
              registration={register("coinReceived")}
              inputProps={{
                type: "number",
                min: "0",
                step: "any",
                inputMode: "decimal",
                placeholder: "0.00004634",
              }}
            />
            <DcaFormField
              id="dca-order-price"
              label="ราคาต่อเหรียญ (THB)"
              error={errors.pricePerCoin?.message}
              registration={register("pricePerCoin")}
              inputProps={{
                type: "number",
                min: "0",
                step: "any",
                inputMode: "decimal",
                placeholder: "2330307.8",
              }}
            />
          </div>

          <DcaFormField
            id="dca-order-executed-at"
            label="วันที่และเวลาดำเนินการ"
            error={errors.executedAt?.message}
            registration={register("executedAt")}
            inputProps={{ type: "datetime-local" }}
          />

          <DcaFormField
            id="dca-order-note"
            label="หมายเหตุ (ไม่บังคับ)"
            error={errors.note?.message}
            registration={register("note")}
            inputProps={{ maxLength: 500, placeholder: "หมายเหตุเพิ่มเติม" }}
          />

          <DialogFooter className="border-border flex-col-reverse gap-2 border-t pt-4 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="min-h-10 sm:min-w-28"
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-h-10 sm:min-w-36"
            >
              {getSubmitLabel(isSubmitting, isEditing)}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
