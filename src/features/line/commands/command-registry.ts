/**
 * LINE Command Registry
 *
 * Centralized registry of all available LINE bot commands.
 * Used by AI to understand and route natural language requests to appropriate handlers.
 */

export interface CommandDefinition {
  /** Command name/identifier */
  command: string;
  /** Alternative command names */
  aliases: string[];
  /** Human-readable description in Thai */
  descriptionTH: string;
  /** Human-readable description in English */
  descriptionEN: string;
  /** Keywords that might indicate this command */
  keywords: string[];
  /** Parameters this command accepts */
  parameters?: {
    name: string;
    type: "string" | "number" | "date" | "optional";
    description: string;
  }[];
  /** Example usage */
  examples: string[];
  /** Category for grouping */
  category: "crypto" | "work" | "info" | "utility" | "health" | "settings";
}

export const LINE_COMMANDS: CommandDefinition[] = [
  // ============================================================================
  // Cryptocurrency Commands
  // ============================================================================
  {
    command: "bitkub",
    aliases: ["bk"],
    descriptionTH: "ดูราคาเหรียญคริปโตจากตลาด Bitkub",
    descriptionEN: "Check cryptocurrency prices from Bitkub exchange",
    keywords: [
      "bitkub",
      "bk",
      "ราคาเหรียญ",
      "คริปโต",
      "crypto",
      "bitcoin",
      "btc",
      "eth",
      "ethereum",
    ],
    parameters: [
      {
        name: "coin",
        type: "optional",
        description: "Coin symbol (e.g., BTC, ETH)",
      },
    ],
    examples: ["/bk", "/bitkub btc", "ราคา bitcoin ใน bitkub"],
    category: "crypto",
  },
  {
    command: "binance",
    aliases: ["bn", "bnbusd"],
    descriptionTH: "ดูราคาเหรียญคริปโตจากตลาด Binance",
    descriptionEN: "Check cryptocurrency prices from Binance exchange",
    keywords: ["binance", "bn", "ราคาเหรียญ", "คริปโต", "crypto"],
    parameters: [
      {
        name: "coin",
        type: "optional",
        description: "Coin symbol (e.g., BTC, ETH)",
      },
    ],
    examples: ["/bn", "/binance btc", "ราคา ethereum ใน binance"],
    category: "crypto",
  },
  {
    command: "satang",
    aliases: ["st"],
    descriptionTH: "ดูราคาเหรียญคริปโตจากตลาด Satang",
    descriptionEN: "Check cryptocurrency prices from Satang exchange",
    keywords: ["satang", "st", "ราคาเหรียญ", "คริปโต"],
    parameters: [
      {
        name: "coin",
        type: "optional",
        description: "Coin symbol (e.g., BTC, ETH)",
      },
    ],
    examples: ["/st", "/satang btc", "ราคาใน satang"],
    category: "crypto",
  },
  {
    command: "coinmarketcap",
    aliases: ["cmc"],
    descriptionTH: "ดูราคาเหรียญคริปโตจาก CoinMarketCap",
    descriptionEN: "Check cryptocurrency prices from CoinMarketCap",
    keywords: ["coinmarketcap", "cmc", "ราคาเหรียญ", "ราคาโลก"],
    parameters: [
      {
        name: "coin",
        type: "optional",
        description: "Coin symbol (e.g., BTC, ETH)",
      },
    ],
    examples: ["/cmc", "/cmc btc", "ราคาโลก bitcoin"],
    category: "crypto",
  },
  {
    command: "chart",
    aliases: ["กราฟ", "c"],
    descriptionTH: "สร้างกราฟราคาเหรียญคริปโต",
    descriptionEN: "Generate cryptocurrency price chart",
    keywords: ["chart", "กราฟ", "กราฟราคา", "price chart"],
    parameters: [
      { name: "exchange", type: "optional", description: "Exchange (bn, bk)" },
      { name: "coin", type: "string", description: "Coin symbol" },
    ],
    examples: ["/chart btc", "/c bn btc", "กราฟ bitcoin"],
    category: "crypto",
  },

  // ============================================================================
  // Work Attendance Commands
  // ============================================================================
  {
    command: "checkin",
    aliases: ["เข้างาน"],
    descriptionTH: "บันทึกเวลาเข้างาน",
    descriptionEN: "Check-in to work",
    keywords: ["checkin", "เข้างาน", "มาทำงาน", "check in", "เช็คชื่อเข้า"],
    examples: ["/checkin", "/เข้างาน", "เช็คชื่อเข้างาน"],
    category: "work",
  },
  {
    command: "checkout",
    aliases: ["เลิกงาน", "ออกงาน"],
    descriptionTH: "บันทึกเวลาออกงาน",
    descriptionEN: "Check-out from work",
    keywords: ["checkout", "เลิกงาน", "ออกงาน", "check out", "เช็คเอาท์"],
    examples: ["/checkout", "/เลิกงาน", "เช็คเอาท์"],
    category: "work",
  },
  {
    command: "work",
    aliases: ["งาน"],
    descriptionTH: "ดูข้อมูลการทำงานของวันนี้",
    descriptionEN: "View today's work attendance",
    keywords: ["work", "งาน", "ข้อมูลงาน", "การทำงาน", "วันนี้"],
    examples: ["/work", "/งาน", "ข้อมูลงานวันนี้"],
    category: "work",
  },
  {
    command: "status",
    aliases: ["สถานะ"],
    descriptionTH: "ดูสถานะการทำงานปัจจุบัน",
    descriptionEN: "Check current work status",
    keywords: ["status", "สถานะ", "สถานะงาน"],
    examples: ["/status", "/สถานะ", "ดูสถานะ"],
    category: "work",
  },
  {
    command: "report",
    aliases: ["รายงาน"],
    descriptionTH: "ดูรายงานการทำงานรายเดือน",
    descriptionEN: "View monthly work report",
    keywords: ["report", "รายงาน", "รายงานงาน", "สรุปงาน"],
    examples: ["/report", "/รายงาน", "ดูรายงาน"],
    category: "work",
  },
  {
    command: "leave",
    aliases: ["ลา"],
    descriptionTH: "ยื่นใบลา",
    descriptionEN: "Submit leave request",
    keywords: ["leave", "ลา", "ลางาน", "ขอลา"],
    parameters: [
      {
        name: "startDate",
        type: "date",
        description: "Start date (YYYY-MM-DD)",
      },
      {
        name: "endDate",
        type: "optional",
        description: "End date (YYYY-MM-DD)",
      },
      { name: "reason", type: "string", description: "Leave reason" },
    ],
    examples: ["/leave 2025-01-10 ป่วย", "ขอลา วันที่ 10 มกราคม"],
    category: "work",
  },

  // ============================================================================
  // Information Commands
  // ============================================================================
  {
    command: "gold",
    aliases: ["ทอง"],
    descriptionTH: "ดูราคาทองคำวันนี้",
    descriptionEN: "Check today's gold prices",
    keywords: ["gold", "ทอง", "ราคาทอง", "ทองคำ"],
    examples: ["/gold", "/ทอง", "ราคาทอง", "ทองวันนี้"],
    category: "info",
  },
  {
    command: "lotto",
    aliases: ["หวย"],
    descriptionTH: "ตรวจสอบผลสลากกินแบ่งรัฐบาล",
    descriptionEN: "Check lottery results",
    keywords: ["lotto", "หวย", "สลาก", "ผลหวย"],
    parameters: [
      {
        name: "number",
        type: "optional",
        description: "Lottery number to check",
      },
    ],
    examples: ["/lotto", "/หวย 123456", "ตรวจหวย"],
    category: "info",
  },
  {
    command: "gas",
    aliases: ["น้ำมัน"],
    descriptionTH: "ดูราคาน้ำมันวันนี้",
    descriptionEN: "Check today's fuel prices",
    keywords: ["gas", "น้ำมัน", "ราคาน้ำมัน", "เชื้อเพลิง"],
    examples: ["/gas", "/น้ำมัน", "ราคาน้ำมัน"],
    category: "info",
  },
  {
    command: "policy",
    aliases: ["นโยบาย", "กฎ", "rule"],
    descriptionTH: "ดูนโยบายและกฎการทำงาน",
    descriptionEN: "View workplace policies and rules",
    keywords: ["policy", "นโยบาย", "กฎ", "ข้อบังคับ"],
    examples: ["/policy", "/นโยบาย", "ดูกฎ"],
    category: "info",
  },

  // ============================================================================
  // Health & Activity Commands
  // ============================================================================
  {
    command: "health",
    aliases: ["สุขภาพ", "กิจกรรม", "activity"],
    descriptionTH: "ดูข้อมูลสุขภาพและกิจกรรม",
    descriptionEN: "View health and activity data",
    keywords: ["health", "สุขภาพ", "กิจกรรม", "activity", "ออกกำลังกาย"],
    examples: ["/health", "/สุขภาพ", "ดูข้อมูลสุขภาพ"],
    category: "health",
  },

  // ============================================================================
  // Utility Commands
  // ============================================================================
  {
    command: "thai-id",
    aliases: ["สุ่มเลขบัตร", "บัตรประชาชน"],
    descriptionTH: "สุ่มเลขบัตรประชาชนไทย",
    descriptionEN: "Generate Thai national ID number",
    keywords: ["thai id", "สุ่มเลขบัตร", "บัตรประชาชน", "เลขบัตร", "random id"],
    examples: ["/thai-id", "สุ่มเลขบัตร", "generate id"],
    category: "utility",
  },
  {
    command: "settings",
    aliases: ["ตั้งค่า", "config"],
    descriptionTH: "ตั้งค่าการแจ้งเตือนและการใช้งาน",
    descriptionEN: "Configure notifications and settings",
    keywords: ["settings", "ตั้งค่า", "config", "การตั้งค่า"],
    examples: ["/settings", "/ตั้งค่า", "ตั้งค่าแจ้งเตือน"],
    category: "settings",
  },
  {
    command: "help",
    aliases: ["ช่วยเหลือ", "คำสั่ง", "commands"],
    descriptionTH: "ดูรายการคำสั่งทั้งหมด",
    descriptionEN: "View all available commands",
    keywords: ["help", "ช่วยเหลือ", "คำสั่ง", "commands", "วิธีใช้"],
    examples: ["/help", "/ช่วยเหลือ", "ดูคำสั่ง"],
    category: "info",
  },
];

