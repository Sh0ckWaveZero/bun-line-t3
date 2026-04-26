import { Bitcoin, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DcaOrderListResult } from "@/features/dca/types";
import { formatCoin, formatDate, formatTHB } from "@/features/dca/utils/format";
import { Pagination } from "./Pagination";

interface DcaHistoryTableProps {
  ordersData: DcaOrderListResult | undefined;
  error: string | null;
  isLoading: boolean;
  page: number;
  onPageChange: (page: number) => void;
}

const StatusBadge = ({ idPrefix, status }: { idPrefix: string; status: string }) => {
  if (status === "SUCCESS") {
    return (
      <Badge
        id={`${idPrefix}-status-success`}
        className="border-green-500/30 bg-green-500/20 px-2 py-0.5 text-xs font-medium text-green-400 hover:bg-green-500/20"
      >
        สำเร็จ
      </Badge>
    );
  }

  if (status === "FAILED") {
    return (
      <Badge
        id={`${idPrefix}-status-failed`}
        className="border-red-500/30 bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-400 hover:bg-red-500/20"
      >
        ล้มเหลว
      </Badge>
    );
  }

  return (
    <span id={`${idPrefix}-status-empty`} className="text-muted-foreground text-sm">
      -
    </span>
  );
};

const CoinIcon = ({ coin, idPrefix }: { coin: string; idPrefix: string }) => {
  if (coin === "BTC") {
    return (
      <span
        id={`${idPrefix}-coin-icon-btc`}
        className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white"
      >
        ₿
      </span>
    );
  }

  if (coin === "ETH") {
    return (
      <span
        id={`${idPrefix}-coin-icon-eth`}
        className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white"
      >
        Ξ
      </span>
    );
  }

  return (
    <span
      id={`${idPrefix}-coin-icon-${coin.toLowerCase()}`}
      className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-purple-500 text-xs font-bold text-white"
    >
      {coin[0]}
    </span>
  );
};

