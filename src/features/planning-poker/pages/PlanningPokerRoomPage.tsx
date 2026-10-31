import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "@tanstack/react-router";
import {
  PixelChevronDown,
  PixelCode,
  PixelList,
  PixelLogout,
  PixelMail,
  PixelMinus,
  PixelPlus,
  PixelRefresh,
  PixelShare,
  PixelSwap,
} from "@/features/planning-poker/components/pixel-icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { CopyButton } from "../components/CopyButton";
import { JoinRoomForm } from "../components/JoinRoomForm";
import { NameEditor } from "../components/NameEditor";
import { PlayerCard } from "../components/PlayerCard";
import { RevealCaseButton } from "../components/RevealCaseButton";
import { RevealOverlay } from "../components/RevealOverlay";
import { ResultsPanel } from "../components/ResultsPanel";
import { RoundHistory } from "../components/RoundHistory";
import { RoundTimer } from "../components/RoundTimer";
import { VoteDeck } from "../components/VoteDeck";
import { countGoodStreak } from "../helpers/fx-rarity";
import {
  ACCESSIBLE_PRIMARY_CLASS,
  POKER_LIMITS,
} from "../constants";
import { inviteRecipientsSchema } from "../lib/schemas";
import { usePokerRoom } from "../hooks/usePokerRoom";
import type { PublicRoom } from "../types";

const STORY_SAVE_DELAY_MS = 600;

type CardSize = "small" | "medium" | "large";

const CARD_SIZE_LABELS: Record<CardSize, string> = {
  small: "Small",
  medium: "Medium",
  large: "Large",
};
const PREVIOUS_CARD_SIZE: Record<CardSize, CardSize> = {
  small: "small",
  medium: "small",
  large: "medium",
};
const NEXT_CARD_SIZE: Record<CardSize, CardSize> = {
  small: "medium",
  medium: "large",
  large: "large",
};

/**
 * เมนู "⋯" ของหัวห้อง — ยุบ actions รอง (เปลี่ยนชื่อ/สลับบทบาท/ออกจากห้อง) ไว้ที่เดียว
 * ตาม pattern แถว actions ของโปรเจกต์: ไม่กองปุ่มเรียงแถว ลดความรกของหัวห้องบนจอทุกขนาด
 * แผงเป็น Radix portal อยู่นอก main.poker-pixel จึงต้องใส่คลาสธีม pixel เอง (เหมือน poker-select-pixel)
 */
const RoomActionsMenu = ({
  isJoined,
  me,
  isRevealed,
  isBusy,
  onRename,
  onSwitchRole,
  onLeave,
}: {
  isJoined: boolean;
  me: { name: string; role: "voter" | "spectator" } | null;
  isRevealed: boolean;
  isBusy: boolean;
  onRename: (name: string) => Promise<unknown>;
  onSwitchRole: (role: "voter" | "spectator") => void;
  onLeave: () => void;
}) => (
  <Popover>
    {/* Tooltip ครอบนอก — trigger ทั้งสอง (tooltip + popover) ต้อง asChild chain ลงปุ่มเดียวกัน
        ห้ามให้ asChild ครอบ <Tooltip> เพราะเป็น context ไม่มี DOM node (ref/handler ผูกไม่ได้ = กดไม่ได้) */}
    <Tooltip>
      <TooltipTrigger asChild>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            id="poker-more-actions"
            aria-label="More actions"
            aria-haspopup="menu"
            className="w-9 px-0"
          >
            <PixelList aria-hidden="true" />
          </Button>
        </PopoverTrigger>
      </TooltipTrigger>
      <TooltipContent side="top" className="poker-tooltip-soft">
        More actions
      </TooltipContent>
    </Tooltip>
    <PopoverContent
      id="poker-more-panel"
      align="end"
      className="poker-menu-pixel w-56 p-1"
    >
      <div className="flex flex-col gap-1">
        {isJoined && me ? (
          <NameEditor
            currentName={me.name}
            isBusy={isBusy}
            onSave={onRename}
          />
        ) : null}
        {isJoined && me ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            id="poker-switch-role"
            disabled={isRevealed}
            aria-describedby={isRevealed ? "poker-role-hint" : undefined}
            className="w-full justify-start"
            onClick={() => onSwitchRole(me.role === "voter" ? "spectator" : "voter")}
          >
            <PixelSwap aria-hidden="true" />
            {me.role === "voter" ? "Become spectator" : "Become voter"}
          </Button>
        ) : null}
        {isJoined ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            id="poker-leave-room"
            className="w-full justify-start"
            onClick={onLeave}
          >
            <PixelLogout aria-hidden="true" />
            Leave room
          </Button>
        ) : null}
      </div>
    </PopoverContent>
  </Popover>
);

