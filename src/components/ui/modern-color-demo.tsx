"use client";

import React from "react";

/**
 * 🎨 Modern Color Scheme Demo Component
 * แสดงตัวอย่างสีใหม่ที่โมเดิร์นและสวยงาม
 */
export function ModernColorDemo() {
  return (
    <div className="bg-gradient-bg-light dark:bg-gradient-bg-dark min-h-screen p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* 🎯 Header */}
        <div className="mb-12 text-center">
          <h1 className="text-text-modern-light-extra mb-4 text-4xl font-black">
            🌈 Modern Color Palette - เข้มสุด
          </h1>
          <p className="text-text-modern-light-primary text-lg font-semibold">
            ชุดสีใหม่ที่โมเดิร์น มีเอกลักษณ์ และข้อความเข้มที่สุด
          </p>
          <p className="text-text-modern-light-secondary mt-2 text-sm">
            ปรับปรุงความเข้มของข้อความ 40-60% เพื่อการอ่านที่ชัดเจนยิ่งขึ้น
          </p>
        </div>

        {/* 🔥 Gradient Cards - Main Dashboard Style */}
        <section>
          <h2 className="text-text-modern-light-extra mb-6 text-2xl font-black">
            📊 Dashboard Cards with Modern Gradients
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5">
            {/* Attendance Card */}
            <div className="bg-gradient-attendance shadow-ocean-glow transition-all-smooth hover:shadow-ocean-hover transform rounded-xl p-6 text-white duration-300 hover:scale-105">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-semibold text-white">
                  วันเข้างาน
                </span>
                <span className="text-2xl">👥</span>
              </div>
              <div className="mb-2 text-4xl font-black text-white">22</div>
              <div className="text-sm font-medium text-white">
                วัน (ในเดือน)
              </div>
            </div>

            {/* Hours Card */}
            <div className="bg-gradient-hours shadow-emerald-glow transition-all-smooth hover:shadow-emerald-hover transform rounded-xl p-6 text-white duration-300 hover:scale-105">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-semibold text-white">
                  ชั่วโมงรวม
                </span>
                <span className="text-2xl">⏰</span>
              </div>
              <div className="mb-2 text-4xl font-black text-white">176.5</div>
              <div className="text-sm font-medium text-white">ชั่วโมง</div>
            </div>

            {/* Overtime Card */}
            <div className="bg-gradient-overtime shadow-rose-glow transition-all-smooth hover:shadow-rose-hover transform rounded-xl p-6 text-white duration-300 hover:scale-105">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-semibold text-white">
                  ล่วงเวลา
                </span>
                <span className="text-2xl">🚀</span>
              </div>
              <div className="mb-2 text-4xl font-black text-white">12.5%</div>
              <div className="text-sm font-medium text-white">ของเวลารวม</div>
            </div>

            {/* Efficiency Card */}
            <div className="bg-gradient-efficiency shadow-amber-glow transition-all-smooth hover:shadow-emerald-hover transform rounded-xl p-6 text-white duration-300 hover:scale-105">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-semibold text-white">
                  ประสิทธิภาพ
                </span>
                <span className="text-2xl">📈</span>
              </div>
              <div className="mb-2 text-4xl font-black text-white">95.2%</div>
              <div className="text-sm font-medium text-white">คะแนนรวม</div>
            </div>

            {/* Late Card */}
            <div className="bg-gradient-late shadow-violet-glow transition-all-smooth hover:shadow-rose-hover transform rounded-xl p-6 text-white duration-300 hover:scale-105">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-semibold text-white">มาสาย</span>
                <span className="text-2xl">⚠️</span>
              </div>
              <div className="mb-2 text-4xl font-black text-white">2</div>
              <div className="text-sm font-medium text-white">ครั้ง</div>
            </div>
          </div>
        </section>

        {/* 🎨 Individual Color Showcase */}
        <section>
          <h2 className="text-text-dark-primary mb-6 text-2xl font-black">
            🎨 Individual Color Families
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Ocean Blue */}
            <div className="bg-surface-modern-light shadow-card-modern transition-colors-shadow hover:shadow-card-hover dark:bg-surface-modern-dark rounded-xl p-6 duration-300">
              <h3 className="text-text-modern-light-primary mb-4 text-lg font-black">
                🌊 Ocean Blue
              </h3>
              <div className="grid grid-cols-5 gap-2">
                {["50", "200", "400", "600", "800"].map((shade) => (
                  <div
                    key={shade}
                    className={`bg-ocean-${shade} h-12 rounded-lg`}
                  />
                ))}
              </div>
              <p className="text-text-modern-light-secondary mt-3 text-sm font-medium">
                สำหรับข้อมูลสำคัญและการเข้างาน
              </p>
            </div>

            {/* Rose */}
            <div className="bg-surface-modern-light shadow-card-modern transition-colors-shadow hover:shadow-card-hover dark:bg-surface-modern-dark rounded-xl p-6 duration-300">
              <h3 className="mb-4 text-lg font-black text-rose-600">🌹 Rose</h3>
              <div className="grid grid-cols-5 gap-2">
                {["50", "200", "400", "600", "800"].map((shade) => (
                  <div
                    key={shade}
                    className={`bg-rose-${shade} h-12 rounded-lg`}
                  />
                ))}
              </div>
              <p className="text-text-dark-medium mt-3 text-sm font-medium">
                สำหรับการแจ้งเตือนและเหตุการณ์สำคัญ
              </p>
            </div>

            {/* Emerald */}
            <div className="bg-surface-modern-light shadow-card-modern transition-colors-shadow hover:shadow-card-hover dark:bg-surface-modern-dark rounded-xl p-6 duration-300">
              <h3 className="mb-4 text-lg font-black text-emerald-600">
                💚 Emerald
              </h3>
              <div className="grid grid-cols-5 gap-2">
                {["50", "200", "400", "600", "800"].map((shade) => (
                  <div
                    key={shade}
                    className={`bg-emerald-${shade} h-12 rounded-lg`}
                  />
                ))}
              </div>
              <p className="text-text-dark-medium mt-3 text-sm font-medium">
                สำหรับสถานะสำเร็จและข้อมูลบวก
              </p>
            </div>

            {/* Violet */}
            <div className="bg-surface-modern-light shadow-card-modern transition-colors-shadow hover:shadow-card-hover dark:bg-surface-modern-dark rounded-xl p-6 duration-300">
              <h3 className="mb-4 text-lg font-black text-violet-600">
                💜 Violet
              </h3>
              <div className="grid grid-cols-5 gap-2">
                {["50", "200", "400", "600", "800"].map((shade) => (
                  <div
                    key={shade}
                    className={`bg-violet-${shade} h-12 rounded-lg`}
                  />
                ))}
              </div>
              <p className="text-text-dark-medium mt-3 text-sm font-medium">
                สำหรับข้อมูลพิเศษและฟีเจอร์ใหม่
              </p>
            </div>

            {/* Amber */}
            <div className="bg-surface-modern-light shadow-card-modern transition-colors-shadow hover:shadow-card-hover dark:bg-surface-modern-dark rounded-xl p-6 duration-300">
              <h3 className="mb-4 text-lg font-black text-amber-600">
                🧡 Amber
              </h3>
              <div className="grid grid-cols-5 gap-2">
                {["50", "200", "400", "600", "800"].map((shade) => (
                  <div
                    key={shade}
                    className={`bg-amber-${shade} h-12 rounded-lg`}
                  />
                ))}
              </div>
              <p className="text-text-dark-medium mt-3 text-sm font-medium">
                สำหรับการเตือนและข้อมูลที่ต้องระวัง
              </p>
            </div>

            {/* Teal */}
            <div className="bg-surface-modern-light shadow-card-modern transition-colors-shadow hover:shadow-card-hover dark:bg-surface-modern-dark rounded-xl p-6 duration-300">
              <h3 className="mb-4 text-lg font-black text-teal-600">🔷 Teal</h3>
              <div className="grid grid-cols-5 gap-2">
                {["50", "200", "400", "600", "800"].map((shade) => (
                  <div
                    key={shade}
                    className={`bg-teal-${shade} h-12 rounded-lg`}
                  />
                ))}
              </div>
              <p className="text-text-dark-medium mt-3 text-sm font-medium">
                สำหรับข้อมูลสถิติและการวิเคราะห์
              </p>
            </div>
          </div>
        </section>

        {/* 📚 Book Colors Section */}
        <section>
          <h2 className="text-text-dark-primary mb-6 text-2xl font-black">
            📚 Book Colors - สีหนังสือสำหรับ Light Mode
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Paper */}
            <div className="bg-surface-book-light shadow-book transition-colors-shadow hover:shadow-book-hover rounded-xl p-6 duration-300">
              <h3 className="text-text-book-primary mb-4 text-lg font-black">
                📄 Paper
              </h3>
              <div className="grid grid-cols-5 gap-2">
                {["50", "200", "400", "600", "800"].map((shade) => (
                  <div
                    key={shade}
                    className={`bg-paper-${shade} h-12 rounded-lg`}
                  />
                ))}
              </div>
              <p className="text-text-book-secondary mt-3 text-sm font-semibold">
                สีกระดาษหนังสือที่อบอุ่นและเป็นมิตรกับสายตา
              </p>
            </div>

            {/* Ink */}
            <div className="bg-surface-book-warm shadow-book transition-colors-shadow hover:shadow-book-hover rounded-xl p-6 duration-300">
              <h3 className="text-ink-700 mb-4 text-lg font-black">🖋️ Ink</h3>
              <div className="grid grid-cols-5 gap-2">
                {["50", "200", "400", "600", "800"].map((shade) => (
                  <div
                    key={shade}
                    className={`bg-ink-${shade} h-12 rounded-lg`}
                  />
                ))}
              </div>
              <p className="text-text-book-secondary mt-3 text-sm font-semibold">
                สีหมึกสำหรับข้อความที่อ่านง่าย
              </p>
            </div>

            {/* Leather */}
            <div className="bg-surface-book-vintage shadow-leather-glow transition-colors-shadow hover:shadow-leather-hover rounded-xl p-6 duration-300">
              <h3 className="text-leather-600 mb-4 text-lg font-black">
                📖 Leather
              </h3>
              <div className="grid grid-cols-5 gap-2">
                {["50", "200", "400", "600", "800"].map((shade) => (
                  <div
                    key={shade}
                    className={`bg-leather-${shade} h-12 rounded-lg`}
                  />
                ))}
              </div>
              <p className="text-text-book-leather mt-3 text-sm font-bold">
                สีหนังปกหนังสือแบบคลาสสิก
              </p>
            </div>

            {/* Vintage */}
            <div className="bg-surface-book-aged shadow-vintage-glow transition-colors-shadow hover:shadow-book-hover rounded-xl p-6 duration-300">
              <h3 className="text-vintage-600 mb-4 text-lg font-black">
                📜 Vintage
              </h3>
              <div className="grid grid-cols-5 gap-2">
                {["50", "200", "400", "600", "800"].map((shade) => (
                  <div
                    key={shade}
                    className={`bg-vintage-${shade} h-12 rounded-lg`}
                  />
                ))}
              </div>
              <p className="text-text-book-vintage mt-3 text-sm font-bold">
                สีวินเทจสำหรับหนังสือเก่า
              </p>
            </div>

            {/* Sepia */}
            <div className="bg-gradient-book-sepia shadow-sepia-glow transition-colors-shadow hover:shadow-book-hover rounded-xl p-6 duration-300">
              <h3 className="text-sepia-700 mb-4 text-lg font-black">
                🏺 Sepia
              </h3>
              <div className="grid grid-cols-5 gap-2">
                {["50", "200", "400", "600", "800"].map((shade) => (
                  <div
                    key={shade}
                    className={`bg-sepia-${shade} h-12 rounded-lg`}
                  />
                ))}
              </div>
              <p className="text-text-book-vintage mt-3 text-sm font-bold">
                สีซีเปียสำหรับภาพและข้อความเก่า
              </p>
            </div>
          </div>
        </section>

        {/* 📖 Book Theme Demo Cards */}
        <section>
          <h2 className="text-text-book-primary mb-6 text-2xl font-semibold">
            📖 Book Theme Cards - ตัวอย่างการใช้งาน
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Reading Statistics */}
            <div className="bg-gradient-book-warm shadow-paper-glow transition-all-smooth hover:shadow-paper-hover transform rounded-xl p-6 text-white duration-300 hover:scale-105">
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
            <div className="bg-gradient-book-classic shadow-leather-glow transition-all-smooth hover:shadow-leather-hover transform rounded-xl p-6 text-white duration-300 hover:scale-105">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-medium text-white/90">
                  เวลาอ่าน
                </span>
                <span className="text-2xl">⏱️</span>
              </div>
              <div className="mb-2 text-3xl font-bold">24.5</div>
              <div className="text-sm text-white/90">ชั่วโมง</div>
            </div>

            {/* Books Completed */}
            <div className="bg-gradient-book-antique shadow-vintage-glow transition-all-smooth hover:shadow-book-hover transform rounded-xl p-6 text-white duration-300 hover:scale-105">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-medium text-white/90">
                  หนังสือจบ
                </span>
                <span className="text-2xl">✅</span>
              </div>
              <div className="mb-2 text-3xl font-bold">12</div>
              <div className="text-sm text-white/90">เล่ม</div>
            </div>

            {/* Knowledge Score */}
            <div className="text-leather-800 bg-gradient-book-paper shadow-paper-glow transition-all-smooth hover:shadow-paper-hover transform rounded-xl p-6 duration-300 hover:scale-105">
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

        {/* 🌟 Interactive Elements */}
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
                <button className="bg-gradient-ocean transition-all-smooth hover:shadow-ocean-hover w-full transform rounded-lg px-6 py-3 text-white duration-300 hover:scale-105">
                  Primary Action
                </button>
                <button className="bg-gradient-emerald transition-all-smooth hover:shadow-emerald-hover w-full transform rounded-lg px-6 py-3 text-white duration-300 hover:scale-105">
                  Success Action
                </button>
                <button className="bg-gradient-rose transition-all-smooth hover:shadow-rose-hover w-full transform rounded-lg px-6 py-3 text-white duration-300 hover:scale-105">
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
                <button className="bg-gradient-book-warm transition-all-smooth hover:shadow-paper-hover w-full transform rounded-lg px-6 py-3 text-white duration-300 hover:scale-105">
                  เริ่มอ่าน
                </button>
                <button className="bg-gradient-book-classic transition-all-smooth hover:shadow-leather-hover w-full transform rounded-lg px-6 py-3 text-white duration-300 hover:scale-105">
                  บันทึกความคิดเห็น
                </button>
                <button className="bg-gradient-book-antique transition-all-smooth hover:shadow-vintage-glow w-full transform rounded-lg px-6 py-3 text-white duration-300 hover:scale-105">
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
                <div className="bg-gradient-sky transition-all-smooth hover:shadow-ocean-hover transform cursor-pointer rounded-lg p-4 duration-300 hover:scale-105">
                  <div className="font-medium text-white">Hover Effect 1</div>
                </div>
                <div className="bg-gradient-mint transition-all-smooth hover:shadow-emerald-hover transform cursor-pointer rounded-lg p-4 duration-300 hover:scale-105">
                  <div className="font-medium text-white">Hover Effect 2</div>
                </div>
                <div className="hover:shadow-violet-hover bg-gradient-dawn transition-all-smooth transform cursor-pointer rounded-lg p-4 duration-300 hover:scale-105">
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
                <div className="bg-gradient-book-paper transition-all-smooth hover:shadow-paper-hover transform cursor-pointer rounded-lg p-4 duration-300 hover:scale-105">
                  <div className="text-text-book-primary font-medium">
                    📄 Paper Mode
                  </div>
                </div>
                <div className="bg-gradient-book-vintage transition-all-smooth hover:shadow-vintage-glow transform cursor-pointer rounded-lg p-4 duration-300 hover:scale-105">
                  <div className="text-text-book-vintage font-medium">
                    📜 Vintage Mode
                  </div>
                </div>
                <div className="bg-gradient-book-sepia transition-all-smooth hover:shadow-sepia-glow transform cursor-pointer rounded-lg p-4 duration-300 hover:scale-105">
                  <div className="text-text-book-vintage font-medium">
                    🏺 Sepia Mode
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 🔤 Ultra Dark Text Colors Showcase */}
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
                <div className="text-text-book-muted">
                  Muted: เทาเข้ม (#1a1a1a)
                </div>
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
              <p className="text-text-card-muted mt-2 text-xs">
                อ่านง่าย ชัดเจน
              </p>
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
              <p className="text-text-book-muted mt-2 text-xs">
                เหมาะกับการอ่าน
              </p>
            </div>
          </div>
        </section>

        {/* 🔮 Footer */}
        <div className="py-8 text-center">
          <p className="text-text-modern-light-secondary dark:text-text-modern-dark-secondary">
            🎨 Modern Color Scheme ที่สร้างขึ้นเพื่อ Attendance System
            ที่โมเดิร์นและใช้งานง่าย
          </p>
        </div>
      </div>
    </div>
  );
}

export default ModernColorDemo;
