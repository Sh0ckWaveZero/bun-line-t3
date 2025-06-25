import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib';
import { leaveService } from '@/features/attendance/services/leave';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ success: false, message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }
    let body: any;
    try {
      body = await req.json();
    } catch {
      return Response.json({ success: false, message: 'ข้อมูลไม่ถูกต้อง' }, { status: 400 });
    }
    const { date, type, reason } = body;
    if (!date) {
      return Response.json({ success: false, message: 'กรุณาระบุวันที่ลา' }, { status: 422 });
    }
    // ตรวจสอบรูปแบบวันที่ (yyyy-mm-dd)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return Response.json({ success: false, message: 'รูปแบบวันที่ไม่ถูกต้อง' }, { status: 422 });
    }
    try {
      await leaveService.createLeave({
        userId: session.user.id,
        date,
        type: type || 'personal',
        reason,
        isActive: true
      });
    } catch (err: any) {
      // ตรวจสอบ error จากฐานข้อมูลหรือ business logic
      if (err?.code === 'P2002') {
        // ตัวอย่าง: Prisma unique constraint
        return Response.json({ success: false, message: 'มีการบันทึกวันลานี้แล้ว' }, { status: 409 });
      }
      return Response.json({ success: false, message: err?.message || 'เกิดข้อผิดพลาดขณะบันทึกวันลา' }, { status: 400 });
    }
    return Response.json({ success: true, message: 'บันทึกวันลาสำเร็จ' });
  } catch {
    // กรณี error ที่ไม่คาดคิดเท่านั้นจึงจะตอบ 500
    return Response.json({ success: false, message: 'เกิดข้อผิดพลาดของระบบ กรุณาลองใหม่หรือติดต่อผู้ดูแล' }, { status: 500 });
  }
}