/**
 * Get command definition by command name or alias
 */
export function getCommandByName(name: string): CommandDefinition | undefined {
  const normalizedName = name.toLowerCase();
  return LINE_COMMANDS.find(
    (cmd) =>
      cmd.command === normalizedName || cmd.aliases.includes(normalizedName),
  );
}

/**
 * Search commands by keywords
 */
export function searchCommands(query: string): CommandDefinition[] {
  const normalizedQuery = query.toLowerCase();
  return LINE_COMMANDS.filter((cmd) =>
    cmd.keywords.some((keyword) => keyword.includes(normalizedQuery)),
  );
}

/**
 * Get all commands in a category
 */
export function getCommandsByCategory(
  category: CommandDefinition["category"],
): CommandDefinition[] {
  return LINE_COMMANDS.filter((cmd) => cmd.category === category);
}

/**
 * Format command registry for AI context
 */
export function formatCommandsForAI(): string {
  const categories = {
    crypto: "📊 คริปโตเคอร์เรนซี (Cryptocurrency)",
    work: "💼 การทำงาน (Work Attendance)",
    info: "ℹ️ ข้อมูล (Information)",
    health: "🏃 สุขภาพ (Health & Activity)",
    utility: "🔧 เครื่องมือ (Utilities)",
    settings: "⚙️ ตั้งค่า (Settings)",
  };

  let output = "คำสั่ง LINE Bot ที่มีทั้งหมด:\n\n";

  Object.entries(categories).forEach(([key, label]) => {
    const commands = getCommandsByCategory(
      key as CommandDefinition["category"],
    );
    if (commands.length === 0) return;

    output += `${label}\n`;
    commands.forEach((cmd) => {
      output += `- /${cmd.command}`;
      if (cmd.aliases.length > 0) {
        output += ` (aliases: ${cmd.aliases.map((a) => `/${a}`).join(", ")})`;
      }
      output += `\n  ${cmd.descriptionTH}\n`;
      if (cmd.parameters) {
        output += `  พารามิเตอร์: ${cmd.parameters.map((p) => p.name).join(", ")}\n`;
      }
      output += `  ตัวอย่าง: ${cmd.examples.join(", ")}\n`;
    });
    output += "\n";
  });

  return output;
}
