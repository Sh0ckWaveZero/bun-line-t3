# ผลตรวจสอบโมเดล AI สำหรับโปรเจกต์

วันที่ตรวจสอบ: 2026-08-02

## ขอบเขตที่พบในโค้ด

โปรเจกต์ใช้ OpenAI โดยตรงผ่าน `@ai-sdk/openai` และ Vercel AI SDK (`ai`) ไม่ได้ใช้ provider อื่นใน source ปัจจุบัน งาน AI มี 4 กลุ่มหลัก:

1. `/ai` route ข้อความภาษาไทย/อังกฤษไปยังคำสั่ง LINE และดึงพารามิเตอร์ เช่น จำนวนเงิน เหรียญ และวันที่
2. `/ai chat` ตอบแชตทั่วไปภาษาไทย
3. สร้างข้อความสั้นสำหรับ check-in, ปลอบใจ และข้อความตอบกลับกรณีถ้อยคำไม่เหมาะสม
4. สร้างข้อความส่วนบุคคลสั้น ๆ

จุดอ้างอิงใน repository:

- `src/lib/ai/openai-client.ts` — routing และ chat
- `src/lib/utils/ai-message-generator.ts` — ข้อความ check-in/ปลอบใจ
- `src/lib/ai/text-generation.ts` — ข้อความส่วนบุคคล
- `src/env.mjs` — ค่า `MCP_AI_MODEL` และค่าเริ่มต้น `gpt-5.6-luna`

## คำแนะนำ

### ตัวเลือกหลัก หากบัญชี API เข้าถึงได้

ใช้ `gpt-5.6-luna` เป็นค่าเริ่มต้นสำหรับ routing และข้อความสั้น เพราะ OpenAI ระบุว่าเป็นรุ่นสำหรับงานที่ต้องการต้นทุนต่ำและปริมาณสูง มีราคา input $0.20 และ output $1.20 ต่อ 1 ล้าน token, รองรับ function calling และ Structured Outputs:

<https://developers.openai.com/api/docs/models/gpt-5.6-luna>

ตั้ง reasoning effort เป็น `none` สำหรับ routing/ข้อความสั้น เพื่อคุม latency และต้นทุน

### ตัวเลือก production ที่ปลอดภัยและตรงกับงานปัจจุบัน

ใช้ `gpt-5.4-nano` หากยังไม่ต้องการพึ่งรุ่น 5.6 หรือบัญชี API ยังไม่เปิดให้ใช้ 5.6 รุ่นนี้ถูกระบุชัดเจนว่าสำหรับ classification, data extraction และงานปริมาณสูง ราคา input $0.20 และ output $1.25 ต่อ 1 ล้าน token และรองรับ Structured Outputs:

<https://developers.openai.com/api/docs/models/gpt-5.4-nano>

จากลักษณะของ `/ai` router รุ่นนี้เหมาะกว่า `gpt-5-nano` เดิม โดยเฉพาะการสกัดจำนวนเงินและพารามิเตอร์จากภาษาไทย แต่ควรยืนยันด้วยชุดทดสอบข้อความจริงก่อนเปลี่ยน production

### งานแชตที่ต้องการคุณภาพภาษาไทยสูงขึ้น

แยกใช้ `gpt-5.4-mini` สำหรับ `/ai chat` หรือข้อความที่ต้องรักษาโทนมากกว่า routing โดยราคาอยู่ที่ input $0.75 และ output $4.50 ต่อ 1 ล้าน token:

<https://developers.openai.com/api/docs/models/gpt-5.4-mini>

ถ้าปริมาณแชตสูงและคุณภาพของ Luna เพียงพอ ให้ใช้ Luna ต่อทั้งระบบเพื่อลดความซับซ้อน

## สรุปเชิงปฏิบัติ

| งาน                                      | รุ่นแนะนำ                          | เหตุผล                                                  |
| ---------------------------------------- | ---------------------------------- | ------------------------------------------------------- |
| `/ai` routing, intent, amount extraction | `gpt-5.6-luna` หรือ `gpt-5.4-nano` | งานจำแนกและสกัดข้อมูล ปริมาณสูง ต้นทุนต่ำ               |
| `/ai chat`                               | `gpt-5.4-mini`                     | คุณภาพการสนทนาและภาษาเหมาะกว่า nano เมื่อมีบริบทซับซ้อน |
| check-in/ปลอบใจ/ชมเชย                    | `gpt-5.6-luna` หรือ `gpt-5.4-nano` | ข้อความสั้นและมี fallback อยู่แล้ว                      |
| งาน reasoning ซับซ้อน                    | ยังไม่จำเป็น                       | ไม่พบ use case ใน repository ที่คุ้มกับรุ่นใหญ่         |

เมื่อใช้ environment variable เดียว ให้ตั้งเป็น:

```env
MCP_AI_MODEL=gpt-5.6-luna
```

ควรตรวจสอบสิทธิ์การเรียกโมเดลและ benchmark ใน staging ก่อนเปิด production โดยใช้ชุดข้อความภาษาไทยจริง

ไม่แนะนำให้ใช้ `gpt-5.6-sol`, `gpt-5.4` หรือรุ่นใหญ่เป็นค่าเริ่มต้น เพราะงานปัจจุบันเป็นงานสั้นและปริมาณสูง ไม่ใช่ reasoning ซับซ้อน

## จุดที่ควรแก้ก่อนเปลี่ยนโมเดลจริง

1. `routeCommand()` ใช้ `JSON.parse()` ตรง ๆ และไม่ได้ใช้ schema helper ที่มีอยู่ ควรเปลี่ยนเป็น Structured Outputs/`Output.object` พร้อม Zod หรือ function calling เพื่อบังคับรูปแบบคำตอบ
2. `parameters` เป็น object แบบเปิดกว้าง ซึ่งอาจไม่เหมาะกับ strict schema ควรกำหนด schema ตามคำสั่ง หรือแยก tool/function ต่อคำสั่ง
3. ค่าโมเดลเคยกระจายหลายจุด ควรให้ทุกจุดอ่านจาก `MCP_AI_MODEL` เดียวกัน
4. ควรกำหนด `maxOutputTokens` และ `reasoningEffort: "none"` สำหรับ routing/ข้อความสั้น
5. สร้างชุด eval ภาษาไทยอย่างน้อย 100 ข้อ แยก intent, รายรับรายจ่าย, จำนวนเงินหลายยอด, วันที่, ภาษาอังกฤษปนไทย และข้อความแชต แล้ววัด accuracy, JSON/schema failure, latency และค่าใช้จ่ายก่อนตัดสินใจ

OpenAI แนะนำให้ใช้ Structured Outputs เมื่อจำเป็นต้องให้ผลลัพธ์ตรง schema เพราะ JSON mode รับประกันเพียงว่าเป็น JSON แต่ไม่รับประกันการตรง schema:

<https://developers.openai.com/api/docs/guides/structured-outputs>

## หมายเหตุเรื่อง configuration

`.env.local` เป็นไฟล์ที่ถูก ignore จึงใช้ยืนยันได้เฉพาะค่าในเครื่อง ไม่ใช่ค่า production ส่วนเอกสารบางแห่งยังพูดถึง GPT-4o/MCP ซึ่งไม่ตรงกับ implementation ปัจจุบันที่เรียก OpenAI โดยตรง
