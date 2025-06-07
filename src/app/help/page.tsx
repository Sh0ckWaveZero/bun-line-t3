"use client";

import { useEffect, useState } from 'react';
import Head from 'next/head';
import '~/styles/help.css';

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

export default function HelpPage() {
  const [categories, setCategories] = useState<CommandCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // In a real application, you might fetch this from an API endpoint
    // For now, we'll hardcode the commands data structure
    const commandsData: CommandCategory[] = [
      {
        title: "การลงเวลาทำงาน",
        description: "คำสั่งสำหรับระบบลงเวลาเข้า-ออกงาน",
        commands: [
          {
            name: "work",
            aliases: ["งาน", "เข้างาน", "checkin"],
            description: "เปิดเมนูลงชื่อเข้างาน",
            usage: "/work",
            examples: ["/work", "/งาน", "/เข้างาน", "/checkin"]
          },
          {
            name: "checkout",
            aliases: ["เลิกงาน", "ออกงาน"],
            description: "ลงชื่อออกงานทันที",
            usage: "/checkout",
            examples: ["/checkout", "/เลิกงาน", "/ออกงาน"]
          },
          {
            name: "status",
            aliases: ["สถานะ"],
            description: "ตรวจสอบสถานะการทำงานวันนี้",
            usage: "/status",
            examples: ["/status", "/สถานะ"]
          },
          {
            name: "report",
            aliases: ["รายงาน"],
            description: "ดูรายงานการทำงานประจำเดือน",
            usage: "/report",
            examples: ["/report", "/รายงาน"]
          },
          {
            name: "policy",
            aliases: ["นโยบาย", "กฎ", "rule"],
            description: "ดูนโยบายการทำงาน",
            usage: "/policy",
            examples: ["/policy", "/นโยบาย", "/กฎ", "/rule"]
          }
        ]
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
            examples: ["/bk btc", "/bitkub eth", "/bk btc eth"]
          },
          {
            name: "satang",
            aliases: ["st"],
            description: "ดูราคาคริปโตจาก Satang Pro",
            usage: "/st [symbol]",
            examples: ["/st btc", "/satang eth", "/st btc eth"]
          },
          {
            name: "bitazza",
            aliases: ["btz"],
            description: "ดูราคาคริปโตจาก Bitazza",
            usage: "/btz [symbol]",
            examples: ["/btz btc", "/bitazza eth", "/btz btc eth"]
          },
          {
            name: "binance",
            aliases: ["bn", "bnbusd"],
            description: "ดูราคาคริปโตจาก Binance",
            usage: "/bn [symbol] หรือ /bnbusd [symbol]",
            examples: ["/bn btc", "/binance eth", "/bnbusd sol"]
          },
          {
            name: "gateio",
            aliases: ["gate", "gt"],
            description: "ดูราคาคริปโตจาก Gate.io",
            usage: "/gate [symbol]",
            examples: ["/gate btc", "/gateio eth", "/gt sol"]
          },
          {
            name: "mexc",
            aliases: ["mx"],
            description: "ดูราคาคริปโตจาก MEXC",
            usage: "/mexc [symbol]",
            examples: ["/mexc btc", "/mx eth"]
          },
          {
            name: "cmc",
            aliases: ["coinmarketcap"],
            description: "ดูราคาและข้อมูลคริปโตจาก CoinMarketCap",
            usage: "/cmc [symbol]",
            examples: ["/cmc btc", "/coinmarketcap eth"]
          }
        ]
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
            examples: ["/gold", "/ทอง"]
          },
          {
            name: "lotto",
            aliases: ["หวย"],
            description: "ตรวจผลสลากกินแบ่งรัฐบาล",
            usage: "/หวย [งวด]",
            examples: ["/หวย 16/04/2566", "/lotto 16/04/2566"]
          },
          {
            name: "gas",
            aliases: ["น้ำมัน"],
            description: "ดูราคาน้ำมันล่าสุด",
            usage: "/gas [ประเภท]",
            examples: ["/gas diesel", "/น้ำมัน เบนซิน"]
          },
          {
            name: "help",
            aliases: ["ช่วยเหลือ", "คำสั่ง", "commands"],
            description: "แสดงคำสั่งทั้งหมดและวิธีใช้งาน",
            usage: "/help",
            examples: ["/help", "/ช่วยเหลือ", "/คำสั่ง", "/commands"]
          }
        ]
      }
    ];
    
    setCategories(commandsData);
    setLoading(false);
  }, []);

  const filteredCategories = categories.map(category => {
    const filteredCommands = category.commands.filter(cmd => 
      cmd.name.includes(searchTerm.toLowerCase()) || 
      cmd.aliases.some(alias => alias.includes(searchTerm.toLowerCase())) ||
      cmd.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return {
      ...category,
      commands: filteredCommands
    };
  }).filter(category => category.commands.length > 0);

  return (
    <div className="min-h-screen bg-gray-50 font-sans prompt-text">
      <Head>
        <title>LINE Bot คำสั่งทั้งหมด | Bun LINE T3</title>
        <meta name="description" content="รวมทุกคำสั่งของ LINE Bot พร้อมตัวอย่างการใช้งาน" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="max-w-6xl mx-auto py-8 px-4">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4 tracking-tight leading-tight">คำสั่งทั้งหมดของ LINE Bot</h1>
          <p className="text-lg text-gray-600 mb-6 font-light leading-relaxed">รวมทุกคำสั่งที่ใช้ได้กับบอท LINE พร้อมคำอธิบายและตัวอย่าง</p>
          
          <div className="max-w-xl mx-auto">
            <input
              type="text"
              placeholder="ค้นหาคำสั่ง..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-light"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </header>

        <main>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : (
            <div className="space-y-16">
              {filteredCategories.map((category, idx) => (
                <section key={idx} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="bg-indigo-600 p-6">
                    <h2 className="text-2xl font-bold text-white tracking-tight">{category.title}</h2>
                    <p className="text-indigo-100 mt-1 font-light">{category.description}</p>
                  </div>
                  
                  <div className="divide-y divide-gray-200">
                    {category.commands.map((command, cmdIdx) => (
                      <div key={cmdIdx} className="p-6">
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className="bg-indigo-100 text-indigo-800 font-medium px-3 py-1 rounded-full text-sm">/{command.name}</span>
                          {command.aliases.map((alias, aliasIdx) => (
                            <span key={aliasIdx} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-light">/{alias}</span>
                          ))}
                        </div>
                        
                        <p className="text-gray-700 mb-4 font-light">{command.description}</p>
                        
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2 tracking-wider">การใช้งาน</h4>
                          <code className="bg-gray-100 text-gray-800 px-2 py-1 rounded font-medium code-text">{command.usage}</code>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2 tracking-wider">ตัวอย่าง</h4>
                          <div className="flex flex-wrap gap-2">
                            {command.examples.map((example, exIdx) => (
                              <code key={exIdx} className="bg-gray-100 text-gray-800 px-2 py-1 rounded font-medium code-text">{example}</code>
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
            <div className="text-center py-16">
              <h3 className="text-xl font-medium text-gray-700">ไม่พบคำสั่งที่ค้นหา</h3>
              <p className="text-gray-500 mt-2 font-light">ลองค้นหาด้วยคำอื่น หรือตรวจสอบการสะกดอีกครั้ง</p>
            </div>
          )}
        </main>

        <footer className="mt-16 text-center text-gray-500 text-sm font-light">
          <p>© {new Date().getFullYear()} Bun LINE T3. สามารถใช้คำสั่งทั้งภาษาไทยและอังกฤษได้</p>
        </footer>
      </div>
    </div>
  );
}
