import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { PIXEL_ARTS } from "../helpers/pixel-art";
import { buildPixelGrid, pixelGridWidth } from "../helpers/pixel-font";

interface PixelMatrixCardProps {
  /** ค่าโหวต; ค่าที่ไม่มี glyph ใช้ลาย question และ glyph ที่กว้างใช้พิกเซลความละเอียดเต็ม */
  value: string;
  /** ขนาดช่อง (px) — การ์ดกว้าง = cell*9 */
  cell?: number;
  className?: string;
}

export const PixelMatrixCard = ({
  value,
  cell = 23,
  className,
}: PixelMatrixCardProps) => {
  const grid = buildPixelGrid(value);
  const pattern = grid ?? PIXEL_ARTS.question;
  const cols = grid ? pixelGridWidth(grid) : 9;
  const rows = grid ? grid.length : 9;
  const useHighResolutionGlyph = grid !== null && cols > 9;

  // Map glyph pixels to the nearest cell so the foreground and matrix share one grid.
  const boxW = Math.min(8, (6 * cols) / rows);
  const boxH = (boxW * rows) / cols;
  const boxX = (9 - boxW) / 2;
  const boxY = (9 - boxH) / 2;
  const cellBrightness = new Map<number, "half" | "full">();

  if (!useHighResolutionGlyph) {
    pattern.forEach((row, y) => {
      [...row].forEach((char, x) => {
        const brightness =
          char === "#" || char === "x" ? "full" : char === "o" ? "half" : null;
        if (!brightness) return;

        const matrixX = Math.round(boxX + ((x + 0.5) * boxW) / cols - 0.5);
        const matrixY = Math.round(boxY + ((y + 0.5) * boxH) / rows - 0.5);
        const matrixIndex = matrixY * 9 + matrixX;
        if (
          brightness === "full" ||
          cellBrightness.get(matrixIndex) !== "full"
        ) {
          cellBrightness.set(matrixIndex, brightness);
        }
      });
    });
  }

  const cells: Array<ReactNode> = [];
  for (let y = 0; y < 9; y += 1) {
    for (let x = 0; x < 9; x += 1) {
      const brightness = cellBrightness.get(y * 9 + x);
      cells.push(
        <rect
          key={`${x}-${y}`}
          x={x + 0.06}
          y={y + 0.06}
          width={0.88}
          height={0.88}
          rx={0.14}
          className={brightness ? undefined : "poker-matrix-dim"}
          opacity={brightness === "half" ? 0.5 : undefined}
        />,
      );
    }
  }

  // Keep multi-character glyphs recognizable instead of collapsing them onto the 9×9 card grid.
  const glyphCell = Math.min(0.85, 8 / cols);
  const glyphWidth = cols * glyphCell;
  const glyphHeight = rows * glyphCell;
  const glyphX = (9 - glyphWidth) / 2;
  const glyphY = (9 - glyphHeight) / 2;
  const pixelValue = useHighResolutionGlyph
    ? pattern.flatMap((row, y) =>
        [...row].flatMap((char, x) =>
          char === "#"
            ? [
                <rect
                  key={`value-${x}-${y}`}
                  x={glyphX + x * glyphCell}
                  y={glyphY + y * glyphCell}
                  width={glyphCell}
                  height={glyphCell}
                  shapeRendering="crispEdges"
                />,
              ]
            : [],
        ),
      )
    : null;

  return (
    <svg
      className={cn("poker-matrix", className)}
      width={cell * 9}
      height={cell * 9}
      style={{ width: "100%", height: "auto", maxWidth: cell * 9 }}
      viewBox="0 0 9 9"
      fill="currentColor"
      aria-hidden="true"
    >
      {cells}
      {pixelValue}
    </svg>
  );
};
