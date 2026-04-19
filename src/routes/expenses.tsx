"use client";

/**
 * Expense Tracker Page — /expenses
 * บันทึกและดูรายรับรายจ่ายแยกตาม user
 */

import { AlertDialog, AlertDialogContent } from "@/components/ui/AlertDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryCombobox } from "@/components/expenses/CategoryCombobox";
import { PopoverDatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  EMOJI_LIST,
  TRANSACTION_TYPE_COLORS,
} from "@/features/expenses/constants";
import {
  formatAmount,
  formatMonthThai,
  getCurrentMonth,
  shiftMonth,
  toTransDate,
} from "@/features/expenses/helpers";
import type {
  CategorySummary,
  CreateTransactionInput,
  ExpenseCategory,
  MonthlySummary,
  TransactionWithCategory,
} from "@/features/expenses/types";
import { useSession } from "@/lib/auth/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  ChevronLeft,
  ChevronRight,
  Edit,
  Loader2,
  Plus,
  RefreshCw,
  Tag,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

// ─────────────────────────────────────────────
// Route
// ─────────────────────────────────────────────

export const Route = createFileRoute("/expenses")({
  component: ExpensesPage,
});

// ─────────────────────────────────────────────
// API helpers
// ─────────────────────────────────────────────

async function fetchTransactions(
  transMonth: string,
): Promise<TransactionWithCategory[]> {
  const res = await fetch(`/api/expenses?transMonth=${transMonth}&limit=100`);
  if (!res.ok) throw new Error("ไม่สามารถดึงรายการได้");
  const json = (await res.json()) as { data: TransactionWithCategory[] };
  return json.data;
}

async function fetchSummary(
  transMonth: string,
): Promise<{ summary: MonthlySummary; categories: CategorySummary[] }> {
  const res = await fetch(`/api/expenses/summary?transMonth=${transMonth}`);
  if (!res.ok) throw new Error("ไม่สามารถดึงสรุปได้");
  const json = (await res.json()) as {
    data: { summary: MonthlySummary; categories: CategorySummary[] };
  };
  return json.data;
}

async function fetchCategories(): Promise<ExpenseCategory[]> {
  const res = await fetch("/api/expenses/categories");
  if (!res.ok) throw new Error("ไม่สามารถดึงหมวดหมู่ได้");
  const json = (await res.json()) as { data: ExpenseCategory[] };
  return json.data;
}

// ─────────────────────────────────────────────
// SummaryCard — ใช้ Card จาก project
// ─────────────────────────────────────────────

interface SummaryCardProps {
  label: string;
  amount: number;
  icon: React.ReactNode;
  iconBg: string;
  id: string;
  className?: string;
}

