import { Button } from "@/components/ui/button";
import type { useBitkubDca } from "../hooks/useBitkubDca";

type BitkubHistoryProps = Pick<
  ReturnType<typeof useBitkubDca>,
  | "dateLabels"
  | "history"
  | "page"
  | "setPage"
  | "selected"
  | "setSelected"
  | "isBusy"
  | "outcomes"
  | "handleImport"
>;

export function BitkubBuyHistory({
  history,
  dateLabels,
  page,
  setPage,
  selected,
  setSelected,
  isBusy,
  outcomes,
  handleImport,
}: BitkubHistoryProps) {
  const selectedIds = new Set(selected);
  const outcomesById = new Map(
    outcomes.map((outcome) => [outcome.buyId, outcome]),
  );
  return (
    <div className="space-y-2">
      <h3 className="font-medium">รายการซื้อที่โหลดไว้</h3>
      <p className="text-muted-foreground text-sm">
        ต้นทุนรวมค่าธรรมเนียม THB จำนวน BTC คำนวณจากยอดซื้อ THB ÷ ราคา
        เลือกเฉพาะรายการที่ต้องการเพิ่มใน DCA ประวัติจาก API
        อาจไม่ครอบคลุมข้อมูลเก่าที่ Bitkub จัดเก็บถาวร
      </p>
      {history.data?.buys.length ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">
              รายการซื้อ BTC ที่เลือกนำเข้า DCA ได้
            </caption>
            <thead>
              <tr>
                <th scope="col" className="p-2">
                  เลือก
                </th>
                <th scope="col" className="p-2">
                  วันเวลา / รหัสธุรกรรม
                </th>
                <th scope="col" className="p-2">
                  ต้นทุน THB รวมค่าธรรมเนียม
                </th>
                <th scope="col" className="p-2">
                  BTC
                </th>
                <th scope="col" className="p-2">
                  สถานะ
                </th>
              </tr>
            </thead>
            <tbody>
              {history.data.buys.map((buy) => {
                const outcome = outcomesById.get(buy.id);
                return (
                  <tr key={buy.id} className="border-border border-t">
                    <td className="p-2">
                      <label className="flex min-h-10 min-w-10 items-center justify-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(buy.id)}
                          disabled={isBusy || buy.imported}
                          onChange={(event) =>
                            setSelected((current) =>
                              event.target.checked
                                ? [...current, buy.id]
                                : current.filter((id) => id !== buy.id),
                            )
                          }
                        />
                        <span className="sr-only">
                          เลือกธุรกรรม {buy.externalTradeIdentity}
                        </span>
                      </label>
                    </td>
                    <th scope="row" className="p-2 font-normal">
                      <time dateTime={buy.executedAt}>
                        {dateLabels.get(buy.id)}
                      </time>
                      <span className="text-muted-foreground block text-xs break-all">
                        {buy.externalTradeIdentity}
                      </span>
                    </th>
                    <td className="p-2">
                      {buy.spentTHB}
                      <span className="text-muted-foreground block text-xs">
                        ค่าธรรมเนียม {buy.feeTHB}
                      </span>
                    </td>
                    <td className="p-2">{buy.receivedBTC}</td>
                    <td className="p-2">
                      {buy.imported
                        ? "นำเข้าแล้ว"
                        : outcome?.status === "legacy_conflict"
                          ? "อาจซ้ำข้อมูลเดิม กรุณาตรวจสอบ"
                          : "พร้อมนำเข้า"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">
          {history.isLoading
            ? "กำลังโหลดรายการ"
            : "ยังไม่มีรายการซื้อที่โหลดไว้"}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          disabled={isBusy || selected.length === 0}
          onClick={handleImport}
        >
          นำเข้า {selected.length} รายการที่เลือก
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isBusy || page <= 1}
          onClick={() => {
            setSelected([]);
            setPage((current) => current - 1);
          }}
        >
          หน้าก่อนหน้า
        </Button>
        <span className="text-muted-foreground text-sm">
          หน้า {page} / {Math.max(1, history.data?.totalPages ?? 1)}
        </span>
        <Button
          type="button"
          variant="outline"
          disabled={isBusy || page >= (history.data?.totalPages ?? 1)}
          onClick={() => {
            setSelected([]);
            setPage((current) => current + 1);
          }}
        >
          หน้าถัดไป
        </Button>
      </div>
    </div>
  );
}
