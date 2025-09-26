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
    <div className="container mx-auto max-w-4xl p-6">
      <div className="mb-8 text-center">
        <h1 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">
          โปรแกรมสุ่มชื่อไทย (Thai Names Generator)
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          สุ่มชื่อจริง นามสกุล และชื่อเล่น คนไทย สำหรับช่วยคิดชื่อ ใช้เป็น mock
          data หรือไอเดียตั้งชื่อ
        </p>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Options Panel */}
        <Card>
          <CardHeader>
            <div className="rounded-lg bg-gray-200 px-4 py-3 text-center dark:bg-gray-700">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                ตั้งค่า
              </h2>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Gender Selection */}
            <div>
              <Label className="mb-3 block text-base font-medium">เพศ</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="male"
                    checked={options.gender.male}
                    onCheckedChange={(checked) =>
                      updateGender("male", !!checked)
                    }
                  />
                  <Label htmlFor="male" className="text-sm">
                    หญิง
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="female"
                    checked={options.gender.female}
                    onCheckedChange={(checked) =>
                      updateGender("female", !!checked)
                    }
                  />
                  <Label htmlFor="female" className="text-sm">
                    ชาย
                  </Label>
                </div>
              </div>
            </div>

            {/* Type Selection */}
            <div>
              <Label className="mb-3 block text-base font-medium">ประเภท</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="firstName"
                    checked={options.types.firstName}
                    onCheckedChange={(checked) =>
                      updateType("firstName", !!checked)
                    }
                  />
                  <Label htmlFor="firstName" className="text-sm">
                    ชื่อจริง
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="surname"
                    checked={options.types.surname}
                    onCheckedChange={(checked) =>
                      updateType("surname", !!checked)
                    }
                  />
                  <Label htmlFor="surname" className="text-sm">
                    นามสกุล
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="nickname"
                    checked={options.types.nickname}
                    onCheckedChange={(checked) =>
                      updateType("nickname", !!checked)
                    }
                  />
                  <Label htmlFor="nickname" className="text-sm">
                    ชื่อเล่น
                  </Label>
                </div>
              </div>
            </div>

            {/* Language Selection */}
            <div>
              <Label className="mb-3 block text-base font-medium">ภาษา</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="thai"
                    checked={options.languages.thai}
                    onCheckedChange={(checked) =>
                      updateLanguage("thai", !!checked)
                    }
                  />
                  <Label htmlFor="thai" className="text-sm">
                    ไทย
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="english"
                    checked={options.languages.english}
                    onCheckedChange={(checked) =>
                      updateLanguage("english", !!checked)
                    }
                  />
                  <Label htmlFor="english" className="text-sm">
                    English
                  </Label>
                </div>
              </div>
            </div>

            {/* Count Selection */}
            <div>
              <Label
                htmlFor="count"
                className="mb-3 block text-base font-medium"
              >
                จำนวนชื่อ
              </Label>
              <div className="flex items-center space-x-3">
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
                  className="w-20"
                />
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
                  className="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-gray-200 dark:bg-gray-700"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Panel */}
        <Card>
          <CardHeader>
            <div className="rounded-lg bg-gray-200 px-4 py-3 text-center dark:bg-gray-700">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                ชื่อ
              </h2>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-6 text-center">
              <Button
                onClick={handleGenerate}
                size="lg"
                className="rounded-lg bg-green-500 px-8 py-3 text-lg font-medium text-white hover:bg-green-600"
              >
                สุ่มชื่อใหม่
              </Button>
            </div>

            {generatedNames.length > 0 && (
              <div className="space-y-4">
                {generatedNames.map((name, index) => (
                  <div
                    key={index}
                    className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800"
                  >
                    {options.languages.thai && (
                      <div className="space-y-1">
                        {name.fullName && (
                          <div className="text-lg font-medium text-gray-900 dark:text-gray-100">
                            {name.fullName}
                          </div>
                        )}
                        {name.nickname && !name.fullName && (
                          <div className="text-lg font-medium text-gray-900 dark:text-gray-100">
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
                      <div className="mt-1 text-sm text-gray-500 dark:text-gray-500">
                        ชื่อเล่น: {name.nickname}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {generatedNames.length === 0 && (
              <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                กดปุ่ม &quot;สุ่มชื่อใหม่&quot; เพื่อเริ่มสร้างชื่อ
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
