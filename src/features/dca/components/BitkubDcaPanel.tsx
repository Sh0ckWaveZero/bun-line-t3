import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBitkubDca } from "../hooks/useBitkubDca";
import { BitkubBuyHistory } from "./BitkubBuyHistory";

export function BitkubDcaPanel({ onImported }: { onImported: () => void }) {
  const {
    connection,
    history,
    dateLabels,
    balances,
    page,
    setPage,
    selected,
    setSelected,
    nextCursor,
    isBusy,
    message,
    outcomes,
    visibleError,
    handleConnect,
    handleDisconnect,
    handleSync,
    handleImport,
  } = useBitkubDca(onImported);
  return (
    <section
      aria-labelledby="bitkub-heading"
      aria-busy={isBusy}
      className="border-border bg-card mt-6 space-y-4 rounded-lg border p-4 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="bitkub-heading" className="text-lg font-semibold">
          Bitkub · นำเข้ารายการซื้อ BTC
        </h2>
        <span className="text-muted-foreground text-sm">
          {connection.isLoading
            ? "กำลังตรวจสอบการเชื่อมต่อ"
            : connection.data?.connected
              ? `เชื่อมต่อแล้ว ${connection.data.keyHint ?? ""}`
              : "ยังไม่ได้เชื่อมต่อ"}
        </span>
      </div>
      <p id="bitkub-key-help" className="text-muted-foreground text-sm">
        สร้าง API key ใน Bitkub และจำกัดสิทธิ์ให้อ่านข้อมูลเท่านั้น
        แอปอ่านยอดกระเป๋าและประวัติซื้อ
        การเชื่อมต่อสำเร็จไม่ได้ยืนยันว่าสิทธิ์ของ key ถูกจำกัดแล้ว
      </p>
      <p className="text-muted-foreground text-sm">
        เมื่อเปลี่ยน key
        ประวัติที่โหลดไว้ยังคงอยู่และอยู่ร่วมกับประวัติที่โหลดใหม่ ควรใช้ key
        ของบัญชี Bitkub เดิมเมื่อต้องการเก็บประวัติของบัญชีเดียว
      </p>
      {!connection.data?.connected && connection.data?.configured && (
        <form
          method="post"
          action="/api/exchanges/bitkub/connection"
          onSubmit={handleConnect}
        >
          <fieldset disabled={isBusy} className="space-y-3">
            <legend className="sr-only">ข้อมูลรับรอง Bitkub</legend>
            <div>
              <label htmlFor="bitkub-api-key" className="mb-1 block text-sm">
                API key
              </label>
              <Input
                id="bitkub-api-key"
                name="apiKey"
                type="password"
                autoComplete="off"
                spellCheck={false}
                required
                minLength={1}
                maxLength={256}
                aria-describedby="bitkub-key-help"
              />
            </div>
            <div>
              <label htmlFor="bitkub-api-secret" className="mb-1 block text-sm">
                API secret
              </label>
              <Input
                id="bitkub-api-secret"
                name="apiSecret"
                type="password"
                autoComplete="off"
                spellCheck={false}
                required
                minLength={1}
                maxLength={512}
                aria-describedby="bitkub-key-help"
              />
            </div>
            <Button type="submit">เชื่อมต่อ Bitkub</Button>
          </fieldset>
        </form>
      )}
      {connection.data && !connection.data.configured && (
        <p className="text-sm">
          ระบบยังไม่พร้อมรับการเชื่อมต่อ Bitkub กรุณาติดต่อผู้ดูแล
        </p>
      )}
      {connection.data?.connected && (
        <div className="flex flex-wrap gap-2">
          <Button type="button" disabled={isBusy} onClick={() => handleSync()}>
            โหลดประวัติล่าสุดจาก Bitkub
          </Button>
          {nextCursor && (
            <Button
              type="button"
              variant="outline"
              disabled={isBusy}
              onClick={() => handleSync(nextCursor)}
            >
              โหลดประวัติก่อนหน้านี้
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            disabled={isBusy}
            onClick={() => void balances.refetch()}
          >
            อัปเดตยอดกระเป๋า
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isBusy}
            onClick={handleDisconnect}
          >
            ยกเลิกการเชื่อมต่อ
          </Button>
        </div>
      )}
      {visibleError && (
        <p role="alert" className="text-destructive text-sm">
          {visibleError}
        </p>
      )}
      <p role="status" aria-live="polite" className="text-sm">
        {isBusy ? "กำลังดำเนินการ…" : message}
      </p>
      {connection.data?.connected && balances.data && (
        <div className="space-y-2">
          <h3 className="font-medium">ยอดกระเป๋าปัจจุบัน</h3>
          <p className="text-muted-foreground text-sm">
            ยอดกระเป๋าแสดงแยกจากต้นทุนและกำไรขาดทุน DCA
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">ยอดกระเป๋า Bitkub</caption>
              <thead>
                <tr>
                  <th scope="col" className="p-2">
                    สกุลเงิน
                  </th>
                  <th scope="col" className="p-2">
                    พร้อมใช้
                  </th>
                  <th scope="col" className="p-2">
                    สำรอง
                  </th>
                  <th scope="col" className="p-2">
                    รวม
                  </th>
                </tr>
              </thead>
              <tbody>
                {balances.data.map((balance) => (
                  <tr key={balance.currency} className="border-border border-t">
                    <th scope="row" className="p-2">
                      {balance.currency}
                    </th>
                    <td className="p-2">{balance.available}</td>
                    <td className="p-2">{balance.reserved}</td>
                    <td className="p-2">{balance.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <BitkubBuyHistory
        history={history}
        dateLabels={dateLabels}
        page={page}
        setPage={setPage}
        selected={selected}
        setSelected={setSelected}
        isBusy={isBusy}
        outcomes={outcomes}
        handleImport={handleImport}
      />
    </section>
  );
}
