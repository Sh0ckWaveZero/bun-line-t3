import { Metadata } from "next";
import ThaiIdHelp from "../../../components/thai-id/ThaiIdHelp";

export const metadata: Metadata = {
  title: "คำแนะนำการใช้งาน | Thai ID Generator Help",
  description: "คำแนะนำการใช้งานตัวสร้างและตรวจสอบเลขบัตรประชาชนไทย",
  keywords:
    "คำแนะนำ, help, thai id generator, สุ่มเลขบัตรประชาชน, ตรวจสอบเลขบัตรประชาชน",
};

export default function ThaiIdHelpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-800">
            📋 คำแนะนำการใช้งาน
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            คำแนะนำการใช้งานตัวสร้างและตรวจสอบเลขบัตรประชาชนไทย
          </p>
        </div>

        <ThaiIdHelp />
      </div>
    </div>
  );
}
