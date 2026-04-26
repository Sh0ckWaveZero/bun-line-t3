"use client";

import { useState } from "react";
import { useSafeHydration } from "@/hooks/useHydrationSafe";
import "@/styles/help.css";

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
        description:
          "จัดการการตั้งค่าการแจ้งเตือน (เข้างาน, เลิกงาน, วันหยุด)",
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
    title: "รายรับรายจ่าย",
    description: "คำสั่งสำหรับบันทึกและดูสรุปรายรับรายจ่ายส่วนตัว",
    commands: [
      {
        name: "จ่าย",
        aliases: ["exp", "e", "expense", "รายจ่าย"],
        description: "บันทึกรายจ่าย ระบุหมวดหมู่ได้ (ถ้าไม่ระบุจะใช้หมวด 'อื่นๆ' อัตโนมัติ)",
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
        description: "ดูสรุปรายรับรายจ่ายเดือนปัจจุบัน พร้อม top รายจ่ายตามหมวดหมู่",
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
    title: "เครื่องมือสำหรับนักพัฒนา",
    description: "คำสั่งสำหรับเครื่องมือช่วยเหลือนักพัฒนาและการทดสอบ",
    commands: [
      {
        name: "สุ่มเลขบัตร",
        aliases: ["สุ่มบัตรประชาชน", "เลขบัตรประชาชน", "บัตรประชาชน"],
        description:
          "สุ่มเลขบัตรประชาชนไทยที่ถูกต้องตาม Check Digit Algorithm",
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
        examples: [
          "/ตรวจสอบบัตร 1-2345-67890-12-1",
          "/เช็คบัตร 1234567890121",
        ],
      },
    ],
  },
];

export function HelpPage() {
  const [categories] = useState<CommandCategory[]>(COMMAND_CATEGORIES);
  const loading = false;
  const [searchTerm, setSearchTerm] = useState("");

  const currentYear = useSafeHydration(
    2025,
    () => new Date().getFullYear(),
  );

  const filteredCategories = categories
    .map((category) => {
      const filteredCommands = category.commands.filter(
        (cmd) =>
          cmd.name.includes(searchTerm.toLowerCase()) ||
          cmd.aliases.some((alias) =>
            alias.includes(searchTerm.toLowerCase()),
          ) ||
          cmd.description.toLowerCase().includes(searchTerm.toLowerCase()),
      );

      return {
        ...category,
        commands: filteredCommands,
      };
    })
    .filter((category) => category.commands.length > 0);

  return (
    <div className="prompt-text min-h-screen font-prompt">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <header className="mb-10 text-center">
          <h1 className="mb-4 font-prompt text-4xl font-bold leading-tight tracking-tight text-gray-900 dark:text-white">
            คำสั่งทั้งหมดของ LINE Bot
          </h1>
          <p className="mb-6 font-prompt text-lg font-normal leading-relaxed text-gray-700 dark:text-gray-300">
            รวมทุกคำสั่งที่ใช้ได้กับบอท LINE พร้อมคำอธิบายและตัวอย่าง
          </p>

          <div className="mx-auto max-w-xl">
            <input
              type="text"
              placeholder="ค้นหาคำสั่ง..."
              className="w-full rounded-lg border border-gray-300 bg-white p-3 font-prompt font-normal text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </header>

        <main>
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-indigo-500"></div>
            </div>
          ) : (
            <div className="space-y-16">
              {filteredCategories.map((category, idx) => (
                <section
                  key={idx}
                  className="overflow-hidden rounded-lg bg-white shadow-md dark:bg-gray-800"
                >
                  <div className="bg-indigo-600 p-6">
                    <h2 className="font-prompt text-2xl font-bold tracking-tight text-white">
                      {category.title}
                    </h2>
                    <p className="mt-1 font-prompt font-normal text-indigo-100 dark:text-indigo-200">
                      {category.description}
                    </p>
                  </div>

                  <div className="table-divider table-divide-light">
                    {category.commands.map((command, cmdIdx) => (
                      <div key={cmdIdx} className="p-6">
                        <div className="mb-3 flex flex-wrap gap-2">
                          <span className="rounded-full bg-indigo-100 px-3 py-1 font-prompt text-sm font-medium text-indigo-800">
                            /{command.name}
                          </span>
                          {command.aliases.map((alias, aliasIdx) => (
                            <span
                              key={aliasIdx}
                              className="rounded-full bg-gray-100 px-3 py-1 font-prompt text-sm font-normal text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                            >
                              /{alias}
                            </span>
                          ))}
                        </div>

                        <p className="mb-4 font-prompt font-normal text-gray-800 dark:text-gray-200">
                          {command.description}
                        </p>

                        <div className="mb-4">
                          <h4 className="mb-2 font-prompt text-sm font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                            การใช้งาน
                          </h4>
                          <code className="code-text rounded bg-gray-100 px-2 py-1 font-prompt font-medium text-gray-900 dark:bg-gray-700 dark:text-gray-200">
                            {command.usage}
                          </code>
                        </div>

                        <div>
                          <h4 className="mb-2 font-prompt text-sm font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                            ตัวอย่าง
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {command.examples.map((example, exIdx) => (
                              <code
                                key={exIdx}
                                className="code-text rounded bg-gray-100 px-2 py-1 font-prompt font-medium text-gray-900 dark:bg-gray-700 dark:text-gray-200"
                              >
                                {example}
                              </code>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}

          {!loading && filteredCategories.length === 0 && (
            <div className="py-16 text-center">
              <h3 className="font-prompt text-xl font-medium text-gray-800 dark:text-gray-200">
                ไม่พบคำสั่งที่ค้นหา
              </h3>
              <p className="mt-2 font-prompt font-normal text-gray-600 dark:text-gray-400">
                ลองค้นหาด้วยคำอื่น หรือตรวจสอบการสะกดอีกครั้ง
              </p>
            </div>
          )}
        </main>

        <footer className="mt-16 text-center font-prompt text-sm font-normal text-gray-600 dark:text-gray-400">
          <p>
            © {currentYear} Bun LINE T3. สามารถใช้คำสั่งทั้งภาษาไทยและอังกฤษได้
          </p>
        </footer>
      </div>
    </div>
  );
}
