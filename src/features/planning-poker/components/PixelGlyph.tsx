import { cn } from "@/lib/utils";
import { buildPixelGrid, pixelGridWidth } from "../helpers/pixel-font";

interface PixelGlyphProps {
  /** ค่าโหวต — รองรับสูงสุด 4 ตัวอักษร (เช่น 8, 13, ?, ☕) นอกนั้น fallback เป็นข้อความ */
  value: string;
  /**
   * ขนาดจุดต่อช่อง (px) ตาม model ของ lib (<PixelGlyph art colour cell={14} />)
   * กำหนดแล้วขนาดเป็น px ตรง ๆ (กว้าง = cols*cell สูง = 7*cell) ไม่งั้นใช้ % ตาม CSS
   */
  cell?: number;
  className?: string;
}

/**
 * อาร์ตพิกเซลของค่าโหวตบนหน้าไพ่ — สีตาม currentColor (face ตั้งเป็นสี tier ให้)
 * aria-hidden โดยนัย: ไพ่ทั้งก้อน aria-hidden อยู่แล้ว ค่าจริงประกาศผ่าน sr-only
 */
export const PixelGlyph = ({ value, cell, className }: PixelGlyphProps) => {
  const grid = buildPixelGrid(value);
  if (!grid) {
    return <span className={cn("poker-glyph-fallback", className)}>{value}</span>;
  }
  const cols = pixelGridWidth(grid);
  const sizeStyle = cell
    ? { width: cols * cell, height: 7 * cell }
    : undefined;
  return (
    <svg
      className={cn("poker-glyph", className)}
      style={sizeStyle}
      viewBox={`0 0 ${cols} 7`}
      shapeRendering="crispEdges"
      fill="currentColor"
    >
      {grid.flatMap((row, y) =>
        [...row].map((cell, x) =>
          cell === "#" ? (
            <rect
              key={`${x}-${y}`}
              x={x}
              y={y}
              width={1.04}
              height={1.04}
              rx={0.12}
            />
          ) : null,
        ),
      )}
    </svg>
  );
};
