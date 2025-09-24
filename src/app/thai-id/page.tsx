import { Metadata } from 'next';
import ThaiIdGenerator from '@/components/thai-id/ThaiIdGenerator';

export const metadata: Metadata = {
  title: 'สุ่มเลขบัตรประชาชน | Thai ID Generator',
  description: 'สุ่มและตรวจสอบเลขบัตรประชาชนไทยแบบสุ่ม สร้างเลขบัตรประชาชนที่ถูกต้องตาม Check Digit Algorithm',
  keywords: 'สุ่มเลขบัตรประชาชน, Thai ID Generator, บัตรประชาชนไทย, สุ่มบัตรประชาชน',
};

export default function ThaiIdPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            🎲 สุ่มเลขบัตรประชาชนไทย
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            สร้างเลขบัตรประชาชนไทยแบบสุ่มที่ถูกต้องตาม Check Digit Algorithm
            ใช้เพื่อการทดสอบเท่านั้น ห้ามนำไปใช้ในการปลอมแปลงเอกสาร
          </p>
        </div>

        <ThaiIdGenerator />
      </div>
    </div>
  );
}