const RoomMessage = ({ title, detail }: { title: string; detail?: string }) => (
  <main
    id="poker-room-message"
    className={cn(
      "poker-pixel mx-auto max-w-md px-4 py-16 text-center",
      ACCESSIBLE_PRIMARY_CLASS,
    )}
  >
    <h1 className="text-xl font-bold">{title}</h1>
    {detail ? (
      <p className="text-muted-foreground mt-2 text-sm">{detail}</p>
    ) : null}
    <Button asChild className="mt-6">
      <Link to="/planning-poker" id="poker-room-back">
        Back to Planning Poker
      </Link>
    </Button>
  </main>
);

const InvitePanel = ({ code }: { code: string }) => {
  const [emails, setEmails] = useState("");
  // zod validate ก่อนใช้เสมอ — อีเมลไหนไม่ผ่าน format ทั้งชุดถือว่ายังไม่พร้อมส่ง
  const recipients = inviteRecipientsSchema
    .catch([])
    .parse(
      emails
        .split(/[,;\s]+/)
        .map((email) => email.trim())
        .filter((email) => email.length > 0),
    );

  const getLink = () => `${window.location.origin}/planning-poker/${code}`;

  // เปิดโปรแกรมอีเมลของผู้ใช้เอง (mailto) — server ไม่ส่งอีเมลและไม่เก็บอีเมลไว้
  // URL API + URLSearchParams จะ encode ทุก taint ให้เป็น safe percent-encoding
  // (เปลี่ยน '+' กลับเป็น %20 ตาม RFC 6068 — บาง mail client ไม่ decode '+')
  const handleInvite = () => {
    if (recipients.length === 0) return;
    const url = new URL(`mailto:${recipients.join(",")}`);
    url.search = new URLSearchParams({
      subject: "Join our Planning Poker room",
      body: `Join our story point estimation\nRoom code: ${code}\nLink: ${getLink()}`,
    })
      .toString()
      .replace(/\+/g, "%20");
    window.location.href = url.href;
  };

  return (
    <details id="poker-invite-panel" className="group bg-card rounded-lg border shadow-sm">
      <summary className="focus-visible:ring-ring flex cursor-pointer list-none items-center justify-between gap-2 rounded-lg px-6 py-4 focus-visible:ring-2 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <PixelMail className="h-4 w-4" aria-hidden="true" />
          Invite your team
        </h2>
        <PixelChevronDown
          className="h-4 w-4 transition-transform group-open:rotate-180 motion-reduce:transition-none"
          aria-hidden="true"
        />
      </summary>
      <div className="space-y-4 px-6 pb-6">
        <div className="space-y-1.5">
          <Label htmlFor="poker-invite-emails">Teammate emails</Label>
          <div className="flex gap-2">
            <Input
              id="poker-invite-emails"
              type="text"
              inputMode="email"
              value={emails}
              onChange={(event) => setEmails(event.target.value)}
              placeholder="a@example.com, b@example.com"
              autoComplete="off"
              aria-describedby="poker-invite-hint"
            />
            <Button
              type="button"
              variant="outline"
              id="poker-invite-submit"
              disabled={recipients.length === 0}
              onClick={handleInvite}
            >
              Invite
            </Button>
          </div>
          <p id="poker-invite-hint" className="text-muted-foreground text-xs">
            Separate multiple emails with commas — opens your email app with a
            prefilled invite we don&apos;t store the emails
          </p>
        </div>
        <a
          id="poker-invite-json-link"
          href={`/api/poker/rooms/${code}`}
          target="_blank"
          rel="noreferrer"
          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex min-h-6 items-center gap-1.5 rounded text-sm underline underline-offset-4 focus-visible:ring-2 focus-visible:outline-none"
        >
          <PixelCode className="h-4 w-4" aria-hidden="true" />
          View room data as JSON (API) — opens in a new tab
        </a>
      </div>
    </details>
  );
};

