import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from "@/components/ui/AlertDialog"
import { Button } from "@/components/ui/button"
import { PopoverDatePicker } from "@/components/ui/date-picker"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toTransDate } from "@/features/expenses/helpers"
import type { CreateTransactionInput, ExpenseCategory, TransactionWithCategory } from "@/features/expenses/types"
import { Loader2, Tag, TrendingDown, TrendingUp, X } from "lucide-react"
import { useEffect, useState } from "react"
import { CategoryCombobox } from "./CategoryCombobox"

function formatAmount(value: string): string {
  const stripped = value.replace(/[^0-9.]/g, "")
  if (!stripped) return ""
  const dotIndex = stripped.indexOf(".")
  const hasDot = dotIndex !== -1
  const intPart = hasDot ? stripped.slice(0, dotIndex) : stripped
  const decPart = hasDot ? stripped.slice(dotIndex + 1).replace(/\./g, "").slice(0, 2) : undefined
  const formattedInt = intPart
    ? intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    : "0"
  return decPart !== undefined ? `${formattedInt}.${decPart}` : formattedInt
}

interface AddTransactionModalProps {
  categories: ExpenseCategory[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (input: Omit<CreateTransactionInput, "userId">) => Promise<void>
  isLoading: boolean
  onAddCategory: () => void
  editData?: TransactionWithCategory | null
}

export function AddTransactionModal({
  categories,
  open,
  onOpenChange,
  onSave,
  isLoading,
  onAddCategory,
  editData,
}: AddTransactionModalProps) {
  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE")
  const [categoryId, setCategoryId] = useState("")
  const [amount, setAmount] = useState("")
  const [note, setNote] = useState("")
  const [tags, setTags] = useState("")
  const [transDate, setTransDate] = useState(() => toTransDate())

  useEffect(() => {
    if (open) {
      if (editData) {
        setType(editData.type)
        setCategoryId(editData.categoryId)
        setAmount(formatAmount(editData.amount.toString()))
        setNote(editData.note ?? "")
        setTags(editData.tags ?? "")
        setTransDate(editData.transDate)
      } else {
        setType("EXPENSE")
        setCategoryId("")
        setAmount("")
        setNote("")
        setTags("")
        setTransDate(toTransDate())
      }
    }
  }, [open, editData])

  const filtered = categories.filter((c) => c.isActive)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const numeric = parseFloat(amount.replace(/,/g, ""))
    if (!categoryId || !amount || !transDate || isNaN(numeric) || numeric <= 0) return
    await onSave({
      categoryId,
      type,
      amount: numeric,
      note: note || undefined,
      tags: tags || undefined,
      transDate,
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        id="add-transaction-modal"
        className="border-border bg-card fixed top-1/2 left-1/2 z-50 flex max-h-[85vh] w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-lg border p-0"
      >
        <div
          id="add-transaction-modal-header"
          className="border-border/50 relative flex shrink-0 items-center justify-center border-b px-6 py-4"
        >
          <AlertDialogTitle className="text-foreground text-center text-lg font-bold">
            {editData ? "แก้ไขรายการ" : "เพิ่มรายการ"}
          </AlertDialogTitle>
          <AlertDialogDescription className="sr-only">
            {editData ? "แก้ไขรายละเอียดรายรับหรือรายจ่าย" : "เพิ่มรายการรายรับหรือรายจ่ายใหม่"}
          </AlertDialogDescription>
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
          <form id="add-transaction-form" onSubmit={handleSubmit} className="space-y-4">
            <div id="transaction-type-section" className="space-y-2">
              <Label
                id="transaction-type-label"
                className="text-foreground text-sm font-semibold"
              >
                ประเภทรายการ
              </Label>
              <div
                id="transaction-type-group"
                className="grid grid-cols-2 gap-2 rounded-xl bg-muted/50 p-1"
              >
                {(["EXPENSE", "INCOME"] as const).map((t) => {
                  const isSelected = type === t
                  const activeClass =
                    t === "EXPENSE"
                      ? "bg-red-500 text-white shadow-sm"
                      : "bg-emerald-500 text-white shadow-sm"
                  const inactiveClass =
                    "text-muted-foreground hover:text-foreground hover:bg-muted"
                  return (
                    <button
                      key={t}
                      id={`transaction-type-${t.toLowerCase()}-btn`}
                      type="button"
                      aria-label={`เลือกประเภทรายการ${t === "INCOME" ? "รายรับ" : "รายจ่าย"}`}
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
                  )
                })}
              </div>
            </div>

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

            <div id="transaction-amount-group" className="space-y-2">
              <Label
                htmlFor="transaction-amount-input"
                id="transaction-amount-label"
                className="text-foreground text-sm font-semibold"
              >
                จำนวนเงิน
              </Label>
              <Input
                id="transaction-amount-input"
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(formatAmount(e.target.value))}
                required
                placeholder="จำนวนเงิน (บาท)"
                className="border-border bg-background placeholder:text-muted-foreground/60 focus-visible:ring-foreground/30 h-12 rounded-lg px-4 text-base font-medium"
              />
            </div>

            <PopoverDatePicker
              id="transaction-date-picker"
              label="วันที่"
              required
              value={transDate ? new Date(transDate + "T00:00:00") : undefined}
              onChange={(date) => setTransDate(date ? toTransDate(date) : "")}
              maxDate={new Date()}
            />

            <div id="transaction-note-group" className="space-y-2">
              <Label
                htmlFor="transaction-note-input"
                id="transaction-note-label"
                className="text-foreground text-sm font-semibold"
              >
                หมายเหตุ
              </Label>
              <Input
                id="transaction-note-input"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="หมายเหตุ (ถ้ามี)"
                className="border-border bg-background placeholder:text-muted-foreground/60 focus-visible:ring-foreground/30 h-12 rounded-lg px-4 text-base font-medium"
                maxLength={500}
              />
            </div>

            <div id="transaction-tags-group" className="space-y-2">
              <Label
                htmlFor="transaction-tags-input"
                id="transaction-tags-label"
                className="text-foreground text-sm font-semibold"
              >
                แท็ก
              </Label>
              <Input
                id="transaction-tags-input"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="แท็ก เช่น lunch,office (ถ้ามี)"
                className="border-border bg-background placeholder:text-muted-foreground/60 focus-visible:ring-foreground/30 h-12 rounded-lg px-4 text-base font-medium"
                maxLength={200}
              />
              {tags && (
                <div id="transaction-tags-preview" className="flex flex-wrap gap-1">
                  {tags
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean)
                    .map((tag, index) => (
                      <span
                        key={`${tag}-${index}`}
                        id={`transaction-tag-chip-${index}`}
                        className="bg-primary/10 text-primary inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                      >
                        @{tag}
                      </span>
                    ))}
                </div>
              )}
            </div>

            <div id="transaction-buttons-group" className="grid grid-cols-2 gap-3 pt-1">
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
  )
}
