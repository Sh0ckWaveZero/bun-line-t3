"use client";

import { useState } from "react";
import { Copy } from "lucide-react";
import {
  generateRandomThaiID,
  validateThaiID,
  formatThaiID,
  formatThaiIDInput,
} from "@/lib/utils/thai-id-generator";

export default function ThaiIdGenerator() {
  // Generate initial random Thai ID
  const initialId = generateRandomThaiID();
  const [generatedId, setGeneratedId] = useState<string>(initialId);
  const [displayGeneratedId, setDisplayGeneratedId] = useState<string>(
    formatThaiID(initialId),
  );
  const [validationInput, setValidationInput] = useState<string>("");
  const [validationResult, setValidationResult] = useState<boolean | null>(
    null,
  );

  const [isLoading, setIsLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleGenerateNew = async () => {
    setIsLoading(true);
    try {
      // Animation phase - show spinning numbers with color changes
      const animationDuration = 1500; // 1.5 seconds
      const animationInterval = 50; // 50ms intervals
      const iterations = animationDuration / animationInterval;

      // Create a promise that resolves when animation completes
      await new Promise<void>((resolve) => {
        let currentIteration = 0;
        const animationTimer = setInterval(() => {
          // Generate random 13-digit number for animation
          const randomId = Array.from({ length: 13 }, () =>
            Math.floor(Math.random() * 10),
          ).join("");
          setGeneratedId(randomId);
          setDisplayGeneratedId(formatThaiID(randomId));

          currentIteration++;
          if (currentIteration >= iterations) {
            clearInterval(animationTimer);

            // Generate final valid ID
            const finalId = generateRandomThaiID();
            setGeneratedId(finalId);
            setDisplayGeneratedId(formatThaiID(finalId));

            // Resolve the promise to end loading state
            resolve();
          }
        }, animationInterval);
      });
    } catch (error) {
      console.error("Error generating ID:", error);
      // Fallback: generate ID without animation
      const fallbackId = generateRandomThaiID();
      setGeneratedId(fallbackId);
      setDisplayGeneratedId(formatThaiID(fallbackId));
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
      const formattedValue = formatThaiIDInput(value);
      setValidationInput(formattedValue);
      setValidationResult(null);
    }
  };

  return (
    <div id="thai-id-container" className="flex flex-col space-y-4 px-4 py-2">
      {/* Main Card - ID Generator */}
      <div
        id="id-generator-card"
        className="mx-auto w-full max-w-sm rounded-xl bg-white p-4 shadow-lg"
      >
        <h2
          id="generator-title"
          className="mb-4 text-center text-lg font-bold"
          style={{
            background: "linear-gradient(90deg, #7c3aed, #ec4899, #6366f1)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          สุ่มเลขบัตรประชาชน
        </h2>

        {/* Generated ID Display */}
        <div
          id="id-display-container"
          className="mb-4 rounded-lg border-2 border-gray-200 bg-white p-4 text-center shadow-sm"
        >
          <div
            id="generated-id-text"
            className={`font-prompt text-2xl font-black tracking-wider transition-all duration-300 ${
              isLoading
                ? "scale-110 animate-pulse text-blue-600"
                : "text-gray-800"
            }`}
          >
            {displayGeneratedId}
          </div>

          {/* Copy Button - Below the number */}
          <div className="mt-3">
            <button
              id="copy-button"
              onClick={handleCopy}
              className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                copySuccess
                  ? "bg-green-500 text-white"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              } shadow-md hover:shadow-lg active:scale-95`}
            >
              <Copy size={16} />
              <span>{copySuccess ? "คัดลอกแล้ว!" : "คัดลอก"}</span>
            </button>
          </div>
        </div>

        {/* Generate New Button */}
        <button
          id="generate-new-button"
          onClick={handleGenerateNew}
          disabled={isLoading}
          className="mb-3 w-full rounded-lg bg-gray-200 px-4 py-3 text-sm font-semibold text-gray-900 shadow-sm transition-all duration-200 hover:bg-gray-300 active:scale-95 disabled:opacity-50"
        >
          {isLoading ? "กำลังสุ่ม..." : "สุ่มเลขบัตรใหม่"}
        </button>

        {/* Warning Text */}
        <p
          id="warning-text"
          className="px-2 text-center text-xs leading-relaxed text-gray-500"
        >
          เลขบัตรประชาชนนี้เป็นเพียงตัวอย่างที่สร้างขึ้นมาเพื่อการทดสอบเท่านั้น
          ไม่ใช่เลขของคนที่มีอยู่จริง
        </p>
      </div>

      {/* Validation Card */}
      <div
        id="validation-card"
        className="mx-auto w-full max-w-sm rounded-xl bg-white p-4 shadow-lg"
      >
        <h2
          id="validation-title"
          className="mb-4 text-center text-lg font-bold"
          style={{
            background: "linear-gradient(90deg, #7c3aed, #ec4899, #6366f1)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          ตรวจสอบเลขบัตรประชาชน
        </h2>

        {/* Input Field */}
        <div id="input-container" className="mb-3">
          <input
            id="validation-input"
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            value={validationInput}
            onChange={handleInputChange}
            placeholder="กรอกเลขบัตรประชาชน 13 หลัก"
            className="w-full rounded-lg border-2 border-gray-200 px-3 py-3 text-center font-prompt text-base transition-colors focus:border-purple-400 focus:outline-none"
          />
        </div>

        {/* Validate Button */}
        <button
          id="validate-button"
          onClick={handleValidation}
          disabled={
            !validationInput.trim() ||
            validationInput.replace(/[-\s]/g, "").length !== 13
          }
          className="mb-3 w-full rounded-lg bg-gray-200 px-4 py-3 text-sm font-semibold text-gray-900 shadow-sm transition-all duration-200 hover:bg-gray-300 active:scale-95 disabled:opacity-50"
        >
          ตรวจสอบ
        </button>

        {/* Validation Result */}
        {validationResult !== null && (
          <div
            id="validation-result"
            className={`rounded-lg p-3 text-center ${
              validationResult
                ? "border border-green-200 bg-green-50 text-green-700"
                : "border border-red-200 bg-red-50 text-red-700"
            }`}
          >
            <div id="validation-message" className="text-sm font-semibold">
              {validationResult
                ? "✅ เลขบัตรประชาชนถูกต้อง"
                : "❌ เลขบัตรประชาชนไม่ถูกต้อง"}
            </div>
            {validationResult && (
              <div id="validation-details" className="mt-1 text-xs">
                ผ่านการตรวจสอบ Check Digit Algorithm
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
