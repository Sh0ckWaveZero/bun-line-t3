import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { PIXEL_ARTS, type ArtName } from "../helpers/pixel-art";

interface PixelArtGlyphProps {
  name: ArtName;
  /** ขนาดจุดต่อช่อง (px) — 9×9 ช่อง = cell*9 (model เดียวกับ <PixelGlyph art colour cell> ของ lib) */
  cell?: number;
  className?: string;
}

/**
 * ตารางจุดสี่เหลี่ยมคลุมทั้งไพ่ (BG แบบ demo — ทุกช่องมีจุดหรี่ ๆ)
 * วางเป็นเลเยอร์หลังตัวเลขด้วย absolute inset-0; สีตาม currentColor
 */
export const PixelLattice = ({
  cell = 15,
  cols = 14,
  rows = 14,
  className,
}: {
  cell?: number;
  cols?: number;
  rows?: number;
  className?: string;
}) => {
  const cells: Array<ReactNode> = [];
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      cells.push(
        <rect
          key={`${x}-${y}`}
          x={x + 0.08}
          y={y + 0.08}
          width={0.84}
          height={0.84}
          rx={0.12}
          className="poker-lattice-cell"
        />,
      );
    }
  }
  return (
    <svg
      className={cn("poker-lattice", className)}
      width={cols * cell}
      height={rows * cell}
      viewBox={`0 0 ${cols} ${rows}`}
      preserveAspectRatio="none"
      fill="currentColor"
      aria-hidden="true"
    >
      {cells}
    </svg>
  );
};

export const PixelArtGlyph = ({
  name,
  cell = 14,
  className,
}: PixelArtGlyphProps) => {
  const art = PIXEL_ARTS[name];
  if (!art) return null;
  const cells: Array<ReactNode> = [];
  art.forEach((row, y) => {
    [...row].forEach((char, x) => {
      const key = `${x}-${y}`;
      if (char === ".") {
        cells.push(
          <circle key={key} cx={x + 0.5} cy={y + 0.5} r={0.32} className="poker-art-dim" />,
        );
      } else if (char === "o") {
        cells.push(
          <circle key={key} cx={x + 0.5} cy={y + 0.5} r={0.42} opacity={0.5} />,
        );
      } else {
        cells.push(<circle key={key} cx={x + 0.5} cy={y + 0.5} r={0.44} />);
      }
    });
  });
  return (
    <svg
      className={cn("poker-art", className)}
      width={cell * 9}
      height={cell * 9}
      viewBox="0 0 9 9"
      fill="currentColor"
      shapeRendering="geometricPrecision"
    >
      {cells}
    </svg>
  );
};
