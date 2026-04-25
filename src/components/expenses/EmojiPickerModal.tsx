import { AlertDialog, AlertDialogContent } from "@/components/ui/AlertDialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EMOJI_LIST } from "@/features/expenses/constants"
import { X } from "lucide-react"
import { useEffect, useRef, useState } from "react"

interface EmojiPickerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (emoji: string) => void
}

export function EmojiPickerModal({
  open,
  onOpenChange,
  onSelect,
}: EmojiPickerModalProps) {
  const [search, setSearch] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  const filtered = search ? EMOJI_LIST.filter((e) => e.includes(search)) : EMOJI_LIST

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
          <h3 id="emoji-picker-title" className="text-foreground text-sm font-semibold">
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
          <div id="emoji-search-wrapper" className="relative">
            <Input
              id="emoji-native-input"
              ref={inputRef}
              value={search}
              onChange={(e) => {
                const val = e.target.value
                setSearch(val)
                if (val && val !== search) {
                  const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" })
                  const segs = [...segmenter.segment(val)]
                  if (segs.length > 0) {
                    const lastEmoji = segs[segs.length - 1]!.segment
                    if (EMOJI_LIST.includes(lastEmoji)) {
                      onSelect(lastEmoji)
                      onOpenChange(false)
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
                  onSelect(emoji)
                  onOpenChange(false)
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
              <p id="emoji-empty-title" className="text-muted-foreground text-sm">
                ไม่พบ emoji
              </p>
              <p id="emoji-empty-description" className="text-muted-foreground/60 mt-1 text-xs">
                ลองเปลี่ยนคำค้น
              </p>
            </div>
          )}
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
