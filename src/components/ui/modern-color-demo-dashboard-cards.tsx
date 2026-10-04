// src/components/ui/modern-color-demo-dashboard-cards.tsx
"use client";

/** 🔥 การ์ดสถิติแดชบอร์ดพร้อม gradient */
export function ModernColorDemoDashboardCards() {
  return (
    <section>
      <h2 className="text-text-modern-light-extra mb-6 text-2xl font-black">
        📊 Dashboard Cards with Modern Gradients
      </h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5">
        {/* Attendance Card */}
        <div className="bg-gradient-attendance shadow-ocean-glow hover:shadow-ocean-hover transform rounded-xl p-6 text-white transition-[transform,box-shadow] duration-300 hover:scale-105">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-white">วันเข้างาน</span>
            <span className="text-2xl">👥</span>
          </div>
          <div className="mb-2 text-4xl font-black text-white">22</div>
          <div className="text-sm font-medium text-white">วัน (ในเดือน)</div>
        </div>

        {/* Hours Card */}
        <div className="bg-gradient-hours shadow-emerald-glow hover:shadow-emerald-hover transform rounded-xl p-6 text-white transition-[transform,box-shadow] duration-300 hover:scale-105">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-white">ชั่วโมงรวม</span>
            <span className="text-2xl">⏰</span>
          </div>
          <div className="mb-2 text-4xl font-black text-white">176.5</div>
          <div className="text-sm font-medium text-white">ชั่วโมง</div>
        </div>

        {/* Overtime Card */}
        <div className="bg-gradient-overtime shadow-rose-glow hover:shadow-rose-hover transform rounded-xl p-6 text-white transition-[transform,box-shadow] duration-300 hover:scale-105">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-white">ล่วงเวลา</span>
            <span className="text-2xl">🚀</span>
          </div>
          <div className="mb-2 text-4xl font-black text-white">12.5%</div>
          <div className="text-sm font-medium text-white">ของเวลารวม</div>
        </div>

        {/* Efficiency Card */}
        <div className="bg-gradient-efficiency shadow-amber-glow hover:shadow-emerald-hover transform rounded-xl p-6 text-white transition-[transform,box-shadow] duration-300 hover:scale-105">
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
        <div className="bg-gradient-late shadow-violet-glow hover:shadow-rose-hover transform rounded-xl p-6 text-white transition-[transform,box-shadow] duration-300 hover:scale-105">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-white">มาสาย</span>
            <span className="text-2xl">⚠️</span>
          </div>
          <div className="mb-2 text-4xl font-black text-white">2</div>
          <div className="text-sm font-medium text-white">ครั้ง</div>
        </div>
      </div>
    </section>
  );
}
