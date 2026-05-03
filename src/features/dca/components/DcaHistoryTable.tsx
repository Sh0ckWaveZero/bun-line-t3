"use client";

import { Fragment, useState } from "react";
import { Bitcoin, ChevronDown, ChevronRight, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DcaOrder, DcaOrderListResult } from "@/features/dca/types";
import { formatCoin, formatDateOnly, formatTimeOnly, formatTHB } from "@/features/dca/utils/format";
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

const OrderDetailRow = ({ order, colSpan }: { order: DcaOrder; colSpan: number }) => (
  <tr id={`dca-order-detail-${order.id}`} className="bg-muted/5">
    <td colSpan={colSpan} className="px-4 pb-3 pt-1">
      <div className="border-l-2 border-primary/20 pl-3 flex flex-wrap gap-x-8 gap-y-1 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">Order ID</span>
          <span className="font-mono text-foreground/70">{order.orderId}</span>
        </div>
        {order.note && (
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">หมายเหตุ</span>
            <span className="text-foreground/70">{order.note}</span>
          </div>
        )}
      </div>
    </td>
  </tr>
);

export const DcaHistoryTable = ({
  ordersData,
  error,
  isLoading,
  page,
  onPageChange,
}: DcaHistoryTableProps) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
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
              กด &ldquo;เพิ่มคำสั่งซื้อ&rdquo; หรือส่ง message จาก Bitkub ผ่าน LINE
            </p>
          </div>
        )}

        {ordersData && ordersData.orders.length > 0 && (
          <div id="dca-table-scroll" className="overflow-x-auto">
            <table id="dca-orders-table" className="w-full text-sm">
              <thead id="dca-orders-table-head">
                <tr id="dca-orders-table-head-row" className="border-border bg-muted/30 border-b">
                  <th className="w-px py-3 pl-3 pr-1" />
                  <th id="dca-orders-header-executed-at" className="text-muted-foreground w-px px-4 py-3 text-left font-medium whitespace-nowrap">
                    วันที่ทำการ
                  </th>
                  <th id="dca-orders-header-transaction" className="text-muted-foreground px-4 py-3 text-left font-medium whitespace-nowrap">
                    รายละเอียดการซื้อ
                  </th>
                  <th id="dca-orders-header-status" className="text-muted-foreground px-4 py-3 text-center font-medium whitespace-nowrap">
                    สถานะ
                  </th>
                </tr>
              </thead>
              <tbody id="dca-orders-table-body" className="divide-border divide-y">
                {ordersData.orders.map((order) => {
                  const isExpanded = expandedRows.has(order.id);
                  return (
                    <Fragment key={order.id}>
                      <tr
                        id={`dca-order-row-${order.id}`}
                        className="hover:bg-muted/20 cursor-pointer transition-colors"
                        onClick={() => toggleRow(order.id)}
                      >
                        <td className="w-px py-3 pl-3 pr-1">
                          {isExpanded ? (
                            <ChevronDown className="text-muted-foreground h-4 w-4" />
                          ) : (
                            <ChevronRight className="text-muted-foreground h-4 w-4" />
                          )}
                        </td>
                        <td
                          id={`dca-order-${order.id}-executed-at`}
                          className="w-px px-4 py-3 whitespace-nowrap"
                        >
                          <div className="flex items-center gap-2 text-sm">
                            <span>{formatDateOnly(order.executedAt)}</span>
                            <span className="text-muted-foreground">{formatTimeOnly(order.executedAt)}</span>
                          </div>
                          <div id={`dca-order-${order.id}-round`} className="mt-1">
                            <Badge
                              id={`dca-order-${order.id}-round-badge`}
                              className="border-border bg-muted text-muted-foreground hover:bg-muted px-1.5 py-0 text-xs font-normal"
                            >
                              รอบ {order.round}
                            </Badge>
                          </div>
                        </td>
                        <td
                          id={`dca-order-${order.id}-transaction`}
                          className="px-4 py-3 whitespace-nowrap"
                        >
                          <div
                            id={`dca-order-${order.id}-transaction-primary`}
                            className="flex items-center gap-2"
                          >
                            <CoinIcon coin={order.coin} idPrefix={`dca-order-${order.id}`} />
                            <span id={`dca-order-${order.id}-amount-value`} className="font-medium">
                              {formatTHB(order.amountTHB)} บาท
                            </span>
                            <span className="text-muted-foreground">→</span>
                            <span id={`dca-order-${order.id}-coin-received-value`} className="font-mono font-medium">
                              {formatCoin(order.coinReceived)}{" "}
                              <span id={`dca-order-${order.id}-coin-received-unit`} className="text-muted-foreground text-xs">
                                {order.coin}
                              </span>
                            </span>
                          </div>
                          <div id={`dca-order-${order.id}-price`} className="text-muted-foreground mt-0.5 pl-8 text-xs">
                            @ {formatTHB(order.pricePerCoin)} บาท/เหรียญ
                          </div>
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
                      </tr>
                      {isExpanded && (
                        <OrderDetailRow order={order} colSpan={4} />
                      )}
                    </Fragment>
                  );
                })}
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
};
