// src/components/ui/modern-color-demo-text-showcase.tsx
"use client";

/** 🔤 ตัวอย่างสีข้อความโทนเข้มสุด */
export function ModernColorDemoTextShowcase() {
  return (
    <section>
      <h2 className="text-text-modern-light-extra mb-6 text-2xl font-black">
        🔤 Ultra Dark Text Colors - เข้มสุด
      </h2>

      {/* Text Comparison */}
      <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Modern Text Colors */}
        <div className="bg-surface-modern-light shadow-card-modern rounded-xl p-6">
          <h3 className="text-text-modern-light-primary mb-4 text-xl font-black">
            💼 Modern Text (เข้มสุด)
          </h3>
          <div className="space-y-3">
            <div className="text-text-modern-light-extra text-lg font-black">
              Primary Extra: เข้มที่สุด (Pure Black)
            </div>
            <div className="text-text-modern-light-primary text-lg font-bold">
              Primary: หัวข้อสำคัญ (#080814)
            </div>
            <div className="text-text-modern-light-secondary font-semibold">
              Secondary: ข้อความรอง (#0f172a)
            </div>
            <div className="text-text-modern-light-muted">
              Muted: รายละเอียด (#1e293b)
            </div>
          </div>
        </div>

        {/* Book Text Colors */}
        <div className="shadow-book-paper bg-surface-book-light rounded-xl p-6">
          <h3 className="text-text-book-primary mb-4 text-xl font-black">
            📖 Book Text (เข้มสุด)
          </h3>
          <div className="space-y-3">
            <div className="text-text-book-extra text-lg font-black">
              Extra: เข้มที่สุด (#050505)
            </div>
            <div className="text-text-book-primary text-lg font-bold">
              Primary: หมึกดำสนิท (#000000)
            </div>
            <div className="text-text-book-secondary font-semibold">
              Secondary: หมึกเข้มมาก (#0a0a0a)
            </div>
            <div className="text-text-book-muted">Muted: เทาเข้ม (#1a1a1a)</div>
          </div>
        </div>
      </div>

      {/* Text Contrast Demo Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Ultra Dark Card */}
        <div className="border-border-modern-light-primary shadow-card-modern rounded-xl border bg-white p-6">
          <h4 className="text-text-dark-primary mb-3 text-xl font-black">
            การ์ดข้อความเข้มสุด
          </h4>
          <div className="text-text-dark-secondary mb-2 text-3xl font-black">
            99.9%
          </div>
          <p className="text-text-dark-strong text-sm font-semibold">
            ความเข้มของข้อความ
          </p>
          <p className="text-text-dark-medium mt-2 text-xs">
            WCAG AAA Compliant
          </p>
        </div>

        {/* Card Text Colors */}
        <div className="shadow-card-modern rounded-xl bg-linear-to-br from-blue-50 to-blue-100 p-6">
          <h4 className="text-text-card-primary mb-3 text-xl font-black">
            Card Text Colors
          </h4>
          <div className="text-text-card-primary mb-2 text-3xl font-black">
            100%
          </div>
          <p className="text-text-card-secondary text-sm font-semibold">
            ข้อความในการ์ด
          </p>
          <p className="text-text-card-muted mt-2 text-xs">อ่านง่าย ชัดเจน</p>
        </div>

        {/* Book Style Card */}
        <div className="shadow-book-warm bg-bg-book-paper rounded-xl border border-amber-200 p-6">
          <h4 className="text-text-book-primary mb-3 text-xl font-black">
            Book Style Text
          </h4>
          <div className="text-text-book-primary mb-2 text-3xl font-black">
            📚
          </div>
          <p className="text-text-book-secondary text-sm font-semibold">
            โทนหนังสือเข้มสุด
          </p>
          <p className="text-text-book-muted mt-2 text-xs">เหมาะกับการอ่าน</p>
        </div>
      </div>
    </section>
  );
}
