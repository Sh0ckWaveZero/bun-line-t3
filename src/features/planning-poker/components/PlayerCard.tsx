import { PixelEye } from "@/features/planning-poker/components/pixel-icons";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { getVoteTier } from "../helpers/vote-tier";
import { PixelGlyph } from "./PixelGlyph";
import { PixelArtGlyph } from "./PixelArtGlyph";
import { PixelMatrixCard } from "./PixelMatrixCard";
import type { PublicParticipant } from "../types";

interface PlayerCardProps {
  participant: PublicParticipant;
  isRevealed: boolean;
  /**
   * ลำดับการพลิกของไพ่ตอนเปิด (stagger ผ่าน CSS var --flip-index)
   * undefined เมื่อไม่มีค่าโหวตให้พลิก — ไพ่ค้างด้านหลังตามเดิม
   */
  staggerIndex?: number;
  position: FanPosition;
}

interface FanPosition {
  index: number;
  count: number;
}

/** ข้อความสถานะที่มองเห็นได้ ไม่พึ่งสีอย่างเดียว (null = ไม่ต้องแสดง เพราะไพ่แสดงค่าอยู่แล้ว) */
const getStatusCaption = (
  participant: PublicParticipant,
  isRevealed: boolean,
): string | null => {
  if (participant.role === "spectator") return "Spectator";
  if (isRevealed) return participant.vote === null ? "No vote" : null;
  return participant.hasVoted ? "Voted" : "Not voted";
};

const getFanStyle = ({ index, count }: FanPosition): CSSProperties => {
  const fanPosition = count > 1 ? (index / (count - 1)) * 2 - 1 : 0;
  const lift = count > 1 ? (1 - Math.abs(fanPosition)) * 14 : 0;

  return {
    "--poker-fan-angle": `${fanPosition * 9}deg`,
    "--poker-fan-lift": `${-lift}px`,
    "--poker-fan-index": index,
  } as CSSProperties;
};

export const PlayerCard = ({
  participant,
  isRevealed,
  staggerIndex,
  position,
}: PlayerCardProps) => {
  const isSpectator = participant.role === "spectator";
  const revealedVote = isRevealed ? participant.vote : null;
  const showValue = revealedVote !== null;
  const caption = getStatusCaption(participant, isRevealed);
  const tier = revealedVote !== null ? getVoteTier(revealedVote) : null;
  const offlineClass = participant.isOnline ? null : "opacity-60";
  const flipStyle = { "--flip-index": staggerIndex ?? 0 } as CSSProperties;

  // ไพ่เป็นภาพประกอบ — ข้อมูลจริงอยู่ในข้อความด้านล่าง (ซ่อนจาก screen reader กันอ่านซ้ำ)
  // ทุกหน้าไพ่วาดด้วย PixelGlyph ("—" ยังไม่โหวต, "✓" โหวตแล้ว, ค่าโหวตตอนเปิด)
  const cardVisual = isSpectator ? (
    <div
      aria-hidden="true"
      className={cn(
        "flex items-center justify-center rounded-lg border-2 border-dashed text-muted-foreground",
        "aspect-square w-full poker-player-card__visual poker-player-card__visual--placeholder",
        offlineClass,
      )}
    >
      <PixelEye className="h-5 w-5" />
    </div>
  ) : showValue ? (
    // ไพ่พลิกจากหลัง (check โหวตแล้ว) ไปหน้า (art ตาม tier + ตัวเลข pixel) — เวที + ด้านไพ่จัดโครงใน input.css
    <div
      aria-hidden="true"
      className={cn(
        "poker-flip-scene aspect-square w-full poker-player-card__visual",
        offlineClass,
      )}
    >
      <div className="poker-flip poker-flip--revealed" style={flipStyle}>
        <div className="poker-flip-face poker-flip-face--back border-primary bg-primary text-primary-foreground">
          <PixelArtGlyph name="check" cell={14} />
        </div>
        <div
          className={cn(
            "poker-flip-face poker-flip-face--front",
            tier && `poker-tier--${tier}`,
          )}
        >
          {/* dot-matrix ช่อง 9×9 — plot ตัวเลขลงบนช่องของกริดเดิม */}
          <PixelMatrixCard value={revealedVote} cell={210 / 9} />
        </div>
      </div>
    </div>
  ) : participant.hasVoted ? (
    <div
      aria-hidden="true"
      className={cn(
        "flex items-center justify-center rounded-lg border-2 border-primary bg-primary text-primary-foreground",
        "aspect-square w-full poker-player-card__visual",
        offlineClass,
      )}
    >
      <PixelArtGlyph name="check" cell={14} />
    </div>
  ) : isRevealed ? (
    <div
      aria-hidden="true"
      className={cn(
        "flex items-center justify-center rounded-lg border-2 border-dashed border-border text-muted-foreground",
        "aspect-square w-full poker-player-card__visual poker-player-card__visual--placeholder",
        offlineClass,
      )}
    >
      <PixelGlyph value="—" />
    </div>
  ) : (
    // ไพ่คว่ำในกล่อง (สไตล์ CardCase) — art "question" หรี่ ๆ — เปิดไพ่แล้วถ้าไม่ได้โหวตจะกลายเป็น "—" ข้างบน
    <div
      aria-hidden="true"
      className={cn(
        "poker-slot aspect-square w-full poker-player-card__visual poker-player-card__visual--back",
        offlineClass,
      )}
    >
      <PixelArtGlyph name="question" cell={23} />
    </div>
  );

  return (
    <li
      className={cn("poker-player-card", tier && `poker-tier--${tier}`)}
      style={getFanStyle(position)}
    >
      <div className="poker-player-card__art">{cardVisual}</div>
      <div className="poker-player-card__meta">
        <span
          className={cn(
            "poker-player-card__name text-sm font-medium",
            participant.isYou && "text-primary font-semibold",
          )}
          title={participant.name}
        >
          {participant.name}
          {participant.isYou ? " (you)" : ""}
        </span>
        {showValue ? (
          <span className="poker-player-card__status text-muted-foreground text-xs">
            Voted {revealedVote}
          </span>
        ) : null}
        {caption || !participant.isOnline ? (
          <span className="poker-player-card__status text-muted-foreground text-xs">
            {caption ? <span>{caption}</span> : null}
            {caption && !participant.isOnline ? (
              <span aria-hidden="true"> · </span>
            ) : null}
            {!participant.isOnline ? <span>Offline</span> : null}
          </span>
        ) : null}
      </div>
    </li>
  );
};
