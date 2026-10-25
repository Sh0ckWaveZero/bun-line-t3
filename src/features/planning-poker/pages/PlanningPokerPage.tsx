import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { PixelCode, PixelDice, PixelPlus } from "@/features/planning-poker/components/pixel-icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  ACCESSIBLE_PRIMARY_CLASS,
  CUSTOM_DECK_ID,
  CUSTOM_DECK_LIMITS,
  DECKS,
  DECK_IDS,
  DEFAULT_DECK_ID,
  POKER_LIMITS,
  ROOM_CODE_LENGTH,
  ROOM_CODE_PATTERN,
} from "../constants";
import { LiveStats } from "../components/LiveStats";
import { PokerApiError, createRoomRequest } from "../lib/api";
import { loadSavedName, saveName, saveRoomToken } from "../lib/storage";

const DECK_OPTIONS = [
  ...DECK_IDS.map((id) => ({
    value: id,
    label: `${DECKS[id].label} (${DECKS[id].values.slice(0, 5).join(", ")}…)`,
  })),
  { value: CUSTOM_DECK_ID, label: "Custom" },
];

/** แยกค่าไพ่ที่ผู้ใช้พิมพ์ (คั่นด้วยคอมมา ช่องว่าง หรือขึ้นบรรทัดใหม่) */
const parseCustomDeck = (text: string): string[] =>
  text
    .split(/[,\n\s]+/)
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

const normalizeCode = (value: string): string =>
  value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, ROOM_CODE_LENGTH);

const CreateRoomCard = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [deckId, setDeckId] = useState<string>(DEFAULT_DECK_ID);
  const [customDeckText, setCustomDeckText] = useState("0 1 2 3 5 8 13");
  const [isSpectator, setIsSpectator] = useState(false);
  const [observersCanControl, setObserversCanControl] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(loadSavedName());
  }, []);

  // ผู้สร้างเป็นผู้สังเกตการณ์ + ปิดสิทธิ์ผู้สังเกตการณ์ = ผู้สร้างเปิดไพ่ในห้องตัวเองไม่ได้
  const isCreatorLockedOut = isSpectator && !observersCanControl;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || isCreatorLockedOut) return;

    setIsBusy(true);
    setError(null);
    try {
      const created = await createRoomRequest({
        name: trimmed,
        deckId,
        customDeck:
          deckId === CUSTOM_DECK_ID
            ? parseCustomDeck(customDeckText)
            : undefined,
        role: isSpectator ? "spectator" : "voter",
        story: "",
        observersCanControl,
      });
      saveName(trimmed);
      saveRoomToken(created.room.code, created.token);
      await navigate({
        to: "/planning-poker/$code",
        params: { code: created.room.code },
      });
    } catch (caught) {
      setError(
        caught instanceof PokerApiError
          ? caught.message
          : "Couldn't create a room — please try again",
      );
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="flex items-center gap-2 text-lg leading-none font-semibold tracking-tight">
          <PixelPlus className="h-5 w-5" aria-hidden="true" />
          Create a new room
        </h2>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="poker-create-name">Display name</Label>
            <Input
              id="poker-create-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={POKER_LIMITS.nameMaxLength}
              placeholder="e.g. Somchai"
              autoComplete="nickname"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="poker-create-deck">Card deck</Label>
            <Select
              id="poker-create-deck"
              value={deckId}
              onValueChange={setDeckId}
              options={DECK_OPTIONS}
              /* panel เป็น Radix portal อยู่นอก main.poker-pixel — ใส่ pixel font เอง */
              className="poker-select-pixel"
              contentClassName="poker-select-pixel"
            />
          </div>
          {deckId === CUSTOM_DECK_ID ? (
            <div className="space-y-2">
              <Label htmlFor="poker-create-custom-deck">
                Card values (separate with spaces or commas)
              </Label>
              <Input
                id="poker-create-custom-deck"
                value={customDeckText}
                onChange={(event) => setCustomDeckText(event.target.value)}
                placeholder="e.g. 1 2 3 5 8 ?"
                autoComplete="off"
              />
              <p className="text-muted-foreground text-xs">
                {CUSTOM_DECK_LIMITS.minValues}–{CUSTOM_DECK_LIMITS.maxValues} cards,
                up to {CUSTOM_DECK_LIMITS.valueMaxLength} characters each,
                no duplicates
              </p>
            </div>
          ) : null}
          <div className="flex items-center gap-2">
            <Checkbox
              id="poker-create-spectator"
              checked={isSpectator}
              onCheckedChange={(checked) => setIsSpectator(checked === true)}
            />
            <Label htmlFor="poker-create-spectator">
              I&apos;m facilitating — I won&apos;t vote
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="poker-create-observers-control"
              checked={observersCanControl}
              onCheckedChange={(checked) =>
                setObserversCanControl(checked === true)
              }
            />
            <Label htmlFor="poker-create-observers-control">
              Spectators can reveal and start new rounds
            </Label>
          </div>
          {isCreatorLockedOut ? (
            <p role="alert" className="text-destructive text-sm">
              If you don&apos;t vote and this room doesn&apos;t let spectators
              control it, nobody can reveal the cards until a voter joins —
              enable spectator control or vote yourself
            </p>
          ) : null}
          {error ? (
            <p role="alert" className="text-destructive text-sm">
              {error}
            </p>
          ) : null}
          <Button
            type="submit"
            id="poker-create-submit"
            disabled={isBusy || !name.trim() || isCreatorLockedOut}
            className="w-full"
          >
            Create room
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

const JoinByCodeCard = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const isValid = ROOM_CODE_PATTERN.test(code);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!isValid) return;
    await navigate({ to: "/planning-poker/$code", params: { code } });
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="flex items-center gap-2 text-lg leading-none font-semibold tracking-tight">
          <PixelCode className="h-5 w-5" aria-hidden="true" />
          Join with a code
        </h2>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="poker-join-code">
              Room code ({ROOM_CODE_LENGTH} characters)
            </Label>
            <Input
              id="poker-join-code"
              value={code}
              onChange={(event) => setCode(normalizeCode(event.target.value))}
              placeholder="ABC234"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              className="text-center font-mono text-lg tracking-widest"
            />
          </div>
          <Button
            type="submit"
            id="poker-join-submit"
            variant="outline"
            disabled={!isValid}
            className="w-full"
          >
            Join room
          </Button>
          <p className="text-muted-foreground text-xs">
            No sign-in needed — the room code is enough to watch and vote
          </p>
        </form>
      </CardContent>
    </Card>
  );
};

export const PlanningPokerPage = () => (
  <main
    className={cn(
      // poker-pixel = ธีม pixel เดียวกับหน้าห้อง (Silkscreen + มุมตรง + เงาแข็ง)
      "poker-pixel mx-auto max-w-3xl space-y-6 px-4 py-8",
      ACCESSIBLE_PRIMARY_CLASS,
    )}
  >
    <header className="text-center">
      <div className="bg-primary/10 text-primary mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl">
        <PixelDice className="h-6 w-6" aria-hidden="true" />
      </div>
      <h1 className="text-2xl font-bold">Planning Poker</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Estimate story points together in real time — hidden votes, revealed all at once
      </p>
    </header>
    <div className="grid gap-4 md:grid-cols-2">
      <CreateRoomCard />
      <JoinByCodeCard />
    </div>
    <LiveStats />
    <p className="text-muted-foreground text-center text-xs">
      Rooms are temporary — deleted after 12 hours idle or when the server
      restarts
    </p>
  </main>
);
