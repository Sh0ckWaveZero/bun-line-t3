// src/components/ui/modern-color-demo-shade-grid.tsx
"use client";

const SHADES = ["50", "200", "400", "600", "800"] as const;

interface ModernColorShadeGridProps {
  /** ชื่อตระกูลสี เช่น "ocean", "rose" */
  family: string;
}

/** แสดงตัวอย่างเฉดสี 5 ระดับของตระกูลสีหนึ่ง */
export function ModernColorShadeGrid({ family }: ModernColorShadeGridProps) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {SHADES.map((shade) => (
        <div key={shade} className={`bg-${family}-${shade} h-12 rounded-lg`} />
      ))}
    </div>
  );
}
