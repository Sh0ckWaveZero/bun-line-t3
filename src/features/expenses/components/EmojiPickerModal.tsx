"use client"

import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from "@/components/ui/AlertDialog"
import { Button } from "@/components/ui/button"
import data from "@emoji-mart/data"
import Picker from "@emoji-mart/react"
import { X } from "lucide-react"
import { useEffect, useRef } from "react"

interface EmojiPickerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (emoji: string) => void
}

interface EmojiMartResult {
  native: string
}

export function EmojiPickerModal({ open, onOpenChange, onSelect }: EmojiPickerModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (open) setTimeout(() => closeRef.current?.focus(), 50)
  }, [open])

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        id="emoji-picker-modal"
        className="border-border/70 bg-card fixed top-1/2 left-1/2 z-60 flex w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-lg border p-0"
      >
        <div className="border-border/50 flex shrink-0 items-center justify-between border-b px-5 py-4">
          <AlertDialogTitle className="text-foreground text-sm font-semibold">
            เลือก Emoji
          </AlertDialogTitle>
          <AlertDialogDescription className="sr-only">
            เลือก Emoji สำหรับหมวดหมู่
          </AlertDialogDescription>
          <Button
            ref={closeRef}
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="hover:bg-muted h-8 w-8 rounded-lg"
          >
            <X size={18} />
          </Button>
        </div>

        <div className="emoji-mart-wrapper">
          <Picker
            data={data}
            onEmojiSelect={(emoji: EmojiMartResult) => {
              onSelect(emoji.native)
              onOpenChange(false)
            }}
            locale="en"
            theme="auto"
            previewPosition="none"
            skinTonePosition="none"
            navPosition="bottom"
            perLine={8}
            set="native"
          />
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
