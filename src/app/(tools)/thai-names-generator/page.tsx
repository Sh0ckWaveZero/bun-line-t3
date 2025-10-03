"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { Copy, Check, Shuffle } from "lucide-react";
import { generateThaiName } from "@/lib/data/thai-names";

interface GeneratedName {
  firstName: string;
  surname: string;
  nickname: string;
}

export default function ThaiNamesGeneratorPage() {
  const [name, setName] = useState<GeneratedName | null>(null);
  const [copied, setCopied] = useState<string>("");

  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(""), 2000);
  };

  const handleGenerate = () => {
    const gender = Math.random() < 0.5 ? "male" : "female";
    const generated = generateThaiName({
      includeFirstName: true,
      includeSurname: true,
      includeNickname: true,
      gender,
    });

    setName({
      firstName: generated.firstName || "",
      surname: generated.surname || "",
      nickname: generated.nickname || "",
    });
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">สุ่มชื่อไทย</h1>
          <p className="text-muted-foreground">
            สุ่มชื่อจริง นามสกุล และชื่อเล่นคนไทย
          </p>
        </div>

        {/* Generate Button */}
        <Button onClick={handleGenerate} className="w-full" size="lg">
          <Shuffle className="mr-2 h-4 w-4" />
          สุ่มชื่อใหม่
        </Button>

        {/* Result */}
        {name && (
          <Card>
            <CardContent className="space-y-4 p-6">
              {/* First Name */}
              <div className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3">
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground">ชื่อจริง</div>
                  <div className="text-lg font-medium">{name.firstName}</div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(name.firstName, "firstName")}
                  className="h-8 w-8 p-0"
                >
                  {copied === "firstName" ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Surname */}
              <div className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3">
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground">นามสกุล</div>
                  <div className="text-lg font-medium">{name.surname}</div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(name.surname, "surname")}
                  className="h-8 w-8 p-0"
                >
                  {copied === "surname" ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Nickname */}
              <div className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3">
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground">ชื่อเล่น</div>
                  <div className="text-lg font-medium">{name.nickname}</div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(name.nickname, "nickname")}
                  className="h-8 w-8 p-0"
                >
                  {copied === "nickname" ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info */}
        <p className="text-center text-xs text-muted-foreground">
          ข้อมูลจาก{" "}
          <a
            href="https://github.com/korkeatw/thai-names-corpus"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            Thai Names Corpus
          </a>
        </p>
      </div>
    </div>
  );
}
