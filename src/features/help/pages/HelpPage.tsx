"use client";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useSafeHydration } from "@/hooks/useHydrationSafe";
import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";

interface CommandCategory {
  title: string;
  description: string;
  commands: Command[];
}

interface Command {
  name: string;
  aliases: string[];
  description: string;
  usage: string;
  examples: string[];
}

const COMMAND_CATEGORIES: CommandCategory[] = [
  {
    title: "การลงเวลาทำงาน",
    description: "คำสั่งสำหรับระบบลงเวลาเข้า-ออกงาน",
    commands: [
      {
        name: "work",
        aliases: ["งาน"],
        description: "เปิดเมนูลงชื่อเข้างาน/ตรวจสอบสถานะ",
        usage: "/work",
        examples: ["/work", "/งาน"],
      },
      {
        name: "checkin",
        aliases: ["เข้างาน"],
        description: "ลงชื่อเข้างานทันที",
        usage: "/checkin",
        examples: ["/checkin", "/เข้างาน"],
      },
      {
        name: "checkout",
        aliases: ["เลิกงาน", "ออกงาน"],
        description: "ลงชื่อออกงานทันที",
        usage: "/checkout",
        examples: ["/checkout", "/เลิกงาน", "/ออกงาน"],
      },
      {
        name: "status",
        aliases: ["สถานะ"],
        description: "ตรวจสอบสถานะการทำงานวันนี้",
        usage: "/status",
        examples: ["/status", "/สถานะ"],
      },
      {
        name: "report",
        aliases: ["รายงาน"],
        description: "ดูรายงานการทำงานประจำเดือน",
        usage: "/report",
        examples: ["/report", "/รายงาน"],
      },
      {
        name: "policy",
        aliases: ["นโยบาย", "กฎ", "rule"],
        description: "ดูนโยบายการทำงาน",
        usage: "/policy",
        examples: ["/policy", "/นโยบาย", "/กฎ"],
      },
      {
        name: "settings",
        aliases: ["ตั้งค่า", "การตั้งค่า"],
        description: "จัดการการตั้งค่าการแจ้งเตือน (เข้างาน, เลิกงาน, วันหยุด)",
        usage: "/settings [ตัวเลือก]",
        examples: [
          "/settings",
          "/ตั้งค่า",
          "/ตั้งค่า เข้างาน",
          "/ตั้งค่า เลิกงาน",
          "/ตั้งค่า วันหยุด",
          "/settings morning",
          "/settings finish",
          "/settings holiday",
        ],
      },
    ],
  },
  {
    title: "รายรับรายจ่าย",
    description: "คำสั่งสำหรับบันทึกและดูสรุปรายรับรายจ่ายส่วนตัว",
    commands: [
      {
        name: "จ่าย",
        aliases: ["exp", "e", "expense", "รายจ่าย"],
        description:
          "บันทึกรายจ่าย ระบุหมวดหมู่ได้ (ถ้าไม่ระบุจะใช้หมวด 'อื่นๆ' อัตโนมัติ)",
        usage: "/จ่าย [จำนวน] [หมวด?]",
        examples: [
          "/จ่าย 250 อาหาร",
          "/exp 1200 เดินทาง",
          "/e 50",
          "/expense add 800 ช้อปปิ้ง",
        ],
      },
      {
        name: "รับ",
        aliases: ["i", "income", "รายรับ"],
        description: "บันทึกรายรับ เช่น เงินเดือน โบนัส รายได้เสริม",
        usage: "/รับ [จำนวน] [หมวด?]",
        examples: [
          "/รับ 30000 เงินเดือน",
          "/i 5000 โบนัส",
          "/income 2000 freelance",
        ],
      },
      {
        name: "expense",
        aliases: ["เงิน"],
        description:
          "ดูสรุปรายรับรายจ่ายเดือนปัจจุบัน พร้อม top รายจ่ายตามหมวดหมู่",
        usage: "/expense [sum|list|help]",
        examples: [
          "/expense",
          "/expense sum",
          "/expense list",
          "/expense help",
        ],
      },
    ],
  },
  {
    title: "การลาป่วย/ลาพักผ่อน",
    description: "คำสั่งสำหรับจัดการการลางาน",
    commands: [
      {
        name: "leave",
        aliases: ["ลา"],
        description: "ส่งคำขอลาป่วยหรือลาพักผ่อน",
        usage: "/leave [ประเภท] [วันที่] [เหตุผล]",
        examples: [
          "/leave sick 2024-12-20 ป่วยไข้หวัด",
          "/ลา vacation 2024-12-25 ลาพักผ่อน",
        ],
      },
    ],
  },
  {
    title: "ข้อมูลคริปโตเคอเรนซี",
    description: "คำสั่งสำหรับดูราคาคริปโตเคอเรนซี",
    commands: [
      {
        name: "bitkub",
        aliases: ["bk"],
        description: "ดูราคาคริปโตจาก Bitkub",
        usage: "/bk [symbol]",
        examples: ["/bk btc", "/bitkub eth", "/bk btc eth"],
      },
      {
        name: "satang",
        aliases: ["st"],
        description: "ดูราคาคริปโตจาก Satang Pro",
        usage: "/st [symbol]",
        examples: ["/st btc", "/satang eth", "/st btc eth"],
      },
      {
        name: "bitazza",
        aliases: ["btz"],
        description: "ดูราคาคริปโตจาก Bitazza",
        usage: "/btz [symbol]",
        examples: ["/btz btc", "/bitazza eth", "/btz btc eth"],
      },
      {
        name: "binance",
        aliases: ["bn", "bnbusd"],
        description: "ดูราคาคริปโตจาก Binance",
        usage: "/bn [symbol] หรือ /bnbusd [symbol]",
        examples: ["/bn btc", "/binance eth", "/bnbusd sol"],
      },
      {
        name: "gateio",
        aliases: ["gate", "gt"],
        description: "ดูราคาคริปโตจาก Gate.io",
        usage: "/gate [symbol]",
        examples: ["/gate btc", "/gateio eth", "/gt sol"],
      },
      {
        name: "mexc",
        aliases: ["mx"],
        description: "ดูราคาคริปโตจาก MEXC",
        usage: "/mexc [symbol]",
        examples: ["/mexc btc", "/mx eth"],
      },
      {
        name: "cmc",
        aliases: ["coinmarketcap"],
        description: "ดูราคาและข้อมูลคริปโตจาก CoinMarketCap",
        usage: "/cmc [symbol]",
        examples: ["/cmc btc", "/coinmarketcap eth"],
      },
    ],
  },
  {
    title: "กราฟและชาร์ท",
    description: "คำสั่งสำหรับดูกราฟราคาคริปโตเคอเรนซี",
    commands: [
      {
        name: "chart",
        aliases: ["c", "กราฟ"],
        description: "แสดงกราฟราคาคริปโตเคอเรนซี 24 ชั่วโมง",
        usage: "/chart [เหรียญ] [ตลาด] หรือ /chart [ตลาด] [เหรียญ]",
        examples: [
          "/chart btc",
          "/chart btc binance",
          "/chart bn btc",
          "/chart bk eth",
          "/c bn btc",
          "/c bk sol",
          "/กราฟ btc",
          "/chart btc compare",
        ],
      },
    ],
  },
  {
    title: "ข้อมูลอื่นๆ",
    description: "คำสั่งสำหรับดูข้อมูลทั่วไป",
    commands: [
      {
        name: "gold",
        aliases: ["ทอง"],
        description: "ดูราคาทองคำล่าสุด",
        usage: "/gold",
        examples: ["/gold", "/ทอง"],
      },
      {
        name: "lotto",
        aliases: ["หวย"],
        description: "ตรวจผลสลากกินแบ่งรัฐบาล",
        usage: "/หวย [งวด]",
        examples: ["/หวย 16/04/2566", "/lotto 16/04/2566"],
      },
      {
        name: "gas",
        aliases: ["น้ำมัน"],
        description: "ดูราคาน้ำมันล่าสุด",
        usage: "/gas [ประเภท]",
        examples: ["/gas diesel", "/น้ำมัน เบนซิน"],
      },
      {
        name: "help",
        aliases: ["ช่วยเหลือ", "คำสั่ง", "commands"],
        description: "แสดงคำสั่งทั้งหมดและวิธีใช้งาน",
        usage: "/help",
        examples: ["/help", "/ช่วยเหลือ", "/คำสั่ง", "/commands"],
      },
    ],
  },
  {
    title: "เครื่องมือสำหรับนักพัฒนา",
    description: "คำสั่งสำหรับเครื่องมือช่วยเหลือนักพัฒนาและการทดสอบ",
    commands: [
      {
        name: "สุ่มเลขบัตร",
        aliases: ["สุ่มบัตรประชาชน", "เลขบัตรประชาชน", "บัตรประชาชน"],
        description: "สุ่มเลขบัตรประชาชนไทยที่ถูกต้องตาม Check Digit Algorithm",
        usage: "/สุ่มเลขบัตร [จำนวน]",
        examples: [
          "/สุ่มเลขบัตร",
          "/สุ่มบัตรประชาชน",
          "/สุ่มเลขบัตร 5",
          "/เลขบัตรประชาชน 3",
        ],
      },
      {
        name: "ตรวจสอบบัตร",
        aliases: ["เช็คบัตร"],
        description: "ตรวจสอบความถูกต้องของเลขบัตรประชาชนไทย",
        usage: "/ตรวจสอบบัตร [เลขบัตรประชาชน]",
        examples: ["/ตรวจสอบบัตร 1-2345-67890-12-1", "/เช็คบัตร 1234567890121"],
      },
    ],
  },
];