export const DcaHistoryTable = ({
  ordersData,
  error,
  isLoading,
  page,
  onPageChange,
}: DcaHistoryTableProps) => (
  <Card id="dca-table-card" className="border-border">
    <CardHeader id="dca-table-header" className="pb-2">
      <CardTitle id="dca-table-title" className="text-base font-semibold">
        รายการคำสั่งซื้อทั้งหมด
        {ordersData && (
          <span
            id="dca-table-total-count"
            className="text-muted-foreground ml-2 text-sm font-normal"
          >
            ({ordersData.total} รายการ)
          </span>
        )}
      </CardTitle>
    </CardHeader>
    <CardContent id="dca-table-content" className="p-0">
      {error && (
        <div id="dca-table-error" className="px-6 py-4 text-sm text-red-500">
          {error}
        </div>
      )}

      {isLoading && !ordersData && (
        <div
          id="dca-table-loading"
          className="text-muted-foreground flex items-center justify-center py-16"
        >
          <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
          กำลังโหลด...
        </div>
      )}

      {ordersData && ordersData.orders.length === 0 && !isLoading && (
        <div
          id="dca-table-empty"
          className="text-muted-foreground flex flex-col items-center justify-center py-16"
        >
          <Bitcoin className="mb-3 h-12 w-12 opacity-30" />
          <p id="dca-table-empty-title" className="text-sm">
            ยังไม่มีประวัติคำสั่งซื้อ
          </p>
          <p id="dca-table-empty-description" className="mt-1 text-xs">
            กด &ldquo;เพิ่มคำสั่งซื้อ&rdquo; หรือส่ง message จาก Bitkub ผ่าน
            LINE
          </p>
        </div>
      )}

      {ordersData && ordersData.orders.length > 0 && (
        <div id="dca-table-scroll" className="overflow-x-auto">
          <table id="dca-orders-table" className="w-full text-sm">
            <thead id="dca-orders-table-head">
              <tr id="dca-orders-table-head-row" className="border-border bg-muted/30 border-b">
                <th id="dca-orders-header-order-id" className="text-muted-foreground px-4 py-3 text-left font-medium whitespace-nowrap">
                  ID คำสั่ง
                </th>
                <th id="dca-orders-header-executed-at" className="text-muted-foreground px-4 py-3 text-left font-medium whitespace-nowrap">
                  วันที่ทำการ
                </th>
                <th id="dca-orders-header-coin" className="text-muted-foreground px-4 py-3 text-left font-medium whitespace-nowrap">
                  เหรียญ
                </th>
                <th id="dca-orders-header-amount" className="text-muted-foreground px-4 py-3 text-right font-medium whitespace-nowrap">
                  จำนวนเงินต่อรอบ
                </th>
                <th id="dca-orders-header-coin-received" className="text-muted-foreground px-4 py-3 text-right font-medium whitespace-nowrap">
                  จำนวนเหรียญที่ได้รับ
                </th>
                <th id="dca-orders-header-price" className="text-muted-foreground px-4 py-3 text-right font-medium whitespace-nowrap">
                  ราคาต่อเหรียญ
                </th>
                <th id="dca-orders-header-round" className="text-muted-foreground px-4 py-3 text-center font-medium whitespace-nowrap">
                  รอบที่
                </th>
                <th id="dca-orders-header-status" className="text-muted-foreground px-4 py-3 text-center font-medium whitespace-nowrap">
                  สถานะ
                </th>
                <th id="dca-orders-header-note" className="text-muted-foreground px-4 py-3 text-left font-medium whitespace-nowrap">
                  หมายเหตุ
                </th>
              </tr>
            </thead>
            <tbody id="dca-orders-table-body" className="divide-border divide-y">
              {ordersData.orders.map((order) => (
                <tr
                  id={`dca-order-row-${order.id}`}
                  key={order.id}
                  className="hover:bg-muted/20 transition-colors"
                >
                  <td
                    id={`dca-order-${order.id}-order-id`}
                    className="text-muted-foreground px-4 py-3 font-mono text-xs whitespace-nowrap"
                  >
                    {order.orderId}
                  </td>
                  <td
                    id={`dca-order-${order.id}-executed-at`}
                    className="px-4 py-3 text-xs whitespace-nowrap"
                  >
                    {formatDate(order.executedAt)}
                  </td>
                  <td
                    id={`dca-order-${order.id}-coin`}
                    className="px-4 py-3 whitespace-nowrap"
                  >
                    <div
                      id={`dca-order-${order.id}-coin-group`}
                      className="flex items-center gap-2"
                    >
                      <CoinIcon
                        coin={order.coin}
                        idPrefix={`dca-order-${order.id}`}
                      />
                      <span
                        id={`dca-order-${order.id}-coin-label`}
                        className="font-medium"
                      >
                        {order.coin}
                      </span>
                    </div>
                  </td>
                  <td
                    id={`dca-order-${order.id}-amount`}
                    className="px-4 py-3 text-right whitespace-nowrap"
                  >
                    <span
                      id={`dca-order-${order.id}-amount-value`}
                      className="font-medium"
                    >
                      {formatTHB(order.amountTHB)}
                    </span>
                    <span
                      id={`dca-order-${order.id}-amount-unit`}
                      className="text-muted-foreground ml-1 text-xs"
                    >
                      บาท
                    </span>
                  </td>
                  <td
                    id={`dca-order-${order.id}-coin-received`}
                    className="px-4 py-3 text-right font-mono text-xs whitespace-nowrap"
                  >
                    {formatCoin(order.coinReceived)}{" "}
                    <span
                      id={`dca-order-${order.id}-coin-received-unit`}
                      className="text-muted-foreground"
                    >
                      {order.coin}
                    </span>
                  </td>
                  <td
                    id={`dca-order-${order.id}-price`}
                    className="px-4 py-3 text-right whitespace-nowrap"
                  >
                    <span id={`dca-order-${order.id}-price-value`}>
                      {formatTHB(order.pricePerCoin)}
                    </span>
                    <span
                      id={`dca-order-${order.id}-price-unit`}
                      className="text-muted-foreground ml-1 text-xs"
                    >
                      บาท
                    </span>
                  </td>
                  <td
                    id={`dca-order-${order.id}-round`}
                    className="px-4 py-3 text-center"
                  >
                    <span
                      id={`dca-order-${order.id}-round-value`}
                      className="font-medium"
                    >
                      {order.round}
                    </span>
                  </td>
                  <td
                    id={`dca-order-${order.id}-status`}
                    className="px-4 py-3 text-center"
                  >
                    <StatusBadge
                      idPrefix={`dca-order-${order.id}`}
                      status={order.status}
                    />
                  </td>
                  <td
                    id={`dca-order-${order.id}-note`}
                    className="text-muted-foreground max-w-[120px] truncate px-4 py-3"
                  >
                    {order.note ?? "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {ordersData && (
        <div id="dca-table-pagination" className="border-border border-t px-4">
          <Pagination
            currentPage={page}
            totalPages={ordersData.totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </CardContent>
  </Card>
);
