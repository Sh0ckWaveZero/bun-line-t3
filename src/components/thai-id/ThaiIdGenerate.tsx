'use client';

import { useState } from 'react';
import Link from 'next/link';
import { generateFormattedThaiID, generateMultipleThaiIDs, validateThaiID } from '@/lib/utils/thai-id-generator';

export default function ThaiIdGenerate() {
  const [count, setCount] = useState(1);
  const [generatedId, setGeneratedId] = useState<string>('');
  const [generatedIds, setGeneratedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  const handleGenerateSingle = async () => {
    setIsLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      const id = generateFormattedThaiID();
      setGeneratedId(id);
      setHistory(prev => [id, ...prev.slice(0, 9)]); // Keep last 10
    } catch (error) {
      console.error('Error generating ID:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateMultiple = async () => {
    setIsLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      const ids = generateMultipleThaiIDs(count);
      setGeneratedIds(ids);
      setHistory(prev => [...ids, ...prev.slice(0, 10 - ids.length)]); // Keep last 10
    } catch (error) {
      console.error('Error generating IDs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You can add toast notification here
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Generate Controls */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            🎲 สุ่มเลขบัตรประชาชน
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                จำนวนเลขที่ต้องการสุ่ม:
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={count}
                onChange={(e) => setCount(Math.min(Math.max(parseInt(e.target.value) || 1, 1), 20))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleGenerateSingle}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                {isLoading ? '...' : '🎲 สุ่ม 1 เลข'}
              </button>

              <button
                onClick={handleGenerateMultiple}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                {isLoading ? '...' : `🎲 สุ่ม ${count} เลข`}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Link
                href="/thai-id"
                className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors text-center block"
              >
                ⬅️ กลับ
              </Link>

              <Link
                href="/thai-id/validate"
                className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors text-center block"
              >
                🔍 ตรวจสอบ
              </Link>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            📋 ผลลัพธ์
          </h2>

          {generatedId && (
            <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="font-semibold text-green-800 mb-2">เลขบัตรประชาชนที่สุ่มได้:</h3>
              <div className="text-xl font-mono text-green-700 bg-white p-3 rounded border text-center mb-2">
                {generatedId}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(generatedId)}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded transition-colors"
                >
                  📋 คัดลอก
                </button>
                <button
                  onClick={() => validateThaiID(generatedId) ? alert('✅ ถูกต้อง') : alert('❌ ไม่ถูกต้อง')}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded transition-colors"
                >
                  ✅ ตรวจสอบ
                </button>
              </div>
            </div>
          )}

          {generatedIds.length > 0 && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-800 mb-2">
                เลขบัตรประชาชนที่สุ่มได้ ({generatedIds.length} เลข):
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {generatedIds.map((id, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-white rounded border">
                    <span className="text-sm font-mono text-blue-700 flex-1">{id}</span>
                    <button
                      onClick={() => copyToClipboard(id)}
                      className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-2 py-1 rounded"
                    >
                      📋
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => copyToClipboard(generatedIds.join('\n'))}
                className="mt-2 w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded transition-colors"
              >
                📋 คัดลอกทั้งหมด
              </button>
            </div>
          )}

          {history.length > 0 && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-2">ประวัติการสุ่มล่าสุด:</h3>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {history.slice(0, 5).map((id, index) => (
                  <div key={index} className="text-sm font-mono text-gray-600 bg-white p-2 rounded border">
                    {id}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
