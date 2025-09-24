import { Metadata } from 'next';
import ThaiIdHelp from "../../../components/thai-id/ThaiIdHelp";

export const metadata: Metadata = {
  title: 'คำแนะนำการใช้งาน | Thai ID Generator Help',
  description: 'คำแนะนำการใช้งานตัวสร้างและตรวจสอบเลขบัตรประชาชนไทย',
  keywords: 'คำแนะนำ, help, thai id generator, สุ่มเลขบัตรประชาชน, ตรวจสอบเลขบัตรประชาชน',
};

export default function ThaiIdHelpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            📋 คำแนะนำการใช้งาน
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            คำแนะนำการใช้งานตัวสร้างและตรวจสอบเลขบัตรประชาชนไทย
          </p>
        </div>

        <ThaiIdHelp />
      </div>
    </div>
  );
}
