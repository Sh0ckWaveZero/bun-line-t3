import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAddDcaOrder } from "@/features/dca/hooks/useAddDcaOrder";

interface AddDcaFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const AddDcaForm = ({ onClose, onSuccess }: AddDcaFormProps) => {
  const { form, setForm, error, isLoading, handleSubmit } = useAddDcaOrder({
    onClose,
    onSuccess,
  });

  return (
    <div
      id="dca-add-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <Card
        id="dca-add-card"
        className="border-border mx-4 w-full max-w-md border shadow-2xl"
      >
        <CardHeader
          id="dca-add-header"
          className="flex flex-row items-center justify-between space-y-0 pb-4"
        >
          <CardTitle id="dca-add-title" className="flex items-center gap-2 text-lg">
            <Plus className="h-5 w-5 text-yellow-500" />
            เพิ่มคำสั่งซื้อ Auto DCA
          </CardTitle>
          <Button
            id="dca-add-close-button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent id="dca-add-content">
          <form id="dca-add-form" onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div
                id="dca-add-error"
                className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500"
              >
                {error}
              </div>
            )}

            <div id="dca-add-coin-field" className="space-y-1">
              <label
                id="dca-add-coin-label"
                htmlFor="dca-add-coin-input"
                className="text-muted-foreground text-xs font-medium"
              >
                เหรียญ
              </label>
              <Input
                id="dca-add-coin-input"
                value={form.coin}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    coin: e.target.value.toUpperCase(),
                  }))
                }
                placeholder="BTC"
                className="h-9"
                required
              />
            </div>

            <div id="dca-add-amount-field" className="space-y-1">
              <label
                id="dca-add-amount-label"
                htmlFor="dca-add-amount-input"
                className="text-muted-foreground text-xs font-medium"
              >
                จำนวนเงินต่อรอบ (THB)
              </label>
              <Input
                id="dca-add-amount-input"
                type="number"
                step="0.01"
                value={form.amountTHB}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    amountTHB: e.target.value,
                  }))
                }
                placeholder="107.99"
                className="h-9"
                required
              />
            </div>

            <div
              id="dca-add-coin-price-fields"
              className="grid grid-cols-2 gap-3"
            >
              <div id="dca-add-coin-received-field" className="space-y-1">
                <label
                  id="dca-add-coin-received-label"
                  htmlFor="dca-add-coin-received-input"
                  className="text-muted-foreground text-xs font-medium"
                >
                  จำนวนเหรียญที่ได้รับ
                </label>
                <Input
                  id="dca-add-coin-received-input"
                  type="number"
                  step="any"
                  value={form.coinReceived}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      coinReceived: e.target.value,
                    }))
                  }
                  placeholder="0.00004634"
                  className="h-9"
                  required
                />
              </div>
              <div id="dca-add-price-field" className="space-y-1">
                <label
                  id="dca-add-price-label"
                  htmlFor="dca-add-price-input"
                  className="text-muted-foreground text-xs font-medium"
                >
                  ราคาต่อเหรียญ (THB)
                </label>
                <Input
                  id="dca-add-price-input"
                  type="number"
                  step="0.01"
                  value={form.pricePerCoin}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      pricePerCoin: e.target.value,
                    }))
                  }
                  placeholder="2330307.8"
                  className="h-9"
                  required
                />
              </div>
            </div>

            <div id="dca-add-executed-at-field" className="space-y-1">
              <label
                id="dca-add-executed-at-label"
                htmlFor="dca-add-executed-at-input"
                className="text-muted-foreground text-xs font-medium"
              >
                วันที่และเวลาดำเนินการ
              </label>
              <Input
                id="dca-add-executed-at-input"
                type="datetime-local"
                value={form.executedAt}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    executedAt: e.target.value,
                  }))
                }
                className="h-9"
                required
              />
            </div>

            <div id="dca-add-note-field" className="space-y-1">
              <label
                id="dca-add-note-label"
                htmlFor="dca-add-note-input"
                className="text-muted-foreground text-xs font-medium"
              >
                หมายเหตุ (ไม่บังคับ)
              </label>
              <Input
                id="dca-add-note-input"
                value={form.note}
                onChange={(e) =>
                  setForm((current) => ({ ...current, note: e.target.value }))
                }
                placeholder="หมายเหตุเพิ่มเติม"
                className="h-9"
              />
            </div>

            <div id="dca-add-form-actions" className="flex gap-2 pt-2">
              <Button
                id="dca-add-cancel-button"
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isLoading}
              >
                ยกเลิก
              </Button>
              <Button
                id="dca-add-submit-button"
                type="submit"
                className="flex-1 bg-yellow-500 text-black hover:bg-yellow-400"
                disabled={isLoading}
              >
                {isLoading ? "กำลังบันทึก..." : "บันทึก"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
