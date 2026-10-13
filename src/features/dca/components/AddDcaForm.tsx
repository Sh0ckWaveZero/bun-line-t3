import { Pencil, Plus } from "lucide-react";
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
            <div className="space-y-1">
              <label
                htmlFor="dca-order-coin"
                className="text-muted-foreground text-sm font-medium"
              >
                เหรียญ
              </label>
              <Input
                id="dca-order-coin"
                {...register("coin")}
                placeholder="BTC"
                aria-invalid={Boolean(errors.coin)}
                aria-describedby={
                  errors.coin ? "dca-order-coin-error" : undefined
                }
                className="h-10"
              />
              {errors.coin?.message && (
                <p
                  id="dca-order-coin-error"
                  role="alert"
                  className="text-sm text-red-600 dark:text-red-400"
                >
                  {errors.coin.message}
                </p>
              )}
            </div>
          )}

          <div className="space-y-1">
            <label
              htmlFor="dca-order-amount"
              className="text-muted-foreground text-sm font-medium"
            >
              ยอดซื้อรวม (THB)
            </label>
            <Input
              id="dca-order-amount"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              placeholder="107.99"
              aria-invalid={Boolean(errors.amountTHB)}
              aria-describedby={
                errors.amountTHB ? "dca-order-amount-error" : undefined
              }
              className="h-10"
              {...register("amountTHB")}
            />
            {errors.amountTHB?.message && (
              <p
                id="dca-order-amount-error"
                role="alert"
                className="text-sm text-red-600 dark:text-red-400"
              >
                {errors.amountTHB.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label
                htmlFor="dca-order-coin-received"
                className="text-muted-foreground text-sm font-medium"
              >
                จำนวนเหรียญที่ได้รับ
              </label>
              <Input
                id="dca-order-coin-received"
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                placeholder="0.00004634"
                aria-invalid={Boolean(errors.coinReceived)}
                aria-describedby={
                  errors.coinReceived
                    ? "dca-order-coin-received-error"
                    : undefined
                }
                className="h-10"
                {...register("coinReceived")}
              />
              {errors.coinReceived?.message && (
                <p
                  id="dca-order-coin-received-error"
                  role="alert"
                  className="text-sm text-red-600 dark:text-red-400"
                >
                  {errors.coinReceived.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <label
                htmlFor="dca-order-price"
                className="text-muted-foreground text-sm font-medium"
              >
                ราคาต่อเหรียญ (THB)
              </label>
              <Input
                id="dca-order-price"
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                placeholder="2330307.8"
                aria-invalid={Boolean(errors.pricePerCoin)}
                aria-describedby={
                  errors.pricePerCoin ? "dca-order-price-error" : undefined
                }
                className="h-10"
                {...register("pricePerCoin")}
              />
              {errors.pricePerCoin?.message && (
                <p
                  id="dca-order-price-error"
                  role="alert"
                  className="text-sm text-red-600 dark:text-red-400"
                >
                  {errors.pricePerCoin.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="dca-order-executed-at"
              className="text-muted-foreground text-sm font-medium"
            >
              วันที่และเวลาดำเนินการ
            </label>
            <Input
              id="dca-order-executed-at"
              type="datetime-local"
              aria-invalid={Boolean(errors.executedAt)}
              aria-describedby={
                errors.executedAt ? "dca-order-executed-at-error" : undefined
              }
              className="h-10"
              {...register("executedAt")}
            />
            {errors.executedAt?.message && (
              <p
                id="dca-order-executed-at-error"
                role="alert"
                className="text-sm text-red-600 dark:text-red-400"
              >
                {errors.executedAt.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label
              htmlFor="dca-order-note"
              className="text-muted-foreground text-sm font-medium"
            >
              หมายเหตุ (ไม่บังคับ)
            </label>
            <Input
              id="dca-order-note"
              maxLength={500}
              placeholder="หมายเหตุเพิ่มเติม"
              aria-invalid={Boolean(errors.note)}
              aria-describedby={
                errors.note ? "dca-order-note-error" : undefined
              }
              className="h-10"
              {...register("note")}
            />
            {errors.note?.message && (
              <p
                id="dca-order-note-error"
                role="alert"
                className="text-sm text-red-600 dark:text-red-400"
              >
                {errors.note.message}
              </p>
            )}
          </div>

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
              {isSubmitting
                ? "กำลังบันทึก..."
                : isEditing
                  ? "บันทึกการแก้ไข"
                  : "เพิ่มรายการ"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
