"use client"

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/AlertDialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, X } from "lucide-react"
import { useMemo, useState } from "react"

interface EmojiPickerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (emoji: string) => void
}

interface EmojiOption {
  emoji: string
  label: string
  keywords: string
}

const FREQUENT_EMOJIS = ["🍔", "🚗", "🏠", "💡", "🏥", "🎮", "🛍️", "💰"]

const EMOJI_OPTIONS: EmojiOption[] = [
  { emoji: "🍔", label: "อาหาร", keywords: "food meal burger eat restaurant อาหาร กิน ร้านอาหาร" },
  { emoji: "🍜", label: "ก๋วยเตี๋ยว", keywords: "noodle ramen food อาหาร ก๋วยเตี๋ยว" },
  { emoji: "🍱", label: "ข้าวกล่อง", keywords: "bento lunch food อาหาร กลางวัน" },
  { emoji: "☕", label: "กาแฟ", keywords: "coffee drink cafe กาแฟ เครื่องดื่ม คาเฟ่" },
  { emoji: "🍺", label: "เครื่องดื่ม", keywords: "beer drink bar เครื่องดื่ม" },
  { emoji: "🛒", label: "ของใช้", keywords: "grocery shopping market ของใช้ ตลาด ซื้อของ" },
  { emoji: "🛍️", label: "ช้อปปิ้ง", keywords: "shopping bag buy mall ช้อปปิ้ง ซื้อของ" },
  { emoji: "👕", label: "เสื้อผ้า", keywords: "shirt clothes fashion เสื้อผ้า แฟชั่น" },
  { emoji: "👟", label: "รองเท้า", keywords: "shoes sneaker รองเท้า" },
  { emoji: "💄", label: "ความงาม", keywords: "beauty makeup cosmetic ความงาม เครื่องสำอาง" },
  { emoji: "🚗", label: "รถยนต์", keywords: "car transport travel รถ เดินทาง" },
  { emoji: "⛽", label: "น้ำมัน", keywords: "fuel gas petrol น้ำมัน รถ" },
  { emoji: "🚌", label: "รถเมล์", keywords: "bus transport รถเมล์ เดินทาง" },
  { emoji: "🚕", label: "แท็กซี่", keywords: "taxi ride transport แท็กซี่ เดินทาง" },
  { emoji: "✈️", label: "เดินทาง", keywords: "flight plane travel trip เที่ยว เดินทาง" },
  { emoji: "🏠", label: "บ้าน", keywords: "home house rent บ้าน ที่พัก ค่าเช่า" },
  { emoji: "🏢", label: "คอนโด", keywords: "condo apartment rent คอนโด หอพัก" },
  { emoji: "💡", label: "ไฟฟ้า", keywords: "electric utility bill ไฟฟ้า ค่าน้ำ ค่าไฟ" },
  { emoji: "💧", label: "ค่าน้ำ", keywords: "water utility bill น้ำ ค่าน้ำ" },
  { emoji: "📶", label: "อินเทอร์เน็ต", keywords: "internet wifi phone อินเทอร์เน็ต โทรศัพท์" },
  { emoji: "📱", label: "มือถือ", keywords: "phone mobile มือถือ โทรศัพท์" },
  { emoji: "🏥", label: "สุขภาพ", keywords: "health hospital medical สุขภาพ โรงพยาบาล" },
  { emoji: "💊", label: "ยา", keywords: "medicine pill pharmacy ยา ร้านยา" },
  { emoji: "🦷", label: "ฟัน", keywords: "dental tooth dentist ฟัน หมอฟัน" },
  { emoji: "🏋️", label: "ฟิตเนส", keywords: "fitness gym exercise ฟิตเนส ออกกำลัง" },
  { emoji: "🎮", label: "เกม", keywords: "game entertainment เกม บันเทิง" },
  { emoji: "🎬", label: "หนัง", keywords: "movie cinema film หนัง โรงหนัง" },
  { emoji: "🎵", label: "เพลง", keywords: "music song เพลง subscription" },
  { emoji: "📚", label: "การศึกษา", keywords: "book education study เรียน หนังสือ การศึกษา" },
  { emoji: "💼", label: "งาน", keywords: "work job office งาน เงินเดือน" },
  { emoji: "💰", label: "เงิน", keywords: "money income cash เงิน รายรับ" },
  { emoji: "💵", label: "เงินสด", keywords: "cash money เงินสด" },
  { emoji: "🏦", label: "ธนาคาร", keywords: "bank finance ธนาคาร การเงิน" },
  { emoji: "📈", label: "ลงทุน", keywords: "invest stock profit ลงทุน หุ้น กำไร" },
  { emoji: "🎁", label: "ของขวัญ", keywords: "gift bonus present ของขวัญ โบนัส" },
  { emoji: "💳", label: "บัตร", keywords: "card credit payment บัตร เครดิต" },
  { emoji: "🧾", label: "บิล", keywords: "bill receipt invoice บิล ใบเสร็จ" },
  { emoji: "💸", label: "รายจ่าย", keywords: "expense spending money รายจ่าย ใช้เงิน" },
  { emoji: "🐶", label: "สัตว์เลี้ยง", keywords: "pet dog cat สัตว์เลี้ยง" },
  { emoji: "🌱", label: "ต้นไม้", keywords: "plant garden ต้นไม้ สวน" },
  { emoji: "🧹", label: "ทำความสะอาด", keywords: "clean home ทำความสะอาด บ้าน" },
  { emoji: "🔧", label: "ซ่อม", keywords: "repair tool maintenance ซ่อม เครื่องมือ" },
  { emoji: "🚨", label: "ฉุกเฉิน", keywords: "emergency urgent ฉุกเฉิน" },
  { emoji: "❤️", label: "ครอบครัว", keywords: "family love ครอบครัว ความรัก" },
  { emoji: "👶", label: "ลูก", keywords: "baby child kid ลูก เด็ก" },
  { emoji: "🙏", label: "ทำบุญ", keywords: "donate merit charity ทำบุญ บริจาค" },
  { emoji: "➕", label: "อื่นๆ", keywords: "other misc อื่นๆ" },
]

