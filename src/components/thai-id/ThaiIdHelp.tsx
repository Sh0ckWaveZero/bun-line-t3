"use client";

import Link from "next/link";

export default function ThaiIdHelp() {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-6 text-center text-3xl font-bold text-gray-800">
          📋 คำแนะนำการใช้งาน
        </h2>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Generate Section */}
          <div>
            <h3 className="mb-4 text-xl font-bold text-green-700">
              🎲 สุ่มเลขบัตรประชาชน
            </h3>

            <div className="space-y-3">
              <div className="rounded-lg bg-green-50 p-3">
                <h4 className="mb-2 font-semibold text-green-800">คำสั่ง:</h4>
                <ul className="space-y-1 text-sm text-green-700">
                  <li>• สุ่มเลขบัตร</li>
                  <li>• สุ่มบัตรประชาชน</li>
                  <li>• สุ่มเลขบัตรประชาชน</li>
                  <li>• random id</li>
                  <li>• generate id</li>
                  <li>• สุ่มเลขบัตร 5 (สุ่ม 5 เลข)</li>
                </ul>
              </div>

              <div className="rounded-lg bg-blue-50 p-3">
                <h4 className="mb-2 font-semibold text-blue-800">
                  ตัวอย่างการสุ่ม:
                </h4>
                <ul className="space-y-1 text-sm text-blue-700">
                  <li>• 5-9531-38724-86-1</li>
                  <li>• 3-8664-97941-96-4</li>
                  <li>• 8-0376-06232-15-1</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Validate Section */}
          <div>
            <h3 className="mb-4 text-xl font-bold text-orange-700">
              🔍 ตรวจสอบเลขบัตรประชาชน
            </h3>

            <div className="space-y-3">
              <div className="rounded-lg bg-orange-50 p-3">
                <h4 className="mb-2 font-semibold text-orange-800">คำสั่ง:</h4>
                <ul className="space-y-1 text-sm text-orange-700">
                  <li>• ตรวจสอบบัตร [เลขบัตร]</li>
                  <li>• ตรวจสอบเลขบัตรประชาชน</li>
                  <li>• เช็คบัตร [เลขบัตร]</li>
                  <li>• validate id [เลขบัตร]</li>
                  <li>• check id [เลขบัตร]</li>
                </ul>
              </div>

              <div className="rounded-lg bg-yellow-50 p-3">
                <h4 className="mb-2 font-semibold text-yellow-800">
                  รูปแบบที่รองรับ:
                </h4>
                <ul className="space-y-1 text-sm text-yellow-700">
                  <li>• 1234567890123 (ไม่มี dash)</li>
                  <li>• 1-2345-67890-12-3 (มี dash)</li>
                  <li>• 1 2345 67890 12 3 (มี space)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-6">
          {/* Features */}
          <div className="rounded-lg bg-indigo-50 p-4">
            <h3 className="mb-3 text-lg font-bold text-indigo-800">
              ✨ คุณสมบัติพิเศษ
            </h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center">
                <div className="mb-2 text-2xl">🎯</div>
                <h4 className="font-semibold text-indigo-700">ถูกต้อง 100%</h4>
                <p className="text-sm text-indigo-600">
                  Check Digit Algorithm ถูกต้องตามมาตรฐาน
                </p>
              </div>
              <div className="text-center">
                <div className="mb-2 text-2xl">📋</div>
                <h4 className="font-semibold text-indigo-700">คัดลอกง่าย</h4>
                <p className="text-sm text-indigo-600">
                  คลิกเพื่อคัดลอกเลขบัตรได้ทันที
                </p>
              </div>
              <div className="text-center">
                <div className="mb-2 text-2xl">🔄</div>
                <h4 className="font-semibold text-indigo-700">
                  รองรับหลายรูปแบบ
                </h4>
                <p className="text-sm text-indigo-600">
                  dash, space หรือไม่มีเครื่องหมาย
                </p>
              </div>
            </div>
          </div>

          {/* Usage Instructions */}
          <div className="rounded-lg bg-gray-50 p-4">
            <h3 className="mb-3 text-lg font-bold text-gray-800">
              📖 วิธีการใช้งาน
            </h3>
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-gray-700">
                  1. สุ่มเลขบัตรประชาชน:
                </h4>
                <p className="ml-4 text-sm text-gray-600">
                  พิมพ์ &ldquo;สุ่มเลขบัตร&rdquo; หรือคลิกปุ่ม
                  &ldquo;สุ่มเลขบัตร 1 เลข&rdquo;
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700">2. สุ่มหลายเลข:</h4>
                <p className="ml-4 text-sm text-gray-600">
                  พิมพ์ &ldquo;สุ่มเลขบัตร 5&rdquo; หรือเลือกจำนวนในหน้าเว็บ
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700">
                  3. ตรวจสอบเลขบัตร:
                </h4>
                <p className="ml-4 text-sm text-gray-600">
                  พิมพ์ &ldquo;ตรวจสอบบัตร [เลขบัตร]&rdquo; หรือกรอกในหน้าเว็บ
                </p>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <h3 className="mb-2 text-lg font-bold text-red-800">
              ⚠️ คำเตือนสำคัญ
            </h3>
            <p className="text-sm text-red-700">
              เลขบัตรประชาชนที่สร้างขึ้นนี้เป็นเพียงการสุ่มเพื่อการทดสอบเท่านั้น
              ห้ามนำไปใช้ในการปลอมแปลงเอกสาร ทำผิดกฎหมาย หรือใช้ในทางที่ผิด
              ผู้ใช้ต้องรับผิดชอบในการใช้งานด้วยตนเอง
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Link
              href="/thai-id"
              className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
            >
              🏠 หน้าแรก
            </Link>
            <Link
              href="/thai-id/generate"
              className="rounded-lg bg-green-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-green-700"
            >
              🎲 สุ่มเลขบัตร
            </Link>
            <Link
              href="/thai-id/validate"
              className="rounded-lg bg-orange-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-orange-700"
            >
              🔍 ตรวจสอบ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
