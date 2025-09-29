"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

import { generateThaiName } from "@/lib/data/thai-names";

// Constants สำหรับการแสดงชื่อ
const NAME_FIELD_TYPES = {
  firstName: {
    label: "ชื่อจริง",
    bgColor:
      "bg-gradient-to-r from-emerald-50! to-teal-50! dark:from-emerald-900!40 dark:to-teal-900!40",
    borderColor: "border-emerald-300! dark:border-emerald-600!",
    buttonBg:
      "bg-gradient-to-r from-emerald-600! to-teal-600! hover:from-emerald-700! hover:to-teal-700! shadow-md hover:shadow-lg transition-all duration-200",
    icon: "👤",
  },
  surname: {
    label: "นามสกุล",
    bgColor:
      "bg-gradient-to-r from-blue-50! to-indigo-50! dark:from-blue-900!40 dark:to-indigo-900!40",
    borderColor: "border-blue-300! dark:border-blue-600!",
    buttonBg:
      "bg-gradient-to-r from-blue-600! to-indigo-600! hover:from-blue-700! hover:to-indigo-700! shadow-md hover:shadow-lg transition-all duration-200",
    icon: "🏠",
  },
  nickname: {
    label: "ชื่อเล่น",
    bgColor:
      "bg-gradient-to-r from-purple-50! to-pink-50! dark:from-purple-900!40 dark:to-pink-900!40",
    borderColor: "border-purple-300! dark:border-purple-600!",
    buttonBg:
      "bg-gradient-to-r from-purple-600! to-pink-600! hover:from-purple-700! hover:to-pink-700! shadow-md hover:shadow-lg transition-all duration-200",
    icon: "⭐",
  },
  fullName: {
    label: "ชื่อเต็ม",
    bgColor:
      "bg-gradient-to-r from-amber-50! to-orange-50! dark:from-amber-900!40 dark:to-orange-900!40",
    borderColor: "border-amber-300! dark:border-amber-600!",
    buttonBg:
      "bg-gradient-to-r from-amber-600! to-orange-600! hover:from-amber-700! hover:to-orange-700! shadow-md hover:shadow-lg transition-all duration-200",
    icon: "📝",
  },
  englishName: {
    label: "🇺🇸 English",
    bgColor:
      "bg-gradient-to-r from-slate-50! to-gray-50! dark:from-slate-900!40 dark:to-gray-900!40",
    borderColor: "border-slate-300! dark:border-slate-600!",
    buttonBg:
      "bg-gradient-to-r from-slate-600! to-gray-600! hover:from-slate-700! hover:to-gray-700! shadow-md hover:shadow-lg transition-all duration-200",
    icon: "🌍",
  },
} as const;

// Common styles
const COMMON_STYLES = {
  container:
    "flex items-center gap-3 p-4 sm:p-5 rounded-xl border-2 hover:scale-[1.01] transition-all duration-300 backdrop-blur-sm shadow-sm hover:shadow-md",
  label:
    "inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-bold text-white! min-w-[80px] flex-shrink-0 shadow-lg",
  text: "flex-1 text-base sm:text-lg font-bold text-gray-900! dark:text-gray-50! min-w-0 px-2",
  button:
    "rounded-lg px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-bold whitespace-nowrap flex-shrink-0 text-white! transform hover:scale-105 active:scale-95",
} as const;

// Settings panel styles
const SETTINGS_STYLES = {
  cardHeader:
    "rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-3 text-center shadow-lg sm:px-6 sm:py-4",
  button:
    "flex w-full items-center justify-center gap-3 text-lg font-bold text-white sm:text-xl hover:scale-[1.02] transition-transform duration-200",
  cardContent:
    "animate-in slide-in-from-top-2 space-y-8 p-6 sm:p-8 duration-300",
  label: "block text-lg font-bold text-gray-800 dark:text-gray-100 mb-3",
  checkboxContainer:
    "flex items-center space-x-3 rounded-xl border-2 border-gray-200 bg-white p-4 transition-all hover:border-indigo-400 hover:shadow-lg hover:scale-[1.02] dark:border-gray-600 dark:bg-gray-800 dark:hover:border-indigo-500",
  checkboxLabel:
    "cursor-pointer font-semibold text-gray-700 dark:text-gray-300",
} as const;

// Component สำหรับแสดงชื่อแต่ละประเภท
interface NameFieldProps {
  type: keyof typeof NAME_FIELD_TYPES;
  value: string;
  index: number;
  name: any;
  copiedStates: Record<string, boolean>;
  handleCopy: (text: string, key: string) => void;
  getCopyKey: (index: number, type: string, name: any) => string;
}

