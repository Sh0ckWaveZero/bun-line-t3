import { TransactionRow } from "@/features/expenses/components/TransactionRow";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  TRANSACTION_TABS,
  type TransactionTab,
} from "@/features/expenses/constants";
import type { TransactionWithCategory } from "@/features/expenses/types";
import { useState } from "react";
import { Loader2 } from "lucide-react";

interface TransactionsTabsProps {
  transactions: TransactionWithCategory[];
  isLoading: boolean;
  hideAmounts: boolean;
  onEdit: (tx: TransactionWithCategory) => void;
  onDelete: (id: string) => void;
}

/** แท็บกรองรายการ (ทั้งหมด/รายจ่าย/รายรับ) พร้อม animated indicator */
export function TransactionsTabs({
  transactions,
  isLoading,
  hideAmounts,
  onEdit,
  onDelete,
}: TransactionsTabsProps) {
  const [activeTab, setActiveTab] = useState<TransactionTab>("all");
  const tabIndex = TRANSACTION_TABS.indexOf(activeTab);
  const tabCount = TRANSACTION_TABS.length;

  return (
    <Tabs
      id="transactions-tabs"
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as TransactionTab)}
    >
      <div
        id="transactions-tabs-list"
        role="tablist"
        className="bg-muted/50 relative mb-3 flex w-full rounded-xl p-1 sm:mb-4"
      >
        <div
          aria-hidden="true"
          className="bg-background absolute rounded-lg shadow-sm"
          style={{
            top: "4px",
            bottom: "4px",
            left: `calc(${(tabIndex / tabCount) * 100}% + ${4 - (tabIndex * 8) / tabCount}px)`,
            width: `calc(${(1 / tabCount) * 100}% - ${8 / tabCount}px)`,
            transition: "left 250ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
        {TRANSACTION_TABS.map((tab) => (
          <button
            key={tab}
            id={`tab-trigger-${tab}`}
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "relative z-10 flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors duration-200 sm:text-sm",
              activeTab === tab
                ? "text-foreground"
                : tab === "EXPENSE"
                  ? "text-card-red/60 hover:text-card-red"
                  : tab === "INCOME"
                    ? "text-card-green/60 hover:text-card-green"
                    : "text-muted-foreground hover:text-foreground/70",
            )}
          >
            {tab === "all"
              ? "ทั้งหมด"
              : tab === "EXPENSE"
                ? "รายจ่าย"
                : "รายรับ"}
          </button>
        ))}
      </div>
      {TRANSACTION_TABS.map((tab) => {
        const list =
          tab === "all"
            ? transactions
            : transactions.filter((t) => t.type === tab);
        return (
          <TabsContent
            id={`tab-content-${tab}`}
            key={tab}
            value={tab}
            className="data-[state=active]:animate-tab-in space-y-2 pb-24"
          >
            {isLoading && (
              <div
                id="transactions-loading"
                className="text-muted-foreground flex items-center justify-center py-12"
              >
                <Loader2 size={24} className="animate-spin" />
              </div>
            )}
            {!isLoading && list.length === 0 && (
              <Card
                id="transactions-empty-card"
                className="border-border/50 bg-card/60 dark:bg-card/45"
              >
                <CardContent
                  id="transactions-empty-content"
                  className="text-muted-foreground py-12 text-center"
                >
                  <p id="transactions-empty-msg" className="text-sm">
                    ยังไม่มีรายการ
                  </p>
                </CardContent>
              </Card>
            )}
            <div id={`transactions-list-${tab}`} className="space-y-2">
              {list.map((tx) => (
                <TransactionRow
                  key={tx.id}
                  tx={tx}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  hideAmounts={hideAmounts}
                />
              ))}
            </div>
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
