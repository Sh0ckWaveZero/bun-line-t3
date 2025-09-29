import { Metadata } from "next";
import ThaiIdGenerator from "@/components/thai-id/ThaiIdGenerator";

export const metadata: Metadata = {
  title: "สุ่มเลขบัตรประชาชน | Thai ID Generator",
  description:
    "สุ่มและตรวจสอบเลขบัตรประชาชนไทยแบบสุ่ม สร้างเลขบัตรประชาชนที่ถูกต้องตาม Check Digit Algorithm",
  keywords:
    "สุ่มเลขบัตรประชาชน, Thai ID Generator, บัตรประชาชนไทย, สุ่มบัตรประชาชน",
};

export default function ThaiIdPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
      <div className="container mx-auto">
        <ThaiIdGenerator />
      </div>
    </div>
  );
}

