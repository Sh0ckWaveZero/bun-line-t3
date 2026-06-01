"use client";

import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Copy,
  Check,
  Shuffle,
  User,
  Building2,
  Star,
  CopyCheck,
  Users,
  UserRound,
} from "lucide-react";
import { generateThaiName } from "@/lib/data/thai-names";

type GenderOption = "any" | "male" | "female";

interface GeneratedName {
  firstName: string;
  surname: string;
  nickname: string;
}

const GENDER_OPTIONS: {
  value: GenderOption;
  label: string;
  icon: React.ReactNode;
}[] = [
  { value: "any", label: "ทุกเพศ", icon: <Users className="h-3.5 w-3.5" /> },
  { value: "male", label: "ชาย", icon: <User className="h-3.5 w-3.5" /> },
  {
    value: "female",
    label: "หญิง",
    icon: <UserRound className="h-3.5 w-3.5" />,
  },
];

export function ThaiNamesGeneratorPage() {
  const [count, setCount] = useState<number>(5);
  const [gender, setGender] = useState<GenderOption>("any");
  const [generatedNames, setGeneratedNames] = useState<GeneratedName[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleCopy = useCallback(async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1500);
    } catch {}
  }, []);

  const handleCopyAll = useCallback(async () => {
    if (generatedNames.length === 0) return;
    const text = generatedNames
      .map((n) => `${n.firstName} ${n.surname} (${n.nickname})`)
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 1500);
    } catch {}
  }, [generatedNames]);

  const handleGenerate = useCallback(() => {
    const names: GeneratedName[] = [];
    for (let i = 0; i < count; i++) {
      const g: "male" | "female" =
        gender === "any" ? (Math.random() < 0.5 ? "male" : "female") : gender;
      const result = generateThaiName({
        includeFirstName: true,
        includeSurname: true,
        includeNickname: true,
        gender: g,
      });
      names.push({
        firstName: result.firstName || "",
        surname: result.surname || "",
        nickname: result.nickname || "",
      });
    }
    setGeneratedNames(names);
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  }, [count, gender]);

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">สุ่มชื่อไทย</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            สุ่มชื่อจริง นามสกุล และชื่อเล่น สำหรับทดสอบระบบหรือข้อมูลตัวอย่าง
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-[300px_1fr]">
          <div className="space-y-6">
            <Card>
              <CardContent className="space-y-6 p-5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">จำนวน</Label>
                    <Badge
                      variant="secondary"
                      className="font-mono tabular-nums"
                    >
                      {count}
                    </Badge>
                  </div>
                  <Slider
                    value={[count]}
                    onValueChange={(v) => setCount(v[0] ?? 1)}
                    min={1}
                    max={20}
                    step={1}
                  />
                  <div className="text-muted-foreground flex justify-between text-xs">
                    <span>1</span>
                    <span>20</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">เพศ</Label>
                  <div className="bg-muted grid grid-cols-3 gap-1.5 rounded-md p-1">
                    {GENDER_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setGender(opt.value)}
                        className={`flex items-center justify-center gap-1.5 rounded-sm px-2 py-1.5 text-xs font-medium transition-colors ${
                          gender === opt.value
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {opt.icon}
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <Button onClick={handleGenerate} className="w-full" size="lg">
                  <Shuffle className="mr-2 h-4 w-4" />
                  สุ่มชื่อใหม่
                </Button>
              </CardContent>
            </Card>

            <div className="bg-card text-muted-foreground rounded-lg border p-4 text-sm">
              ฐานข้อมูล 22,000+ รายการจาก{" "}
              <a
                href="https://github.com/korkeatw/thai-names-corpus"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground decoration-muted-foreground/40 hover:decoration-foreground font-medium underline underline-offset-2"
              >
                Thai Names Corpus
              </a>{" "}
              (CC BY-SA 4.0)
            </div>
          </div>

          <div className="space-y-4" ref={resultsRef}>
            {generatedNames.length === 0 ? (
              <div className="flex min-h-[320px] items-center justify-center rounded-lg border border-dashed">
                <div className="text-muted-foreground text-center">
                  <Shuffle className="mx-auto mb-3 h-10 w-10 opacity-30" />
                  <p className="text-sm">
                    กดปุ่ม &quot;สุ่มชื่อใหม่&quot; เพื่อเริ่มต้น
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-muted-foreground text-sm">
                    สุ่มได้ {generatedNames.length} ชื่อ
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyAll}
                    className="h-8 gap-1.5 text-xs"
                  >
                    {copiedAll ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        คัดลอกแล้ว
                      </>
                    ) : (
                      <>
                        <CopyCheck className="h-3.5 w-3.5" />
                        คัดลอกทั้งหมด
                      </>
                    )}
                  </Button>
                </div>

                <div className="space-y-2">
                  {generatedNames.map((name, i) => {
                    const fullName = `${name.firstName} ${name.surname}`;
                    const nameKey = (field: string) => `${i}-${field}`;
                    return (
                      <div
                        key={i}
                        className="group bg-card hover:bg-accent/50 rounded-lg border p-3 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex min-w-0 items-baseline gap-2">
                            <span className="text-muted-foreground w-5 shrink-0 text-xs tabular-nums">
                              {i + 1}.
                            </span>
                            <span className="truncate font-medium">
                              {fullName}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleCopy(fullName, nameKey("full"))
                            }
                            className="h-7 w-7 shrink-0 p-0 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                          >
                            {copiedKey === nameKey("full") ? (
                              <Check className="text-primary h-3.5 w-3.5" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                        <div className="text-muted-foreground mt-1.5 flex items-center gap-3 pl-7 text-xs">
                          <NameChip
                            icon={<User className="h-3 w-3" />}
                            value={name.firstName}
                            isCopied={copiedKey === nameKey("first")}
                            onCopy={() =>
                              handleCopy(name.firstName, nameKey("first"))
                            }
                          />
                          <NameChip
                            icon={<Building2 className="h-3 w-3" />}
                            value={name.surname}
                            isCopied={copiedKey === nameKey("surname")}
                            onCopy={() =>
                              handleCopy(name.surname, nameKey("surname"))
                            }
                          />
                          <NameChip
                            icon={<Star className="h-3 w-3" />}
                            value={name.nickname}
                            isCopied={copiedKey === nameKey("nick")}
                            onCopy={() =>
                              handleCopy(name.nickname, nameKey("nick"))
                            }
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface NameChipProps {
  icon: React.ReactNode;
  value: string;
  isCopied: boolean;
  onCopy: () => void;
}

function NameChip({ icon, value, isCopied, onCopy }: NameChipProps) {
  return (
    <button
      onClick={onCopy}
      className="bg-background/60 hover:bg-accent inline-flex items-center gap-1 rounded border px-1.5 py-0.5 transition-colors"
      title={`คัดลอก${value}`}
    >
      {isCopied ? (
        <Check className="text-primary h-3 w-3" />
      ) : (
        <span className="text-muted-foreground">{icon}</span>
      )}
      <span>{value}</span>
    </button>
  );
}
