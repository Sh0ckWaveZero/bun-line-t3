// src/components/ui/modern-color-demo-book-theme-cards.tsx
"use client";

/** 📖 การ์ดตัวอย่างการใช้งานธีมหนังสือ */
export function ModernColorDemoBookThemeCards() {
  return (
    <section>
      <h2 className="text-text-book-primary mb-6 text-2xl font-semibold">
        📖 Book Theme Cards - ตัวอย่างการใช้งาน
      </h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Reading Statistics */}
        <div className="bg-gradient-book-warm shadow-paper-glow hover:shadow-paper-hover transform rounded-xl p-6 text-white transition-[transform,box-shadow] duration-300 hover:scale-105">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-medium text-white/90">
              หน้าที่อ่าน
            </span>
            <span className="text-2xl">📚</span>
          </div>
          <div className="mb-2 text-3xl font-bold">1,247</div>
          <div className="text-sm text-white/90">หน้า (เดือนนี้)</div>
        </div>

        {/* Reading Time */}
        <div className="bg-gradient-book-classic shadow-leather-glow hover:shadow-leather-hover transform rounded-xl p-6 text-white transition-[transform,box-shadow] duration-300 hover:scale-105">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-medium text-white/90">เวลาอ่าน</span>
            <span className="text-2xl">⏱️</span>
          </div>
          <div className="mb-2 text-3xl font-bold">24.5</div>
          <div className="text-sm text-white/90">ชั่วโมง</div>
        </div>

        {/* Books Completed */}
        <div className="bg-gradient-book-antique shadow-vintage-glow hover:shadow-book-hover transform rounded-xl p-6 text-white transition-[transform,box-shadow] duration-300 hover:scale-105">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-medium text-white/90">หนังสือจบ</span>
            <span className="text-2xl">✅</span>
          </div>
          <div className="mb-2 text-3xl font-bold">12</div>
          <div className="text-sm text-white/90">เล่ม</div>
        </div>

        {/* Knowledge Score */}
        <div className="text-leather-800 bg-gradient-book-paper shadow-paper-glow hover:shadow-paper-hover transform rounded-xl p-6 transition-[transform,box-shadow] duration-300 hover:scale-105">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-leather-700/90 text-sm font-medium">
              คะแนนความรู้
            </span>
            <span className="text-2xl">🧠</span>
          </div>
          <div className="mb-2 text-3xl font-bold">87%</div>
          <div className="text-leather-700/90 text-sm">ความเข้าใจ</div>
        </div>
      </div>
    </section>
  );
}
