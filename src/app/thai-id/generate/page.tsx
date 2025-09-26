import { Metadata } from "next";
import ThaiIdGenerate from "../../../components/thai-id/ThaiIdGenerate";

export const metadata: Metadata = {
  title: "สุ่มเลขบัตรประชาชน | Generate Thai ID",
  description:
    "สุ่มเลขบัตรประชาชนไทยแบบสุ่ม สร้างเลขบัตรประชาชนที่ถูกต้องตาม Check Digit Algorithm",
  keywords:
    "สุ่มเลขบัตรประชาชน, generate thai id, สุ่มบัตรประชาชน, thai id generator",
};

export default function ThaiIdGeneratePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-800">
            🎲 สุ่มเลขบัตรประชาชนไทย
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            สร้างเลขบัตรประชาชนไทยแบบสุ่มที่ถูกต้องตาม Check Digit Algorithm
            ใช้เพื่อการทดสอบเท่านั้น ห้ามนำไปใช้ในการปลอมแปลงเอกสาร
          </p>
        </div>

        <ThaiIdGenerate />
      </div>
    </div>
  );
}