const StoryField = ({
  room,
  canEdit,
  onSave,
}: {
  room: PublicRoom;
  canEdit: boolean;
  onSave: (story: string) => void;
}) => {
  const [draft, setDraft] = useState(room.story);
  const [isEditing, setIsEditing] = useState(false);

  // รับค่าใหม่จาก server เฉพาะตอนที่ไม่ได้พิมพ์อยู่ ไม่งั้น polling จะทับสิ่งที่กำลังพิมพ์
  useEffect(() => {
    if (!isEditing) setDraft(room.story);
  }, [room.story, isEditing]);

  useEffect(() => {
    if (!isEditing || draft === room.story) return;
    const timer = window.setTimeout(() => onSave(draft), STORY_SAVE_DELAY_MS);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, isEditing]);

  if (!canEdit) {
    return room.story ? (
      <p className="text-lg font-medium">{room.story}</p>
    ) : (
      <p className="text-muted-foreground text-sm">No story set</p>
    );
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor="poker-story">Story under estimation</Label>
      <Input
        id="poker-story"
        value={draft}
        maxLength={POKER_LIMITS.storyMaxLength}
        placeholder="e.g. PROJ-123 alert system"
        onFocus={() => setIsEditing(true)}
        onBlur={() => {
          setIsEditing(false);
          if (draft !== room.story) onSave(draft);
        }}
        onChange={(event) => setDraft(event.target.value)}
      />
    </div>
  );
};

/** ข้อความสถานะสำหรับ screen reader — ประกาศเมื่อจำนวนโหวตเปลี่ยนหรือเปิดไพ่ */
const getAnnouncement = (
  room: PublicRoom,
  votedCount: number,
  voterCount: number,
): string => {
  if (!room.revealed || !room.summary) {
    return `Voted ${votedCount} of ${voterCount}`;
  }
  // ประกาศเป็นอังกฤษทั้งประโยค (หน้า room เป็นอังกฤษหมด) — ปนไทยแล้ว SR อ่านสำเวียนเสียงผิด (3.1.2)
  const average =
    room.summary.average === null
      ? "no average"
      : `average ${room.summary.average}`;
  return `Cards revealed: ${average}${room.summary.isConsensus ? " — everyone matched" : ""}`;
};

