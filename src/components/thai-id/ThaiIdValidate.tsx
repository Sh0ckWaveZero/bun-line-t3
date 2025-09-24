'use client';

import { useState } from 'react';
import Link from 'next/link';
import { validateThaiID, formatThaiID } from '@/lib/utils/thai-id-generator';

export default function ThaiIdValidate() {
  const [inputId, setInputId] = useState('');
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    formattedId: string;
    message: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<Array<{id: string, isValid: boolean}>>([]);

  const handleValidate = async () => {
    if (!inputId.trim()) {
      setValidationResult({
        isValid: false,
        formattedId: '',
        message: 'กรุณากรอกเลขบัตรประชาชน'
      });
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));

      const isValid = validateThaiID(inputId);
      let formattedId = inputId;

      try {
        const cleanId = inputId.replace(/[-\s]/g, '');
        if (cleanId.length === 13) {
          formattedId = formatThaiID(cleanId);
        }
      } catch {
        formattedId = inputId;
      }

      const message = isValid
        ? '✅ เลขบัตรประชาชนถูกต้องตาม Check Digit Algorithm'
        : '❌ เลขบัตรประชาชนไม่ถูกต้อง';

      setValidationResult({
        isValid,
        formattedId,
        message
      });

      // Add to history
      setHistory(prev => [{
        id: formattedId,
        isValid
      }, ...prev.slice(0, 9)]);
    } catch {
      setValidationResult({
        isValid: false,
        formattedId: inputId,
        message: 'เกิดข้อผิดพลาดในการตรวจสอบ'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleValidate();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const clearInput = () => {
    setInputId('');
    setValidationResult(null);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            🔍 ตรวจสอบเลขบัตรประชาชน
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                กรอกเลขบัตรประชาชน 13 หลัก:
              </label>
              <input
                type="text"
                value={inputId}
                onChange={(e) => setInputId(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="1234567890123 หรือ 1-2345-67890-12-3"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono text-lg"
                maxLength={17}
              />
            </div>

            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              <p className="font-semibold mb-2">รองรับรูปแบบ:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>1234567890123 (ไม่มี dash)</li>
                <li>1-2345-67890-12-3 (มี dash)</li>
                <li>1 2345 67890 12 3 (มี space)</li>
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleValidate}
                disabled={isLoading}
                className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                {isLoading ? 'กำลังตรวจสอบ...' : '🔍 ตรวจสอบ'}
              </button>

              <button
                onClick={clearInput}
                disabled={isLoading}
                className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                🗑️ ล้าง
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
                href="/thai-id/generate"
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors text-center block"
              >
                🎲 สุ่ม
              </Link>
            </div>
          </div>
        </div>

        {/* Result Section */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            📋 ผลการตรวจสอบ
          </h2>

          {validationResult && (
            <div className={`p-4 rounded-lg border mb-4 ${
              validationResult.isValid
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <h3 className="font-semibold mb-2">
                {validationResult.isValid ? '✅ ถูกต้อง' : '❌ ไม่ถูกต้อง'}
              </h3>

              <div className="text-lg font-mono bg-white p-3 rounded border mb-3">
                {validationResult.formattedId}
              </div>

              <p className={`text-sm ${
                validationResult.isValid ? 'text-green-700' : 'text-red-700'
              }`}>
                {validationResult.message}
              </p>

              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => copyToClipboard(validationResult.formattedId)}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded transition-colors"
                >
                  📋 คัดลอก
                </button>
              </div>
            </div>
          )}

          {history.length > 0 && (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-2">ประวัติการตรวจสอบล่าสุด:</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {history.map((item, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-2 p-2 rounded border ${
                      item.isValid
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <span className={`text-sm font-mono flex-1 ${
                      item.isValid ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {item.id}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      item.isValid
                        ? 'bg-green-500 text-white'
                        : 'bg-red-500 text-white'
                    }`}>
                      {item.isValid ? '✅' : '❌'}
                    </span>
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
