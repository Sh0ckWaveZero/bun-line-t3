'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ThaiIdGenerator() {
  const [generatedId, setGeneratedId] = useState<string>('');
  const [generatedIds, setGeneratedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const generateSingleId = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/thai-id/generate');
      const data = await response.json();
      setGeneratedId(data.id);
    } catch (error) {
      console.error('Error generating ID:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateMultipleIds = async (count: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/thai-id/generate?count=${count}`);
      const data = await response.json();
      setGeneratedIds(data.ids);
    } catch (error) {
      console.error('Error generating IDs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Generate Section */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
            🎲 สุ่มเลขบัตรประชาชน
          </h2>

          <div className="space-y-4">
            <button
              onClick={generateSingleId}
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              {isLoading ? 'กำลังสุ่ม...' : '🎲 สุ่มเลขบัตร 1 เลข'}
            </button>

            <button
              onClick={() => generateMultipleIds(5)}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              {isLoading ? 'กำลังสุ่ม...' : '🎲 สุ่มเลขบัตร 5 เลข'}
            </button>

            <Link
              href="/thai-id/generate"
              className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors text-center"
            >
              เปิดหน้าสุ่มเลขบัตร
            </Link>
          </div>

          {generatedId && (
            <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="font-semibold text-green-800 mb-2">เลขบัตรประชาชนที่สุ่มได้:</h3>
              <div className="text-2xl font-mono text-green-700 bg-white p-3 rounded border text-center">
                {generatedId}
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(generatedId)}
                className="mt-2 w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded transition-colors"
              >
                📋 คัดลอก
              </button>
            </div>
          )}

          {generatedIds.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-800 mb-2">
                เลขบัตรประชาชนที่สุ่มได้ ({generatedIds.length} เลข):
              </h3>
              <div className="space-y-2">
                {generatedIds.map((id, index) => (
                  <div key={index} className="text-lg font-mono text-blue-700 bg-white p-2 rounded border">
                    {id}
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(generatedIds.join('\n'))}
                className="mt-2 w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded transition-colors"
              >
                📋 คัดลอกทั้งหมด
              </button>
            </div>
          )}
        </div>

        {/* Validate Section */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
            🔍 ตรวจสอบเลขบัตรประชาชน
          </h2>

          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              <p className="mb-2">รองรับรูปแบบ:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>1234567890123</li>
                <li>1-2345-67890-12-3</li>
                <li>1 2345 67890 12 3</li>
              </ul>
            </div>

            <Link
              href="/thai-id/validate"
              className="block w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors text-center"
            >
              เปิดหน้าตรวจสอบเลขบัตร
            </Link>

            <Link
              href="/thai-id/help"
              className="block w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors text-center"
            >
              ดูคำแนะนำการใช้งาน
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            ⚠️ <strong>หมายเหตุ:</strong> ใช้เพื่อการทดสอบเท่านั้น ห้ามนำไปใช้ในการปลอมแปลงเอกสาร
          </p>
        </div>
      </div>
    </div>
  );
}
