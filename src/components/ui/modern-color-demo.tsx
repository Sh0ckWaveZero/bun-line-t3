"use client";

import React from "react";

/**
 * 🎨 Modern Color Scheme Demo Component
 * แสดงตัวอย่างสีใหม่ที่โมเดิร์นและสวยงาม
 */
export function ModernColorDemo() {
  return (
    <div className="min-h-screen bg-gradient-bg-light p-8 dark:bg-gradient-bg-dark">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* 🎯 Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-black text-text-modern-light-extra">
            🌈 Modern Color Palette - เข้มสุด
          </h1>
          <p className="text-lg font-semibold text-text-modern-light-primary">
            ชุดสีใหม่ที่โมเดิร์น มีเอกลักษณ์ และข้อความเข้มที่สุด
          </p>
          <p className="mt-2 text-sm text-text-modern-light-secondary">
            ปรับปรุงความเข้มของข้อความ 40-60% เพื่อการอ่านที่ชัดเจนยิ่งขึ้น
          </p>
        </div>

        {/* 🔥 Gradient Cards - Main Dashboard Style */}
        <section>
          <h2 className="mb-6 text-2xl font-black text-text-modern-light-extra">
            📊 Dashboard Cards with Modern Gradients
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5">
            {/* Attendance Card */}
            <div className="transform rounded-xl bg-gradient-attendance p-6 text-white shadow-ocean-glow transition-all-smooth duration-300 hover:scale-105 hover:shadow-ocean-hover">
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
            <div className="transform rounded-xl bg-gradient-hours p-6 text-white shadow-emerald-glow transition-all-smooth duration-300 hover:scale-105 hover:shadow-emerald-hover">
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
            <div className="transform rounded-xl bg-gradient-overtime p-6 text-white shadow-rose-glow transition-all-smooth duration-300 hover:scale-105 hover:shadow-rose-hover">
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
            <div className="transform rounded-xl bg-gradient-efficiency p-6 text-white shadow-amber-glow transition-all-smooth duration-300 hover:scale-105 hover:shadow-emerald-hover">
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
            <div className="transform rounded-xl bg-gradient-late p-6 text-white shadow-violet-glow transition-all-smooth duration-300 hover:scale-105 hover:shadow-rose-hover">
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
          <h2 className="mb-6 text-2xl font-black text-text-dark-primary">
            🎨 Individual Color Families
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Ocean Blue */}
            <div className="rounded-xl bg-surface-modern-light p-6 shadow-card-modern transition-colors-shadow duration-300 hover:shadow-card-hover dark:bg-surface-modern-dark">
              <h3 className="mb-4 text-lg font-black text-text-modern-light-primary">
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
              <p className="mt-3 text-sm font-medium text-text-modern-light-secondary">
                สำหรับข้อมูลสำคัญและการเข้างาน
              </p>
            </div>

            {/* Rose */}
            <div className="rounded-xl bg-surface-modern-light p-6 shadow-card-modern transition-colors-shadow duration-300 hover:shadow-card-hover dark:bg-surface-modern-dark">
              <h3 className="mb-4 text-lg font-black text-rose-600">🌹 Rose</h3>
              <div className="grid grid-cols-5 gap-2">
                {["50", "200", "400", "600", "800"].map((shade) => (
                  <div
                    key={shade}
                    className={`bg-rose-${shade} h-12 rounded-lg`}
                  />
                ))}
              </div>
              <p className="mt-3 text-sm font-medium text-text-dark-medium">
                สำหรับการแจ้งเตือนและเหตุการณ์สำคัญ
              </p>
            </div>

            {/* Emerald */}
            <div className="rounded-xl bg-surface-modern-light p-6 shadow-card-modern transition-colors-shadow duration-300 hover:shadow-card-hover dark:bg-surface-modern-dark">
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
              <p className="mt-3 text-sm font-medium text-text-dark-medium">
                สำหรับสถานะสำเร็จและข้อมูลบวก
              </p>
            </div>

            {/* Violet */}
            <div className="rounded-xl bg-surface-modern-light p-6 shadow-card-modern transition-colors-shadow duration-300 hover:shadow-card-hover dark:bg-surface-modern-dark">
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
              <p className="mt-3 text-sm font-medium text-text-dark-medium">
                สำหรับข้อมูลพิเศษและฟีเจอร์ใหม่
              </p>
            </div>

            {/* Amber */}
            <div className="rounded-xl bg-surface-modern-light p-6 shadow-card-modern transition-colors-shadow duration-300 hover:shadow-card-hover dark:bg-surface-modern-dark">
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
              <p className="mt-3 text-sm font-medium text-text-dark-medium">
                สำหรับการเตือนและข้อมูลที่ต้องระวัง
              </p>
            </div>

            {/* Teal */}
            <div className="rounded-xl bg-surface-modern-light p-6 shadow-card-modern transition-colors-shadow duration-300 hover:shadow-card-hover dark:bg-surface-modern-dark">
              <h3 className="mb-4 text-lg font-black text-teal-600">🔷 Teal</h3>
              <div className="grid grid-cols-5 gap-2">
                {["50", "200", "400", "600", "800"].map((shade) => (
                  <div
                    key={shade}
                    className={`bg-teal-${shade} h-12 rounded-lg`}
                  />
                ))}
              </div>
              <p className="mt-3 text-sm font-medium text-text-dark-medium">
                สำหรับข้อมูลสถิติและการวิเคราะห์
              </p>
            </div>
          </div>
        </section>

        {/* 📚 Book Colors Section */}
        <section>
          <h2 className="mb-6 text-2xl font-black text-text-dark-primary">
            📚 Book Colors - สีหนังสือสำหรับ Light Mode
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Paper */}
            <div className="rounded-xl bg-surface-book-light p-6 shadow-book transition-colors-shadow duration-300 hover:shadow-book-hover">
              <h3 className="mb-4 text-lg font-black text-text-book-primary">
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
              <p className="mt-3 text-sm font-semibold text-text-book-secondary">
                สีกระดาษหนังสือที่อบอุ่นและเป็นมิตรกับสายตา
              </p>
            </div>

            {/* Ink */}
            <div className="rounded-xl bg-surface-book-warm p-6 shadow-book transition-colors-shadow duration-300 hover:shadow-book-hover">
              <h3 className="text-ink-700 mb-4 text-lg font-black">🖋️ Ink</h3>
              <div className="grid grid-cols-5 gap-2">
                {["50", "200", "400", "600", "800"].map((shade) => (
                  <div
                    key={shade}
                    className={`bg-ink-${shade} h-12 rounded-lg`}
                  />
                ))}
              </div>
              <p className="mt-3 text-sm font-semibold text-text-book-secondary">
                สีหมึกสำหรับข้อความที่อ่านง่าย
              </p>
            </div>

            {/* Leather */}
            <div className="rounded-xl bg-surface-book-vintage p-6 shadow-leather-glow transition-colors-shadow duration-300 hover:shadow-leather-hover">
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
              <p className="mt-3 text-sm font-bold text-text-book-leather">
                สีหนังปกหนังสือแบบคลาสสิก
              </p>
            </div>

            {/* Vintage */}
            <div className="rounded-xl bg-surface-book-aged p-6 shadow-vintage-glow transition-colors-shadow duration-300 hover:shadow-book-hover">
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
              <p className="mt-3 text-sm font-bold text-text-book-vintage">
                สีวินเทจสำหรับหนังสือเก่า
              </p>
            </div>

            {/* Sepia */}
            <div className="rounded-xl bg-gradient-book-sepia p-6 shadow-sepia-glow transition-colors-shadow duration-300 hover:shadow-book-hover">
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
              <p className="mt-3 text-sm font-bold text-text-book-vintage">
                สีซีเปียสำหรับภาพและข้อความเก่า
              </p>
            </div>
          </div>
        </section>

        {/* 📖 Book Theme Demo Cards */}
        <section>
          <h2 className="mb-6 text-2xl font-semibold text-text-book-primary">
            📖 Book Theme Cards - ตัวอย่างการใช้งาน
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Reading Statistics */}
            <div className="transform rounded-xl bg-gradient-book-warm p-6 text-white shadow-paper-glow transition-all-smooth duration-300 hover:scale-105 hover:shadow-paper-hover">
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
            <div className="transform rounded-xl bg-gradient-book-classic p-6 text-white shadow-leather-glow transition-all-smooth duration-300 hover:scale-105 hover:shadow-leather-hover">
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
            <div className="transform rounded-xl bg-gradient-book-antique p-6 text-white shadow-vintage-glow transition-all-smooth duration-300 hover:scale-105 hover:shadow-book-hover">
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
            <div className="text-leather-800 transform rounded-xl bg-gradient-book-paper p-6 shadow-paper-glow transition-all-smooth duration-300 hover:scale-105 hover:shadow-paper-hover">
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
          <h2 className="mb-6 text-2xl font-semibold text-text-modern-light-primary dark:text-text-modern-dark-primary">
            ✨ Interactive Elements
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Modern Buttons */}
            <div className="rounded-xl bg-surface-modern-light p-6 shadow-card-modern dark:bg-surface-modern-dark">
              <h3 className="mb-4 text-lg font-semibold text-text-modern-light-primary dark:text-text-modern-dark-primary">
                🔘 Modern Buttons
              </h3>
              <div className="space-y-3">
                <button className="w-full transform rounded-lg bg-gradient-ocean px-6 py-3 text-white transition-all-smooth duration-300 hover:scale-105 hover:shadow-ocean-hover">
                  Primary Action
                </button>
                <button className="w-full transform rounded-lg bg-gradient-emerald px-6 py-3 text-white transition-all-smooth duration-300 hover:scale-105 hover:shadow-emerald-hover">
                  Success Action
                </button>
                <button className="w-full transform rounded-lg bg-gradient-rose px-6 py-3 text-white transition-all-smooth duration-300 hover:scale-105 hover:shadow-rose-hover">
                  Warning Action
                </button>
              </div>
            </div>

            {/* Book Buttons */}
            <div className="rounded-xl bg-gradient-book-paper p-6 shadow-paper-glow">
              <h3 className="mb-4 text-lg font-semibold text-text-book-primary">
                📚 Book Buttons
              </h3>
              <div className="space-y-3">
                <button className="w-full transform rounded-lg bg-gradient-book-warm px-6 py-3 text-white transition-all-smooth duration-300 hover:scale-105 hover:shadow-paper-hover">
                  เริ่มอ่าน
                </button>
                <button className="w-full transform rounded-lg bg-gradient-book-classic px-6 py-3 text-white transition-all-smooth duration-300 hover:scale-105 hover:shadow-leather-hover">
                  บันทึกความคิดเห็น
                </button>
                <button className="w-full transform rounded-lg bg-gradient-book-antique px-6 py-3 text-white transition-all-smooth duration-300 hover:scale-105 hover:shadow-vintage-glow">
                  แชร์หนังสือ
                </button>
              </div>
            </div>

            {/* Cards with Hover Effects */}
            <div className="rounded-xl bg-surface-modern-light p-6 shadow-card-modern dark:bg-surface-modern-dark">
              <h3 className="mb-4 text-lg font-semibold text-text-modern-light-primary dark:text-text-modern-dark-primary">
                📱 Modern Hover Cards
              </h3>
              <div className="space-y-3">
                <div className="transform cursor-pointer rounded-lg bg-gradient-sky p-4 transition-all-smooth duration-300 hover:scale-105 hover:shadow-ocean-hover">
                  <div className="font-medium text-white">Hover Effect 1</div>
                </div>
                <div className="transform cursor-pointer rounded-lg bg-gradient-mint p-4 transition-all-smooth duration-300 hover:scale-105 hover:shadow-emerald-hover">
                  <div className="font-medium text-white">Hover Effect 2</div>
                </div>
                <div className="hover:shadow-violet-hover transform cursor-pointer rounded-lg bg-gradient-dawn p-4 transition-all-smooth duration-300 hover:scale-105">
                  <div className="font-medium text-white">Hover Effect 3</div>
                </div>
              </div>
            </div>

            {/* Book Reading Mode */}
            <div className="rounded-xl bg-gradient-book-cream p-6 shadow-sepia-glow">
              <h3 className="mb-4 text-lg font-semibold text-text-book-primary">
                📖 Reading Mode
              </h3>
              <div className="space-y-3">
                <div className="transform cursor-pointer rounded-lg bg-gradient-book-paper p-4 transition-all-smooth duration-300 hover:scale-105 hover:shadow-paper-hover">
                  <div className="font-medium text-text-book-primary">
                    📄 Paper Mode
                  </div>
                </div>
                <div className="transform cursor-pointer rounded-lg bg-gradient-book-vintage p-4 transition-all-smooth duration-300 hover:scale-105 hover:shadow-vintage-glow">
                  <div className="font-medium text-text-book-vintage">
                    📜 Vintage Mode
                  </div>
                </div>
                <div className="transform cursor-pointer rounded-lg bg-gradient-book-sepia p-4 transition-all-smooth duration-300 hover:scale-105 hover:shadow-sepia-glow">
                  <div className="font-medium text-text-book-vintage">
                    🏺 Sepia Mode
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 🔤 Ultra Dark Text Colors Showcase */}
        <section>
          <h2 className="mb-6 text-2xl font-black text-text-modern-light-extra">
            🔤 Ultra Dark Text Colors - เข้มสุด
          </h2>

          {/* Text Comparison */}
          <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* Modern Text Colors */}
            <div className="rounded-xl bg-surface-modern-light p-6 shadow-card-modern">
              <h3 className="mb-4 text-xl font-black text-text-modern-light-primary">
                💼 Modern Text (เข้มสุด)
              </h3>
              <div className="space-y-3">
                <div className="text-lg font-black text-text-modern-light-extra">
                  Primary Extra: เข้มที่สุด (Pure Black)
                </div>
                <div className="text-lg font-bold text-text-modern-light-primary">
                  Primary: หัวข้อสำคัญ (#080814)
                </div>
                <div className="font-semibold text-text-modern-light-secondary">
                  Secondary: ข้อความรอง (#0f172a)
                </div>
                <div className="text-text-modern-light-muted">
                  Muted: รายละเอียด (#1e293b)
                </div>
              </div>
            </div>

            {/* Book Text Colors */}
            <div className="shadow-book-paper rounded-xl bg-surface-book-light p-6">
              <h3 className="mb-4 text-xl font-black text-text-book-primary">
                📖 Book Text (เข้มสุด)
              </h3>
              <div className="space-y-3">
                <div className="text-lg font-black text-text-book-extra">
                  Extra: เข้มที่สุด (#050505)
                </div>
                <div className="text-lg font-bold text-text-book-primary">
                  Primary: หมึกดำสนิท (#000000)
                </div>
                <div className="font-semibold text-text-book-secondary">
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
            <div className="rounded-xl border border-border-modern-light-primary bg-white p-6 shadow-card-modern">
              <h4 className="mb-3 text-xl font-black text-text-dark-primary">
                การ์ดข้อความเข้มสุด
              </h4>
              <div className="mb-2 text-3xl font-black text-text-dark-secondary">
                99.9%
              </div>
              <p className="text-sm font-semibold text-text-dark-strong">
                ความเข้มของข้อความ
              </p>
              <p className="mt-2 text-xs text-text-dark-medium">
                WCAG AAA Compliant
              </p>
            </div>

            {/* Card Text Colors */}
            <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 p-6 shadow-card-modern">
              <h4 className="mb-3 text-xl font-black text-text-card-primary">
                Card Text Colors
              </h4>
              <div className="mb-2 text-3xl font-black text-text-card-primary">
                100%
              </div>
              <p className="text-sm font-semibold text-text-card-secondary">
                ข้อความในการ์ด
              </p>
              <p className="mt-2 text-xs text-text-card-muted">
                อ่านง่าย ชัดเจน
              </p>
            </div>

            {/* Book Style Card */}
            <div className="shadow-book-warm rounded-xl border border-amber-200 bg-bg-book-paper p-6">
              <h4 className="mb-3 text-xl font-black text-text-book-primary">
                Book Style Text
              </h4>
              <div className="mb-2 text-3xl font-black text-text-book-primary">
                📚
              </div>
              <p className="text-sm font-semibold text-text-book-secondary">
                โทนหนังสือเข้มสุด
              </p>
              <p className="mt-2 text-xs text-text-book-muted">
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
