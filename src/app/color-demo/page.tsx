import { Metadata } from "next";
import ModernColorDemo from "@/components/ui/modern-color-demo";

export const metadata: Metadata = {
  title: "Modern Color Demo | ตัวอย่างสีใหม่",
  description: "แสดงตัวอย่างชุดสีใหม่ที่โมเดิร์นสำหรับระบบ Attendance",
};

/**
 * 🎨 Demo Page for Modern Color Scheme
 * หน้าสำหรับแสดงตัวอย่างสีใหม่ที่โมเดิร์น
 */
export default function ModernColorDemoPage() {
  return <ModernColorDemo />;
}
