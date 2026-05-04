"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DcaOrder } from "@/features/dca/types";
import { useDcaLocale } from "@/features/dca/lib/dca-locale-context";

interface GoalsSectionProps {
  orders: DcaOrder[];
}

const STORAGE_KEY = "dca-goals";

interface GoalValues {
  goalFiat: number;
  goalSatoshi: number;
}

const DEFAULT_GOALS: GoalValues = {
  goalFiat: 200_000,
  goalSatoshi: 2_000_000,
};

function loadGoals(): GoalValues {
  if (typeof window === "undefined") return DEFAULT_GOALS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_GOALS;
    const parsed = JSON.parse(raw) as Partial<GoalValues>;
    return {
      goalFiat: parsed.goalFiat ?? DEFAULT_GOALS.goalFiat,
      goalSatoshi: parsed.goalSatoshi ?? DEFAULT_GOALS.goalSatoshi,
    };
  } catch {
    return DEFAULT_GOALS;
  }
}

function saveGoals(goals: GoalValues) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
}

const fmtInt = (n: number): string => Math.round(n).toLocaleString("en-US");
const clampProgress = (value: number): number => Math.max(0, Math.min(100, value));
const toSafeNumber = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

type EditField = "goalFiat" | "goalSatoshi" | null;

export const GoalsSection = ({ orders }: GoalsSectionProps) => {
  const { t } = useDcaLocale();
  const [goals, setGoals] = useState<GoalValues>(DEFAULT_GOALS);
  const [editing, setEditing] = useState<EditField>(null);
  const [draft, setDraft] = useState<string>("");

  useEffect(() => {
    setGoals(loadGoals());
  }, []);

  const spendFiat = orders.reduce((sum, order) => sum + toSafeNumber(order.amountTHB), 0);
  const totalSatoshi = Math.round(
    orders
      .filter((order) => order.coin.toUpperCase() === "BTC")
      .reduce((sum, order) => sum + toSafeNumber(order.coinReceived) * 1e8, 0),
  );

  const progressFiatRaw =
    goals.goalFiat > 0 ? (toSafeNumber(spendFiat) / goals.goalFiat) * 100 : 0;
  const progressBTCRaw =
    goals.goalSatoshi > 0 ? (toSafeNumber(totalSatoshi) / goals.goalSatoshi) * 100 : 0;
  const progressFiat = clampProgress(progressFiatRaw);
  const progressBTC = clampProgress(progressBTCRaw);
  const btcFromSat = goals.goalSatoshi / 1e8;

  const startEdit = useCallback((field: EditField) => {
    if (!field) return;
    setEditing(field);
    setDraft(String(goals[field]));
  }, [goals]);

  const cancelEdit = useCallback(() => {
    setEditing(null);
    setDraft("");
  }, []);

  const saveEdit = useCallback(() => {
    if (!editing) return;
    const value = Math.floor(Number(draft));
    if (!Number.isInteger(value) || value <= 0) {
      cancelEdit();
      return;
    }
    const updated = { ...goals, [editing]: value };
    setGoals(updated);
    saveGoals(updated);
    setEditing(null);
    setDraft("");
  }, [editing, draft, goals, cancelEdit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") saveEdit();
      if (e.key === "Escape") cancelEdit();
    },
    [saveEdit, cancelEdit]
  );

  return (
    <div id="dca-goals-section" className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
      {/* Goal: Fiat Invested */}
      <div className="bg-card border-border/80 rounded-lg border p-4 shadow-sm sm:p-5">
        <div className="mb-2.5 flex items-baseline justify-between">
          <h3 className="text-foreground/80 text-xs font-semibold uppercase tracking-wider">
            {t.goals.goalFiatInvested}
          </h3>
          <div className="text-foreground font-mono text-lg font-medium tracking-tight sm:text-xl">
            {progressFiat.toFixed(2)}%
          </div>
        </div>
        <div className="bg-muted/70 border-border h-2.5 overflow-hidden rounded-sm border">
          <div
            className="dca-goal-fill h-full rounded-sm"
            style={{
              width: `${progressFiat}%`,
              minWidth: progressFiat > 0 ? "6px" : "0",
              backgroundColor: "rgb(249 115 22)",
            }}
          />
        </div>
        <div className="text-muted-foreground mt-1.5 flex items-center justify-between text-[10px]">
          <span className="font-mono">&#3647;{fmtInt(spendFiat)}</span>
          {editing === "goalFiat" ? (
            <span className="flex items-center gap-1">
              {t.goals.goalFiat}
              <Input
                type="number"
                value={draft}
                min={1}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={saveEdit}
                autoFocus
                className="h-5 w-24 border-orange-500 px-1 py-0 font-mono text-[10px]"
              />
              <Button variant="ghost" size="icon" onClick={saveEdit} className="h-4 w-4 p-0">
                <Check className="h-3 w-3 text-green-600" />
              </Button>
              <Button variant="ghost" size="icon" onClick={cancelEdit} className="h-4 w-4 p-0">
                <X className="h-3 w-3 text-red-500" />
              </Button>
            </span>
          ) : (
            <button
              onClick={() => startEdit("goalFiat")}
              className="hover:text-foreground inline-flex cursor-pointer items-center gap-1 border-b border-dashed border-transparent hover:border-current"
              title={t.goals.editGoalTitle}
            >
              {t.goals.goalFiat} <span className="font-mono">{fmtInt(goals.goalFiat)}</span>
              <Pencil className="h-2.5 w-2.5 opacity-50" />
            </button>
          )}
        </div>
      </div>

      {/* Goal: Total Satoshi */}
      <div className="bg-card border-border/80 rounded-lg border p-4 shadow-sm sm:p-5">
        <div className="mb-2.5 flex items-baseline justify-between">
          <h3 className="text-foreground/80 text-xs font-semibold uppercase tracking-wider">
            {t.goals.goalTotalSatoshi}
          </h3>
          <div className="text-foreground font-mono text-lg font-medium tracking-tight sm:text-xl">
            {progressBTC.toFixed(2)}%
          </div>
        </div>
        <div className="bg-muted/70 border-border h-2.5 overflow-hidden rounded-sm border">
          <div
            className="dca-goal-fill h-full rounded-sm"
            style={{
              width: `${progressBTC}%`,
              minWidth: progressBTC > 0 ? "6px" : "0",
              backgroundColor: "rgb(51 65 85)",
            }}
          />
        </div>
        <div className="text-muted-foreground mt-1.5 flex items-center justify-between text-[10px]">
          <span><span className="font-mono">{fmtInt(totalSatoshi)}</span> {t.goals.sat}</span>
          {editing === "goalSatoshi" ? (
            <span className="flex items-center gap-1">
              {t.goals.goalSatoshi}
              <Input
                type="number"
                value={draft}
                min={1}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={saveEdit}
                autoFocus
                className="h-5 w-28 border-orange-500 px-1 py-0 font-mono text-[10px]"
              />
              {t.goals.sat} {t.goals.btc((Number(draft) / 1e8).toFixed(2))}
              <Button variant="ghost" size="icon" onClick={saveEdit} className="h-4 w-4 p-0">
                <Check className="h-3 w-3 text-green-600" />
              </Button>
              <Button variant="ghost" size="icon" onClick={cancelEdit} className="h-4 w-4 p-0">
                <X className="h-3 w-3 text-red-500" />
              </Button>
            </span>
          ) : (
            <button
              onClick={() => startEdit("goalSatoshi")}
              className="hover:text-foreground inline-flex cursor-pointer items-center gap-1 border-b border-dashed border-transparent hover:border-current"
              title={t.goals.editGoalTitle}
            >
              {t.goals.goalSatoshi} <span className="font-mono">{fmtInt(goals.goalSatoshi)}</span> {t.goals.sat} {t.goals.btc(btcFromSat.toFixed(2))}
              <Pencil className="h-2.5 w-2.5 opacity-50" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
