// src/components/ui/modern-color-demo-color-families.tsx
"use client";
import { ModernColorShadeGrid } from "@/components/ui/modern-color-demo-shade-grid";

/** 🎨 การ์ดแสดงตระกูลสีหลักทีละเฉด */
export function ModernColorDemoColorFamilies() {
  return (
    <section>
      <h2 className="text-text-dark-primary mb-6 text-2xl font-black">
        🎨 Individual Color Families
      </h2>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {/* Ocean Blue */}
        <div className="bg-surface-modern-light shadow-card-modern hover:shadow-card-hover dark:bg-surface-modern-dark rounded-xl p-6 transition-[box-shadow] duration-300">
          <h3 className="text-text-modern-light-primary mb-4 text-lg font-black">
            🌊 Ocean Blue
          </h3>
          <ModernColorShadeGrid family="ocean" />
          <p className="text-text-modern-light-secondary mt-3 text-sm font-medium">
            สำหรับข้อมูลสำคัญและการเข้างาน
          </p>
        </div>

        {/* Rose */}
        <div className="bg-surface-modern-light shadow-card-modern hover:shadow-card-hover dark:bg-surface-modern-dark rounded-xl p-6 transition-[box-shadow] duration-300">
          <h3 className="mb-4 text-lg font-black text-rose-600">🌹 Rose</h3>
          <ModernColorShadeGrid family="rose" />
          <p className="text-text-dark-medium mt-3 text-sm font-medium">
            สำหรับการแจ้งเตือนและเหตุการณ์สำคัญ
          </p>
        </div>

        {/* Emerald */}
        <div className="bg-surface-modern-light shadow-card-modern hover:shadow-card-hover dark:bg-surface-modern-dark rounded-xl p-6 transition-[box-shadow] duration-300">
          <h3 className="mb-4 text-lg font-black text-emerald-600">
            💚 Emerald
          </h3>
          <ModernColorShadeGrid family="emerald" />
          <p className="text-text-dark-medium mt-3 text-sm font-medium">
            สำหรับสถานะสำเร็จและข้อมูลบวก
          </p>
        </div>

        {/* Violet */}
        <div className="bg-surface-modern-light shadow-card-modern hover:shadow-card-hover dark:bg-surface-modern-dark rounded-xl p-6 transition-[box-shadow] duration-300">
          <h3 className="mb-4 text-lg font-black text-violet-600">💜 Violet</h3>
          <ModernColorShadeGrid family="violet" />
          <p className="text-text-dark-medium mt-3 text-sm font-medium">
            สำหรับข้อมูลพิเศษและฟีเจอร์ใหม่
          </p>
        </div>

        {/* Amber */}
        <div className="bg-surface-modern-light shadow-card-modern hover:shadow-card-hover dark:bg-surface-modern-dark rounded-xl p-6 transition-[box-shadow] duration-300">
          <h3 className="mb-4 text-lg font-black text-amber-600">🧡 Amber</h3>
          <ModernColorShadeGrid family="amber" />
          <p className="text-text-dark-medium mt-3 text-sm font-medium">
            สำหรับการเตือนและข้อมูลที่ต้องระวัง
          </p>
        </div>

        {/* Teal */}
        <div className="bg-surface-modern-light shadow-card-modern hover:shadow-card-hover dark:bg-surface-modern-dark rounded-xl p-6 transition-[box-shadow] duration-300">
          <h3 className="mb-4 text-lg font-black text-teal-600">🔷 Teal</h3>
          <ModernColorShadeGrid family="teal" />
          <p className="text-text-dark-medium mt-3 text-sm font-medium">
            สำหรับข้อมูลสถิติและการวิเคราะห์
          </p>
        </div>
      </div>
    </section>
  );
}