function SummaryCard({ label, amount, icon, iconBg, id, className }: SummaryCardProps) {
  return (
    <Card
      id={`summary-card-${id}`}
      className={`border-border/70 bg-card/85 hover:border-theme-hover dark:bg-card/70 relative overflow-hidden border transition-colors ${className || ""}`}
    >
      <div
        id={`summary-card-accent-${id}`}
        className={`absolute inset-x-0 top-0 h-1 ${iconBg}`}
      />
      <CardContent id={`summary-card-content-${id}`} className="p-3 sm:p-4">
        <div
          id={`summary-card-row-${id}`}
          className="flex items-center gap-2 sm:gap-3"
        >
          <div
            id={`summary-icon-${id}`}
            className={`border-border/50 rounded-lg border p-2 sm:p-2.5 ${iconBg}`}
          >
            {icon}
          </div>
          <div id={`summary-text-${id}`} className="min-w-0 flex-1">
            <p
              id={`summary-label-${id}`}
              className="text-muted-foreground text-[10px] font-medium sm:text-xs"
            >
              {label}
            </p>
            <p
              id={`summary-amount-${id}`}
              className="text-foreground text-lg font-bold tabular-nums sm:text-xl"
            >
              {formatAmount(amount)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────
// TransactionRow — ใช้ theme colors
// ─────────────────────────────────────────────

interface TransactionRowProps {
  tx: TransactionWithCategory;
  onEdit?: (tx: TransactionWithCategory) => void;
  onDelete: (id: string) => void;
}

function TransactionRow({ tx, onEdit, onDelete }: TransactionRowProps) {
  const isIncome = tx.type === "INCOME";
  const rowTone = isIncome
    ? "border-card-green bg-card-green/70 dark:bg-card-green/40"
    : "border-card-red bg-card-red/70 dark:bg-card-red/40";
  return (
    <Card
      id={`transaction-card-${tx.id}`}
      className="group border-border/60 bg-card/85 hover:border-theme-hover dark:bg-card/70 relative overflow-hidden border transition-colors"
    >
      <CardContent
        id={`transaction-card-content-${tx.id}`}
        className="flex items-center justify-between gap-3 p-2.5 sm:p-3"
      >
        <div
          id={`transaction-main-${tx.id}`}
          className="flex min-w-0 items-center gap-2 sm:gap-3"
        >
          <span
            id={`transaction-emoji-${tx.id}`}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-lg sm:h-10 sm:w-10 sm:text-2xl ${rowTone}`}
          >
            {tx.category.icon ?? (isIncome ? "💰" : "💸")}
          </span>
          <div className="min-w-0 flex-1">
            <p
              id={`transaction-category-${tx.id}`}
              className="text-foreground truncate text-xs font-medium sm:text-sm"
            >
              {tx.category.name}
            </p>
            {tx.note && (
              <p
                id={`transaction-note-${tx.id}`}
                className="text-muted-foreground/70 mt-0.5 line-clamp-1 text-[10px] sm:text-xs"
              >
                {tx.note}
              </p>
            )}
          </div>
        </div>
        <div
          id={`transaction-actions-${tx.id}`}
          className="flex shrink-0 items-center gap-1 sm:gap-1.5"
        >
          <span
            id={`transaction-amount-${tx.id}`}
            className="text-xs font-bold tabular-nums sm:text-sm mr-1 sm:mr-2"
            style={{
              color: isIncome
                ? TRANSACTION_TYPE_COLORS.INCOME
                : TRANSACTION_TYPE_COLORS.EXPENSE,
            }}
          >
            {isIncome ? "+" : "-"}
            {formatAmount(tx.amount)}
          </span>
          {onEdit && (
            <Button
              id={`transaction-edit-btn-${tx.id}`}
              variant="ghost"
              size="icon"
              className="text-muted-foreground/30 hover:text-primary hover:bg-primary/10 h-7 w-7 sm:h-8 sm:w-8 transition-colors"
              onClick={() => onEdit(tx)}
              aria-label="แก้ไข"
            >
              <Edit size={14} />
            </Button>
          )}
          <Button
            id={`transaction-delete-btn-${tx.id}`}
            variant="ghost"
            size="icon"
            className="text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 h-7 w-7 sm:h-8 sm:w-8 transition-colors"
            onClick={() => onDelete(tx.id)}
            aria-label="ลบ"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────
// Emoji Picker Modal — สำหรับเลือก emoji
// ─────────────────────────────────────────────

interface EmojiPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (emoji: string) => void;
}

function EmojiPickerModal({
  open,
  onOpenChange,
  onSelect,
}: EmojiPickerModalProps) {
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto focus input when modal opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const filtered = search
    ? EMOJI_LIST.filter((e) => e.includes(search))
    : EMOJI_LIST;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        id="emoji-picker-modal"
        className="border-border/70 bg-card fixed top-1/2 left-1/2 z-60 flex max-h-[85vh] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-lg border p-0"
      >
        <div
          id="emoji-picker-header"
          className="border-border/50 flex shrink-0 flex-row items-center justify-between space-y-0 border-b px-5 py-4"
        >
          <h3
            id="emoji-picker-title"
            className="text-foreground text-sm font-semibold"
          >
            เลือก Emoji
          </h3>
          <Button
            id="emoji-picker-close-btn"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="hover:bg-muted h-8 w-8 rounded-lg"
          >
            <X id="emoji-picker-close-icon" size={18} />
          </Button>
        </div>

        <div
          id="emoji-picker-content"
          className="min-h-0 flex-1 space-y-3 overflow-y-auto p-5"
        >
          {/* Native emoji input */}
          <div id="emoji-search-wrapper" className="relative">
            <Input
              id="emoji-native-input"
              ref={inputRef}
              value={search}
              onChange={(e) => {
                const val = e.target.value;
                setSearch(val);
                // If user typed an emoji, select it
                if (val && val !== search) {
                  const segmenter = new Intl.Segmenter(undefined, {
                    granularity: "grapheme",
                  });
                  const segs = [...segmenter.segment(val)];
                  if (segs.length > 0) {
                    const lastEmoji = segs[segs.length - 1]!.segment;
                    if (EMOJI_LIST.includes(lastEmoji)) {
                      onSelect(lastEmoji);
                      onOpenChange(false);
                    }
                  }
                }
              }}
              placeholder="🔍 พิมพ์ emoji..."
              className="h-10 border-2 text-center text-xl"
              maxLength={10}
            />
            <div
              id="emoji-search-count"
              className="text-muted-foreground/50 absolute top-1/2 right-3 -translate-y-1/2 text-xs"
            >
              {search.length > 0 && `${filtered.length} ตัว`}
            </div>
          </div>

          {/* Emoji grid */}
          <div
            id="emoji-grid"
            className="grid max-h-[40vh] grid-cols-8 gap-1.5 overflow-y-auto pb-1"
          >
            {filtered.slice(0, 200).map((emoji) => (
              <button
                key={emoji}
                id={`emoji-btn-${emoji.codePointAt(0)}`}
                type="button"
                onClick={() => {
                  onSelect(emoji);
                  onOpenChange(false);
                }}
                className="hover:border-border hover:bg-muted flex h-10 w-10 items-center justify-center rounded-lg border border-transparent text-2xl transition-colors"
                aria-label={`เลือก ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>

          {filtered.length === 0 && (
            <div id="emoji-empty-msg" className="py-8 text-center">
              <p
                id="emoji-empty-title"
                className="text-muted-foreground text-sm"
              >
                ไม่พบ emoji
              </p>
              <p
                id="emoji-empty-description"
                className="text-muted-foreground/60 mt-1 text-xs"
              >
                ลองเปลี่ยนคำค้น
              </p>
            </div>
          )}
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─────────────────────────────────────────────
// CategoryManagerModal — จัดการหมวดหมู่ทั้งหมด
// ─────────────────────────────────────────────

interface CategoryManagerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: ExpenseCategory[];
  onEdit: (category: ExpenseCategory) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

function CategoryManagerModal({
  open,
  onOpenChange,
  categories,
  onEdit,
  onDelete,
  onAdd,
}: CategoryManagerModalProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        id="category-manager-modal"
        className="border-border bg-card fixed top-1/2 left-1/2 z-50 flex max-h-[85vh] w-[calc(100vw-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-lg border"
      >
        {/* Header */}
        <div
          id="category-manager-header"
          className="border-border/50 relative flex shrink-0 items-center justify-center border-b px-6 py-4"
        >
          <h3
            id="category-manager-title"
            className="text-foreground text-center text-xl font-bold sm:text-2xl"
          >
            หมวดหมู่
          </h3>
          <Button
            id="category-manager-close-btn"
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:bg-muted absolute top-1/2 right-4 h-10 w-10 -translate-y-1/2 rounded-full"
          >
            <X id="category-manager-close-icon" size={22} />
          </Button>
        </div>

        {/* Category List */}
        <div
          id="category-manager-list"
          className="min-h-0 flex-1 overflow-y-auto px-6 py-4"
        >
          {categories.length === 0 ? (
            <div
              id="category-manager-empty"
              className="text-muted-foreground py-10 text-center text-sm"
            >
              ไม่มีหมวดหมู่
            </div>
          ) : (
            <div className="divide-border/70 divide-y">
              {categories.map((category) => (
                <div
                  key={category.id}
                  id={`category-manager-item-${category.id}`}
                  className="group hover:bg-muted/35 flex items-center justify-between gap-4 py-4 transition-colors"
                >
                  <div
                    id={`category-manager-item-main-${category.id}`}
                    className="flex min-w-0 items-center gap-4"
                  >
                    <span
                      id={`category-manager-item-icon-${category.id}`}
                      className="border-border bg-muted/40 flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border text-2xl"
                    >
                      {category.icon ?? "📦"}
                    </span>
                    <div
                      id={`category-manager-item-text-${category.id}`}
                      className="min-w-0"
                    >
                      <p
                        id={`category-manager-item-name-${category.id}`}
                        className="text-foreground truncate text-base font-semibold"
                      >
                        {category.name}
                      </p>
                      <p
                        id={`category-manager-item-meta-${category.id}`}
                        className="text-muted-foreground text-sm"
                      >
                        {category.isDefault ? "ค่าเริ่มต้น" : "กำหนดเอง"}
                      </p>
                    </div>
                  </div>
                  <div
                    id={`category-manager-item-actions-${category.id}`}
                    className="flex gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    <Button
                      id={`category-manager-edit-btn-${category.id}`}
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-foreground hover:bg-muted h-9 w-9 rounded-lg"
                      onClick={() => onEdit(category)}
                    >
                      <Edit size={14} />
                    </Button>
                    <Button
                      id={`category-manager-delete-btn-${category.id}`}
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-9 w-9 rounded-lg"
                      onClick={() => onDelete(category.id)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          id="category-manager-footer"
          className="bg-card shrink-0 px-6 pt-2 pb-6"
        >
          <Button
            id="category-manager-add-btn"
            type="button"
            className="bg-foreground text-background hover:bg-foreground/90 h-12 w-full gap-3 rounded-lg text-base font-semibold"
            onClick={() => {
              onAdd();
              onOpenChange(false);
            }}
          >
            <Plus id="category-manager-add-icon" size={16} />
            เพิ่มหมวดหมู่
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─────────────────────────────────────────────
// AddCategoryModal — เพิ่ม/แก้ไขหมวดหมู่
// ─────────────────────────────────────────────

interface AddCategoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { name: string; icon: string }) => Promise<void>;
  isLoading: boolean;
  editMode?: boolean;
  category?: ExpenseCategory | null;
}

function AddCategoryModal({
  open,
  onOpenChange,
  onSave,
  isLoading,
  editMode,
  category,
}: AddCategoryModalProps) {
  const [icon, setIcon] = useState(() =>
    editMode && category ? (category.icon ?? "🤔") : "🤔",
  );
  const [name, setName] = useState(() =>
    editMode && category ? category.name : "",
  );
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await onSave({ name: name.trim(), icon });
  };

  return (
    <>
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent
          id="add-category-modal"
          className="border-border bg-card fixed top-1/2 left-1/2 z-50 flex max-h-[85vh] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-lg border p-0"
        >
          {/* Header */}
          <div
            id="add-category-modal-header"
            className="border-border/50 relative flex shrink-0 items-center justify-center border-b px-6 py-4"
          >
            <h3
              id="add-category-modal-title"
              className="text-foreground text-center text-lg font-bold"
            >
              {editMode ? "แก้ไขหมวดหมู่" : "หมวดหมู่"}
            </h3>
            <Button
              id="add-category-close-btn"
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="text-muted-foreground hover:bg-muted absolute top-1/2 right-4 h-8 w-8 -translate-y-1/2 rounded-full"
            >
              <X id="add-category-close-icon" size={18} />
            </Button>
          </div>

          <div
            id="add-category-modal-content"
            className="min-h-0 flex-1 overflow-y-auto px-6 py-6"
          >
            <form
              id="add-category-form"
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {/* Emoji picker */}
              <div
                id="category-emoji-group"
                className="flex justify-center pt-1"
              >
                <button
                  id="category-emoji-selector"
                  type="button"
                  className="group border-border hover:border-foreground/60 bg-muted/35 relative flex h-28 w-32 items-center justify-center overflow-hidden rounded-lg border p-0 transition-colors"
                  onClick={() => setShowEmojiPicker(true)}
                  aria-label="เลือกไอคอนหมวดหมู่"
                >
                  <span
                    id="category-emoji-preview"
                    className="flex h-full w-full shrink-0 items-center justify-center text-6xl"
                  >
                    {icon}
                  </span>
                  <span
                    id="category-emoji-hover-layer"
                    className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <span
                      id="category-emoji-change-label"
                      className="bg-foreground/80 text-background rounded-md px-3 py-1 text-xs font-semibold"
                    >
                      เปลี่ยน
                    </span>
                  </span>
                </button>
              </div>

              <div id="category-form-row" className="grid gap-3">
                <Input
                  id="category-name-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ชื่อหมวดหมู่"
                  className="border-border bg-background placeholder:text-muted-foreground/60 focus-visible:ring-foreground/30 h-12 rounded-lg px-4 text-base font-medium"
                  required
                />

                {/* Save */}
                <Button
                  id="save-category-btn"
                  type="submit"
                  className="bg-foreground text-background hover:bg-foreground/90 h-12 rounded-lg text-base font-semibold"
                  disabled={isLoading || !name.trim()}
                >
                  {isLoading ? (
                    <>
                      <Loader2
                        id="save-category-loader"
                        size={18}
                        className="animate-spin"
                      />
                      <span id="save-category-loading-text">กำลังบันทึก</span>
                    </>
                  ) : (
                    <>
                      <Plus id="save-category-plus-icon" size={24} />
                      บันทึก
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Emoji Picker Modal */}
      <EmojiPickerModal
        open={showEmojiPicker}
        onOpenChange={setShowEmojiPicker}
        onSelect={setIcon}
      />
    </>
  );
}

// ─────────────────────────────────────────────
// AddTransactionModal — ใช้ project components
// ─────────────────────────────────────────────

interface AddTransactionModalProps {
  categories: ExpenseCategory[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (input: Omit<CreateTransactionInput, "userId">) => Promise<void>;
  isLoading: boolean;
  onAddCategory: () => void;
  editData?: TransactionWithCategory | null;
}

function AddTransactionModal({
  categories,
  open,
  onOpenChange,
  onSave,
  isLoading,
  onAddCategory,
  editData,
}: AddTransactionModalProps) {
  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [transDate, setTransDate] = useState(() => toTransDate());

  useEffect(() => {
    if (open) {
      if (editData) {
        setType(editData.type);
        setCategoryId(editData.categoryId);
        setAmount(editData.amount.toString());
        setNote(editData.note || "");
        setTransDate(editData.transDate);
      } else {
        setType("EXPENSE");
        setCategoryId("");
        setAmount("");
        setNote("");
        setTransDate(toTransDate());
      }
    }
  }, [open, editData]);

  const filtered = categories.filter((c) => c.isActive);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId || !amount || !transDate) return;
    await onSave({
      categoryId,
      type,
      amount: parseFloat(amount),
      note: note || undefined,
      transDate,
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        id="add-transaction-modal"
        className="border-border bg-card fixed top-1/2 left-1/2 z-50 flex max-h-[85vh] w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-lg border p-0"
      >
        {/* Header */}
        <div
          id="add-transaction-modal-header"
          className="border-border/50 relative flex shrink-0 items-center justify-center border-b px-6 py-4"
        >
          <h3
            id="add-transaction-modal-title"
            className="text-foreground text-center text-lg font-bold"
          >
            {editData ? "แก้ไขรายการ" : "เพิ่มรายการ"}
          </h3>
          <Button
            id="add-transaction-close-btn"
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:bg-muted absolute top-1/2 right-4 h-8 w-8 -translate-y-1/2 rounded-full"
          >
            <X id="add-transaction-close-icon" size={18} />
          </Button>
        </div>

        <div
          id="add-transaction-modal-content"
          className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6"
        >
          <form
            id="add-transaction-form"
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {/* ประเภท */}
            <div id="transaction-type-group" className="grid grid-cols-2 gap-2 rounded-xl bg-muted/50 p-1">
              {(["EXPENSE", "INCOME"] as const).map((t) => {
                const isSelected = type === t;
                const activeClass =
                  t === "EXPENSE"
                    ? "bg-red-500 text-white shadow-sm"
                    : "bg-emerald-500 text-white shadow-sm";
                const inactiveClass = "text-muted-foreground hover:text-foreground hover:bg-muted";
                
                return (
                  <button
                    key={t}
                    id={`transaction-type-${t.toLowerCase()}-btn`}
                    type="button"
                    className={`flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-all ${
                      isSelected ? activeClass : inactiveClass
                    }`}
                    onClick={() => setType(t)}
                  >
                    {t === "INCOME" ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    {t === "INCOME" ? "รายรับ" : "รายจ่าย"}
                  </button>
                );
              })}
            </div>

            {/* หมวดหมู่ */}
            <div id="transaction-category-group" className="space-y-2">
              <div
                id="transaction-category-header"
                className="flex items-center justify-between"
              >
                <Label
                  id="transaction-category-label"
                  className="text-foreground text-sm font-semibold"
                >
                  หมวดหมู่
                </Label>
                <Button
                  id="manage-categories-btn"
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground h-8 gap-2 px-2 text-sm"
                  onClick={onAddCategory}
                >
                  <Tag id="manage-categories-icon" size={16} />
                  <span id="manage-categories-text">จัดการ</span>
                </Button>
              </div>
              {filtered.length === 0 && (
                <p
                  id="no-categories-msg"
                  className="border-border bg-muted/25 text-muted-foreground rounded-lg border px-4 py-3 text-center text-sm"
                >
                  ยังไม่มีหมวดหมู่
                </p>
              )}
              {filtered.length > 0 && (
                <CategoryCombobox
                  categories={filtered}
                  value={categoryId}
                  onChange={setCategoryId}
                  required
                  placeholder="เลือกหมวดหมู่"
                />
              )}
            </div>

            {/* จำนวนเงิน */}
            <div id="transaction-amount-group" className="space-y-2">
              <Input
                id="transaction-amount-input"
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                placeholder="จำนวนเงิน (บาท)"
                className="border-border bg-background placeholder:text-muted-foreground/60 focus-visible:ring-foreground/30 h-12 rounded-lg px-4 text-base font-medium"
              />
            </div>

            {/* วันที่ */}
            <PopoverDatePicker
              id="transaction-date-picker"
              label=""
              required
              value={transDate ? new Date(transDate + "T00:00:00") : undefined}
              onChange={(date) => setTransDate(date ? toTransDate(date) : "")}
              maxDate={new Date()}
            />

            {/* หมายเหตุ */}
            <div id="transaction-note-group" className="space-y-2">
              <Input
                id="transaction-note-input"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="หมายเหตุ (ถ้ามี)"
                className="border-border bg-background placeholder:text-muted-foreground/60 focus-visible:ring-foreground/30 h-12 rounded-lg px-4 text-base font-medium"
                maxLength={500}
              />
            </div>

            {/* Buttons */}
            <div
              id="transaction-buttons-group"
              className="grid grid-cols-2 gap-3 pt-1"
            >
              <Button
                id="transaction-cancel-btn"
                type="button"
                variant="outline"
                className="border-border bg-background h-12 rounded-lg text-base font-semibold"
                onClick={() => onOpenChange(false)}
              >
                ยกเลิก
              </Button>
              <Button
                id="transaction-save-btn"
                type="submit"
                className={`h-12 rounded-lg text-base font-semibold text-white ${
                  type === "EXPENSE"
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-emerald-500 hover:bg-emerald-600"
                }`}
                disabled={isLoading || !categoryId || !amount}
              >
                {isLoading ? (
                  <>
                    <Loader2
                      id="transaction-save-loader"
                      size={16}
                      className="animate-spin"
                    />{" "}
                    <span id="transaction-save-loading-text">กำลังบันทึก</span>
                  </>
                ) : editData ? (
                  "บันทึกการแก้ไข"
                ) : (
                  "บันทึก"
                )}
              </Button>
            </div>
          </form>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────

function ExpensesPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showCategoryManagerModal, setShowCategoryManagerModal] =
    useState(false);
  const [shouldReturnToAddModal, setShouldReturnToAddModal] = useState(false);
  const [shouldReturnToCategoryManager, setShouldReturnToCategoryManager] =
    useState(false);
  const [editingCategory, setEditingCategory] =
    useState<ExpenseCategory | null>(null);
  const [editingTx, setEditingTx] = useState<TransactionWithCategory | null>(
    null,
  );

  // ─── Queries ───────────────────────────────

  const {
    data: transactions = [],
    isLoading: txLoading,
    refetch: refetchTx,
  } = useQuery({
    queryKey: ["expenses", currentMonth],
    queryFn: () => fetchTransactions(currentMonth),
    enabled: !!session?.user,
  });

  const { data: summaryData } = useQuery({
    queryKey: ["expenses-summary", currentMonth],
    queryFn: () => fetchSummary(currentMonth),
    enabled: !!session?.user,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["expense-categories"],
    queryFn: fetchCategories,
    enabled: !!session?.user,
    staleTime: 5 * 60_000,
  });

  // ─── Mutations ─────────────────────────────

  const createMutation = useMutation({
    mutationFn: async (input: Omit<CreateTransactionInput, "userId">) => {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("บันทึกไม่สำเร็จ");
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["expenses", currentMonth],
      });
      void queryClient.invalidateQueries({
        queryKey: ["expenses-summary", currentMonth],
      });
      setShowAddModal(false);
    },
  });

  const updateTransactionMutation = useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: Omit<CreateTransactionInput, "userId">;
    }) => {
      const res = await fetch(`/api/expenses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("แก้ไขไม่สำเร็จ");
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["expenses", currentMonth],
      });
      void queryClient.invalidateQueries({
        queryKey: ["expenses-summary", currentMonth],
      });
      setShowAddModal(false);
      setEditingTx(null);
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (data: { name: string; icon: string }) => {
      const res = await fetch("/api/expenses/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "เพิ่มหมวดหมู่ไม่สำเร็จ");
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["expense-categories"] });
      setShowCategoryModal(false);
      setEditingCategory(null);
      // ถ้ามาจากการกด "จัดการหมวดหมู่" ใน modal เพิ่มรายการ ให้กลับไปเปิด modal นั้น
      if (shouldReturnToAddModal) {
        setShowAddModal(true);
        setShouldReturnToAddModal(false);
      } else if (shouldReturnToCategoryManager) {
        setShowCategoryManagerModal(true);
        setShouldReturnToCategoryManager(false);
      }
    },
    onError: (error: Error) => {
      console.error("Create category error:", error.message);
      alert(error.message || "เพิ่มหมวดหมู่ไม่สำเร็จ");
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: { name: string; icon: string };
    }) => {
      const res = await fetch(`/api/expenses/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "แก้ไขหมวดหมู่ไม่สำเร็จ");
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["expense-categories"] });
      setShowCategoryModal(false);
      setEditingCategory(null);
      if (shouldReturnToCategoryManager) {
        setShowCategoryManagerModal(true);
        setShouldReturnToCategoryManager(false);
      }
    },
    onError: (error: Error) => {
      console.error("Update category error:", error.message);
      alert(error.message || "แก้ไขหมวดหมู่ไม่สำเร็จ");
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/expenses/categories/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "ลบหมวดหมู่ไม่สำเร็จ");
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["expense-categories"] });
      setShowCategoryModal(false);
      setEditingCategory(null);
    },
    onError: (error: Error) => {
      console.error("Delete category error:", error.message);
      alert(error.message || "ลบหมวดหมู่ไม่สำเร็จ");
    },
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("ลบไม่สำเร็จ");
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["expenses", currentMonth],
      });
      void queryClient.invalidateQueries({
        queryKey: ["expenses-summary", currentMonth],
      });
    },
  });

  // ─── Handlers ──────────────────────────────

  const handlePrevMonth = useCallback(
    () => setCurrentMonth((m) => shiftMonth(m, -1)),
    [],
  );
  const handleNextMonth = useCallback(() => {
    setCurrentMonth((m) => {
      const newMonth = shiftMonth(m, 1);
      const now = getCurrentMonth();
      // ห้ามขยับเกินเดือนปัจจุบัน
      return newMonth <= now ? newMonth : m;
    });
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      if (confirm("ยืนยันการลบรายการนี้?"))
        deleteTransactionMutation.mutate(id);
    },
    [deleteTransactionMutation],
  );

  const handleEditCategory = useCallback((category: ExpenseCategory) => {
    setEditingCategory(category);
    setShouldReturnToAddModal(false);
    setShouldReturnToCategoryManager(true);
    setShowCategoryManagerModal(false);
    setShowCategoryModal(true);
  }, []);

  const handleDeleteCategory = useCallback(
    (id: string) => {
      if (confirm("ยืนยันการลบหมวดหมู่นี้?")) deleteCategoryMutation.mutate(id);
    },
    [deleteCategoryMutation],
  );

  const handleSaveCategory = useCallback(
    async (data: { name: string; icon: string }) => {
      if (editingCategory) {
        await updateCategoryMutation.mutateAsync({
          id: editingCategory.id,
          data,
        });
      } else {
        await createCategoryMutation.mutateAsync(data);
      }
    },
    [editingCategory, createCategoryMutation, updateCategoryMutation],
  );

  const handleOpenCategory = useCallback(() => {
    setEditingCategory(null); // Reset เพื่อให้เป็น add mode
    setShouldReturnToAddModal(true); // เก็บว่าควรกลับมาเปิด modal เพิ่มรายการหลังจากเพิ่มหมวดหมู่เสร็จ
    setShouldReturnToCategoryManager(false);
    setShowAddModal(false);
    setShowCategoryManagerModal(false);
    setShowCategoryModal(true);
  }, []);

  const handleOpenManageCategories = useCallback(() => {
    setShowCategoryManagerModal(true);
  }, []);

  const handleCategoryModalOpenChange = useCallback(
    (open: boolean) => {
      setShowCategoryModal(open);

      if (!open && shouldReturnToAddModal) {
        setShouldReturnToAddModal(false);
        setShowAddModal(true);
      } else if (!open && shouldReturnToCategoryManager) {
        setShouldReturnToCategoryManager(false);
        setShowCategoryManagerModal(true);
      }
    },
    [shouldReturnToAddModal, shouldReturnToCategoryManager],
  );

  // ─── Derived ──────────────────────────────

  const summary = summaryData?.summary;
  const categorySummary = summaryData?.categories ?? [];

  if (!session?.user) {
    return (
      <div
        id="expenses-auth-required"
        className="text-muted-foreground flex min-h-screen items-center justify-center"
      >
        กรุณาเข้าสู่ระบบเพื่อดูรายรับรายจ่าย
      </div>
    );
  }

  return (
    <div id="expenses-page" className="bg-background min-h-screen w-full">
      <div
        id="expenses-container"
        className="container mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8"
      >
        {/* ─── Page Header ─── */}
        <div
          id="expenses-header"
          className="border-border/70 bg-card/80 dark:bg-card/65 mb-6 overflow-hidden rounded-lg border p-4 sm:mb-8 sm:p-5"
        >
          <div
            id="expenses-header-row"
            className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
          >
            <div id="expenses-heading-group">
              <div
                id="expenses-eyebrow"
                className="border-primary/20 bg-primary/10 text-primary mb-2 inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-xs font-medium"
              >
                <Wallet id="expenses-eyebrow-icon" className="h-3.5 w-3.5" />
                Expense Tracker
              </div>
              <h1
                id="expenses-title"
                className="text-foreground text-2xl font-bold sm:text-3xl"
              >
                รายรับรายจ่าย
              </h1>
              <p
                id="expenses-description"
                className="text-muted-foreground mt-1 max-w-2xl text-sm"
              >
                บันทึกและติดตามการเงินของคุณ
              </p>
            </div>
            <div
              id="expenses-actions"
              className="flex flex-wrap items-center gap-2"
            >
              <Button
                id="manage-categories-header-btn"
                variant="outline"
                size="sm"
                onClick={handleOpenManageCategories}
                className="gap-2"
              >
                <Tag id="manage-categories-header-icon" size={14} />
                <span
                  id="manage-categories-header-text"
                  className="hidden sm:inline"
                >
                  หมวดหมู่
                </span>
              </Button>
              <Button
                id="refresh-btn"
                variant="outline"
                size="sm"
                onClick={() => void refetchTx()}
                disabled={txLoading}
                className="gap-2"
                aria-label="รีเฟรชข้อมูล"
              >
                <RefreshCw
                  id="refresh-icon"
                  className={`h-4 w-4 ${txLoading ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          </div>
        </div>

        {/* ─── Month Navigator ─── */}
        <Card
          id="month-navigator"
          className="border-border/70 bg-card/85 dark:bg-card/70 mb-4 border sm:mb-6"
        >
          <CardContent
            id="month-navigator-content"
            className="pointer-events-auto flex items-center justify-between p-3 sm:p-4"
          >
            <Button
              id="prev-month-btn"
              variant="ghost"
              size="sm"
              onClick={handlePrevMonth}
              aria-label="เดือนก่อน"
              className="hover:bg-muted h-8 w-8 rounded-lg sm:h-9 sm:w-9"
            >
              <ChevronLeft id="prev-month-icon" size={18} />
            </Button>
            <span
              id="current-month-label"
              className="text-foreground text-sm font-semibold sm:text-base"
            >
              {formatMonthThai(currentMonth)}
            </span>
            <Button
              id="next-month-btn"
              variant="ghost"
              size="sm"
              onClick={handleNextMonth}
              disabled={currentMonth >= getCurrentMonth()}
              aria-label="เดือนหน้า"
              className="hover:bg-muted h-8 w-8 rounded-lg disabled:cursor-not-allowed disabled:opacity-50 sm:h-9 sm:w-9"
            >
              <ChevronRight id="next-month-icon" size={18} />
            </Button>
          </CardContent>
        </Card>

        {/* ─── Summary Cards ─── */}
        <div
          id="summary-cards-grid"
          className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3"
        >
          <SummaryCard
            id="income"
            label="รายรับ"
            amount={summary?.totalIncome ?? 0}
            icon={
              <TrendingUp className="text-card-green h-4 w-4 sm:h-5 sm:w-5" />
            }
            iconBg="bg-card-green"
          />
          <SummaryCard
            id="expense"
            label="รายจ่าย"
            amount={summary?.totalExpense ?? 0}
            icon={
              <TrendingDown className="text-card-red h-4 w-4 sm:h-5 sm:w-5" />
            }
            iconBg="bg-card-red"
          />
          <SummaryCard
            id="balance"
            label="คงเหลือ"
            className="col-span-2 sm:col-span-1"
            amount={summary?.balance ?? 0}
            icon={
              <Wallet
                className={`h-4 w-4 sm:h-5 sm:w-5 ${summary && summary.balance >= 0 ? "text-card-blue" : "text-destructive"}`}
              />
            }
            iconBg={
              summary && summary.balance >= 0
                ? "bg-card-blue"
                : "bg-destructive/10"
            }
          />
        </div>

        {/* ─── Category Breakdown (Expense Only) ─── */}
        {categorySummary.some((c) => c.type === "EXPENSE") && (
          <Card
            id="expense-breakdown-card"
            className="border-border/70 bg-card/85 dark:bg-card/70 mb-4 border sm:mb-6"
          >
            <CardHeader
              id="expense-breakdown-header"
              className="px-3 pt-3 pb-2 sm:px-4 sm:pt-4 sm:pb-3"
            >
              <CardTitle
                id="expense-breakdown-title"
                className="text-muted-foreground text-xs font-semibold sm:text-sm"
              >
                สรุปรายจ่าย (Top 5)
              </CardTitle>
            </CardHeader>
            <CardContent
              id="expense-breakdown-content"
              className="space-y-2 px-3 pb-3 sm:space-y-3 sm:px-4 sm:pb-4"
            >
              {categorySummary
                .filter((c) => c.type === "EXPENSE")
                .slice(0, 5)
                .map((c) => (
                  <div
                    key={c.categoryId}
                    id={`expense-breakdown-row-${c.categoryId}`}
                    className="flex items-center gap-2 sm:gap-3"
                  >
                    <span
                      id={`expense-breakdown-icon-${c.categoryId}`}
                      className="border-card-red bg-card-red flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-sm sm:text-lg"
                    >
                      {c.icon ?? "📦"}
                    </span>
                    <div
                      id={`expense-breakdown-detail-${c.categoryId}`}
                      className="min-w-0 flex-1"
                    >
                      <div
                        id={`expense-breakdown-meta-${c.categoryId}`}
                        className="mb-1 flex justify-between gap-3 text-xs sm:text-sm"
                      >
                        <span
                          id={`expense-breakdown-name-${c.categoryId}`}
                          className="text-foreground truncate font-medium"
                        >
                          {c.categoryName}
                        </span>
                        <span
                          id={`expense-breakdown-total-${c.categoryId}`}
                          className="text-muted-foreground shrink-0 text-xs tabular-nums"
                        >
                          {formatAmount(c.total)} • {c.percentage.toFixed(1)}%
                        </span>
                      </div>
                      <div
                        id={`expense-breakdown-track-${c.categoryId}`}
                        className="bg-muted h-1.5 w-full overflow-hidden rounded-full sm:h-2"
                      >
                        <div
                          id={`expense-breakdown-bar-${c.categoryId}`}
                          className="bg-card-red h-full rounded-full"
                          style={{ width: `${Math.min(c.percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        )}

        {/* ─── Transaction List with Tabs ─── */}
        <Tabs id="transaction-tabs" defaultValue="all">
          <TabsList
            id="transaction-tabs-list"
            className="border-border/50 bg-muted/50 mb-3 w-full border p-1 sm:mb-4"
          >
            <TabsTrigger
              id="transaction-tab-all"
              value="all"
              className="flex-1 text-xs font-medium sm:text-sm"
            >
              ทั้งหมด
            </TabsTrigger>
            <TabsTrigger
              id="transaction-tab-expense"
              value="EXPENSE"
              className="text-card-red flex-1 text-xs font-medium sm:text-sm"
            >
              รายจ่าย
            </TabsTrigger>
            <TabsTrigger
              id="transaction-tab-income"
              value="INCOME"
              className="text-card-green flex-1 text-xs font-medium sm:text-sm"
            >
              รายรับ
            </TabsTrigger>
          </TabsList>

          {(["all", "EXPENSE", "INCOME"] as const).map((tab) => {
            const list =
              tab === "all"
                ? transactions
                : transactions.filter((t) => t.type === tab);
            return (
              <TabsContent
                key={tab}
                id={`transaction-tab-content-${tab.toLowerCase()}`}
                value={tab}
                className="space-y-2 pb-24"
              >
                {txLoading && (
                  <div
                    id={`transaction-loading-${tab.toLowerCase()}`}
                    className="text-muted-foreground flex items-center justify-center py-12"
                  >
                    <Loader2
                      id={`transaction-loading-icon-${tab.toLowerCase()}`}
                      size={24}
                      className="animate-spin"
                    />
                  </div>
                )}
                {!txLoading && list.length === 0 && (
                  <Card
                    id={`transaction-empty-card-${tab.toLowerCase()}`}
                    className="border-border/50 bg-card/60 dark:bg-card/45"
                  >
                    <CardContent
                      id={`transaction-empty-content-${tab.toLowerCase()}`}
                      className="text-muted-foreground py-12 text-center"
                    >
                      <p
                        id={`transaction-empty-text-${tab.toLowerCase()}`}
                        className="text-sm"
                      >
                        ยังไม่มีรายการ
                      </p>
                    </CardContent>
                  </Card>
                )}
                <div
                  id={`transaction-list-${tab.toLowerCase()}`}
                  className="space-y-2"
                >
                  {list.map((tx) => (
                    <TransactionRow
                      key={tx.id}
                      tx={tx}
                      onEdit={(tx) => {
                        setEditingTx(tx);
                        setShowAddModal(true);
                      }}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>

      {/* ─── Floating Add Button ─── */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 sm:bottom-8">
        <Button
          id="add-transaction-fab"
          onClick={() => {
            setEditingTx(null);
            setShowAddModal(true);
          }}
          className="h-12 sm:h-14 rounded-full shadow-xl px-6 bg-primary text-primary-foreground hover:bg-primary/90 transition-all hover:scale-105"
        >
          <Plus id="add-transaction-fab-icon" size={20} className="mr-2" />
          <span className="font-semibold text-base">เพิ่มรายการ</span>
        </Button>
      </div>

      {/* ─── Add Transaction Modal ─── */}
      <AddTransactionModal
        key={`${showAddModal ? "open" : "closed"}-${editingTx?.id ?? "new"}`}
        categories={categories}
        open={showAddModal}
        onOpenChange={(open) => {
          setShowAddModal(open);
          if (!open) setEditingTx(null);
        }}
        onSave={(input) =>
          editingTx
            ? updateTransactionMutation.mutateAsync({ id: editingTx.id, input })
            : createMutation.mutateAsync(input)
        }
        isLoading={
          createMutation.isPending || updateTransactionMutation.isPending
        }
        onAddCategory={handleOpenCategory}
        editData={editingTx}
      />

      {/* ─── Category Manager Modal ─── */}
      <CategoryManagerModal
        open={showCategoryManagerModal}
        onOpenChange={setShowCategoryManagerModal}
        categories={categories}
        onEdit={handleEditCategory}
        onDelete={handleDeleteCategory}
        onAdd={() => {
          setEditingCategory(null);
          setShouldReturnToAddModal(false);
          setShouldReturnToCategoryManager(true);
          setShowCategoryManagerModal(false);
          setShowCategoryModal(true);
        }}
      />

      {/* ─── Add/Edit Category Modal ─── */}
      <AddCategoryModal
        key={`${showCategoryModal ? "open" : "closed"}-${editingCategory?.id ?? "new"}`}
        open={showCategoryModal}
        onOpenChange={handleCategoryModalOpenChange}
        onSave={handleSaveCategory}
        isLoading={
          createCategoryMutation.isPending || updateCategoryMutation.isPending
        }
        editMode={!!editingCategory}
        category={editingCategory}
      />
    </div>
  );
}
