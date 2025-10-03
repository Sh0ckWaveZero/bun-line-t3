"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import {
  Copy,
  Check,
  Shuffle,
  Settings2,
  User,
  Building2,
  Star,
  FileText,
} from "lucide-react";

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
  count: number;
}

interface GeneratedName {
  firstName?: string;
  surname?: string;
  nickname?: string;
  fullName?: string;
}

interface NameFieldProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  isCopied: boolean;
  onCopy: () => void;
}

function NameField({ label, value, icon, isCopied, onCopy }: NameFieldProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-md text-primary">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="truncate font-medium">{value}</div>
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
    count: 5,
  });

  const [generatedNames, setGeneratedNames] = useState<GeneratedName[]>([]);
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

  const generateRandomName = (): GeneratedName => {
    const isRandomMale = Math.random() < 0.5;
    const shouldGenerateMale =
      options.gender.male && (isRandomMale || !options.gender.female);
    const selectedGender = shouldGenerateMale ? "male" : "female";

    const generatedName = generateThaiName({
      includeFirstName: options.types.firstName,
      includeSurname: options.types.surname,
      includeNickname: options.types.nickname,
      gender: selectedGender,
    });

    return {
      firstName: generatedName.firstName,
      surname: generatedName.surname,
      nickname: generatedName.nickname,
      fullName: generatedName.fullName,
    };
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

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            โปรแกรมสุ่มชื่อไทย
          </h1>
          <p className="text-muted-foreground">
            สุ่มชื่อจริง นามสกุล และชื่อเล่นคนไทย
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
              {/* Gender Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">เพศ</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="female"
                      checked={options.gender.female}
                      onCheckedChange={(checked) =>
                        updateGender("female", !!checked)
                      }
                    />
                    <Label
                      htmlFor="female"
                      className="cursor-pointer text-sm font-normal"
                    >
                      หญิง
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="male"
                      checked={options.gender.male}
                      onCheckedChange={(checked) =>
                        updateGender("male", !!checked)
                      }
                    />
                    <Label
                      htmlFor="male"
                      className="cursor-pointer text-sm font-normal"
                    >
                      ชาย
                    </Label>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Type Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">ประเภทชื่อ</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="firstName"
                      checked={options.types.firstName}
                      onCheckedChange={(checked) =>
                        updateType("firstName", !!checked)
                      }
                    />
                    <Label
                      htmlFor="firstName"
                      className="cursor-pointer text-sm font-normal"
                    >
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
                    <Label
                      htmlFor="surname"
                      className="cursor-pointer text-sm font-normal"
                    >
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
                    <Label
                      htmlFor="nickname"
                      className="cursor-pointer text-sm font-normal"
                    >
                      ชื่อเล่น
                    </Label>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Count Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">จำนวนชื่อ</Label>
                  <Badge variant="secondary">{options.count}</Badge>
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
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1</span>
                  <span>20</span>
                </div>
              </div>

              <Button onClick={handleGenerate} className="w-full" size="lg">
                <Shuffle className="mr-2 h-4 w-4" />
                สุ่มชื่อใหม่
              </Button>
            </CardContent>
          </Card>

          {/* Results Panel */}
          <div className="space-y-4">
            {generatedNames.length === 0 ? (
              <Card>
                <CardContent className="flex min-h-[400px] items-center justify-center p-8">
                  <div className="text-center text-muted-foreground">
                    <Shuffle className="mx-auto mb-4 h-12 w-12 opacity-50" />
                    <p>กดปุ่ม &quot;สุ่มชื่อใหม่&quot; เพื่อเริ่มต้น</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {generatedNames.map((name, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        ชื่อที่ {index + 1}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {name.firstName && (
                        <NameField
                          label="ชื่อจริง"
                          value={name.firstName}
                          icon={<User className="h-4 w-4" />}
                          isCopied={copiedStates[`${index}-firstName`] || false}
                          onCopy={() =>
                            handleCopy(name.firstName!, `${index}-firstName`)
                          }
                        />
                      )}
                      {name.surname && (
                        <NameField
                          label="นามสกุล"
                          value={name.surname}
                          icon={<Building2 className="h-4 w-4" />}
                          isCopied={copiedStates[`${index}-surname`] || false}
                          onCopy={() =>
                            handleCopy(name.surname!, `${index}-surname`)
                          }
                        />
                      )}
                      {name.nickname && (
                        <NameField
                          label="ชื่อเล่น"
                          value={name.nickname}
                          icon={<Star className="h-4 w-4" />}
                          isCopied={copiedStates[`${index}-nickname`] || false}
                          onCopy={() =>
                            handleCopy(name.nickname!, `${index}-nickname`)
                          }
                        />
                      )}
                      {name.fullName && (
                        <NameField
                          label="ชื่อเต็ม"
                          value={name.fullName}
                          icon={<FileText className="h-4 w-4" />}
                          isCopied={copiedStates[`${index}-fullName`] || false}
                          onCopy={() =>
                            handleCopy(name.fullName!, `${index}-fullName`)
                          }
                        />
                      )}
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
              <span>ฐานข้อมูล 22,000+ รายการ จาก Thai Names Corpus</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>คัดลอกชื่อแต่ละส่วนได้ด้วยปุ่มคลิกเดียว</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>เลือกเพศและประเภทชื่อได้ตามต้องการ</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>สุ่มได้สูงสุด 20 ชื่อพร้อมกัน</span>
            </li>
          </ul>
        </div>

        {/* Data Source */}
        <div className="space-y-2 rounded-lg border border-blue-500/50 bg-blue-500/10 p-6">
          <h3 className="font-semibold text-blue-700 dark:text-blue-400">
            แหล่งข้อมูล
          </h3>
          <p className="text-sm text-blue-700/80 dark:text-blue-400/80">
            ข้อมูลชื่อและนามสกุลมาจาก{" "}
            <a
              href="https://github.com/korkeatw/thai-names-corpus"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline hover:text-blue-600 dark:hover:text-blue-300"
            >
              Thai Names Corpus
            </a>{" "}
            โดย Korkeat Wannapat (CC BY-SA 4.0 License)
          </p>
        </div>
      </div>
    </div>
  );
}
