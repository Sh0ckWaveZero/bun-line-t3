// src/components/ui/modern-color-demo-interactive.tsx
"use client";

/** 🌟 ตัวอย่างปุ่มและการ์ดแบบ interactive */
export function ModernColorDemoInteractive() {
  return (
    <section>
      <h2 className="text-text-modern-light-primary dark:text-text-modern-dark-primary mb-6 text-2xl font-semibold">
        ✨ Interactive Elements
      </h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Modern Buttons */}
        <div className="bg-surface-modern-light shadow-card-modern dark:bg-surface-modern-dark rounded-xl p-6">
          <h3 className="text-text-modern-light-primary dark:text-text-modern-dark-primary mb-4 text-lg font-semibold">
            🔘 Modern Buttons
          </h3>
          <div className="space-y-3">
            <button className="bg-gradient-ocean hover:shadow-ocean-hover w-full transform rounded-lg px-6 py-3 text-white transition-[transform,box-shadow] duration-300 hover:scale-105">
              Primary Action
            </button>
            <button className="bg-gradient-emerald hover:shadow-emerald-hover w-full transform rounded-lg px-6 py-3 text-white transition-[transform,box-shadow] duration-300 hover:scale-105">
              Success Action
            </button>
            <button className="bg-gradient-rose hover:shadow-rose-hover w-full transform rounded-lg px-6 py-3 text-white transition-[transform,box-shadow] duration-300 hover:scale-105">
              Warning Action
            </button>
          </div>
        </div>

        {/* Book Buttons */}
        <div className="bg-gradient-book-paper shadow-paper-glow rounded-xl p-6">
          <h3 className="text-text-book-primary mb-4 text-lg font-semibold">
            📚 Book Buttons
          </h3>
          <div className="space-y-3">
            <button className="bg-gradient-book-warm hover:shadow-paper-hover w-full transform rounded-lg px-6 py-3 text-white transition-[transform,box-shadow] duration-300 hover:scale-105">
              เริ่มอ่าน
            </button>
            <button className="bg-gradient-book-classic hover:shadow-leather-hover w-full transform rounded-lg px-6 py-3 text-white transition-[transform,box-shadow] duration-300 hover:scale-105">
              บันทึกความคิดเห็น
            </button>
            <button className="bg-gradient-book-antique hover:shadow-vintage-glow w-full transform rounded-lg px-6 py-3 text-white transition-[transform,box-shadow] duration-300 hover:scale-105">
              แชร์หนังสือ
            </button>
          </div>
        </div>

        {/* Cards with Hover Effects */}
        <div className="bg-surface-modern-light shadow-card-modern dark:bg-surface-modern-dark rounded-xl p-6">
          <h3 className="text-text-modern-light-primary dark:text-text-modern-dark-primary mb-4 text-lg font-semibold">
            📱 Modern Hover Cards
          </h3>
          <div className="space-y-3">
            <div className="bg-gradient-sky hover:shadow-ocean-hover transform cursor-pointer rounded-lg p-4 transition-[transform,box-shadow] duration-300 hover:scale-105">
              <div className="font-medium text-white">Hover Effect 1</div>
            </div>
            <div className="bg-gradient-mint hover:shadow-emerald-hover transform cursor-pointer rounded-lg p-4 transition-[transform,box-shadow] duration-300 hover:scale-105">
              <div className="font-medium text-white">Hover Effect 2</div>
            </div>
            <div className="hover:shadow-violet-hover bg-gradient-dawn transform cursor-pointer rounded-lg p-4 transition-[transform,box-shadow] duration-300 hover:scale-105">
              <div className="font-medium text-white">Hover Effect 3</div>
            </div>
          </div>
        </div>

        {/* Book Reading Mode */}
        <div className="bg-gradient-book-cream shadow-sepia-glow rounded-xl p-6">
          <h3 className="text-text-book-primary mb-4 text-lg font-semibold">
            📖 Reading Mode
          </h3>
          <div className="space-y-3">
            <div className="bg-gradient-book-paper hover:shadow-paper-hover transform cursor-pointer rounded-lg p-4 transition-[transform,box-shadow] duration-300 hover:scale-105">
              <div className="text-text-book-primary font-medium">
                📄 Paper Mode
              </div>
            </div>
            <div className="bg-gradient-book-vintage hover:shadow-vintage-glow transform cursor-pointer rounded-lg p-4 transition-[transform,box-shadow] duration-300 hover:scale-105">
              <div className="text-text-book-vintage font-medium">
                📜 Vintage Mode
              </div>
            </div>
            <div className="bg-gradient-book-sepia hover:shadow-sepia-glow transform cursor-pointer rounded-lg p-4 transition-[transform,box-shadow] duration-300 hover:scale-105">
              <div className="text-text-book-vintage font-medium">
                🏺 Sepia Mode
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
