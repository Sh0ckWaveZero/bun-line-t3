const { sendMessage } = await import("@/lib/utils/line-utils");

/**
 * Send AI help message with all available commands and usage examples
 */
export async function sendAIHelp(req: any) {
  const helpText = `🤖 AI Assistant - คำสั่งอัจฉริยะ

📌 วิธีใช้งาน:

1️⃣ สั่งงานด้วยภาษาธรรมชาติ:
   /ai [คำขอ]

   ตัวอย่าง:
   • /ai ดึงราคาทองให้หน่อย
   • /ai ราคา Bitcoin ตอนนี้เท่าไหร่
   • /ai เช็คชื่อเข้างาน
   • /ai สร้างกราฟ BTC จาก binance
   • /ai ขอลาวันที่ 10 มกราคม

2️⃣ แนะนำเพลง Spotify:
   /ai spotify [mood/ค้นหา]
   /ai เพลง [mood/ค้นหา]

   ตัวอย่าง:
   • /ai spotify happy - เพลงมีความสุข
   • /ai spotify sad - เพลงเศร้า
   • /ai spotify energetic - เพลงกระฉับกระเฉง
   • /ai spotify chill - เพลงชิล
   • /ai spotify party - เพลงปาร์ตี้
   • /ai spotify focus - เพลงสำหรับมีสมาธิ
   • /ai spotify คิมแฮนึล - ค้นหาและแนะนำเพลง

3️⃣ สนทนา (จำบริบท):
   /ai chat [ข้อความ]
   /ai คุย [ข้อความ]

   ตัวอย่าง:
   • /ai chat สวัสดี
   • /ai คุย วันนี้อากาศเป็นอย่างไร

4️⃣ ดูคำสั่ง:
   /ai help
   /ai ช่วยเหลือ

💡 เคล็ดลับ:
• AI จะวิเคราะห์คำขอและเรียกคำสั่งที่เหมาะสม
• รองรับภาษาไทยและอังกฤษ
• ไม่ต้องจำคำสั่ง แค่บอกสิ่งที่ต้องการ
• โหมด chat สำหรับสนทนาทั่วไป

📚 คำสั่งที่รองรับ:
• 🎵 เพลง: แนะนำเพลงจาก Spotify
• 💰 คริปโต: ราคาเหรียญ, กราฟ
• 👔 การทำงาน: เช็คชื่อเข้า/ออก, รายงาน, ลา
• 📊 ข้อมูล: ทอง, หวย, น้ำมัน
• 🛠️ เครื่องมือ: สุ่มเลขบัตร, ตั้งค่า

🔋 Powered by GPT-4o via MCP + Spotify API`;

  await sendMessage(req, [
    {
      type: "text",
      text: helpText,
    },
  ]);
}
