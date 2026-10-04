import type { ReactNode } from "react";

interface ThaiHelpTabPanelProps {
  id: string;
  isActive: boolean;
  children: ReactNode;
}

/**
 * แผง tab แบบ always mounted — CSS crossfade ตอนสลับ
 * (โครงสร้าง className ตรงกับ markup เดิมทุกอย่าง)
 */
export function ThaiHelpTabPanel({
  id,
  isActive,
  children,
}: ThaiHelpTabPanelProps) {
  return (
    <div
      id={id}
      className={`space-y-4 transition-[opacity,transform] duration-200 ease-out ${
        isActive
          ? "relative translate-y-0 opacity-100"
          : "pointer-events-none absolute inset-0 translate-y-1 opacity-0"
      }`}
      aria-hidden={!isActive}
    >
      {children}
    </div>
  );
}
