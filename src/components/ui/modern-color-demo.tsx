'use client'

import React from 'react'

/**
 * 🎨 Modern Color Scheme Demo Component
 * แสดงตัวอย่างสีใหม่ที่โมเดิร์นและสวยงาม
 */
export function ModernColorDemo() {
  return (
    <div className="min-h-screen bg-gradient-bg-light dark:bg-gradient-bg-dark p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* 🎯 Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-text-modern-light-extra mb-4">
            🌈 Modern Color Palette - เข้มสุด
          </h1>
          <p className="text-text-modern-light-primary text-lg font-semibold">
            ชุดสีใหม่ที่โมเดิร์น มีเอกลักษณ์ และข้อความเข้มที่สุด
          </p>
          <p className="text-text-modern-light-secondary text-sm mt-2">
            ปรับปรุงความเข้มของข้อความ 40-60% เพื่อการอ่านที่ชัดเจนยิ่งขึ้น
          </p>
        </div>

        {/* 🔥 Gradient Cards - Main Dashboard Style */}
        <section>
          <h2 className="text-2xl font-black text-text-modern-light-extra mb-6">
            📊 Dashboard Cards with Modern Gradients
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            
            {/* Attendance Card */}
            <div className="bg-gradient-attendance text-white p-6 rounded-xl shadow-ocean-glow hover:shadow-ocean-hover transition-all-smooth duration-300 transform hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <span className="text-white font-semibold text-sm">วันเข้างาน</span>
                <span className="text-2xl">👥</span>
              </div>
              <div className="text-4xl font-black mb-2 text-white">22</div>
              <div className="text-white font-medium text-sm">วัน (ในเดือน)</div>
            </div>

            {/* Hours Card */}
            <div className="bg-gradient-hours text-white p-6 rounded-xl shadow-emerald-glow hover:shadow-emerald-hover transition-all-smooth duration-300 transform hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <span className="text-white font-semibold text-sm">ชั่วโมงรวม</span>
                <span className="text-2xl">⏰</span>
              </div>
              <div className="text-4xl font-black mb-2 text-white">176.5</div>
              <div className="text-white font-medium text-sm">ชั่วโมง</div>
            </div>

            {/* Overtime Card */}
            <div className="bg-gradient-overtime text-white p-6 rounded-xl shadow-rose-glow hover:shadow-rose-hover transition-all-smooth duration-300 transform hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <span className="text-white font-semibold text-sm">ล่วงเวลา</span>
                <span className="text-2xl">🚀</span>
              </div>
              <div className="text-4xl font-black mb-2 text-white">12.5%</div>
              <div className="text-white font-medium text-sm">ของเวลารวม</div>
            </div>

            {/* Efficiency Card */}
            <div className="bg-gradient-efficiency text-white p-6 rounded-xl shadow-amber-glow hover:shadow-emerald-hover transition-all-smooth duration-300 transform hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <span className="text-white font-semibold text-sm">ประสิทธิภาพ</span>
                <span className="text-2xl">📈</span>
              </div>
              <div className="text-4xl font-black mb-2 text-white">95.2%</div>
              <div className="text-white font-medium text-sm">คะแนนรวม</div>
            </div>

            {/* Late Card */}
            <div className="bg-gradient-late text-white p-6 rounded-xl shadow-violet-glow hover:shadow-rose-hover transition-all-smooth duration-300 transform hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <span className="text-white font-semibold text-sm">มาสาย</span>
                <span className="text-2xl">⚠️</span>
              </div>
              <div className="text-4xl font-black mb-2 text-white">2</div>
              <div className="text-white font-medium text-sm">ครั้ง</div>
            </div>
          </div>
        </section>

        {/* 🎨 Individual Color Showcase */}
        <section>
          <h2 className="text-2xl font-black text-text-dark-primary mb-6">
            🎨 Individual Color Families
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Ocean Blue */}
            <div className="bg-surface-modern-light dark:bg-surface-modern-dark p-6 rounded-xl shadow-card-modern hover:shadow-card-hover transition-colors-shadow duration-300">
              <h3 className="text-lg font-black text-text-modern-light-primary mb-4">🌊 Ocean Blue</h3>
              <div className="grid grid-cols-5 gap-2">
                {['50', '200', '400', '600', '800'].map((shade) => (
                  <div key={shade} className={`bg-ocean-${shade} h-12 rounded-lg`} />
                ))}
              </div>
              <p className="text-text-modern-light-secondary text-sm mt-3 font-medium">
                สำหรับข้อมูลสำคัญและการเข้างาน
              </p>
            </div>

            {/* Rose */}
            <div className="bg-surface-modern-light dark:bg-surface-modern-dark p-6 rounded-xl shadow-card-modern hover:shadow-card-hover transition-colors-shadow duration-300">
              <h3 className="text-lg font-black text-rose-600 mb-4">🌹 Rose</h3>
              <div className="grid grid-cols-5 gap-2">
                {['50', '200', '400', '600', '800'].map((shade) => (
                  <div key={shade} className={`bg-rose-${shade} h-12 rounded-lg`} />
                ))}
              </div>
              <p className="text-text-dark-medium text-sm mt-3 font-medium">
                สำหรับการแจ้งเตือนและเหตุการณ์สำคัญ
              </p>
            </div>

            {/* Emerald */}
            <div className="bg-surface-modern-light dark:bg-surface-modern-dark p-6 rounded-xl shadow-card-modern hover:shadow-card-hover transition-colors-shadow duration-300">
              <h3 className="text-lg font-black text-emerald-600 mb-4">💚 Emerald</h3>
              <div className="grid grid-cols-5 gap-2">
                {['50', '200', '400', '600', '800'].map((shade) => (
                  <div key={shade} className={`bg-emerald-${shade} h-12 rounded-lg`} />
                ))}
              </div>
              <p className="text-text-dark-medium text-sm mt-3 font-medium">
                สำหรับสถานะสำเร็จและข้อมูลบวก
              </p>
            </div>

            {/* Violet */}
            <div className="bg-surface-modern-light dark:bg-surface-modern-dark p-6 rounded-xl shadow-card-modern hover:shadow-card-hover transition-colors-shadow duration-300">
              <h3 className="text-lg font-black text-violet-600 mb-4">💜 Violet</h3>
              <div className="grid grid-cols-5 gap-2">
                {['50', '200', '400', '600', '800'].map((shade) => (
                  <div key={shade} className={`bg-violet-${shade} h-12 rounded-lg`} />
                ))}
              </div>
              <p className="text-text-dark-medium text-sm mt-3 font-medium">
                สำหรับข้อมูลพิเศษและฟีเจอร์ใหม่
              </p>
            </div>

            {/* Amber */}
            <div className="bg-surface-modern-light dark:bg-surface-modern-dark p-6 rounded-xl shadow-card-modern hover:shadow-card-hover transition-colors-shadow duration-300">
              <h3 className="text-lg font-black text-amber-600 mb-4">🧡 Amber</h3>
              <div className="grid grid-cols-5 gap-2">
                {['50', '200', '400', '600', '800'].map((shade) => (
                  <div key={shade} className={`bg-amber-${shade} h-12 rounded-lg`} />
                ))}
              </div>
              <p className="text-text-dark-medium text-sm mt-3 font-medium">
                สำหรับการเตือนและข้อมูลที่ต้องระวัง
              </p>
            </div>

            {/* Teal */}
            <div className="bg-surface-modern-light dark:bg-surface-modern-dark p-6 rounded-xl shadow-card-modern hover:shadow-card-hover transition-colors-shadow duration-300">
              <h3 className="text-lg font-black text-teal-600 mb-4">🔷 Teal</h3>
              <div className="grid grid-cols-5 gap-2">
                {['50', '200', '400', '600', '800'].map((shade) => (
                  <div key={shade} className={`bg-teal-${shade} h-12 rounded-lg`} />
                ))}
              </div>
              <p className="text-text-dark-medium text-sm mt-3 font-medium">
                สำหรับข้อมูลสถิติและการวิเคราะห์
              </p>
            </div>
          </div>
        </section>

        {/* 📚 Book Colors Section */}
        <section>
          <h2 className="text-2xl font-black text-text-dark-primary mb-6">
            📚 Book Colors - สีหนังสือสำหรับ Light Mode
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Paper */}
            <div className="bg-surface-book-light p-6 rounded-xl shadow-book hover:shadow-book-hover transition-colors-shadow duration-300">
              <h3 className="text-lg font-black text-text-book-primary mb-4">📄 Paper</h3>
              <div className="grid grid-cols-5 gap-2">
                {['50', '200', '400', '600', '800'].map((shade) => (
                  <div key={shade} className={`bg-paper-${shade} h-12 rounded-lg`} />
                ))}
              </div>
              <p className="text-text-book-secondary text-sm mt-3 font-semibold">
                สีกระดาษหนังสือที่อบอุ่นและเป็นมิตรกับสายตา
              </p>
            </div>

            {/* Ink */}
            <div className="bg-surface-book-warm p-6 rounded-xl shadow-book hover:shadow-book-hover transition-colors-shadow duration-300">
              <h3 className="text-lg font-black text-ink-700 mb-4">🖋️ Ink</h3>
              <div className="grid grid-cols-5 gap-2">
                {['50', '200', '400', '600', '800'].map((shade) => (
                  <div key={shade} className={`bg-ink-${shade} h-12 rounded-lg`} />
                ))}
              </div>
              <p className="text-text-book-secondary text-sm mt-3 font-semibold">
                สีหมึกสำหรับข้อความที่อ่านง่าย
              </p>
            </div>

            {/* Leather */}
            <div className="bg-surface-book-vintage p-6 rounded-xl shadow-leather-glow hover:shadow-leather-hover transition-colors-shadow duration-300">
              <h3 className="text-lg font-black text-leather-600 mb-4">📖 Leather</h3>
              <div className="grid grid-cols-5 gap-2">
                {['50', '200', '400', '600', '800'].map((shade) => (
                  <div key={shade} className={`bg-leather-${shade} h-12 rounded-lg`} />
                ))}
              </div>
              <p className="text-text-book-leather text-sm mt-3 font-bold">
                สีหนังปกหนังสือแบบคลาสสิก
              </p>
            </div>

            {/* Vintage */}
            <div className="bg-surface-book-aged p-6 rounded-xl shadow-vintage-glow hover:shadow-book-hover transition-colors-shadow duration-300">
              <h3 className="text-lg font-black text-vintage-600 mb-4">📜 Vintage</h3>
              <div className="grid grid-cols-5 gap-2">
                {['50', '200', '400', '600', '800'].map((shade) => (
                  <div key={shade} className={`bg-vintage-${shade} h-12 rounded-lg`} />
                ))}
              </div>
              <p className="text-text-book-vintage text-sm mt-3 font-bold">
                สีวินเทจสำหรับหนังสือเก่า
              </p>
            </div>

            {/* Sepia */}
            <div className="bg-gradient-book-sepia p-6 rounded-xl shadow-sepia-glow hover:shadow-book-hover transition-colors-shadow duration-300">
              <h3 className="text-lg font-black text-sepia-700 mb-4">🏺 Sepia</h3>
              <div className="grid grid-cols-5 gap-2">
                {['50', '200', '400', '600', '800'].map((shade) => (
                  <div key={shade} className={`bg-sepia-${shade} h-12 rounded-lg`} />
                ))}
              </div>
              <p className="text-text-book-vintage text-sm mt-3 font-bold">
                สีซีเปียสำหรับภาพและข้อความเก่า
              </p>
            </div>
          </div>
        </section>

        {/* 📖 Book Theme Demo Cards */}
        <section>
          <h2 className="text-2xl font-semibold text-text-book-primary mb-6">
            📖 Book Theme Cards - ตัวอย่างการใช้งาน
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Reading Statistics */}
            <div className="bg-gradient-book-warm text-white p-6 rounded-xl shadow-paper-glow hover:shadow-paper-hover transition-all-smooth duration-300 transform hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <span className="text-white/90 text-sm font-medium">หน้าที่อ่าน</span>
                <span className="text-2xl">📚</span>
              </div>
              <div className="text-3xl font-bold mb-2">1,247</div>
              <div className="text-white/90 text-sm">หน้า (เดือนนี้)</div>
            </div>

            {/* Reading Time */}
            <div className="bg-gradient-book-classic text-white p-6 rounded-xl shadow-leather-glow hover:shadow-leather-hover transition-all-smooth duration-300 transform hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <span className="text-white/90 text-sm font-medium">เวลาอ่าน</span>
                <span className="text-2xl">⏱️</span>
              </div>
              <div className="text-3xl font-bold mb-2">24.5</div>
              <div className="text-white/90 text-sm">ชั่วโมง</div>
            </div>

            {/* Books Completed */}
            <div className="bg-gradient-book-antique text-white p-6 rounded-xl shadow-vintage-glow hover:shadow-book-hover transition-all-smooth duration-300 transform hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <span className="text-white/90 text-sm font-medium">หนังสือจบ</span>
                <span className="text-2xl">✅</span>
              </div>
              <div className="text-3xl font-bold mb-2">12</div>
              <div className="text-white/90 text-sm">เล่ม</div>
            </div>

            {/* Knowledge Score */}
            <div className="bg-gradient-book-paper text-leather-800 p-6 rounded-xl shadow-paper-glow hover:shadow-paper-hover transition-all-smooth duration-300 transform hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <span className="text-leather-700/90 text-sm font-medium">คะแนนความรู้</span>
                <span className="text-2xl">🧠</span>
              </div>
              <div className="text-3xl font-bold mb-2">87%</div>
              <div className="text-leather-700/90 text-sm">ความเข้าใจ</div>
            </div>
          </div>
        </section>

        {/* 🌟 Interactive Elements */}
        <section>
          <h2 className="text-2xl font-semibold text-text-modern-light-primary dark:text-text-modern-dark-primary mb-6">
            ✨ Interactive Elements
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Modern Buttons */}
            <div className="bg-surface-modern-light dark:bg-surface-modern-dark p-6 rounded-xl shadow-card-modern">
              <h3 className="text-lg font-semibold text-text-modern-light-primary dark:text-text-modern-dark-primary mb-4">
                🔘 Modern Buttons
              </h3>
              <div className="space-y-3">
                <button className="w-full bg-gradient-ocean text-white py-3 px-6 rounded-lg hover:shadow-ocean-hover transition-all-smooth duration-300 transform hover:scale-105">
                  Primary Action
                </button>
                <button className="w-full bg-gradient-emerald text-white py-3 px-6 rounded-lg hover:shadow-emerald-hover transition-all-smooth duration-300 transform hover:scale-105">
                  Success Action
                </button>
                <button className="w-full bg-gradient-rose text-white py-3 px-6 rounded-lg hover:shadow-rose-hover transition-all-smooth duration-300 transform hover:scale-105">
                  Warning Action
                </button>
              </div>
            </div>

            {/* Book Buttons */}
            <div className="bg-gradient-book-paper p-6 rounded-xl shadow-paper-glow">
              <h3 className="text-lg font-semibold text-text-book-primary mb-4">
                📚 Book Buttons
              </h3>
              <div className="space-y-3">
                <button className="w-full bg-gradient-book-warm text-white py-3 px-6 rounded-lg hover:shadow-paper-hover transition-all-smooth duration-300 transform hover:scale-105">
                  เริ่มอ่าน
                </button>
                <button className="w-full bg-gradient-book-classic text-white py-3 px-6 rounded-lg hover:shadow-leather-hover transition-all-smooth duration-300 transform hover:scale-105">
                  บันทึกความคิดเห็น
                </button>
                <button className="w-full bg-gradient-book-antique text-white py-3 px-6 rounded-lg hover:shadow-vintage-glow transition-all-smooth duration-300 transform hover:scale-105">
                  แชร์หนังสือ
                </button>
              </div>
            </div>

            {/* Cards with Hover Effects */}
            <div className="bg-surface-modern-light dark:bg-surface-modern-dark p-6 rounded-xl shadow-card-modern">
              <h3 className="text-lg font-semibold text-text-modern-light-primary dark:text-text-modern-dark-primary mb-4">
                📱 Modern Hover Cards
              </h3>
              <div className="space-y-3">
                <div className="p-4 bg-gradient-sky rounded-lg cursor-pointer hover:shadow-ocean-hover transition-all-smooth duration-300 transform hover:scale-105">
                  <div className="text-white font-medium">Hover Effect 1</div>
                </div>
                <div className="p-4 bg-gradient-mint rounded-lg cursor-pointer hover:shadow-emerald-hover transition-all-smooth duration-300 transform hover:scale-105">
                  <div className="text-white font-medium">Hover Effect 2</div>
                </div>
                <div className="p-4 bg-gradient-dawn rounded-lg cursor-pointer hover:shadow-violet-hover transition-all-smooth duration-300 transform hover:scale-105">
                  <div className="text-white font-medium">Hover Effect 3</div>
                </div>
              </div>
            </div>

            {/* Book Reading Mode */}
            <div className="bg-gradient-book-cream p-6 rounded-xl shadow-sepia-glow">
              <h3 className="text-lg font-semibold text-text-book-primary mb-4">
                📖 Reading Mode
              </h3>
              <div className="space-y-3">
                <div className="p-4 bg-gradient-book-paper rounded-lg cursor-pointer hover:shadow-paper-hover transition-all-smooth duration-300 transform hover:scale-105">
                  <div className="text-text-book-primary font-medium">📄 Paper Mode</div>
                </div>
                <div className="p-4 bg-gradient-book-vintage rounded-lg cursor-pointer hover:shadow-vintage-glow transition-all-smooth duration-300 transform hover:scale-105">
                  <div className="text-text-book-vintage font-medium">📜 Vintage Mode</div>
                </div>
                <div className="p-4 bg-gradient-book-sepia rounded-lg cursor-pointer hover:shadow-sepia-glow transition-all-smooth duration-300 transform hover:scale-105">
                  <div className="text-text-book-vintage font-medium">🏺 Sepia Mode</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 🔤 Ultra Dark Text Colors Showcase */}
        <section>
          <h2 className="text-2xl font-black text-text-modern-light-extra mb-6">
            🔤 Ultra Dark Text Colors - เข้มสุด
          </h2>
          
          {/* Text Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            
            {/* Modern Text Colors */}
            <div className="bg-surface-modern-light p-6 rounded-xl shadow-card-modern">
              <h3 className="text-xl font-black text-text-modern-light-primary mb-4">
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
            <div className="bg-surface-book-light p-6 rounded-xl shadow-book-paper">
              <h3 className="text-xl font-black text-text-book-primary mb-4">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Ultra Dark Card */}
            <div className="bg-white p-6 rounded-xl shadow-card-modern border border-border-modern-light-primary">
              <h4 className="text-text-dark-primary text-xl font-black mb-3">
                การ์ดข้อความเข้มสุด
              </h4>
              <div className="text-text-dark-secondary text-3xl font-black mb-2">
                99.9%
              </div>
              <p className="text-text-dark-strong text-sm font-semibold">
                ความเข้มของข้อความ
              </p>
              <p className="text-text-dark-medium text-xs mt-2">
                WCAG AAA Compliant
              </p>
            </div>

            {/* Card Text Colors */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-card-modern">
              <h4 className="text-text-card-primary text-xl font-black mb-3">
                Card Text Colors
              </h4>
              <div className="text-text-card-primary text-3xl font-black mb-2">
                100%
              </div>
              <p className="text-text-card-secondary text-sm font-semibold">
                ข้อความในการ์ด
              </p>
              <p className="text-text-card-muted text-xs mt-2">
                อ่านง่าย ชัดเจน
              </p>
            </div>

            {/* Book Style Card */}
            <div className="bg-bg-book-paper p-6 rounded-xl shadow-book-warm border border-amber-200">
              <h4 className="text-text-book-primary text-xl font-black mb-3">
                Book Style Text
              </h4>
              <div className="text-text-book-primary text-3xl font-black mb-2">
                📚
              </div>
              <p className="text-text-book-secondary text-sm font-semibold">
                โทนหนังสือเข้มสุด
              </p>
              <p className="text-text-book-muted text-xs mt-2">
                เหมาะกับการอ่าน
              </p>
            </div>
          </div>
        </section>

        {/* 🔮 Footer */}
        <div className="text-center py-8">
          <p className="text-text-modern-light-secondary dark:text-text-modern-dark-secondary">
            🎨 Modern Color Scheme ที่สร้างขึ้นเพื่อ Attendance System ที่โมเดิร์นและใช้งานง่าย
          </p>
        </div>
      </div>
    </div>
  )
}

export default ModernColorDemo
