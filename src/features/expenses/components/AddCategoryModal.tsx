import { AlertDialog, AlertDialogContent } from "@/components/ui/AlertDialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { ExpenseCategory } from "@/features/expenses/types"
import { Loader2, Plus, X } from "lucide-react"
import { useState } from "react"
import { EmojiPickerModal } from "./EmojiPickerModal"

interface AddCategoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: { name: string; icon: string }) => Promise<void>
  isLoading: boolean
  editMode?: boolean
  category?: ExpenseCategory | null
}

export function AddCategoryModal({
  open,
  onOpenChange,
  onSave,
  isLoading,
  editMode,
  category,
}: AddCategoryModalProps) {
  const [icon, setIcon] = useState(() =>
    editMode && category ? (category.icon ?? "🤔") : "🤔",
  )
  const [name, setName] = useState(() =>
    editMode && category ? category.name : "",
  )
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    await onSave({ name: name.trim(), icon })
  }

  return (
    <>
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent
          id="add-category-modal"
          className="border-border bg-card fixed top-1/2 left-1/2 z-50 flex max-h-[85vh] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-lg border p-0"
        >
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
            <form id="add-category-form" onSubmit={handleSubmit} className="space-y-5">
              <div id="category-emoji-group" className="flex justify-center pt-1">
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
                <Button
                  id="save-category-btn"
                  type="submit"
                  className="bg-foreground text-background hover:bg-foreground/90 h-12 rounded-lg text-base font-semibold"
                  disabled={isLoading || !name.trim()}
                >
                  {isLoading ? (
                    <>
                      <Loader2 id="save-category-loader" size={18} className="animate-spin" />
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

      <EmojiPickerModal
        open={showEmojiPicker}
        onOpenChange={setShowEmojiPicker}
        onSelect={setIcon}
      />
    </>
  )
}
