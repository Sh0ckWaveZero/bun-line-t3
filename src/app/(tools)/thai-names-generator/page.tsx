"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { generateThaiName } from "@/lib/data/thai-names";

interface GenerationOptions {
  gender: {
    male: boolean;
    female: boolean;
  };
  types: {
    firstName: boolean;
    surname: boolean;
    nickname: boolean;
  };
  languages: {
    thai: boolean;
    english: boolean;
  };
  count: number;
}

interface GeneratedName {
  firstName?: string;
  surname?: string;
  nickname?: string;
  fullName?: string;
  englishName?: string;
}

export default function ThaiNamesGeneratorPage() {
  const [options, setOptions] = useState<GenerationOptions>({
    gender: {
      male: true,
      female: true,
    },
    types: {
      firstName: true,
      surname: true,
      nickname: true,
    },
    languages: {
      thai: true,
      english: true,
    },
    count: 1,
  });

  const [generatedNames, setGeneratedNames] = useState<GeneratedName[]>([]);
  const [showSettings, setShowSettings] = useState(false);

  const generateRandomName = (): GeneratedName => {
    const selectedGender = determineGender();

    // Use the new helper function to generate the name
    const generatedName = generateThaiName({
      includeFirstName: options.types.firstName,
      includeSurname: options.types.surname,
      includeNickname: options.types.nickname,
      gender: selectedGender,
    });

    const result: GeneratedName = {
      firstName: generatedName.firstName,
      surname: generatedName.surname,
      nickname: generatedName.nickname,
      fullName: generatedName.fullName,
    };

    // Generate English equivalent (simple romanization for demo)
    if (options.languages.english) {
      result.englishName = romanizeThaiName(
        result.fullName || result.nickname || "",
      );
    }

    return result;
  };

  const determineGender = (): "male" | "female" => {
    const isRandomMale = Math.random() < 0.5;
    const shouldGenerateMale =
      options.gender.male && (isRandomMale || !options.gender.female);
    return shouldGenerateMale ? "male" : "female";
  };

  const romanizeThaiName = (thaiName: string): string => {
    // Simple romanization mapping (basic implementation)
    const romanizationMap: { [key: string]: string } = {
      ก: "K",
      ข: "Kh",
      ค: "Kh",
      ฆ: "Kh",
      ง: "Ng",
      จ: "J",
      ฉ: "Ch",
      ช: "Ch",
      ซ: "S",
      ฌ: "Ch",
      ญ: "Y",
      ด: "D",
      ต: "T",
      ถ: "Th",
      ท: "Th",
      ธ: "Th",
      น: "N",
      บ: "B",
      ป: "P",
      ผ: "Ph",
      ฝ: "F",
      พ: "Ph",
      ฟ: "F",
      ภ: "Ph",
      ม: "M",
      ย: "Y",
      ร: "R",
      ล: "L",
      ว: "W",
      ศ: "S",
      ษ: "S",
      ส: "S",
      ห: "H",
      อ: "",
      ฮ: "H",
      "ั": "a",
      า: "a",
      "ิ": "i",
      "ี": "i",
      "ึ": "ue",
      "ื": "ue",
      "ุ": "u",
      "ู": "u",
      เ: "e",
      แ: "ae",
      โ: "o",
      ใ: "ai",
      ไ: "ai",
      "่": "",
      "้": "",
      "๊": "",
      "๋": "",
      "์": "",
      "ํ": "",
    };

    return thaiName
      .split("")
      .map((char) => romanizationMap[char] || char)
      .join("")
      .replace(/\s+/g, " ")
      .trim();
  };

  const handleGenerate = () => {
    const names: GeneratedName[] = [];
    for (let i = 0; i < options.count; i++) {
      names.push(generateRandomName());
    }
    setGeneratedNames(names);
  };

  const updateGender = (gender: "male" | "female", checked: boolean) => {
    setOptions((prev) => ({
      ...prev,
      gender: {
        ...prev.gender,
        [gender]: checked,
      },
    }));
  };

  const updateType = (
    type: "firstName" | "surname" | "nickname",
    checked: boolean,
  ) => {
    setOptions((prev) => ({
      ...prev,
      types: {
        ...prev.types,
        [type]: checked,
      },
    }));
  };

  const updateLanguage = (language: "thai" | "english", checked: boolean) => {
    setOptions((prev) => ({
      ...prev,
      languages: {
        ...prev.languages,
        [language]: checked,
      },
    }));
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-6">
      {/* Header - Mobile Optimized */}
      <div className="mb-6 text-center sm:mb-8">
        <h1 className="mb-3 text-2xl font-bold text-gray-900 dark:text-white sm:mb-4 sm:text-3xl">
          โปรแกรมสุ่มชื่อไทย
        </h1>
        <h2 className="mb-3 text-lg text-gray-700 dark:text-gray-300 sm:text-xl">
          Thai Names Generator
        </h2>
        <p className="px-2 text-sm text-gray-600 dark:text-gray-300 sm:text-base">
          สุ่มชื่อจริง นามสกุล และชื่อเล่น คนไทย สำหรับช่วยคิดชื่อ ใช้เป็น mock
          data หรือไอเดียตั้งชื่อ
        </p>
        <p className="mt-2 px-2 text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
          ฐานข้อมูลชื่อ 22,000+ รายการ จาก{" "}
          <a
            href="https://github.com/korkeatw/thai-names-corpus"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-blue-600 dark:hover:text-blue-400"
          >
            Thai Names Corpus
          </a>{" "}
          (CC BY-SA 4.0)
        </p>
      </div>

      {/* Main Content - Mobile First Layout */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-2">
        {/* Options Panel - Collapsible */}
        <Card>
          <CardHeader className="pb-3">
            <div className="rounded-lg bg-gray-200 px-3 py-2 text-center dark:bg-gray-700 sm:px-4 sm:py-3">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="flex w-full items-center justify-center gap-2 text-lg font-semibold text-gray-800 dark:text-gray-200 sm:text-xl"
              >
                <span>ตั้งค่า</span>
                <span
                  className={`transform transition-transform duration-200 ${showSettings ? "rotate-180" : ""}`}
                >
                  ▼
                </span>
              </button>
            </div>
          </CardHeader>
          {showSettings && (
            <CardContent className="animate-in slide-in-from-top-2 space-y-4 duration-200">
              {/* Gender Selection - Compact */}
              <div>
                <Label className="mb-2 block text-sm font-medium">เพศ</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2 rounded border border-gray-200 p-2 dark:border-gray-700">
                    <Checkbox
                      id="male"
                      checked={options.gender.male}
                      onCheckedChange={(checked) =>
                        updateGender("male", !!checked)
                      }
                      className="h-4 w-4"
                    />
                    <Label htmlFor="male" className="cursor-pointer text-sm">
                      หญิง
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 rounded border border-gray-200 p-2 dark:border-gray-700">
                    <Checkbox
                      id="female"
                      checked={options.gender.female}
                      onCheckedChange={(checked) =>
                        updateGender("female", !!checked)
                      }
                      className="h-4 w-4"
                    />
                    <Label htmlFor="female" className="cursor-pointer text-sm">
                      ชาย
                    </Label>
                  </div>
                </div>
              </div>

              {/* Type Selection - Mobile Optimized */}
              <div>
                <Label className="mb-2 block text-sm font-medium">ประเภท</Label>
                <div className="grid grid-cols-1 gap-1.5">
                  <div className="flex items-center space-x-2 rounded border border-gray-200 p-2 dark:border-gray-700">
                    <Checkbox
                      id="firstName"
                      checked={options.types.firstName}
                      onCheckedChange={(checked) =>
                        updateType("firstName", !!checked)
                      }
                      className="h-4 w-4"
                    />
                    <Label
                      htmlFor="firstName"
                      className="cursor-pointer text-sm"
                    >
                      ชื่อจริง
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 rounded border border-gray-200 p-2 dark:border-gray-700">
                    <Checkbox
                      id="surname"
                      checked={options.types.surname}
                      onCheckedChange={(checked) =>
                        updateType("surname", !!checked)
                      }
                      className="h-4 w-4"
                    />
                    <Label htmlFor="surname" className="cursor-pointer text-sm">
                      นามสกุล
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 rounded border border-gray-200 p-2 dark:border-gray-700">
                    <Checkbox
                      id="nickname"
                      checked={options.types.nickname}
                      onCheckedChange={(checked) =>
                        updateType("nickname", !!checked)
                      }
                      className="h-4 w-4"
                    />
                    <Label
                      htmlFor="nickname"
                      className="cursor-pointer text-sm"
                    >
                      ชื่อเล่น
                    </Label>
                  </div>
                </div>
              </div>

              {/* Language Selection - Compact */}
              <div>
                <Label className="mb-2 block text-sm font-medium">ภาษา</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2 rounded border border-gray-200 p-2 dark:border-gray-700">
                    <Checkbox
                      id="thai"
                      checked={options.languages.thai}
                      onCheckedChange={(checked) =>
                        updateLanguage("thai", !!checked)
                      }
                      className="h-4 w-4"
                    />
                    <Label htmlFor="thai" className="cursor-pointer text-sm">
                      ไทย
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 rounded border border-gray-200 p-2 dark:border-gray-700">
                    <Checkbox
                      id="english"
                      checked={options.languages.english}
                      onCheckedChange={(checked) =>
                        updateLanguage("english", !!checked)
                      }
                      className="h-4 w-4"
                    />
                    <Label htmlFor="english" className="cursor-pointer text-sm">
                      English
                    </Label>
                  </div>
                </div>
              </div>

              {/* Count Selection - Mobile Optimized */}
              <div>
                <Label
                  htmlFor="count"
                  className="mb-2 block text-sm font-medium sm:mb-3 sm:text-base"
                >
                  จำนวนชื่อ
                </Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      1
                    </span>
                    <div className="mx-3 flex flex-1 items-center justify-center">
                      <span className="rounded-full bg-blue-100 px-4 py-2 text-lg font-bold text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {options.count}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      20
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={options.count}
                    onChange={(e) =>
                      setOptions((prev) => ({
                        ...prev,
                        count: parseInt(e.target.value),
                      }))
                    }
                    className="h-3 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 dark:bg-gray-700
                           [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:cursor-pointer
                           [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
                  />
                  <div className="flex justify-center sm:hidden">
                    <Input
                      id="count"
                      type="number"
                      min="1"
                      max="20"
                      value={options.count}
                      onChange={(e) =>
                        setOptions((prev) => ({
                          ...prev,
                          count: parseInt(e.target.value) || 1,
                        }))
                      }
                      className="w-20 text-center"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Results Panel - Mobile Optimized */}
        <Card>
          <CardHeader className="pb-3">
            <div className="rounded-lg bg-gray-200 px-3 py-2 text-center dark:bg-gray-700 sm:px-4 sm:py-3">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 sm:text-xl">
                ชื่อ
              </h2>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 text-center sm:mb-6">
              <Button
                onClick={handleGenerate}
                size="lg"
                className="w-full rounded-lg bg-green-500 px-6 py-4 text-base font-medium text-white hover:bg-green-600 sm:w-auto sm:px-8 sm:py-3 sm:text-lg"
              >
                สุ่มชื่อใหม่
              </Button>
            </div>

            {generatedNames.length > 0 && (
              <div className="space-y-3 sm:space-y-4">
                {generatedNames.map((name, index) => (
                  <div
                    key={index}
                    className="rounded-lg bg-gray-50 p-3 shadow-sm dark:bg-gray-800 sm:p-4"
                  >
                    {options.languages.thai && (
                      <div className="space-y-1">
                        {name.fullName && (
                          <div className="text-base font-medium text-gray-900 dark:text-gray-100 sm:text-lg">
                            {name.fullName}
                          </div>
                        )}
                        {name.nickname && !name.fullName && (
                          <div className="text-base font-medium text-gray-900 dark:text-gray-100 sm:text-lg">
                            {name.nickname}
                          </div>
                        )}
                      </div>
                    )}
                    {options.languages.english && name.englishName && (
                      <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        {name.englishName}
                      </div>
                    )}
                    {name.nickname && name.fullName && (
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-500 sm:text-sm">
                        ชื่อเล่น: {name.nickname}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {generatedNames.length === 0 && (
              <div className="rounded-lg bg-gray-50 px-4 py-8 text-center text-gray-500 dark:bg-gray-800 dark:text-gray-400 sm:py-12">
                <div className="mb-3 text-4xl sm:text-6xl">🎲</div>
                <p className="text-sm sm:text-base">
                  กดปุ่ม &quot;สุ่มชื่อใหม่&quot; เพื่อเริ่มสร้างชื่อ
                </p>
                <p className="mt-2 text-xs text-gray-400 dark:text-gray-500 sm:text-sm">
                  ฐานข้อมูล 22,000+ ชื่อรอคุณอยู่!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