export function EmojiPickerModal({ open, onOpenChange, onSelect }: EmojiPickerModalProps) {
  const [query, setQuery] = useState("")

  const filteredEmojis = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return EMOJI_OPTIONS

    return EMOJI_OPTIONS.filter((item) =>
      `${item.emoji} ${item.label} ${item.keywords}`.toLowerCase().includes(normalizedQuery),
    )
  }, [query])

  const handleSelect = (emoji: string) => {
    onSelect(emoji)
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        id="emoji-picker-modal"
        className="border-border/70 bg-card fixed top-1/2 left-1/2 z-60 flex max-h-[90vh] w-[calc(100vw-1.5rem)] max-w-[25rem] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border p-0 shadow-2xl"
      >
        <div className="border-border/60 flex shrink-0 items-center justify-between border-b px-5 py-3.5">
          <AlertDialogTitle className="text-muted-foreground text-sm font-semibold tracking-[0.2em] uppercase">
            EMOJI
          </AlertDialogTitle>
          <AlertDialogDescription className="sr-only">
            เลือก Emoji สำหรับหมวดหมู่
          </AlertDialogDescription>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:text-foreground hover:bg-muted h-8 w-8 rounded-lg"
          >
            <X size={18} />
          </Button>
        </div>

        <div className="min-h-0 flex-1 px-4 pb-4 pt-3">
          <div className="relative mb-3">
            <Search className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ค้นหา"
              className="bg-muted/45 h-10 rounded-xl pl-9 text-base"
            />
          </div>

          <div className="emoji-picker-scrollbar max-h-[380px] overflow-y-auto pr-1">
            {!query && (
              <section className="mb-4">
                <h3 className="text-foreground mb-2 text-sm font-semibold">ใช้บ่อย</h3>
                <div className="grid grid-cols-8 gap-1.5">
                  {FREQUENT_EMOJIS.map((emoji) => (
                    <EmojiButton key={emoji} emoji={emoji} onClick={handleSelect} />
                  ))}
                </div>
              </section>
            )}

            <section>
              <h3 className="text-foreground mb-2 text-sm font-semibold">หมวดหมู่</h3>
              {filteredEmojis.length > 0 ? (
                <div className="grid grid-cols-8 gap-1.5">
                  {filteredEmojis.map((item) => (
                    <EmojiButton
                      key={`${item.emoji}-${item.label}`}
                      emoji={item.emoji}
                      label={item.label}
                      onClick={handleSelect}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground py-8 text-center text-sm">
                  ไม่พบ Emoji
                </p>
              )}
            </section>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}

interface EmojiButtonProps {
  emoji: string
  label?: string
  onClick: (emoji: string) => void
}

function EmojiButton({ emoji, label, onClick }: EmojiButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label ? `เลือก ${label}` : `เลือก ${emoji}`}
      onClick={() => onClick(emoji)}
      className="hover:bg-muted focus-visible:ring-ring flex aspect-square items-center justify-center rounded-lg text-2xl transition-colors focus-visible:outline-none focus-visible:ring-2"
    >
      {emoji}
    </button>
  )
}