function matchSearch(text: string, term: string): boolean {
  return text.toLowerCase().includes(term.toLowerCase());
}

export function HelpPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const currentYear = useSafeHydration(2025, () => new Date().getFullYear());

  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return COMMAND_CATEGORIES;

    return COMMAND_CATEGORIES.map((category) => ({
      ...category,
      commands: category.commands.filter(
        (cmd) =>
          matchSearch(cmd.name, searchTerm) ||
          cmd.aliases.some((a) => matchSearch(a, searchTerm)) ||
          matchSearch(cmd.description, searchTerm) ||
          matchSearch(cmd.usage, searchTerm),
      ),
    })).filter((c) => c.commands.length > 0);
  }, [searchTerm]);

  const hasResults = filteredCategories.length > 0;
  const totalCommands = filteredCategories.reduce(
    (sum, c) => sum + c.commands.length,
    0,
  );

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-10">
          <h1 className="text-foreground text-[1.5rem] leading-tight font-semibold tracking-tight">
            คู่มือคำสั่ง LINE Bot
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            คำสั่งทั้งหมดที่ใช้ได้ในแชท LINE พิมพ์ตามนี้ได้เลย
          </p>

          <div className="relative mt-6">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="ค้นหาคำสั่ง..."
              className="pr-9 pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
                aria-label="ล้างการค้นหา"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {searchTerm && hasResults && (
            <p className="text-muted-foreground mt-3 text-xs">
              พบ {totalCommands} คำสั่ง
            </p>
          )}
        </header>

        <main>
          {!hasResults && searchTerm && (
            <div className="py-20 text-center">
              <p className="text-foreground text-sm font-medium">
                ไม่พบคำสั่ง "{searchTerm}"
              </p>
              <p className="text-muted-foreground mt-1 text-sm">
                ลองค้นหาด้วยคำอื่น หรือตรวจสอบการสะกด
              </p>
            </div>
          )}

          <div className="space-y-12">
            {filteredCategories.map((category) => (
              <section key={category.title}>
                <div className="mb-4">
                  <h2 className="text-foreground text-[1.125rem] font-semibold">
                    {category.title}
                  </h2>
                  <p className="text-muted-foreground mt-0.5 text-sm">
                    {category.description}
                  </p>
                </div>

                <div className="space-y-2">
                  {category.commands.map((command) => (
                    <details
                      key={command.name}
                      className="group border-border bg-card hover:bg-muted/40 rounded-lg border transition-colors"
                    >
                      <summary className="flex cursor-pointer items-center gap-3 px-4 py-3 text-sm leading-normal [&::-webkit-details-marker]:hidden [&::marker]:hidden">
                        <code className="bg-primary/10 text-primary shrink-0 rounded-md px-2 py-0.5 font-mono text-[0.8125rem] font-medium">
                          /{command.name}
                        </code>

                        <span className="text-foreground min-w-0 flex-1 truncate">
                          {command.description}
                        </span>

                        {command.aliases.length > 0 && (
                          <span className="hidden shrink-0 gap-1 sm:flex">
                            {command.aliases.slice(0, 2).map((alias) => (
                              <Badge
                                key={alias}
                                variant="outline"
                                className="text-muted-foreground text-[0.6875rem] font-normal"
                              >
                                /{alias}
                              </Badge>
                            ))}
                            {command.aliases.length > 2 && (
                              <Badge
                                variant="outline"
                                className="text-muted-foreground text-[0.6875rem] font-normal"
                              >
                                +{command.aliases.length - 2}
                              </Badge>
                            )}
                          </span>
                        )}

                        <svg
                          className="text-muted-foreground h-4 w-4 shrink-0 transition-transform group-open:rotate-180"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                          />
                        </svg>
                      </summary>

                      <div className="border-border border-t px-4 pt-3 pb-4">
                        <div className="space-y-3">
                          <div>
                            <p className="text-muted-foreground mb-1.5 text-xs font-medium tracking-wider uppercase">
                              การใช้งาน
                            </p>
                            <code className="bg-muted text-foreground rounded-md px-2 py-0.5 font-mono text-[0.8125rem]">
                              {command.usage}
                            </code>
                          </div>

                          <div>
                            <p className="text-muted-foreground mb-1.5 text-xs font-medium tracking-wider uppercase">
                              ตัวอย่าง
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {command.examples.map((example) => (
                                <code
                                  key={example}
                                  className="bg-muted text-foreground rounded-md px-2 py-0.5 font-mono text-[0.8125rem]"
                                >
                                  {example}
                                </code>
                              ))}
                            </div>
                          </div>

                          {command.aliases.length > 0 && (
                            <div className="sm:hidden">
                              <p className="text-muted-foreground mb-1.5 text-xs font-medium tracking-wider uppercase">
                                ชื่อเรียกอื่น
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {command.aliases.map((alias) => (
                                  <Badge
                                    key={alias}
                                    variant="outline"
                                    className="text-muted-foreground text-[0.6875rem] font-normal"
                                  >
                                    /{alias}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </details>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </main>

        <footer className="border-border mt-16 border-t pt-6 text-center">
          <p className="text-muted-foreground text-xs">
            &copy; {currentYear} Bun LINE T3
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            ใช้คำสั่งได้ทั้งภาษาไทยและอังกฤษ พิมพ์ในแชท LINE ได้เลย
          </p>
        </footer>
      </div>
    </div>
  );
}
