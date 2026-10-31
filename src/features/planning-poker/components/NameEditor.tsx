import { useState, type FormEvent } from "react";
import { PixelEdit } from "@/features/planning-poker/components/pixel-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { POKER_LIMITS } from "../constants";

export const NameEditor = ({
  currentName,
  isBusy,
  onSave,
}: {
  currentName: string;
  isBusy: boolean;
  onSave: (name: string) => Promise<unknown>;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(currentName);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) return;
    if (trimmed === currentName) {
      setIsEditing(false);
      return;
    }
    const saved = await onSave(trimmed);
    if (saved) setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        id="poker-rename-toggle"
        className="w-full justify-start"
        onClick={() => {
          setDraft(currentName);
          setIsEditing(true);
        }}
      >
        <PixelEdit aria-hidden="true" />
        Rename
      </Button>
    );
  }

  return (
    // อยู่ในแผงเมนู ⋯ (แคบ ~212px) — เรียงแนวตั้งกันล้น: input เต็มแถว, Save/Cancel แถวล่างครึ่ง ๆ กัน
    <form id="poker-rename-form" onSubmit={handleSubmit} className="flex flex-col gap-1.5">
      <Label htmlFor="poker-rename" className="sr-only">
        Display name
      </Label>
      <Input
        id="poker-rename"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        maxLength={POKER_LIMITS.nameMaxLength}
        autoComplete="nickname"
        autoFocus
        className="h-9 w-full"
      />
      <div className="flex items-center gap-1.5">
        <Button
          type="submit"
          size="sm"
          id="poker-rename-save"
          className="flex-1"
          disabled={isBusy || !draft.trim()}
        >
          Save
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          id="poker-rename-cancel"
          className="flex-1"
          onClick={() => setIsEditing(false)}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};
