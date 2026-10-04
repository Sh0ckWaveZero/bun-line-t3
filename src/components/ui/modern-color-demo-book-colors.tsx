// src/components/ui/modern-color-demo-book-colors.tsx
"use client";
import { ModernColorShadeGrid } from "@/components/ui/modern-color-demo-shade-grid";

/** 📚 การ์ดสีหนังสือสำหรับ Light Mode ทีละเฉด */
export function ModernColorDemoBookColors() {
  return (
    <section>
      <h2 className="text-text-dark-primary mb-6 text-2xl font-black">
        📚 Book Colors - สีหนังสือสำหรับ Light Mode
      </h2>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {/* Paper */}
        <div className="bg-surface-book-light shadow-book hover:shadow-book-hover rounded-xl p-6 transition-[box-shadow] duration-300">
          <h3 className="text-text-book-primary mb-4 text-lg font-black">
            📄 Paper
          </h3>
          <ModernColorShadeGrid family="paper" />
          <p className="text-text-book-secondary mt-3 text-sm font-semibold">
            สีกระดาษหนังสือที่อบอุ่นและเป็นมิตรกับสายตา
          </p>
        </div>

        {/* Ink */}
        <div className="bg-surface-book-warm shadow-book hover:shadow-book-hover rounded-xl p-6 transition-[box-shadow] duration-300">
          <h3 className="text-ink-700 mb-4 text-lg font-black">🖋️ Ink</h3>
          <ModernColorShadeGrid family="ink" />
          <p className="text-text-book-secondary mt-3 text-sm font-semibold">
            สีหมึกสำหรับข้อความที่อ่านง่าย
          </p>
        </div>

        {/* Leather */}
        <div className="bg-surface-book-vintage shadow-leather-glow hover:shadow-leather-hover rounded-xl p-6 transition-[box-shadow] duration-300">
          <h3 className="text-leather-600 mb-4 text-lg font-black">
            📖 Leather
          </h3>
          <ModernColorShadeGrid family="leather" />
          <p className="text-text-book-leather mt-3 text-sm font-bold">
            สีหนังปกหนังสือแบบคลาสสิก
          </p>
        </div>

        {/* Vintage */}
        <div className="bg-surface-book-aged shadow-vintage-glow hover:shadow-book-hover rounded-xl p-6 transition-[box-shadow] duration-300">
          <h3 className="text-vintage-600 mb-4 text-lg font-black">
            📜 Vintage
          </h3>
          <ModernColorShadeGrid family="vintage" />
          <p className="text-text-book-vintage mt-3 text-sm font-bold">
            สีวินเทจสำหรับหนังสือเก่า
          </p>
        </div>

        {/* Sepia */}
        <div className="bg-gradient-book-sepia shadow-sepia-glow hover:shadow-book-hover rounded-xl p-6 transition-[box-shadow] duration-300">
          <h3 className="text-sepia-700 mb-4 text-lg font-black">🏺 Sepia</h3>
          <ModernColorShadeGrid family="sepia" />
          <p className="text-text-book-vintage mt-3 text-sm font-bold">
            สีซีเปียสำหรับภาพและข้อความเก่า
          </p>
        </div>
      </div>
    </section>
  );
}