export const PlanningPokerRoomPage = () => {
  const { code: rawCode } = useParams({ strict: false }) as { code?: string };
  const code = (rawCode ?? "").toUpperCase();
  const poker = usePokerRoom(code);
  const { room } = poker;
  const [cardSize, setCardSize] = useState<CardSize>("medium");

  // overlay ฉลองค่าเฉลี่ยเล่นเฉพาะคนที่ "เห็นจังหวะเปิดไพ่เกิดขึ้นจริง" —
  // คนเข้ามาใหม่กลางรอบที่เปิดแล้ว (โหลดครั้งแรก/ย้ายห้องเข้าตอน revealed)
  // ไม่ต้องดูฉลอง 4 วิของรอบที่ตัวเองไม่ได้โหวต ผลลัพธ์ยังดูได้ที่ ResultsPanel
  const seenRoomCodeRef = useRef<string | null>(null);
  const wasRevealedRef = useRef(false);
  const [hasSeenReveal, setHasSeenReveal] = useState(false);
  useEffect(() => {
    if (!room) return;
    if (seenRoomCodeRef.current !== room.code) {
      // ข้อมูลชุดแรกของห้องนี้ — จำสถานะปัจจุบันไว้แล้วไม่นับเป็นการเปิดไพ่
      seenRoomCodeRef.current = room.code;
      wasRevealedRef.current = room.revealed;
      return;
    }
    if (wasRevealedRef.current === room.revealed) return;
    wasRevealedRef.current = room.revealed;
    setHasSeenReveal(room.revealed);
  }, [room]);

  if (poker.isNotFound) {
    return (
      <RoomMessage
        title="Room not found"
        detail="The code may be wrong, or the room was deleted after being idle too long"
      />
    );
  }
  if (!room) {
    return poker.loadError ? (
      <RoomMessage title="Failed to load the room" detail={poker.loadError} />
    ) : (
      <main className="poker-pixel mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-muted-foreground" role="status">
          Loading room…
        </p>
      </main>
    );
  }

  const isJoined = room.meId !== null;
  const me = room.participants.find((participant) => participant.isYou);
  const canVote = isJoined && me?.role === "voter";
  const voters = room.participants.filter(
    (participant) => participant.role === "voter",
  );
  const votedCount = voters.filter(
    (participant) => participant.hasVoted,
  ).length;

  // ลำดับ stagger ตอนเปิดไพ่: นับเฉพาะใบที่จะพลิก (ผู้โหวตที่มีค่า) — cap ที่ 6 ช่วง กันห้องใหญ่รอนาน
  const revealStagger = new Map<string, number>();
  let flipOrder = 0;
  for (const participant of room.participants) {
    if (participant.role === "voter" && participant.vote !== null) {
      revealStagger.set(participant.id, Math.min(flipOrder, 6));
      flipOrder += 1;
    }
  }

  // ตัวปรับขนาดการ์ด — ท้ายแถวปุ่มหัวห้อง (poker-room-header) เหลือแค่ปุ่ม [−][+] ทุกจอ
  // (ชื่อ group/ค่าปัจจุบันเป็น sr-only — screen reader ยังอ่านและประกาศได้ครบ)
  const cardSizeControls = (
    <div className="flex items-center gap-1">
      <span id="poker-card-size-label" className="sr-only">
        Card size
      </span>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            id="poker-decrease-card-size"
            aria-label="Decrease card size"
            aria-controls="poker-player-cards"
            className="h-9 w-9"
            disabled={cardSize === "small"}
            onClick={() => setCardSize((current) => PREVIOUS_CARD_SIZE[current])}
          >
            <PixelMinus aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="poker-tooltip-soft">
          Decrease card size
        </TooltipContent>
      </Tooltip>
      <span className="sr-only" aria-live="polite">
        {CARD_SIZE_LABELS[cardSize]}
      </span>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            id="poker-increase-card-size"
            aria-label="Increase card size"
            aria-controls="poker-player-cards"
            className="h-9 w-9"
            disabled={cardSize === "large"}
            onClick={() => setCardSize((current) => NEXT_CARD_SIZE[current])}
          >
            <PixelPlus aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="poker-tooltip-soft">
          Increase card size
        </TooltipContent>
      </Tooltip>
    </div>
  );

  return (
    <main
      data-card-size={cardSize}
      className={cn(
        // container เดียวกับ Header ของ site (container mx-auto px-4) — content กว้างเท่า header ทุก breakpoint
        // poker-room = CSS vars ตาม data-card-size (S/M/L), poker-pixel = ธีม pixel (มุมตรง/เงาแข็ง/Silkscreen)
        "poker-room poker-pixel container mx-auto space-y-6 px-4 py-6",
        ACCESSIBLE_PRIMARY_CLASS,
      )}
    >
      <p role="status" className="sr-only">
        {getAnnouncement(room, votedCount, voters.length)}
      </p>

      <header id="poker-room-header" className="space-y-2">
        {/* < lg: ปุ่มทั้งหมด icon-only แถวเดียวข้าง room code (minimal บน mobile/tablet) — ≥ lg ปุ่มเต็มเหมือนเดิม */}
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <div>
            <p className="text-muted-foreground text-xs">
              Planning Poker · Room code
            </p>
            <h1
              className="font-mono text-2xl font-bold tracking-widest sm:text-3xl"
              aria-label={`Planning Poker room code ${room.code.split("").join(" ")}`}
            >
              {room.code}
            </h1>
          </div>
          <TooltipProvider delayDuration={180}>
          <div className="ml-auto flex flex-wrap items-center gap-1.5 lg:gap-2">
            <CopyButton id="poker-copy-code" label="Copy code" getText={() => room.code} />
            <CopyButton
              id="poker-copy-link"
              label="Copy link"
              icon={PixelShare}
              getText={() =>
                `${window.location.origin}/planning-poker/${room.code}`
              }
            />
            {cardSizeControls}
            <RoomActionsMenu
              isJoined={isJoined}
              me={me ? { name: me.name, role: me.role } : null}
              isRevealed={room.revealed}
              isBusy={poker.isBusy}
              onRename={poker.rename}
              onSwitchRole={(role) => void poker.setRole(role)}
              onLeave={() => void poker.leave()}
            />
          </div>
          </TooltipProvider>
        </div>
        <StoryField
          room={room}
          canEdit={isJoined}
          onSave={(story) => void poker.setStory(story)}
        />
        {isJoined && room.revealed ? (
          <p
            id="poker-role-hint"
            className="text-muted-foreground text-xs sm:text-right"
          >
            You can switch roles after a new round starts
          </p>
        ) : null}
      </header>

      {poker.actionError ? (
        <p
          role="alert"
          className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm"
        >
          {poker.actionError}
        </p>
      ) : null}

      {!isJoined ? (
        <div className="mx-auto max-w-md space-y-3">
          <p className="text-muted-foreground flex items-center justify-center gap-1.5 text-sm">
            <PixelShare className="h-4 w-4" aria-hidden="true" />
            You&apos;re watching this room — set a name to join the vote
          </p>
          <JoinRoomForm
            isBusy={poker.isBusy}
            onJoin={(name, role) => void poker.join(name, role)}
          />
        </div>
      ) : null}

      <Card className="relative">
        {/* ป้ายเวลา+ผลโหวต พับมุมบนซ้ายของการ์ด (สไตล์ tag เกม pixel) — เด่นเป็นจุดแรกที่ตาเจอ */}
        <div id="poker-timer-badge" className="poker-timer-badge">
          <RoundTimer
            roundStartedAt={room.roundStartedAt}
            revealedAt={room.revealedAt}
            serverNow={room.serverNow}
          />
          <span className="text-muted-foreground text-sm" aria-hidden="true">
            ·
          </span>
          <span className="text-sm tabular-nums">
            Voted {votedCount}/{voters.length}
          </span>
        </div>
        <CardContent className="space-y-6 pt-8">
          {/* กล่องไพ่สไตล์ CardCase — จำนวนใบ = จำนวนผู้โหวต, กล่องคือปุ่มเปิดไพ่
              ก่อนเปิด: เคสอยู่กลางใต้พัดไพ่ (primary action)
              หลังเปิด: เคสหาย เหลือพัดไพ่ (ตัวปรับขนาดการ์ดอยู่ท้ายแถวปุ่มหัวห้อง) */}
          <section
            id="poker-players-section"
            aria-labelledby="poker-players-heading"
            className="space-y-4 sm:space-y-5"
          >
            <h2 id="poker-players-heading" className="sr-only">
              {voters.length} {voters.length === 1 ? "card is" : "cards are"} in
              this case
            </h2>
            {room.participants.length === 0 ? (
              <p className="text-muted-foreground text-center text-sm">
                No players yet
              </p>
            ) : (
              <>
                <div
                  id="poker-fan-scroll"
                  className="poker-player-fan-scroll"
                  role="region"
                  aria-labelledby="poker-players-heading"
                  tabIndex={0}
                >
                  <ul id="poker-player-cards" className="poker-player-fan">
                    {/* ผู้โหวตมาก่อน spectator ท้ายสุดเสมอ (คงลำดับเข้าห้องภายในกลุ่ม) — แถวอ่านเป็น
                        "คนโหวต" แล้วตามด้วย "คนดู" ตรงกับ Voted x/y ที่นับเฉพาะ voter */}
                    {[...room.participants]
                      .sort(
                        (a, b) =>
                          (a.role === "voter" ? 0 : 1) -
                          (b.role === "voter" ? 0 : 1),
                      )
                      .map((participant, index) => (
                        <PlayerCard
                          key={participant.id}
                          participant={participant}
                          isRevealed={room.revealed}
                          staggerIndex={revealStagger.get(participant.id)}
                          position={{
                            index,
                            count: room.participants.length,
                          }}
                        />
                      ))}
                  </ul>
                </div>
              </>
            )}
            {!room.revealed ? (
              /* เคสเปิดไพ่ = primary action กลางใต้พัดไพ่ — กดเปิดจากการ์ดที่เห็น */
              <div className="flex justify-center">
                <RevealCaseButton
                  id="poker-reveal-case"
                  onClick={() => void poker.reveal()}
                  disabled={!room.canControl}
                />
              </div>
            ) : null}
          </section>

          {room.canControl && room.revealed ? (
            <div className="flex justify-center">
              <Button type="button" id="poker-new-round" onClick={() => void poker.reset()}>
                <PixelRefresh aria-hidden="true" />
                New round
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* ไพ่ให้เลือกอยู่ใต้โต๊ะทันที — ไม่ต้องเลื่อนผ่านผลลัพธ์/ประวัติ และซ่อนหลังเปิดไพ่ */}
      {canVote && !room.revealed ? (
        <section aria-labelledby="poker-deck-heading" className="space-y-3">
          <h2
            id="poker-deck-heading"
            className="text-center text-sm font-semibold"
          >
            Pick your score
          </h2>
          <VoteDeck
            key={room.round}
            deck={room.deck}
            selected={room.myVote}
            labelledBy="poker-deck-heading"
            onSelect={(value) => void poker.vote(value)}
          />
        </section>
      ) : canVote ? (
        <p className="text-center text-sm">
          Cards are revealed — your score:{" "}
          <strong>{room.myVote ?? "no vote"}</strong>
        </p>
      ) : isJoined ? (
        <p className="text-muted-foreground text-center text-sm">
          You&apos;re watching as a spectator — you can&apos;t vote
        </p>
      ) : null}

      {room.summary ? <ResultsPanel summary={room.summary} /> : null}

      <RoundHistory history={room.history} />

      <InvitePanel code={room.code} />

      {/* ไพ่ค่าเฉลี่ยใบเดียวกลางจอตอนเปิดไพ่ (คลิกข้ามได้) — key ต่อรอบให้เล่นใหม่ทุกรอบ
          เล่นเฉพาะคนที่เห็นจังหวะเปิดไพ่ (hasSeenReveal จาก transition ใน effect ด้านบน) */}
      {room.revealed && hasSeenReveal ? (
        <RevealOverlay
          key={room.round}
          summary={room.summary}
          round={room.round}
          streak={countGoodStreak(room.history)}
        />
      ) : null}
    </main>
  );
};
