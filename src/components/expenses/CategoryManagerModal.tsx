import { AlertDialog, AlertDialogContent } from "@/components/ui/AlertDialog"
import { Button } from "@/components/ui/button"
import type { ExpenseCategory } from "@/features/expenses/types"
import { Edit, Plus, Trash2, X } from "lucide-react"

interface CategoryManagerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: ExpenseCategory[]
  onEdit: (category: ExpenseCategory) => void
  onDelete: (id: string) => void
  onAdd: () => void
}

export function CategoryManagerModal({
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
                    <div id={`category-manager-item-text-${category.id}`} className="min-w-0">
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

        <div id="category-manager-footer" className="bg-card shrink-0 px-6 pt-2 pb-6">
          <Button
            id="category-manager-add-btn"
            type="button"
            className="bg-foreground text-background hover:bg-foreground/90 h-12 w-full gap-3 rounded-lg text-base font-semibold"
            onClick={() => {
              onAdd()
              onOpenChange(false)
            }}
          >
            <Plus id="category-manager-add-icon" size={16} />
            เพิ่มหมวดหมู่
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
