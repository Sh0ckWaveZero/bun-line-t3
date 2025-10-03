import { Metadata } from "next";
import ThaiIdGenerate from "@/components/thai-id/ThaiIdGenerate";

export const metadata: Metadata = {
  title: "สุ่มเลขบัตรประชาชน | Thai ID Generator",
  description:
    "สุ่มและตรวจสอบเลขบัตรประชาชนไทยแบบสุ่ม สร้างเลขบัตรประชาชนที่ถูกต้องตาม Check Digit Algorithm",
  keywords:
    "สุ่มเลขบัตรประชาชน, Thai ID Generator, บัตรประชาชนไทย, สุ่มบัตรประชาชน",
};

export default function ThaiIdPage() {
  return <ThaiIdGenerate />;
}
