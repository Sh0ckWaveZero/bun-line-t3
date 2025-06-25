// src/features/line/commands/leave.ts
import { db } from '@/lib/database/db';
import { z } from 'zod';

const LeaveCommandSchema = z.object({
  userId: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  type: z.string().optional(),
  reason: z.string().optional()
});

/**
 * ใช้ใน LINE Bot: /leave YYYY-MM-DD [ประเภท] [เหตุผล]
 * ส่งคืน object เสมอ (success/error)
 */
export async function handleLeaveCommand({ userId, date, type, reason }: z.infer<typeof LeaveCommandSchema>) {
  const parsed = LeaveCommandSchema.safeParse({ userId, date, type, reason });
  if (!parsed.success) {
    return {
      error: true,
      message: 'รูปแบบคำสั่งไม่ถูกต้อง\nตัวอย่าง: /leave 2025-07-01 personal ไปธุระ'
    };
  }
  // ตรวจสอบวันลาซ้ำ
  const existing = await db.leave.findFirst({
    where: {
      userId,
      date,
      isActive: true
    }
  });
  if (existing) {
    return {
      error: true,
      message: `คุณได้บันทึกวันลาวันที่ ${date} ไปแล้ว ไม่สามารถบันทึกซ้ำได้`
    };
  }
  await db.leave.create({
    data: {
      userId,
      date,
      type: type || 'personal',
      reason,
      isActive: true
    }
  });
  return {
    error: false,
    message: `บันทึกวันลาสำเร็จ: ${date} (${type || 'personal'})${reason ? ' - ' + reason : ''}`
  };
}
