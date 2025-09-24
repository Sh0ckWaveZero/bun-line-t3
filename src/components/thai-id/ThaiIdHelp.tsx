'use client';

import Link from 'next/link';

export default function ThaiIdHelp() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          📋 คำแนะนำการใช้งาน
        </h2>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Generate Section */}
          <div>
            <h3 className="text-xl font-bold text-green-700 mb-4">
              🎲 สุ่มเลขบัตรประชาชน
            </h3>

            <div className="space-y-3">
              <div className="bg-green-50 p-3 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">คำสั่ง:</h4>
                <ul className="space-y-1 text-sm text-green-700">
                  <li>• สุ่มเลขบัตร</li>
                  <li>• สุ่มบัตรประชาชน</li>
                  <li>• สุ่มเลขบัตรประชาชน</li>
                  <li>• random id</li>
                  <li>• generate id</li>
                  <li>• สุ่มเลขบัตร 5 (สุ่ม 5 เลข)</li>
                </ul>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">ตัวอย่างการสุ่ม:</h4>
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
            <h3 className="text-xl font-bold text-orange-700 mb-4">
              🔍 ตรวจสอบเลขบัตรประชาชน
            </h3>

            <div className="space-y-3">
              <div className="bg-orange-50 p-3 rounded-lg">
                <h4 className="font-semibold text-orange-800 mb-2">คำสั่ง:</h4>
                <ul className="space-y-1 text-sm text-orange-700">
                  <li>• ตรวจสอบบัตร [เลขบัตร]</li>
                  <li>• ตรวจสอบเลขบัตรประชาชน</li>
                  <li>• เช็คบัตร [เลขบัตร]</li>
                  <li>• validate id [เลขบัตร]</li>
                  <li>• check id [เลขบัตร]</li>
                </ul>
              </div>

              <div className="bg-yellow-50 p-3 rounded-lg">
                <h4 className="font-semibold text-yellow-800 mb-2">รูปแบบที่รองรับ:</h4>
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
          <div className="bg-indigo-50 p-4 rounded-lg">
            <h3 className="text-lg font-bold text-indigo-800 mb-3">
              ✨ คุณสมบัติพิเศษ
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl mb-2">🎯</div>
                <h4 className="font-semibold text-indigo-700">ถูกต้อง 100%</h4>
                <p className="text-sm text-indigo-600">Check Digit Algorithm ถูกต้องตามมาตรฐาน</p>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">📋</div>
                <h4 className="font-semibold text-indigo-700">คัดลอกง่าย</h4>
                <p className="text-sm text-indigo-600">คลิกเพื่อคัดลอกเลขบัตรได้ทันที</p>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">🔄</div>
                <h4 className="font-semibold text-indigo-700">รองรับหลายรูปแบบ</h4>
                <p className="text-sm text-indigo-600">dash, space หรือไม่มีเครื่องหมาย</p>
              </div>
            </div>
          </div>

          {/* Usage Instructions */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-bold text-gray-800 mb-3">
              📖 วิธีการใช้งาน
            </h3>
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-gray-700">1. สุ่มเลขบัตรประชาชน:</h4>
                <p className="text-sm text-gray-600 ml-4">พิมพ์ &ldquo;สุ่มเลขบัตร&rdquo; หรือคลิกปุ่ม &ldquo;สุ่มเลขบัตร 1 เลข&rdquo;</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700">2. สุ่มหลายเลข:</h4>
                <p className="text-sm text-gray-600 ml-4">พิมพ์ &ldquo;สุ่มเลขบัตร 5&rdquo; หรือเลือกจำนวนในหน้าเว็บ</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700">3. ตรวจสอบเลขบัตร:</h4>
                <p className="text-sm text-gray-600 ml-4">พิมพ์ &ldquo;ตรวจสอบบัตร [เลขบัตร]&rdquo; หรือกรอกในหน้าเว็บ</p>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
            <h3 className="text-lg font-bold text-red-800 mb-2">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/thai-id"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              🏠 หน้าแรก
            </Link>
            <Link
              href="/thai-id/generate"
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              🎲 สุ่มเลขบัตร
            </Link>
            <Link
              href="/thai-id/validate"
              className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              🔍 ตรวจสอบ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
