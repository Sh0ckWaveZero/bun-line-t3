"use client";

import { useState } from "react";
import { Copy } from "lucide-react";
import {
  generateFormattedThaiID,
  validateThaiID,
} from "@/lib/utils/thai-id-generator";

export default function ThaiIdGenerate() {
  const [generatedId, setGeneratedId] = useState<string>("6118480700970");
  const [validationInput, setValidationInput] = useState<string>("");
  const [validationResult, setValidationResult] = useState<boolean | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleGenerateNew = async () => {
    setIsLoading(true);
    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      const newId = generateFormattedThaiID().replace(/-/g, "");
      setGeneratedId(newId);
    } catch (error) {
      console.error("Error generating ID:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedId);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleValidation = () => {
    if (validationInput.trim()) {
      const cleanInput = validationInput.replace(/[-\s]/g, "");
      const isValid = validateThaiID(cleanInput);
      setValidationResult(isValid);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ""); // Only allow digits
    if (value.length <= 13) {
      setValidationInput(value);
      setValidationResult(null);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center space-y-8 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
      {/* Main Card - ID Generator */}
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl">
        <h1 className="mb-8 text-center text-2xl font-bold text-purple-600">
          สุ่มเลขบัตรประชาชน
        </h1>

        {/* Generated ID Display */}
        <div className="relative mb-6 rounded-xl bg-gradient-to-r from-blue-400 to-blue-600 p-6 text-center">
          <div className="font-mono text-3xl font-bold tracking-wider text-white">
            {generatedId}
          </div>
          <button
            onClick={handleCopy}
            className="absolute right-4 top-4 text-white transition-colors hover:text-gray-200"
            title="คัดลอก"
          >
            <Copy size={20} />
          </button>
          {copySuccess && (
            <div className="absolute -top-2 right-12 rounded bg-green-500 px-2 py-1 text-xs text-white">
              คัดลอกแล้ว!
            </div>
          )}
        </div>

        {/* Generate New Button */}
        <button
          onClick={handleGenerateNew}
          disabled={isLoading}
          className="mb-4 w-full rounded-xl bg-gray-100 px-6 py-3 font-medium text-gray-800 transition-colors hover:bg-gray-200 disabled:opacity-50"
        >
          {isLoading ? "กำลังสุ่ม..." : "สุ่มเลขบัตรใหม่"}
        </button>

        {/* Warning Text */}
        <p className="text-center text-sm leading-relaxed text-gray-500">
          เลขบัตรประชาชนนี้เป็นเพียงตัวอย่างที่สร้างขึ้นมาเพื่อการทดสอบเท่านั้น
          ไม่ใช่เลขของคนที่มีอยู่จริง
        </p>
      </div>

      {/* Validation Card */}
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl">
        <h2 className="mb-8 text-center text-2xl font-bold text-purple-600">
          ตรวจสอบเลขบัตรประชาชน
        </h2>

        {/* Input Field */}
        <div className="mb-6">
          <input
            type="text"
            value={validationInput}
            onChange={handleInputChange}
            placeholder="กรอกเลขบัตรประชาชน 13 หลัก"
            className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-center font-mono text-lg focus:border-purple-400 focus:outline-none"
          />
        </div>

        {/* Validate Button */}
        <button
          onClick={handleValidation}
          disabled={!validationInput.trim() || validationInput.length !== 13}
          className="mb-4 w-full rounded-xl bg-gray-100 px-6 py-3 font-medium text-gray-800 transition-colors hover:bg-gray-200 disabled:opacity-50"
        >
          ตรวจสอบ
        </button>

        {/* Validation Result */}
        {validationResult !== null && (
          <div
            className={`rounded-xl p-4 text-center ${
              validationResult
                ? "border border-green-200 bg-green-50 text-green-700"
                : "border border-red-200 bg-red-50 text-red-700"
            }`}
          >
            <div className="text-lg font-semibold">
              {validationResult
                ? "✅ เลขบัตรประชาชนถูกต้อง"
                : "❌ เลขบัตรประชาชนไม่ถูกต้อง"}
            </div>
            {validationResult && (
              <div className="mt-1 text-sm">
                ผ่านการตรวจสอบ Check Digit Algorithm
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