function NameField({
  type,
  value,
  index,
  name,
  copiedStates,
  handleCopy,
  getCopyKey,
}: NameFieldProps) {
  const fieldConfig = NAME_FIELD_TYPES[type];
  const copyKey = getCopyKey(index, type, name);
  const isCopied = copiedStates[copyKey];

  return (
    <div
      id={`field-${type}-${index}`}
      className={`${COMMON_STYLES.container} ${fieldConfig.bgColor} ${fieldConfig.borderColor || ""} group/field`}
    >
      <span className={`${COMMON_STYLES.label} ${fieldConfig.buttonBg}`}>
        <span className="text-base">{fieldConfig.icon}</span>
        <span>{fieldConfig.label}</span>
      </span>
      <div
        className={`${COMMON_STYLES.text} group-hover/field:text-gray-900! dark:group-hover/field:text-gray-50! transition-colors duration-200`}
      >
        {value}
      </div>
      <button
        id={`copy-${type}-${index}`}
        onClick={() => handleCopy(value, copyKey)}
        className={`${COMMON_STYLES.button} ${fieldConfig.buttonBg} group/btn`}
        title={`คัดลอก${fieldConfig.label}`}
      >
        <span className="mr-1 text-sm">{isCopied ? "✅" : "📋"}</span>
        <span className="hidden sm:inline">
          {isCopied ? "คัดลอกแล้ว" : "คัดลอก"}
        </span>
        <span className="sm:hidden">{isCopied ? "แล้ว" : "copy"}</span>
      </button>
    </div>
  );
}

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
      english: false,
    },
    count: 1,
  });

  const [generatedNames, setGeneratedNames] = useState<GeneratedName[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>(
    {},
  );

  const generateRandomName = (): GeneratedName => {
    const selectedGender = determineGender();

    // Use the actual helper function to generate the name
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

    return result;
  };

  const determineGender = (): "male" | "female" => {
    const isRandomMale = Math.random() < 0.5;
    const shouldGenerateMale =
      options.gender.male && (isRandomMale || !options.gender.female);
    return shouldGenerateMale ? "male" : "female";
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

  const getCopyKey = (index: number, type: string, name: GeneratedName) => {
    return (
      index +
      "-" +
      type +
      "-" +
      (name.firstName || "") +
      "-" +
      (name.surname || "") +
      "-" +
      (name.nickname || "")
    );
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
    <div
      id="main-container"
      className="container mx-auto max-w-6xl px-4 py-8 sm:py-12"
    >
      {/* Enhanced spacing */}
      {/* Header - Enhanced Design */}
      <div id="header-section" className="mb-8 text-center">
        <div id="header-wrapper" className="mx-auto mb-6 max-w-4xl">
          <div
            id="header-card"
            className="from-violet-600! via-purple-600! to-fuchsia-600! dark:from-violet-600! dark:via-purple-600! dark:to-fuchsia-600! text-white! relative overflow-hidden rounded-3xl bg-gradient-to-br p-8 shadow-2xl"
          >
            {/* Background pattern */}
            <div
              id="backgroundPattern"
              className="from-violet-500!20 to-fuchsia-500!20 dark:from-violet-500!20 dark:to-fuchsia-500!20 absolute inset-0 bg-gradient-to-br via-transparent dark:via-transparent"
            ></div>
            <div
              id="decoration-top"
              className="bg-white!10 dark:bg-white!10 absolute -right-4 -top-4 h-24 w-24 rounded-full blur-xl"
            ></div>
            <div
              id="decoration-bottom"
              className="bg-white!5 dark:bg-white!5 absolute -bottom-4 -left-4 h-32 w-32 rounded-full blur-2xl"
            ></div>

            <div id="header-content" className="relative z-10">
              <div id="dice-container" className="mb-6 flex justify-center">
                <div
                  id="dice-wrapper"
                  className="bg-white!20 dark:bg-white!20 rounded-full p-4 backdrop-blur-sm"
                >
                  <span id="dice-icon" className="text-5xl">
                    🎲
                  </span>
                </div>
              </div>
              <h1
                id="main-title"
                className="from-white! via-pink-100! to-violet-100! mb-3 bg-gradient-to-r bg-clip-text text-4xl font-black text-transparent sm:text-5xl"
              >
                โปรแกรมสุ่มชื่อไทย
              </h1>
              <h2
                id="subtitle"
                className="text-violet-100! dark:text-violet-100! mb-6 text-xl font-semibold sm:text-2xl"
              >
                🇹🇭 Thai Names Generator 🇹🇭
              </h2>
              <p
                id="description"
                className="text-violet-50! dark:text-violet-50! mx-auto max-w-2xl text-base leading-relaxed sm:text-lg"
              >
                ✨ สุ่มชื่อจริง นามสกุล และชื่อเล่น คนไทย
                <br />
                🎯 สำหรับช่วยคิดชื่อ ใช้เป็น mock data หรือไอเดียตั้งชื่อ
              </p>
            </div>
          </div>
        </div>
        <p
          id="data-source"
          className="text-xs text-gray-500 dark:text-gray-400 sm:text-sm"
        >
          ฐานข้อมูล 22,000+ รายการ จาก{" "}
          <a
            id="source-link"
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
      <div
        id="main-content"
        className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-2"
      >
        {/* Options Panel - Collapsible */}
        <Card id="settings-card">
          <CardHeader id="settings-header" className="pb-3">
            <div
              id="settings-card-header"
              className={SETTINGS_STYLES.cardHeader}
            >
              <button
                id="settings-toggle"
                onClick={() => setShowSettings(!showSettings)}
                className={SETTINGS_STYLES.button}
              >
                <span>ตั้งค่า</span>
                <span className="transform transition-transform duration-200">
                  ▼
                </span>
              </button>
            </div>
          </CardHeader>
          {showSettings && (
            <CardContent
              id="settings-content"
              className={SETTINGS_STYLES.cardContent}
            >
              {/* Gender Selection */}
              <div id="gender-section" className="space-y-3">
                <Label id="gender-label" className={SETTINGS_STYLES.label}>
                  เพศ
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className={SETTINGS_STYLES.checkboxContainer}>
                    <Checkbox
                      id="female"
                      checked={options.gender.female}
                      onCheckedChange={(checked) =>
                        updateGender("female", !!checked)
                      }
                      className="h-5 w-5"
                    />
                    <Label
                      className={SETTINGS_STYLES.checkboxLabel}
                      htmlFor="female"
                    >
                      หญิง
                    </Label>
                  </div>
                  <div className={SETTINGS_STYLES.checkboxContainer}>
                    <Checkbox
                      id="male"
                      checked={options.gender.male}
                      onCheckedChange={(checked) =>
                        updateGender("male", !!checked)
                      }
                      className="h-5 w-5"
                    />
                    <Label
                      className={SETTINGS_STYLES.checkboxLabel}
                      htmlFor="male"
                    >
                      ชาย
                    </Label>
                  </div>
                </div>
              </div>

              {/* Type Selection */}
              <div className="space-y-3">
                <Label className={SETTINGS_STYLES.label}>ประเภท</Label>
                <div className="space-y-3">
                  <div
                    className={SETTINGS_STYLES.checkboxContainer
                      .replace("hover:border-blue", "hover:border-green")
                      .replace(
                        "dark:hover:border-blue",
                        "dark:hover:border-green",
                      )}
                  >
                    <Checkbox
                      id="firstName"
                      checked={options.types.firstName}
                      onCheckedChange={(checked) =>
                        updateType("firstName", !!checked)
                      }
                      className="h-5 w-5"
                    />
                    <Label
                      className={SETTINGS_STYLES.checkboxLabel}
                      htmlFor="firstName"
                    >
                      ชื่อจริง
                    </Label>
                  </div>
                  <div
                    className={SETTINGS_STYLES.checkboxContainer
                      .replace("hover:border-blue", "hover:border-green")
                      .replace(
                        "dark:hover:border-blue",
                        "dark:hover:border-green",
                      )}
                  >
                    <Checkbox
                      id="surname"
                      checked={options.types.surname}
                      onCheckedChange={(checked) =>
                        updateType("surname", !!checked)
                      }
                      className="h-5 w-5"
                    />
                    <Label
                      className={SETTINGS_STYLES.checkboxLabel}
                      htmlFor="surname"
                    >
                      นามสกุล
                    </Label>
                  </div>
                  <div
                    className={SETTINGS_STYLES.checkboxContainer
                      .replace("hover:border-blue", "hover:border-green")
                      .replace(
                        "dark:hover:border-blue",
                        "dark:hover:border-green",
                      )}
                  >
                    <Checkbox
                      id="nickname"
                      checked={options.types.nickname}
                      onCheckedChange={(checked) =>
                        updateType("nickname", !!checked)
                      }
                      className="h-5 w-5"
                    />
                    <Label
                      className={SETTINGS_STYLES.checkboxLabel}
                      htmlFor="nickname"
                    >
                      ชื่อเล่น
                    </Label>
                  </div>
                </div>
              </div>

              {/* Language Selection */}
              <div className="space-y-3">
                <Label className={SETTINGS_STYLES.label}>ภาษา</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    className={SETTINGS_STYLES.checkboxContainer
                      .replace("hover:border-blue", "hover:border-purple")
                      .replace(
                        "dark:hover:border-blue",
                        "dark:hover:border-purple",
                      )}
                  >
                    <Checkbox
                      id="thai"
                      checked={options.languages.thai}
                      onCheckedChange={(checked) =>
                        updateLanguage("thai", !!checked)
                      }
                      className="h-5 w-5"
                    />
                    <Label
                      className={SETTINGS_STYLES.checkboxLabel}
                      htmlFor="thai"
                    >
                      🇹🇭 ไทย
                    </Label>
                  </div>
                  <div
                    className={SETTINGS_STYLES.checkboxContainer
                      .replace("hover:border-blue", "hover:border-purple")
                      .replace(
                        "dark:hover:border-blue",
                        "dark:hover:border-purple",
                      )}
                  >
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
                      className="text-gray-700! dark:text-gray-300! cursor-pointer font-medium"
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
                  className="text-gray-800! dark:text-gray-200! block text-base font-semibold"
                >
                  จำนวนชื่อ
                </Label>
                <div className="dark:border-gray-600! rounded-lg border-2 border-gray-200 bg-gradient-to-r from-orange-50 to-red-50 p-5 dark:from-gray-800 dark:to-gray-700">
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
                      id="count-slider"
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
                      className="h-4 w-full cursor-pointer appearance-none rounded-lg bg-gray-300 dark:bg-gray-700
                             [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:cursor-pointer
                             [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full
                             [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-orange-500
                             [&::-webkit-slider-thumb]:to-red-500 [&::-webkit-slider-thumb]:shadow-lg"
                    />
                    <div className="flex justify-center sm:hidden">
                      <Input
                        id="count-input"
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
        <Card id="results-card">
          <CardHeader id="results-header" className="pb-3">
            <div
              id="results-card-header"
              className={SETTINGS_STYLES.cardHeader}
            >
              <h2
                id="results-title"
                className="text-gray-800! dark:text-gray-200! text-lg font-semibold sm:text-xl"
              >
                ชื่อ
              </h2>
            </div>
          </CardHeader>
          <CardContent id="results-content">
            <div className="mb-6 text-center sm:mb-8">
              <Button
                id="generate-names-button"
                onClick={handleGenerate}
                size="lg"
                className="from-green-500! to-emerald-600! hover:text-gray-800! dark:hover:text-gray-200! hover:from-green-600!   hover:to-emerald-700! w-full transform rounded-2xl bg-gradient-to-r px-8 py-5 text-lg font-bold text-gray-700 shadow-xl  transition-all duration-300 hover:scale-105 hover:shadow-2xl dark:text-gray-100 sm:w-auto sm:px-12 sm:py-4 sm:text-xl"
              >
                <span className="mr-2">🎲</span>
                <span>สุ่มชื่อใหม่</span>
                <span className="ml-2">✨</span>
              </Button>
            </div>

            {generatedNames.length > 0 && (
              <div id="names-list" className="space-y-4">
                {generatedNames.map((name, index) => (
                  <div
                    key={index}
                    id={`name-result-${index}`}
                    className="group rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-6 shadow-xl transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl dark:border-gray-700 dark:from-gray-800 dark:to-gray-900"
                  >
                    <div id={`name-fields-${index}`} className="space-y-3">
                      {options.languages.thai && (
                        <>
                          {name.firstName && (
                            <NameField
                              type="firstName"
                              value={name.firstName}
                              index={index}
                              name={name}
                              copiedStates={copiedStates}
                              handleCopy={handleCopy}
                              getCopyKey={getCopyKey}
                            />
                          )}

                          {name.surname && (
                            <NameField
                              type="surname"
                              value={name.surname}
                              index={index}
                              name={name}
                              copiedStates={copiedStates}
                              handleCopy={handleCopy}
                              getCopyKey={getCopyKey}
                            />
                          )}

                          {name.nickname && (
                            <NameField
                              type="nickname"
                              value={name.nickname}
                              index={index}
                              name={name}
                              copiedStates={copiedStates}
                              handleCopy={handleCopy}
                              getCopyKey={getCopyKey}
                            />
                          )}

                          {name.fullName && (
                            <NameField
                              type="fullName"
                              value={name.fullName}
                              index={index}
                              name={name}
                              copiedStates={copiedStates}
                              handleCopy={handleCopy}
                              getCopyKey={getCopyKey}
                            />
                          )}
                        </>
                      )}

                      {options.languages.english && name.englishName && (
                        <NameField
                          type="englishName"
                          value={name.englishName}
                          index={index}
                          name={name}
                          copiedStates={copiedStates}
                          handleCopy={handleCopy}
                          getCopyKey={getCopyKey}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
