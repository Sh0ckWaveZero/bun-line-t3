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

const PlayerStatus = ({
  caption,
  isOnline,
}: {
  caption: string | null;
  isOnline: boolean;
}) => {
  if (!caption && isOnline) return null;
  return (
    <span className="poker-player-card__status text-muted-foreground text-xs">
      {caption && <span>{caption}</span>}
      {caption && !isOnline && <span aria-hidden="true"> · </span>}
      {!isOnline && <span>Offline</span>}
    </span>
  );
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

/** เลือกภาพหน้าไพ่ตามสถานะ (helper นอก component — กัน complexity ของตัว PlayerCard) */
const getCardVisual = ({
  participant,
  isSpectator,
  revealedVote,
  showValue,
  isRevealed,
  tier,
  offlineClass,
  flipStyle,
}: {
  participant: PublicParticipant;
  isSpectator: boolean;
  revealedVote: string | null;
  showValue: boolean;
  isRevealed: boolean;
  tier: string | null;
  offlineClass: string | null;
  flipStyle: CSSProperties;
}) => {
  if (isSpectator) {
    return (
      <div
        aria-hidden="true"
        className={cn(
          "text-muted-foreground flex items-center justify-center rounded-lg border-2 border-dashed",
          "poker-player-card__visual poker-player-card__visual--placeholder aspect-square w-full",
          offlineClass,
        )}
      >
        <PixelEye className="h-5 w-5" />
      </div>
    );
  }
  if (showValue && revealedVote !== null) {
    // ไพ่พลิกจากหลัง (check โหวตแล้ว) ไปหน้า (art ตาม tier + ตัวเลข pixel) — เวที + ด้านไพ่จัดโครงใน input.css
    return (
      <div
        aria-hidden="true"
        className={cn(
          "poker-flip-scene poker-player-card__visual aspect-square w-full",
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
    );
  }
  if (participant.hasVoted) {
    return (
      <div
        aria-hidden="true"
        className={cn(
          "border-primary bg-primary text-primary-foreground flex items-center justify-center rounded-lg border-2",
          "poker-player-card__visual aspect-square w-full",
          offlineClass,
        )}
      >
        <PixelArtGlyph name="check" cell={14} />
      </div>
    );
  }
  if (isRevealed) {
    return (
      <div
        aria-hidden="true"
        className={cn(
          "border-border text-muted-foreground flex items-center justify-center rounded-lg border-2 border-dashed",
          "poker-player-card__visual poker-player-card__visual--placeholder aspect-square w-full",
          offlineClass,
        )}
      >
        <PixelGlyph value="—" />
      </div>
    );
  }
  // ไพ่คว่ำในกล่อง (สไตล์ CardCase) — art "question" หรี่ ๆ — เปิดไพ่แล้วถ้าไม่ได้โหวตจะกลายเป็น "—" ข้างบน
  return (
    <div
      aria-hidden="true"
      className={cn(
        "poker-slot poker-player-card__visual poker-player-card__visual--back aspect-square w-full",
        offlineClass,
      )}
    >
      <PixelArtGlyph name="question" cell={23} />
    </div>
  );
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
  const cardVisual = getCardVisual({
    participant,
    isSpectator,
    revealedVote,
    showValue,
    isRevealed,
    tier,
    offlineClass,
    flipStyle,
  });

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
        <PlayerStatus caption={caption} isOnline={participant.isOnline} />
      </div>
    </li>
  );
};
