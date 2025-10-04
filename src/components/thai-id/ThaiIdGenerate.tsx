"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Copy,
  Check,
  Shuffle,
  Settings2,
  CreditCard,
  CheckCircle2,
  XCircle,
  Info,
} from "lucide-react";
import {
  generateFormattedThaiID,
  validateThaiID,
} from "@/lib/utils/thai-id-generator";

interface GeneratedID {
  raw: string;
  formatted: string;
}

interface IDFieldProps {
  value: string;
  isCopied: boolean;
  onCopy: () => void;
}

function IDField({ value, isCopied, onCopy }: IDFieldProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-md text-primary">
          <CreditCard className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs text-muted-foreground">เลขบัตรประชาชน</div>
          <div className="truncate font-mono font-medium">{value}</div>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onCopy}
        className="h-8 w-8 p-0"
      >
        {isCopied ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}

export default function ThaiIdGenerate() {
  const [count, setCount] = useState<number>(1);
  const [generatedIDs, setGeneratedIDs] = useState<GeneratedID[]>([]);
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  const [validationInput, setValidationInput] = useState<string>("");
  const [validationResult, setValidationResult] = useState<boolean | null>(
    null,
  );
  const [includeValidation, setIncludeValidation] = useState<boolean>(true);
  const firstResultRef = useRef<HTMLDivElement>(null);

  const handleGenerate = () => {
    const ids: GeneratedID[] = [];
    for (let i = 0; i < count; i++) {
      const formatted = generateFormattedThaiID();
      const raw = formatted.replace(/-/g, "");
      ids.push({ raw, formatted });
    }
    setGeneratedIDs(ids);

    // Scroll to first result after generating
    setTimeout(() => {
      firstResultRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  const handleCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStates((prev) => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setCopiedStates((prev) => ({ ...prev, [key]: false }));
      }, 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
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
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 13) {
      setValidationInput(value);
      setValidationResult(null);
    }
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            โปรแกรมสุ่มเลขบัตรประชาชนไทย
          </h1>
          <p className="text-muted-foreground">
            สุ่มเลขบัตรประชาชนไทยที่ถูกต้องตาม Check Digit Algorithm
            สำหรับทดสอบระบบหรือใช้เป็นข้อมูลตัวอย่าง
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[350px_1fr]">
          {/* Settings Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                ตั้งค่า
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Options */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">ตัวเลือก</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="validation"
                      checked={includeValidation}
                      onCheckedChange={(checked) =>
                        setIncludeValidation(!!checked)
                      }
                    />
                    <Label
                      htmlFor="validation"
                      className="cursor-pointer text-sm font-normal"
                    >
                      แสดงช่องตรวจสอบเลขบัตร
                    </Label>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Count Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">จำนวนเลขบัตร</Label>
                  <Badge variant="secondary">{count}</Badge>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={count}
                  onChange={(e) => setCount(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1</span>
                  <span>20</span>
                </div>
              </div>

              <Button onClick={handleGenerate} className="w-full" size="lg">
                <Shuffle className="mr-2 h-4 w-4" />
                สุ่มเลขบัตรใหม่
              </Button>

              {/* Validation Section - Conditional */}
              {includeValidation && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">
                      ตรวจสอบเลขบัตร
                    </Label>
                    <input
                      type="text"
                      value={validationInput}
                      onChange={handleInputChange}
                      placeholder="กรอกเลขบัตร 13 หลัก"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <Button
                      onClick={handleValidation}
                      disabled={
                        !validationInput.trim() || validationInput.length !== 13
                      }
                      className="w-full"
                      variant="secondary"
                      size="sm"
                    >
                      ตรวจสอบ
                    </Button>

                    {/* Validation Result */}
                    {validationResult !== null && (
                      <div
                        className={`rounded-lg border p-3 ${
                          validationResult
                            ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950"
                            : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {validationResult ? (
                            <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-600 dark:text-green-400" />
                          ) : (
                            <XCircle className="mt-0.5 h-4 w-4 text-red-600 dark:text-red-400" />
                          )}
                          <div className="flex-1">
                            <div
                              className={`text-sm font-semibold ${
                                validationResult
                                  ? "text-green-700 dark:text-green-400"
                                  : "text-red-700 dark:text-red-400"
                              }`}
                            >
                              {validationResult
                                ? "เลขบัตรถูกต้อง"
                                : "เลขบัตรไม่ถูกต้อง"}
                            </div>
                            {validationResult && (
                              <div className="text-xs text-green-600 dark:text-green-500">
                                ผ่านการตรวจสอบ Check Digit
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Results Panel */}
          <div className="space-y-4">
            {generatedIDs.length === 0 ? (
              <Card>
                <CardContent className="flex min-h-[400px] items-center justify-center p-8">
                  <div className="text-center text-muted-foreground">
                    <Shuffle className="mx-auto mb-4 h-12 w-12 opacity-50" />
                    <p>กดปุ่ม &quot;สุ่มเลขบัตรใหม่&quot; เพื่อเริ่มต้น</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {generatedIDs.map((id, index) => (
                  <Card key={index} ref={index === 0 ? firstResultRef : null}>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        เลขบัตรที่ {index + 1}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <IDField
                        value={id.formatted}
                        isCopied={copiedStates[`${index}-formatted`] || false}
                        onCopy={() => handleCopy(id.raw, `${index}-formatted`)}
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Features Section */}
        <div className="space-y-4 rounded-lg border bg-card p-6">
          <h2 className="text-xl font-semibold">คุณสมบัติ</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>สุ่มเลขบัตรประชาชนที่ถูกต้องตาม Check Digit Algorithm</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>คัดลอกเลขบัตรได้ด้วยปุ่มคลิกเดียว</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>ตรวจสอบความถูกต้องของเลขบัตรประชาชน</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>สุ่มได้สูงสุด 20 เลขบัตรพร้อมกัน</span>
            </li>
          </ul>
        </div>

        {/* Warning Section */}
        <div className="space-y-2 rounded-lg border border-amber-500/50 bg-amber-500/10 p-6">
          <h3 className="flex items-center gap-2 font-semibold text-amber-700 dark:text-amber-400">
            <Info className="h-5 w-5" />
            คำเตือนสำคัญ
          </h3>
          <p className="text-sm text-amber-700/80 dark:text-amber-400/80">
            เลขบัตรประชาชนที่สร้างขึ้นเป็นเพียงตัวอย่างสำหรับการทดสอบเท่านั้น
            ไม่ใช่เลขบัตรของบุคคลที่มีอยู่จริง
            ห้ามนำไปใช้ในการปลอมแปลงเอกสารหรือทำผิดกฎหมาย
          </p>
        </div>
      </div>
    </div>
  );
}
