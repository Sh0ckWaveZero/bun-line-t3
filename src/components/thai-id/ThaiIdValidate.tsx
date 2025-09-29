"use client";

import { useState } from "react";
import Link from "next/link";
import { validateThaiID, formatThaiID } from "@/lib/utils/thai-id-generator";

export default function ThaiIdValidate() {
  const [inputId, setInputId] = useState("");
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    formattedId: string;
    message: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<
    Array<{ id: string; isValid: boolean }>
  >([]);

  const handleValidate = async () => {
    if (!inputId.trim()) {
      setValidationResult({
        isValid: false,
        formattedId: "",
        message: "กรุณากรอกเลขบัตรประชาชน",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 300));

      const isValid = validateThaiID(inputId);
      let formattedId = inputId;

      try {
        const cleanId = inputId.replace(/[-\s]/g, "");
        if (cleanId.length === 13) {
          formattedId = formatThaiID(cleanId);
        }
      } catch {
        formattedId = inputId;
      }

      const message = isValid
        ? "✅ เลขบัตรประชาชนถูกต้องตาม Check Digit Algorithm"
        : "❌ เลขบัตรประชาชนไม่ถูกต้อง";

      setValidationResult({
        isValid,
        formattedId,
        message,
      });

      // Add to history
      setHistory((prev) => [
        {
          id: formattedId,
          isValid,
        },
        ...prev.slice(0, 9),
      ]);
    } catch {
      setValidationResult({
        isValid: false,
        formattedId: inputId,
        message: "เกิดข้อผิดพลาดในการตรวจสอบ",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleValidate();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const clearInput = () => {
    setInputId("");
    setValidationResult(null);
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="grid gap-8 md:grid-cols-2">
        {/* Input Section */}
        <div className="rounded-lg bg-white p-6 shadow-lg">
          <h2 className="mb-6 text-center text-2xl font-bold text-gray-800">
            🔍 ตรวจสอบเลขบัตรประชาชน
          </h2>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                กรอกเลขบัตรประชาชน 13 หลัก:
              </label>
              <input
                type="text"
                value={inputId}
                onChange={(e) => setInputId(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="1234567890123 หรือ 1-2345-67890-12-3"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 font-mono text-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                maxLength={17}
              />
            </div>

            <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
              <p className="mb-2 font-semibold">รองรับรูปแบบ:</p>
              <ul className="list-inside list-disc space-y-1">
                <li>1234567890123 (ไม่มี dash)</li>
                <li>1-2345-67890-12-3 (มี dash)</li>
                <li>1 2345 67890 12 3 (มี space)</li>
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleValidate}
                disabled={isLoading}
                className="rounded-lg bg-orange-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-orange-700 disabled:bg-gray-400"
              >
                {isLoading ? "กำลังตรวจสอบ..." : "🔍 ตรวจสอบ"}
              </button>

              <button
                onClick={clearInput}
                disabled={isLoading}
                className="rounded-lg bg-gray-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-gray-700 disabled:bg-gray-400"
              >
                🗑️ ล้าง
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Link
                href="/thai-id"
                className="block rounded-lg bg-gray-600 px-4 py-3 text-center font-semibold text-white transition-colors hover:bg-gray-700"
              >
                ⬅️ กลับ
              </Link>

              <Link
                href="/thai-id/generate"
                className="block rounded-lg bg-green-600 px-4 py-3 text-center font-semibold text-white transition-colors hover:bg-green-700"
              >
                🎲 สุ่ม
              </Link>
            </div>
          </div>
        </div>

        {/* Result Section */}
        <div className="rounded-lg bg-white p-6 shadow-lg">
          <h2 className="mb-6 text-center text-2xl font-bold text-gray-800">
            📋 ผลการตรวจสอบ
          </h2>

          {validationResult && (
            <div
              className={`mb-4 rounded-lg border p-4 ${
                validationResult.isValid
                  ? "border-green-200 bg-green-50"
                  : "border-red-200 bg-red-50"
              }`}
            >
              <h3 className="mb-2 font-semibold">
                {validationResult.isValid ? "✅ ถูกต้อง" : "❌ ไม่ถูกต้อง"}
              </h3>

              <div className="mb-3 rounded border bg-white p-3 font-mono text-lg">
                {validationResult.formattedId}
              </div>

              <p
                className={`text-sm ${
                  validationResult.isValid ? "text-green-700" : "text-red-700"
                }`}
              >
                {validationResult.message}
              </p>

              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => copyToClipboard(validationResult.formattedId)}
                  className="flex-1 rounded bg-blue-500 px-4 py-2 font-semibold text-white transition-colors hover:bg-blue-600"
                >
                  📋 คัดลอก
                </button>
              </div>
            </div>
          )}

          {history.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <h3 className="mb-2 font-semibold text-gray-800">
                ประวัติการตรวจสอบล่าสุด:
              </h3>
              <div className="max-h-64 space-y-2 overflow-y-auto">
                {history.map((item, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-2 rounded border p-2 ${
                      item.isValid
                        ? "border-green-200 bg-green-50"
                        : "border-red-200 bg-red-50"
                    }`}
                  >
                    <span
                      className={`flex-1 font-mono text-sm ${
                        item.isValid ? "text-green-700" : "text-red-700"
                      }`}
                    >
                      {item.id}
                    </span>
                    <span
                      className={`rounded px-2 py-1 text-xs ${
                        item.isValid
                          ? "bg-green-500 text-white"
                          : "bg-red-500 text-white"
                      }`}
                    >
                      {item.isValid ? "✅" : "❌"}
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
