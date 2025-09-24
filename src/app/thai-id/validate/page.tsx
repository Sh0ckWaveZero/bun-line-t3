import { Metadata } from 'next';
import ThaiIdValidate from "../../../components/thai-id/ThaiIdValidate";


export const metadata: Metadata = {
  title: 'ตรวจสอบเลขบัตรประชาชน | Validate Thai ID',
  description: 'ตรวจสอบความถูกต้องของเลขบัตรประชาชนไทย ตรวจสอบ Check Digit Algorithm',
  keywords: 'ตรวจสอบเลขบัตรประชาชน, validate thai id, ตรวจสอบบัตรประชาชน, thai id validator',
};

export default function ThaiIdValidatePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            🔍 ตรวจสอบเลขบัตรประชาชนไทย
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            ตรวจสอบความถูกต้องของเลขบัตรประชาชนไทยตาม Check Digit Algorithm
            รองรับทั้งรูปแบบมี dash และไม่มี dash
          </p>
        </div>

        <ThaiIdValidate />
      </div>
    </div>
  );
}
