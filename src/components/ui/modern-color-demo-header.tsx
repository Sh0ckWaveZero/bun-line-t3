// src/components/ui/modern-color-demo-header.tsx
"use client";

/** 🎯 ส่วนหัวของหน้า Modern Color Demo */
export function ModernColorDemoHeader() {
  return (
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
  );
}
