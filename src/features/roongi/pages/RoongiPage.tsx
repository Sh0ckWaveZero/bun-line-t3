import { lazy, Suspense, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RoongiDrawResults } from "../components/RoongiDrawResults";
import {
  RoongiTicketForm,
  type ActiveDigit,
  type LotteryTicket,
} from "../components/RoongiTicketForm";
import { RoongiTicketResults } from "../components/RoongiTicketResults";
import { checkTicket, lotterySchema } from "../lib/lottery";
import "./roongi-motion.css";

const WinCelebration = lazy(() => import("../components/WinCelebration"));

export function RoongiPage() {
  const [selectedDate, setSelectedDate] = useState("");
  const [tickets, setTickets] = useState<LotteryTicket[]>([
    { id: "ticket-0", number: "" },
  ]);
  const [checked, setChecked] = useState<LotteryTicket[]>([]);
  const [isEditing, setIsEditing] = useState(true);
  const [checkSequence, setCheckSequence] = useState(0);
  const [activeDigit, setActiveDigit] = useState<ActiveDigit | null>(null);
  const resultsHeadingRef = useRef<HTMLHeadingElement>(null);
  const nextTicketId = useRef(1);

  const lotteryQuery = useQuery({
    queryKey: ["roongi-lottery", selectedDate],
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams();
      if (selectedDate) params.set("date", selectedDate);
      const response = await fetch(`/api/roongi?${params}`, { signal });
      if (!response.ok) throw new Error("Unable to load lottery results");
      return lotterySchema.parse(await response.json());
    },
    retry: false,
  });

  const lottery = lotteryQuery.data ?? null;
  const error = lotteryQuery.isError
    ? "โหลดผลสลากไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"
    : "";
  const date = lottery
    ? new Date(`${lottery.date}T12:00:00+07:00`).toLocaleDateString("th-TH", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Asia/Bangkok",
      })
    : undefined;
  const highestPrize = lottery
    ? Math.max(
        0,
        ...checked.flatMap((ticket) =>
          checkTicket(ticket.number, lottery).matches.map(
            (match) => match.price,
          ),
        ),
      )
    : 0;

  const handleCheck = () => {
    setChecked([...tickets]);
    setCheckSequence((sequence) => sequence + 1);
    setIsEditing(false);
    requestAnimationFrame(() => resultsHeadingRef.current?.focus());
  };

  const handleEdit = () => {
    setIsEditing(true);
    requestAnimationFrame(() =>
      document.getElementById(tickets[0]?.id ?? "ticket-0")?.focus(),
    );
  };

  const handleTicketChange = (ticketId: string, value: string) => {
    setTickets((currentTickets) =>
      currentTickets.map((ticket) =>
        ticket.id === ticketId
          ? { ...ticket, number: value.replace(/[^0-9]/g, "").slice(0, 6) }
          : ticket,
      ),
    );
    setChecked([]);
  };

  const handleAddTicket = () => {
    const id = `ticket-${nextTicketId.current++}`;
    setTickets((currentTickets) => [...currentTickets, { id, number: "" }]);
  };

  const handleRemoveTicket = (ticketId: string) => {
    setTickets((currentTickets) =>
      currentTickets.filter((ticket) => ticket.id !== ticketId),
    );
    setChecked([]);
  };

  const handleDateChange = (value: string) => {
    setSelectedDate(value);
    setChecked([]);
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
      {highestPrize > 0 && (
        <Suspense fallback={null}>
          <WinCelebration key={checkSequence} prize={highestPrize} />
        </Suspense>
      )}
      <div className="mb-7 max-w-2xl">
        <p className="text-primary mb-2 text-sm font-semibold">
          ตรวจสลาก · สนุกกับตัวเลข
        </p>
        <h1 className="text-3xl font-bold tracking-tight">
          รู้งี้<span className="text-primary">.</span>
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          ตรวจสลากของคุณ แล้วมาดูกันว่าใกล้รางวัลแค่ไหน
        </p>
      </div>
      <div className="grid items-start gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
        <RoongiTicketForm
          activeDigit={activeDigit}
          checkedCount={checked.length}
          date={date}
          error={error}
          isEditing={isEditing}
          latestDate={lottery?.date}
          lotteryLoaded={Boolean(lottery)}
          onActiveDigitChange={setActiveDigit}
          onAddTicket={handleAddTicket}
          onCheck={handleCheck}
          onDateChange={handleDateChange}
          onEdit={handleEdit}
          onRemoveTicket={handleRemoveTicket}
          onRetry={() => void lotteryQuery.refetch()}
          onTicketChange={handleTicketChange}
          selectedDate={selectedDate}
          tickets={tickets}
        />
        {lottery && checked.length > 0 && (
          <RoongiTicketResults
            checkSequence={checkSequence}
            headingRef={resultsHeadingRef}
            lottery={lottery}
            tickets={checked}
          />
        )}
        <RoongiDrawResults
          date={date}
          hasError={Boolean(error)}
          lottery={lottery}
        />
      </div>
    </main>
  );
}
