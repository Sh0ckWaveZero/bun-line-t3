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
    // Comprehensive romanization mapping for Thai characters
    const romanizationMap: { [key: string]: string } = {
      // Consonants
      ก: "k",
      ข: "kh",
      ฃ: "kh",
      ค: "kh",
      ฅ: "kh",
      ฆ: "kh",
      ง: "ng",
      จ: "j",
      ฉ: "ch",
      ช: "ch",
      ซ: "s",
      ฌ: "ch",
      ญ: "y",
      ด: "d",
      ต: "t",
      ถ: "th",
      ท: "th",
      ธ: "th",
      น: "n",
      บ: "b",
      ป: "p",
      ผ: "ph",
      ฝ: "f",
      พ: "ph",
      ฟ: "f",
      ภ: "ph",
      ม: "m",
      ย: "y",
      ร: "r",
      ฤ: "rue",
      ล: "l",
      ฦ: "lue",
      ว: "w",
      ศ: "s",
      ษ: "s",
      ส: "s",
      ห: "h",
      ฬ: "l",
      อ: "",
      ฮ: "h",

      // Vowels
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
      ฤ: "rue",
      ฤๅ: "rue",
      ฦ: "lue",
      ฦๅ: "lue",

      // Special combinations
      เา: "ao",
      เีย: "ia",
      เือ: "uea",
      เาะ: "o",
      แอ: "ae",
      โอ: "o",
      เอา: "ao",
      "ิว": "iw",
      าว: "aw",
      อว: "uaw",

      // Tone marks (remove them)
      "่": "",
      "้": "",
      "๊": "",
      "๋": "",

      // Special marks
      "์": "",
      "ํ": "",
      "็": "",
      "ฺ": "",
      ฯ: "",
      ๆ: "",

      // Numbers
      "๐": "0",
      "๑": "1",
      "๒": "2",
      "๓": "3",
      "๔": "4",
      "๕": "5",
      "๖": "6",
      "๗": "7",
      "๘": "8",
      "๙": "9",

      // Punctuation
      ฯ: "...",
      ๆ: "",
      ฯลฯ: "etc",
    };

    // Process the string character by character
    const result = thaiName
      .split("")
      .map((char) => {
        // If character has romanization, use it; if it's already Latin, keep it; otherwise remove
        if (romanizationMap.hasOwnProperty(char)) {
          return romanizationMap[char];
        } else if (/[a-zA-Z0-9\s\-']/.test(char)) {
          // Keep Latin characters, numbers, spaces, hyphens, and apostrophes
          return char;
        } else {
          // Remove unknown Thai characters or symbols
          return "";
        }
      })
      .join("")
      .replace(/\s+/g, " ") // Clean up multiple spaces
      .replace(/^\s+|\s+$/g, "") // Trim
      .replace(/^$/, "Unknown"); // Handle empty results

    // Capitalize each word properly
    return result
      .split(" ")
      .map((word) =>
        word.length > 0
          ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          : "",
      )
      .filter((word) => word.length > 0) // Remove empty words
      .join(" ");
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
      {/* Header - Enhanced Design */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-6 max-w-4xl">
          <div className="rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 p-8 text-white shadow-xl">
            <div className="mb-4 text-4xl">🎲</div>
            <h1 className="mb-2 text-3xl font-bold sm:text-4xl">
              โปรแกรมสุ่มชื่อไทย
            </h1>
            <h2 className="mb-4 text-lg font-medium text-indigo-100 sm:text-xl">
              Thai Names Generator
            </h2>
            <p className="mx-auto max-w-2xl text-sm text-indigo-50 sm:text-base">
              สุ่มชื่อจริง นามสกุล และชื่อเล่น คนไทย สำหรับช่วยคิดชื่อ ใช้เป็น
              mock data หรือไอเดียตั้งชื่อ
            </p>
          </div>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
          ฐานข้อมูล 22,000+ รายการ จาก{" "}
          <a
            href="https://github.com/korkeatw/thai-names-corpus"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
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
            <CardContent className="animate-in slide-in-from-top-2 space-y-6 p-6 duration-200">
              {/* Gender Selection - Improved Spacing */}
              <div className="space-y-3">
                <Label className="block text-base font-semibold text-gray-800 dark:text-gray-200">
                  เพศ
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center space-x-3 rounded-lg border-2 border-gray-200 bg-white p-4 transition-all hover:border-blue-300 hover:shadow-sm dark:border-gray-600 dark:bg-gray-800 dark:hover:border-blue-500">
                    <Checkbox
                      id="male"
                      checked={options.gender.male}
                      onCheckedChange={(checked) =>
                        updateGender("male", !!checked)
                      }
                      className="h-5 w-5"
                    />
                    <Label
                      htmlFor="male"
                      className="cursor-pointer font-medium text-gray-700 dark:text-gray-300"
                    >
                      หญิง
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 rounded-lg border-2 border-gray-200 bg-white p-4 transition-all hover:border-blue-300 hover:shadow-sm dark:border-gray-600 dark:bg-gray-800 dark:hover:border-blue-500">
                    <Checkbox
                      id="female"
                      checked={options.gender.female}
                      onCheckedChange={(checked) =>
                        updateGender("female", !!checked)
                      }
                      className="h-5 w-5"
                    />
                    <Label
                      htmlFor="female"
                      className="cursor-pointer font-medium text-gray-700 dark:text-gray-300"
                    >
                      ชาย
                    </Label>
                  </div>
                </div>
              </div>

              {/* Type Selection - Better Layout */}
              <div className="space-y-3">
                <Label className="block text-base font-semibold text-gray-800 dark:text-gray-200">
                  ประเภท
                </Label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 rounded-lg border-2 border-gray-200 bg-white p-4 transition-all hover:border-green-300 hover:shadow-sm dark:border-gray-600 dark:bg-gray-800 dark:hover:border-green-500">
                    <Checkbox
                      id="firstName"
                      checked={options.types.firstName}
                      onCheckedChange={(checked) =>
                        updateType("firstName", !!checked)
                      }
                      className="h-5 w-5"
                    />
                    <Label
                      htmlFor="firstName"
                      className="cursor-pointer font-medium text-gray-700 dark:text-gray-300"
                    >
                      ชื่อจริง
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 rounded-lg border-2 border-gray-200 bg-white p-4 transition-all hover:border-green-300 hover:shadow-sm dark:border-gray-600 dark:bg-gray-800 dark:hover:border-green-500">
                    <Checkbox
                      id="surname"
                      checked={options.types.surname}
                      onCheckedChange={(checked) =>
                        updateType("surname", !!checked)
                      }
                      className="h-5 w-5"
                    />
                    <Label
                      htmlFor="surname"
                      className="cursor-pointer font-medium text-gray-700 dark:text-gray-300"
                    >
                      นามสกุล
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 rounded-lg border-2 border-gray-200 bg-white p-4 transition-all hover:border-green-300 hover:shadow-sm dark:border-gray-600 dark:bg-gray-800 dark:hover:border-green-500">
                    <Checkbox
                      id="nickname"
                      checked={options.types.nickname}
                      onCheckedChange={(checked) =>
                        updateType("nickname", !!checked)
                      }
                      className="h-5 w-5"
                    />
                    <Label
                      htmlFor="nickname"
                      className="cursor-pointer font-medium text-gray-700 dark:text-gray-300"
                    >
                      ชื่อเล่น
                    </Label>
                  </div>
                </div>
              </div>

              {/* Language Selection - Improved */}
              <div className="space-y-3">
                <Label className="block text-base font-semibold text-gray-800 dark:text-gray-200">
                  ภาษา
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center space-x-3 rounded-lg border-2 border-gray-200 bg-white p-4 transition-all hover:border-purple-300 hover:shadow-sm dark:border-gray-600 dark:bg-gray-800 dark:hover:border-purple-500">
                    <Checkbox
                      id="thai"
                      checked={options.languages.thai}
                      onCheckedChange={(checked) =>
                        updateLanguage("thai", !!checked)
                      }
                      className="h-5 w-5"
                    />
                    <Label
                      htmlFor="thai"
                      className="cursor-pointer font-medium text-gray-700 dark:text-gray-300"
                    >
                      🇹🇭 ไทย
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 rounded-lg border-2 border-gray-200 bg-white p-4 transition-all hover:border-purple-300 hover:shadow-sm dark:border-gray-600 dark:bg-gray-800 dark:hover:border-purple-500">
                    <Checkbox
                      id="english"
                      checked={options.languages.english}
                      onCheckedChange={(checked) =>
                        updateLanguage("english", !!checked)
                      }
                      className="h-5 w-5"
                    />
                    <Label
                      htmlFor="english"
                      className="cursor-pointer font-medium text-gray-700 dark:text-gray-300"
                    >
                      🇺🇸 English
                    </Label>
                  </div>
                </div>
              </div>

              {/* Count Selection - Enhanced Design */}
              <div className="space-y-4">
                <Label
                  htmlFor="count"
                  className="block text-base font-semibold text-gray-800 dark:text-gray-200"
                >
                  จำนวนชื่อ
                </Label>
                <div className="rounded-lg border-2 border-gray-200 bg-gradient-to-r from-orange-50 to-red-50 p-5 dark:border-gray-600 dark:from-gray-800 dark:to-gray-700">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        น้อย
                      </span>
                      <div className="flex flex-1 items-center justify-center">
                        <span className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-2 text-xl font-bold text-white shadow-lg">
                          {options.count}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        เยอะ
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
                      className="h-4 w-full cursor-pointer appearance-none rounded-lg bg-gray-300 dark:bg-gray-600
                             [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:cursor-pointer
                             [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full
                             [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-orange-500
                             [&::-webkit-slider-thumb]:to-red-500 [&::-webkit-slider-thumb]:shadow-lg"
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
                        className="w-24 border-2 border-orange-300 text-center focus:border-orange-500"
                      />
                    </div>
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
              <div className="space-y-3">
                {generatedNames.map((name, index) => (
                  <div
                    key={index}
                    className="group rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 p-4 shadow-md transition-all duration-200 hover:from-blue-100 hover:to-indigo-100 hover:shadow-lg dark:from-gray-800 dark:to-gray-700 dark:hover:from-gray-700 dark:hover:to-gray-600"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {options.languages.thai && (
                          <div className="space-y-1">
                            {name.fullName && (
                              <div className="text-lg font-bold text-gray-900 dark:text-gray-100 sm:text-xl">
                                {name.fullName}
                              </div>
                            )}
                            {name.nickname && !name.fullName && (
                              <div className="text-lg font-bold text-gray-900 dark:text-gray-100 sm:text-xl">
                                {name.nickname}
                              </div>
                            )}
                          </div>
                        )}
                        {options.languages.english && name.englishName && (
                          <div className="mt-2 text-sm font-medium text-indigo-600 dark:text-indigo-400">
                            {name.englishName}
                          </div>
                        )}
                        {name.nickname && name.fullName && (
                          <div className="mt-2 flex items-center gap-2">
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/20 dark:text-green-400">
                              ชื่อเล่น
                            </span>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {name.nickname}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4 flex flex-col items-center gap-1">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          #{index + 1}
                        </span>
                        <button
                          onClick={() => {
                            const textToCopy = options.languages.thai
                              ? name.fullName || name.nickname || ""
                              : name.englishName || "";
                            navigator.clipboard.writeText(textToCopy);
                          }}
                          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white hover:text-gray-600 dark:hover:bg-gray-600 dark:hover:text-gray-200"
                          title="Copy name"
                        >
                          📋
                        </button>
                      </div>
                    </div>
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
