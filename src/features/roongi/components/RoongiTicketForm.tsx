import { DrawSelector } from "./DrawSelector";

export interface LotteryTicket {
  id: string;
  number: string;
}

export interface ActiveDigit {
  ticketId: string;
  position: number;
}

interface DigitSlot {
  id: string;
  position: number;
}

const DIGIT_SLOTS: DigitSlot[] = [
  { id: "digit-1", position: 0 },
  { id: "digit-2", position: 1 },
  { id: "digit-3", position: 2 },
  { id: "digit-4", position: 3 },
  { id: "digit-5", position: 4 },
  { id: "digit-6", position: 5 },
];

interface RoongiTicketFormProps {
  activeDigit: ActiveDigit | null;
  checkedCount: number;
  date?: string;
  error: string;
  isEditing: boolean;
  latestDate?: string;
  lotteryLoaded: boolean;
  onActiveDigitChange: (activeDigit: ActiveDigit | null) => void;
  onAddTicket: () => void;
  onCheck: () => void;
  onDateChange: (value: string) => void;
  onEdit: () => void;
  onRemoveTicket: (ticketId: string) => void;
  onRetry: () => void;
  onTicketChange: (ticketId: string, value: string) => void;
  selectedDate: string;
  tickets: readonly LotteryTicket[];
}

export function RoongiTicketForm({
  activeDigit,
  checkedCount,
  date,
  error,
  isEditing,
  latestDate,
  lotteryLoaded,
  onActiveDigitChange,
  onAddTicket,
  onCheck,
  onDateChange,
  onEdit,
  onRemoveTicket,
  onRetry,
  onTicketChange,
  selectedDate,
  tickets,
}: RoongiTicketFormProps) {
  return (
    <section className="bg-card border-primary/25 rounded-xl border p-5 sm:p-7 md:col-start-1">
      {!isEditing && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">ตรวจแล้ว {checkedCount} ใบ</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              งวดวันที่ {date}
            </p>
          </div>
          <button
            type="button"
            onClick={onEdit}
            className="border-primary text-primary hover:bg-primary/10 focus-visible:ring-ring rounded-md border px-4 py-2 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            แก้ไขเลขหรืองวด
          </button>
        </div>
      )}
      <div hidden={!isEditing}>
        <h2 className="text-xl font-bold">ตรวจสลากของคุณ</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          กรอกหมายเลข 6 หลัก ตรวจได้หลายใบพร้อมกัน
        </p>
        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            onCheck();
          }}
        >
          <DrawSelector
            selectedDate={selectedDate}
            latestDate={latestDate}
            onChange={onDateChange}
          />
          {tickets.map((ticket, index) => (
            <div key={ticket.id}>
              <label
                htmlFor={ticket.id}
                className="mb-1 block text-sm font-medium"
              >
                สลากใบที่ {index + 1}
              </label>
              <div className="flex gap-2">
                <div className="focus-within:ring-ring relative w-full min-w-0 rounded-md focus-within:ring-2 focus-within:ring-offset-2">
                  <div
                    aria-hidden="true"
                    className="grid grid-cols-6 gap-1.5 sm:gap-2"
                  >
                    {DIGIT_SLOTS.map((slot) => (
                      <span
                        key={slot.id}
                        className={`bg-background flex h-14 min-w-0 items-center justify-center rounded-md border font-mono text-xl font-semibold tabular-nums sm:h-16 sm:text-2xl ${activeDigit?.ticketId === ticket.id && activeDigit.position === slot.position ? "border-primary ring-primary ring-1" : ""}`}
                      >
                        {ticket.number[slot.position] ?? (
                          <span className="text-muted-foreground">–</span>
                        )}
                      </span>
                    ))}
                  </div>
                  <input
                    id={ticket.id}
                    name={ticket.id}
                    value={ticket.number}
                    onSelect={(event) =>
                      onActiveDigitChange({
                        ticketId: ticket.id,
                        position: Math.min(
                          event.currentTarget.selectionStart ?? 0,
                          5,
                        ),
                      })
                    }
                    onBlur={() => onActiveDigitChange(null)}
                    onClick={(event) => {
                      const bounds =
                        event.currentTarget.getBoundingClientRect();
                      const position = Math.min(
                        ticket.number.length,
                        Math.max(
                          0,
                          Math.floor(
                            ((event.clientX - bounds.left) / bounds.width) * 6,
                          ),
                        ),
                      );
                      event.currentTarget.setSelectionRange(position, position);
                      onActiveDigitChange({
                        ticketId: ticket.id,
                        position: Math.min(position, 5),
                      });
                    }}
                    onChange={(event) =>
                      onTicketChange(ticket.id, event.currentTarget.value)
                    }
                    inputMode="numeric"
                    autoComplete="off"
                    pattern="[0-9]{6}"
                    minLength={6}
                    maxLength={6}
                    required
                    className="absolute inset-0 h-full w-full cursor-text opacity-0"
                  />
                </div>
                {tickets.length > 1 && (
                  <button
                    type="button"
                    className="hover:bg-muted focus-visible:ring-ring rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:outline-none"
                    aria-label={`ลบสลากใบที่ ${index + 1}`}
                    onClick={() => onRemoveTicket(ticket.id)}
                  >
                    ลบ
                  </button>
                )}
              </div>
            </div>
          ))}
          <button
            type="button"
            className="text-primary text-sm font-semibold hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
            onClick={onAddTicket}
            disabled={tickets.length >= 20}
          >
            + เพิ่มสลากอีกใบ
          </button>
          <p className="text-muted-foreground text-sm">
            {date
              ? `งวดวันที่ ${date}`
              : error
                ? "ไม่สามารถโหลดงวดล่าสุดได้"
                : "กำลังโหลดงวดล่าสุด..."}
          </p>
          <button
            type="submit"
            disabled={!lotteryLoaded}
            className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring w-full rounded-md px-5 py-3 font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-50"
          >
            ตรวจสลาก
          </button>
        </form>
        {error && (
          <div role="alert" className="mt-4 text-red-700 dark:text-red-400">
            <p>{error}</p>
            <button type="button" className="mt-2 underline" onClick={onRetry}>
              ลองโหลดอีกครั้ง
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
