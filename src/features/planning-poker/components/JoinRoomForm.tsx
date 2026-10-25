import { useEffect, useState, type FormEvent } from "react";
import { PixelEye, PixelLogin } from "@/features/planning-poker/components/pixel-icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { POKER_LIMITS } from "../constants";
import { loadSavedName } from "../lib/storage";

interface JoinRoomFormProps {
  isBusy: boolean;
  onJoin: (name: string, role: "voter" | "spectator") => void;
}

export const JoinRoomForm = ({ isBusy, onJoin }: JoinRoomFormProps) => {
  const [name, setName] = useState("");
  const [isSpectator, setIsSpectator] = useState(false);

  useEffect(() => {
    setName(loadSavedName());
  }, []);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onJoin(trimmed, isSpectator ? "spectator" : "voter");
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-base leading-none font-semibold tracking-tight">
          Join the room to vote
        </h2>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="poker-join-name">Display name</Label>
            <Input
              id="poker-join-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={POKER_LIMITS.nameMaxLength}
              placeholder="e.g. Somchai"
              autoComplete="nickname"
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="poker-join-spectator"
              checked={isSpectator}
              onCheckedChange={(checked) => setIsSpectator(checked === true)}
            />
            <Label
              htmlFor="poker-join-spectator"
              className="flex items-center gap-1.5"
            >
              <PixelEye className="h-4 w-4" aria-hidden="true" />
              Just watching (no vote)
            </Label>
          </div>
          <Button
            type="submit"
            id="poker-join-submit"
            disabled={isBusy || !name.trim()}
            className="w-full"
          >
            <PixelLogin aria-hidden="true" />
            Join room
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
